// Append-only BBP Credit ledger. The authoritative source of truth for
// a member's prepaid BBP Credit wallet (1 BBP = $1 toward eligible Nina Purple
// purchases). credit_balance on UserProfile is a denormalized cache updated
// atomically with each ledger entry; the ledger itself is the source of truth
// and the audit record.
//
// BBP Credits can NEVER pay for Nina Purple Membership or renewals.
//
// INVARIANTS:
//   - Every balance change is a ledger entry. No direct UserProfile.credit_balance
//     mutation except through these helpers.
//   - Debits are created only after: (1) active membership/trial entitlement,
//     (2) confirmed interaction price, (3) sufficient available balance,
//     (4) no existing valid entitlement (for unlock/reveal), (5) idempotency.
//   - Photo reveals use a RESERVE (hold) → owner-approval → CONVERT (debit) flow.
//     Credits are held (not debited) until the owner approves. Decline, expiry,
//     cancellation, or block releases the hold without debiting.
//   - Refunds, reversals, chargebacks, and staff adjustments create compensating
//     ledger entries — never a direct unlogged balance mutation.
//   - Idempotency: each logical operation carries an idempotency_key unique per
//     user. A repeat call with the same key returns the original result.
//
// BALANCE MODEL:
//   - total_balance    = sum of completed entries' amount_delta
//   - reserved_balance = -sum of pending 'hold' entries' amount_delta (positive)
//   - available_balance = total_balance - reserved_balance
//   A hold entry (status='pending', entry_type='hold', amount_delta=-amount)
//   reduces available but not total. On convert, the hold becomes a completed
//   debit (total drops). On release, the hold becomes 'expired' (excluded from
//   reserved) and a zero-delta 'release' audit entry is written.

const LEDGER_ENTITY = 'InteractionCreditLedger';

function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

// Total balance = sum of completed entries.
export async function getCreditBalance(base44, native_user_id) {
  try {
    const entries = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({ native_user_id });
    const completed = entries.filter((e) => e.status === 'completed');
    const sum = completed.reduce((acc, e) => acc + (e.amount_delta || 0), 0);
    return Math.round(sum * 100) / 100;
  } catch (e) {
    console.error('[interactionCredits] getCreditBalance failed:', e?.message || e);
    try {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id });
      return profiles[0]?.credit_balance ?? 0;
    } catch {
      return 0;
    }
  }
}

// Reserved balance = sum of pending holds (as a positive number).
export async function getReservedBalance(base44, native_user_id) {
  try {
    const entries = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({ native_user_id });
    const holds = entries.filter((e) => e.status === 'pending' && e.entry_type === 'hold');
    const sum = holds.reduce((acc, e) => acc + Math.abs(e.amount_delta || 0), 0);
    return Math.round(sum * 100) / 100;
  } catch (e) {
    console.error('[interactionCredits] getReservedBalance failed:', e?.message || e);
    return 0;
  }
}

// Available balance = total - reserved.
export async function getAvailableBalance(base44, native_user_id) {
  const [total, reserved] = await Promise.all([
    getCreditBalance(base44, native_user_id),
    getReservedBalance(base44, native_user_id),
  ]);
  return Math.round((total - reserved) * 100) / 100;
}

// Check whether an idempotency_key has already been used for this user.
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
    description_member_safe: description || `Added ${amount} BBP Credits to your wallet`,
    correlation_id: correlation_id || ledger_id,
  });

  await syncCachedBalance(base44, native_user_id, balanceAfter);
  return { success: true, ledger_id, balance_after: balanceAfter };
}

// Debit the wallet for a paid interaction (unlock, outreach). Returns
// {success, balance_after} or {success:false, reason}. Idempotent on
// (user, idempotency_key). Does NOT check membership entitlement — caller must.
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

  const available = await getAvailableBalance(base44, native_user_id);
  if (available < amount) {
    return {
      success: false,
      reason: 'insufficient_credits',
      balance: available,
      required: amount,
    };
  }

  const balanceBefore = await getCreditBalance(base44, native_user_id);
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
    description_member_safe: description || `Spent ${amount} BBP Credits`,
    correlation_id: correlation_id || ledger_id,
  });

  await syncCachedBalance(base44, native_user_id, balanceAfter);
  return { success: true, ledger_id, balance_after: balanceAfter };
}

// ── HOLD / RELEASE / CONVERT (photo reveal owner-approval flow) ──

// Reserve (hold) BBP Credits for a pending photo-reveal request. The credits
// are NOT debited — they are reserved against the available balance until the
// owner approves (convert) or the request is declined/expired/cancelled
// (release). Idempotent on (user, idempotency_key).
export async function holdCredits(base44, opts) {
  const {
    native_user_id, amount, reserved_for_type, reserved_for_id,
    hold_expires_at, idempotency_key, description, correlation_id,
  } = opts;

  if (amount <= 0) return { success: false, reason: 'Hold amount must be positive' };

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) {
    return {
      success: existing.status === 'pending',
      idempotent: true,
      ledger_id: existing.ledger_id,
      reservation_id: existing.reservation_id,
    };
  }

  const available = await getAvailableBalance(base44, native_user_id);
  if (available < amount) {
    return {
      success: false,
      reason: 'insufficient_credits',
      balance: available,
      required: amount,
    };
  }

  const reservation_id = newId();
  const ledger_id = newId();
  const totalBefore = await getCreditBalance(base44, native_user_id);

  await base44.asServiceRole.entities[LEDGER_ENTITY].create({
    ledger_id,
    native_user_id,
    entry_type: 'hold',
    amount_delta: -amount,
    balance_after: totalBefore, // total unchanged; available = total - reserved
    source_type: reserved_for_type === 'photo_reveal' ? 'photo_reveal_hold' : 'photo_reveal_hold',
    source_reference: reserved_for_id,
    idempotency_key,
    status: 'pending',
    reservation_id,
    reserved_for_type,
    reserved_for_id,
    hold_expires_at,
    description_member_safe: description || `Reserved ${amount} BBP Credits for photo reveal request`,
    correlation_id: correlation_id || ledger_id,
  });

  // Cached balance (total) is unchanged by a hold — only available changes.
  return { success: true, ledger_id, reservation_id };
}

