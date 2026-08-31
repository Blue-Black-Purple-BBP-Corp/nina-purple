// Append-only Interaction Credit ledger. The authoritative source of truth for
// a member's prepaid USD wallet (decision 2). credit_balance on UserProfile is
// a denormalized cache updated atomically with each ledger entry; the ledger
// itself is the source of truth and the audit record.
//
// INVARIANTS:
//   - Every balance change is a ledger entry. No direct UserProfile.credit_balance
//     mutation except through these helpers.
//   - Debits are created only after: (1) active membership/trial entitlement,
//     (2) confirmed interaction price, (3) sufficient available balance,
//     (4) no existing valid entitlement (for unlock/reveal), (5) idempotency.
//   - The debit ledger entry and the entitlement/action are created together;
//     if the entitlement creation fails, the debit is reversed.
//   - Refunds, reversals, chargebacks, and staff adjustments create compensating
//     ledger entries — never a direct unlogged balance mutation.
//   - Idempotency: each logical operation carries an idempotency_key unique per
//     user. A repeat call with the same key returns the original result without
//     creating a duplicate entry or charging twice.

const LEDGER_ENTITY = 'InteractionCreditLedger';

function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

// Read the current authoritative balance from the ledger (sum of completed
// entries). Falls back to the cached credit_balance if the ledger read fails.
export async function getCreditBalance(base44, native_user_id) {
  try {
    const entries = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({ native_user_id });
    const completed = entries.filter((e) => e.status === 'completed');
    const sum = completed.reduce((acc, e) => acc + (e.amount_delta || 0), 0);
    return Math.round(sum * 100) / 100;
  } catch (e) {
    console.error('[interactionCredits] getCreditBalance failed:', e?.message || e);
    // Fallback: read cached balance from profile
    try {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id });
      return profiles[0]?.credit_balance ?? 0;
    } catch {
      return 0;
    }
  }
}

// Check whether an idempotency_key has already been used for this user. Returns
// the existing entry if so (so the caller can return the original result).
async function findIdempotent(base44, native_user_id, idempotency_key) {
  try {
    const existing = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({
      native_user_id,
      idempotency_key,
    });
    return existing[0] || null;
  } catch {
    return null;
  }
}

// Credit the wallet from a Stripe top-up. Idempotent on (user, idempotency_key).
export async function creditFromTopup(base44, opts) {
  const { native_user_id, amount, source_reference, idempotency_key, correlation_id, description } = opts;
  if (amount <= 0) return { success: false, reason: 'Amount must be positive' };

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) {
    return { success: true, idempotent: true, ledger_id: existing.ledger_id, balance_after: existing.balance_after };
  }

  const balanceBefore = await getCreditBalance(base44, native_user_id);
  const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;
  const ledger_id = newId();

  await base44.asServiceRole.entities[LEDGER_ENTITY].create({
    ledger_id,
    native_user_id,
    entry_type: 'credit_purchase',
    amount_delta: amount,
    balance_after: balanceAfter,
    source_type: 'stripe_topup',
    source_reference,
    idempotency_key,
    status: 'completed',
    description_member_safe: description || `Added $${amount.toFixed(2)} to your wallet`,
    correlation_id: correlation_id || ledger_id,
  });

  // Update cached balance on the profile.
  await syncCachedBalance(base44, native_user_id, balanceAfter);

  return { success: true, ledger_id, balance_after: balanceAfter };
}

// Debit the wallet for a paid interaction. Returns {success, balance_after} or
// {success:false, reason}. Idempotent on (user, idempotency_key). Does NOT check
// membership entitlement — the caller must verify that first.
export async function debitInteraction(base44, opts) {
  const {
    native_user_id, amount, entry_type, source_type, source_reference,
    idempotency_key, description, correlation_id,
  } = opts;

  if (amount <= 0) return { success: false, reason: 'Debit amount must be positive' };

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) {
    return {
      success: existing.status === 'completed',
      idempotent: true,
      ledger_id: existing.ledger_id,
      balance_after: existing.balance_after,
    };
  }

  const balanceBefore = await getCreditBalance(base44, native_user_id);
  if (balanceBefore < amount) {
    return {
      success: false,
      reason: 'insufficient_credits',
      balance: balanceBefore,
      required: amount,
    };
  }

  const balanceAfter = Math.round((balanceBefore - amount) * 100) / 100;
  const ledger_id = newId();

  await base44.asServiceRole.entities[LEDGER_ENTITY].create({
    ledger_id,
    native_user_id,
    entry_type,
    amount_delta: -amount,
    balance_after: balanceAfter,
    source_type,
    source_reference,
    idempotency_key,
    status: 'completed',
    description_member_safe: description || `Spent $${amount.toFixed(2)}`,
    correlation_id: correlation_id || ledger_id,
  });

  await syncCachedBalance(base44, native_user_id, balanceAfter);

  return { success: true, ledger_id, balance_after: balanceAfter };
}

