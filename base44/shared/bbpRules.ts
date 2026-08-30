// BBP Points rules engine — shared logic for deterministic award issuance,
// idempotency, cap enforcement, ledger writes, and wallet projection.
// Used by all engagement backend functions to avoid duplicating billing-critical logic.

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32

function encodeTime(now: number, len: number): string {
  let str = '';
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % 32;
    str = ENCODING[mod] + str;
    now = Math.floor(now / 32);
  }
  return str;
}

function encodeRandom(len: number): string {
  let str = '';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) {
    str += ENCODING[bytes[i] % 32];
  }
  return str;
}

export function ulid(): string {
  return encodeTime(Date.now(), 10) + encodeRandom(16);
}

export function generateBbpMemberId(): string {
  return `npm_${ulid()}`;
}

interface AwardResult {
  awarded: boolean;
  reason: string;
  ledger_id?: string;
  points?: number;
  status?: string;
}

interface CapConfig {
  one_time?: boolean;
  monthly?: number;
  per_pair_cooldown_days?: number;
}

function parseCapConfig(rule: any): CapConfig {
  if (!rule?.cap_config) return {};
  try {
    return typeof rule.cap_config === 'string' ? JSON.parse(rule.cap_config) : rule.cap_config;
  } catch {
    return {};
  }
}

/**
 * Core deterministic award function. Resolves the active RewardRule for the
 * given action_type, enforces idempotency and caps, writes an append-only
 * ledger entry, and updates the wallet projection.
 *
 * MUST be called from server-side code only (asServiceRole).
 */
export async function awardPoints(
  base44: any,
  bbp_member_id: string,
  native_user_id: string,
  action_type: string,
  source_type: string,
  source_event_id: string,
  campaign_id?: string
): Promise<AwardResult> {
  // 1. Resolve active RewardRule
  const rules = await base44.asServiceRole.entities.RewardRule.filter({
    action_type,
    status: 'active',
  });

  // Check effective dates
  const now = new Date();
  const activeRule = rules.find((r: any) => {
    if (r.effective_from && new Date(r.effective_from) > now) return false;
    if (r.effective_until && new Date(r.effective_until) < now) return false;
    return true;
  });

  if (!activeRule) {
    return { awarded: false, reason: 'No active rule for this action' };
  }

  // 2. Idempotency: same member + source_type + source_event_id must never produce duplicate awards
  const existing = await base44.asServiceRole.entities.BBPPointsLedger.filter({
    bbp_member_id,
    source_type,
    source_event_id,
    entry_type: 'award',
  });
  if (existing.length > 0) {
    return { awarded: false, reason: 'Already awarded for this event' };
  }

  // 3. Cap enforcement
  const cap = parseCapConfig(activeRule);
  if (cap.one_time) {
    const priorAwards = await base44.asServiceRole.entities.BBPPointsLedger.filter({
      bbp_member_id,
      source_type,
      entry_type: 'award',
    });
    const nonReversed = priorAwards.filter((e: any) => e.status !== 'reversed');
    if (nonReversed.length > 0) {
      return { awarded: false, reason: 'One-time cap already reached' };
    }
  }
  if (cap.monthly) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const allAwards = await base44.asServiceRole.entities.BBPPointsLedger.filter({
      bbp_member_id,
      source_type,
      entry_type: 'award',
    });
    const thisMonth = allAwards.filter(
      (e: any) => e.created_date && new Date(e.created_date) >= new Date(monthStart) && e.status !== 'reversed'
    );
    if (thisMonth.length >= cap.monthly) {
      return { awarded: false, reason: 'Monthly cap reached' };
    }
  }

  // 4. Safety exclusion check — if member has an active safety hold, points go to 'held' status
  const safetyCases = await base44.asServiceRole.entities.SafetyReviewCase.filter({
    subject_bbp_member_id: bbp_member_id,
    status: { $in: ['open', 'under_review'] },
    points_hold_flag: true,
  });
  const hasHold = safetyCases.length > 0;

  // 5. Determine status and available_at
  const pendingHours = activeRule.pending_hours || 0;
  let status: string;
  let available_at: string;

  if (hasHold) {
    status = 'held';
    available_at = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(); // 30 days default for held
  } else if (pendingHours > 0) {
    status = 'pending';
    available_at = new Date(now.getTime() + pendingHours * 3600 * 1000).toISOString();
  } else {
    status = 'available';
    available_at = now.toISOString();
  }

  // 6. Create append-only ledger entry
  const ledgerEntry = await base44.asServiceRole.entities.BBPPointsLedger.create({
    ledger_id: ulid(),
    bbp_member_id,
    native_user_id,
    entry_type: 'award',
    points_delta: activeRule.points_amount,
    status,
    source_type,
    source_event_id,
    rule_version: `${activeRule.rule_id}_v${activeRule.rule_version}`,
    campaign_id: campaign_id || null,
    available_at,
  });

  // 7. Update wallet projection
  await updateWalletProjection(base44, bbp_member_id, native_user_id);

  return {
    awarded: true,
    reason: hasHold ? 'Awarded but held due to safety review' : status === 'pending' ? 'Awarded, pending release' : 'Awarded',
    ledger_id: ledgerEntry.id,
    points: activeRule.points_amount,
    status,
  };
}