// Release a held reservation (decline, expiry, cancellation, block). Marks the
// hold entry as 'expired' and writes a zero-delta 'release' audit entry. The
// available balance is restored because the hold is no longer pending.
// Idempotent on the release's own idempotency_key.
export async function releaseHold(base44, opts) {
  const { native_user_id, reservation_id, reason, idempotency_key, correlation_id } = opts;

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) {
    return { success: true, idempotent: true, ledger_id: existing.ledger_id };
  }

  // Find the hold entry by reservation_id.
  let holdEntry = null;
  try {
    const holds = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({
      native_user_id,
      reservation_id,
    });
    holdEntry = holds.find((e) => e.entry_type === 'hold' && e.status === 'pending') || null;
  } catch (e) {
    console.error('[interactionCredits] releaseHold lookup failed:', e?.message || e);
  }
  if (!holdEntry) {
    // Already released or never existed — idempotent success.
    return { success: true, already_released: true };
  }

  // Mark the hold as expired (excluded from reserved balance).
  await base44.asServiceRole.entities[LEDGER_ENTITY].update(holdEntry.id, {
    status: 'expired',
    staff_reason: reason || 'released',
  });

  // Write a zero-delta release audit entry.
  const release_id = newId();
  await base44.asServiceRole.entities[LEDGER_ENTITY].create({
    ledger_id: release_id,
    native_user_id,
    entry_type: 'release',
    amount_delta: 0,
    balance_after: holdEntry.balance_after,
    source_type: 'photo_reveal_release',
    source_reference: reservation_id,
    idempotency_key,
    status: 'completed',
    reservation_id,
    description_member_safe: `Released reserved BBP Credits — ${reason || 'request closed'}`,
    correlation_id: correlation_id || release_id,
  });

  return { success: true, ledger_id: release_id };
}

// Convert a held reservation into a completed debit (owner approved). The hold
// entry's status changes from 'pending' to 'completed' and entry_type to
// 'debit_reveal', finalizing the spend. Total balance drops by the amount.
// Idempotent on the convert's own idempotency_key.
export async function convertHoldToDebit(base44, opts) {
  const { native_user_id, reservation_id, description, idempotency_key, correlation_id } = opts;

  const existing = await findIdempotent(base44, native_user_id, idempotency_key);
  if (existing) {
    return { success: true, idempotent: true, ledger_id: existing.ledger_id, balance_after: existing.balance_after };
  }

  // Find the hold entry.
  let holdEntry = null;
  try {
    const holds = await base44.asServiceRole.entities[LEDGER_ENTITY].filter({
      native_user_id,
      reservation_id,
    });
    holdEntry = holds.find((e) => e.entry_type === 'hold' && e.status === 'pending') || null;
  } catch (e) {
    console.error('[interactionCredits] convertHoldToDebit lookup failed:', e?.message || e);
  }
  if (!holdEntry) {
    return { success: false, reason: 'hold_not_found_or_already_resolved' };
  }

  const amount = Math.abs(holdEntry.amount_delta || 0);
  const totalBefore = await getCreditBalance(base44, native_user_id);
  const balanceAfter = Math.round((totalBefore - amount) * 100) / 100;

  // Convert the hold into a completed debit_reveal entry.
  await base44.asServiceRole.entities[LEDGER_ENTITY].update(holdEntry.id, {
    status: 'completed',
    entry_type: 'debit_reveal',
    amount_delta: -amount,
    balance_after: balanceAfter,
    description_member_safe: description || `Photo reveal approved — ${amount} BBP Credits`,
    correlation_id: correlation_id || holdEntry.ledger_id,
  });

  await syncCachedBalance(base44, native_user_id, balanceAfter);
  return { success: true, ledger_id: holdEntry.ledger_id, balance_after: balanceAfter };
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
    description_member_safe: amount > 0 ? 'BBP Credits added by Nina Purple team' : 'Adjustment by Nina Purple team',
    staff_reason,
    correlation_id: correlation_id || ledger_id,
  });

  await syncCachedBalance(base44, native_user_id, balanceAfter);
  return { success: true, ledger_id, balance_after: balanceAfter };
}

// Sync the cached credit_balance on UserProfile to match the ledger-derived
// total balance. Best-effort; the ledger remains authoritative.
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
      .filter((e) => e.status === 'completed' || e.status === 'reversed' || e.status === 'pending' || e.status === 'expired')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, limit);
  } catch (e) {
    console.error('[interactionCredits] getRecentLedger failed:', e?.message || e);
    return [];
  }
}