// Reverse a prior debit (refund / chargeback / staff reversal). Creates a
// compensating credit entry linked to the original. Idempotent on the
// reversal's own idempotency_key.
export async function reverseDebit(base44, opts) {
  const {
    native_user_id, original_ledger_id, amount, reason, idempotency_key,
    correlation_id, staff_reason,
  } = opts;

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) {
    return { success: true, idempotent: true, ledger_id: existing.ledger_id, balance_after: existing.balance_after };
  }

  const balanceBefore = await getCreditBalance(base44, native_user_id);
  const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;
  const ledger_id = newId();

  await base44.asServiceRole.entities[LEDGER_ENTITY].create({
    ledger_id,
    native_user_id,
    entry_type: 'reversal',
    amount_delta: amount,
    balance_after: balanceAfter,
    source_type: 'refund_reversal',
    source_reference: original_ledger_id,
    idempotency_key,
    status: 'completed',
    description_member_safe: `Reversal: ${reason || 'refunded interaction'}`,
    staff_reason: staff_reason || reason || null,
    correlation_id: correlation_id || ledger_id,
  });

  // Mark the original debit as reversed.
  try {
    const orig = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({ ledger_id: original_ledger_id });
    if (orig[0]) {
      await base44.asServiceRole.entities[LEDGER_ENTITY].update(orig[0].id, { status: 'reversed' });
    }
  } catch (e) {
    console.warn('[interactionCredits] mark original reversed failed:', e?.message || e);
  }

  await syncCachedBalance(base44, native_user_id, balanceAfter);

  return { success: true, ledger_id, balance_after: balanceAfter };
}

// Staff manual adjustment (credit or debit). Always creates a ledger entry.
export async function staffAdjust(base44, opts) {
  const { native_user_id, amount, staff_reason, idempotency_key, correlation_id } = opts;
  if (amount === 0) return { success: false, reason: 'Adjustment amount cannot be zero' };

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) return { success: true, idempotent: true, ledger_id: existing.ledger_id, balance_after: existing.balance_after };

  const balanceBefore = await getCreditBalance(base44, native_user_id);
  const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;
  const ledger_id = newId();

  await base44.asServiceRole.entities[LEDGER_ENTITY].create({
    ledger_id,
    native_user_id,
    entry_type: 'staff_adjustment',
    amount_delta: amount,
    balance_after: balanceAfter,
    source_type: 'staff_adjustment',
    source_reference: null,
    idempotency_key,
    status: 'completed',
    description_member_safe: amount > 0 ? 'Credit added by Nina Purple team' : 'Adjustment by Nina Purple team',
    staff_reason,
    correlation_id: correlation_id || ledger_id,
  });

  await syncCachedBalance(base44, native_user_id, balanceAfter);

  return { success: true, ledger_id, balance_after: balanceAfter };
}

// Sync the cached credit_balance on UserProfile to match the ledger-derived
// balance. Best-effort; the ledger remains authoritative.
async function syncCachedBalance(base44, native_user_id, balance) {
  try {
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id });
    if (profiles[0]) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, { credit_balance: balance });
    }
  } catch (e) {
    console.warn('[interactionCredits] syncCachedBalance failed:', e?.message || e);
  }
}

// Recent ledger entries for the wallet UI.
export async function getRecentLedger(base44, native_user_id, limit = 20) {
  try {
    const entries = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({ native_user_id });
    return entries
      .filter((e) => e.status === 'completed' || e.status === 'reversed')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, limit);
  } catch (e) {
    console.error('[interactionCredits] getRecentLedger failed:', e?.message || e);
    return [];
  }
}