/**
 * Staff-only reversal: writes a compensating negative ledger entry linked to
 * the original. Never deletes the original record.
 */
export async function reversePoints(
  base44: any,
  ledger_entry_id: string,
  staff_user_id: string,
  reason: string
): Promise<{ success: boolean; reason: string }> {
  const entries = await base44.asServiceRole.entities.BBPPointsLedger.filter({ id: ledger_entry_id });
  if (!entries.length) {
    return { success: false, reason: 'Ledger entry not found' };
  }
  const original = entries[0];
  if (original.entry_type === 'reversal') {
    return { success: false, reason: 'Cannot reverse a reversal entry' };
  }
  if (original.status === 'reversed') {
    return { success: false, reason: 'Entry already reversed' };
  }

  // Create compensating entry
  await base44.asServiceRole.entities.BBPPointsLedger.create({
    ledger_id: ulid(),
    bbp_member_id: original.bbp_member_id,
    native_user_id: original.native_user_id,
    entry_type: 'reversal',
    points_delta: -Math.abs(original.points_delta),
    status: 'reversed',
    source_type: original.source_type,
    source_event_id: `reversal_${original.source_event_id}`,
    rule_version: original.rule_version,
    reversal_of_ledger_id: original.id,
    internal_notes: `Reversed by staff ${staff_user_id}: ${reason}`,
  });

  // Mark original as reversed
  await base44.asServiceRole.entities.BBPPointsLedger.update(original.id, {
    status: 'reversed',
    internal_notes: `Reversed by staff ${staff_user_id}: ${reason}`,
  });

  // Update wallet projection
  await updateWalletProjection(base44, original.bbp_member_id, original.native_user_id);

  return { success: true, reason: 'Reversed successfully' };
}

/**
 * Rebuilds the wallet balance projection from the ledger. This is the source
 * of truth for displayed balances — the ledger is the actual source of truth.
 */
export async function updateWalletProjection(base44: any, bbp_member_id: string, native_user_id: string): Promise<void> {
  const allEntries = await base44.asServiceRole.entities.BBPPointsLedger.filter({ bbp_member_id });

  let available = 0;
  let pending = 0;
  let lifetimeEarned = 0;
  let lifetimeRedeemed = 0;

  for (const entry of allEntries) {
    if (entry.status === 'reversed') continue;
    if (entry.entry_type === 'award') {
      if (entry.status === 'available') available += entry.points_delta;
      else if (entry.status === 'pending' || entry.status === 'held' || entry.status === 'under_review') pending += entry.points_delta;
      if (entry.status !== 'expired') lifetimeEarned += entry.points_delta;
    } else if (entry.entry_type === 'reversal') {
      if (entry.status === 'reversed') {
        // The original award is also marked reversed, so the net effect is handled by skipping reversed awards above
      }
    } else if (entry.entry_type === 'redemption') {
      available += entry.points_delta; // negative
      lifetimeRedeemed += Math.abs(entry.points_delta);
    } else if (entry.entry_type === 'adjustment') {
      available += entry.points_delta;
    }
  }

  available = Math.max(0, available);
  pending = Math.max(0, pending);

  const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({ bbp_member_id });
  if (wallets.length > 0) {
    await base44.asServiceRole.entities.BBPWalletBalance.update(wallets[0].id, {
      available_points: available,
      pending_points: pending,
      lifetime_earned: lifetimeEarned,
      lifetime_redeemed: lifetimeRedeemed,
    });
  } else {
    await base44.asServiceRole.entities.BBPWalletBalance.create({
      bbp_member_id,
      native_user_id,
      available_points: available,
      pending_points: pending,
      lifetime_earned: lifetimeEarned,
      lifetime_redeemed: lifetimeRedeemed,
    });
  }
}

/**
 * Release pending rewards whose available_at has passed and who have no
 * active safety hold. Called by the scheduled releasePendingRewards job.
 */
export async function releasePending(base44: any): Promise<{ released: number }> {
  const now = new Date().toISOString();
  const pendingEntries = await base44.asServiceRole.entities.BBPPointsLedger.filter({
    status: 'pending',
  });

  let released = 0;
  for (const entry of pendingEntries) {
    if (entry.available_at && new Date(entry.available_at) > new Date(now)) continue;

    // Check for active safety hold
    const holds = await base44.asServiceRole.entities.SafetyReviewCase.filter({
      subject_bbp_member_id: entry.bbp_member_id,
      status: { $in: ['open', 'under_review'] },
      points_hold_flag: true,
    });
    if (holds.length > 0) continue;

    await base44.asServiceRole.entities.BBPPointsLedger.update(entry.id, { status: 'available' });
    await updateWalletProjection(base44, entry.bbp_member_id, entry.native_user_id);
    released++;
  }

  return { released };
}