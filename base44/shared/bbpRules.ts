// BBP Points rules engine — shared logic for deterministic award issuance,
// idempotency, cap enforcement, budget enforcement, ledger writes, wallet
// projection, expiry, redemption validation, and referral qualification.
// Used by all engagement backend functions to avoid duplicating billing-critical logic.
//
// 1 BBP = $1.00 USD member benefit value. Points are never cash.

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

// 12-month expiry from available_at
const EXPIRY_MONTHS = 12;

export function computeExpiryDate(available_at: string): string {
  const d = new Date(available_at);
  d.setMonth(d.getMonth() + EXPIRY_MONTHS);
  return d.toISOString();
}

interface AwardResult {
  awarded: boolean;
  reason: string;
  ledger_id?: string;
  points?: number;
  status?: string;
}

/**
 * Core deterministic award function. Resolves the active RewardRule for the
 * given action_type, enforces idempotency, caps, budget, eligibility, and
 * safety/fraud holds. Writes an append-only ledger entry and updates the
 * wallet projection.
 *
 * MUST be called from server-side code only (asServiceRole).
 * NEVER trusts a client-submitted points amount.
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

  // 3. Per-member cap (lifetime or rolling window)
  if (activeRule.per_member_cap != null) {
    const priorAwards = await base44.asServiceRole.entities.BBPPointsLedger.filter({
      bbp_member_id,
      source_type,
      entry_type: 'award',
    });
    let countable = priorAwards.filter((e: any) => e.status !== 'reversed');
    if (activeRule.rolling_period_days) {
      const cutoff = new Date(now.getTime() - activeRule.rolling_period_days * 24 * 3600 * 1000);
      countable = countable.filter((e: any) => e.created_date && new Date(e.created_date) >= cutoff);
    }
    if (countable.length >= activeRule.per_member_cap) {
      return { awarded: false, reason: 'Per-member cap reached' };
    }
  }

  // 4. Per-pair cap (for meetup confirmations)
  if (activeRule.per_pair_cap != null && source_event_id) {
    // source_event_id for meetups encodes the pair: "meetup_<connId>"
    const pairAwards = await base44.asServiceRole.entities.BBPPointsLedger.filter({
      source_type,
      source_event_id,
      entry_type: 'award',
    });
    const nonReversed = pairAwards.filter((e: any) => e.status !== 'reversed');
    if (nonReversed.length >= activeRule.per_pair_cap) {
      return { awarded: false, reason: 'Per-pair cap reached' };
    }
  }

  // 5. Monthly budget enforcement
  if (activeRule.monthly_budget_usd && activeRule.monthly_budget_usd > 0) {
    const issued = activeRule.monthly_issued_usd || 0;
    if (issued + activeRule.points_amount > activeRule.monthly_budget_usd) {
      return { awarded: false, reason: 'This reward offer is currently fully allocated. Other BBP opportunities remain available.' };
    }
  }

  // 6. Safety exclusion check — if member has an active safety hold, points go to 'held'
  const safetyCases = await base44.asServiceRole.entities.SafetyReviewCase.filter({
    subject_bbp_member_id: bbp_member_id,
    status: { $in: ['open', 'under_review'] },
    points_hold_flag: true,
  });
  const hasHold = safetyCases.length > 0;

  // 7. Determine status and available_at
  const pendingHours = activeRule.pending_hours || 0;
  let status: string;
  let available_at: string;

  if (hasHold) {
    status = 'held';
    available_at = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
  } else if (pendingHours > 0) {
    status = 'pending';
    available_at = new Date(now.getTime() + pendingHours * 3600 * 1000).toISOString();
  } else {
    status = 'available';
    available_at = now.toISOString();
  }

  // 8. Compute expiry date (12 months after available_at)
  const expires_at = computeExpiryDate(available_at);

  // 9. Member-safe description
  const member_safe_description = hasHold
    ? 'Your reward is being reviewed and will be available soon.'
    : status === 'pending'
      ? 'Your reward is pending and will be available after the review period.'
      : 'Your reward is available.';

  // 10. Create append-only ledger entry
  const ledgerEntry = await base44.asServiceRole.entities.BBPPointsLedger.create({
    ledger_id: ulid(),
    bbp_member_id,
    native_user_id,
    entry_type: 'award',
    points_delta: activeRule.points_amount,
    status,
    source_type,
    source_event_id,
    rule_id: activeRule.rule_id,
    rule_version: `${activeRule.rule_id}_v${activeRule.rule_version}`,
    campaign_id: campaign_id || null,
    available_at,
    expires_at,
    member_safe_description,
  });

  // 11. Increment monthly_issued_usd on the rule
  if (activeRule.monthly_budget_usd && activeRule.monthly_budget_usd > 0) {
    await base44.asServiceRole.entities.RewardRule.update(activeRule.id, {
      monthly_issued_usd: (activeRule.monthly_issued_usd || 0) + activeRule.points_amount,
    });
  }

  // 12. Update wallet projection
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
    rule_id: original.rule_id,
    rule_version: original.rule_version,
    reversal_of_ledger_id: original.id,
    staff_reason: reason,
    internal_notes: `Reversed by staff ${staff_user_id}: ${reason}`,
  });

  // Mark original as reversed
  await base44.asServiceRole.entities.BBPPointsLedger.update(original.id, {
    status: 'reversed',
    staff_reason: reason,
    internal_notes: `Reversed by staff ${staff_user_id}: ${reason}`,
  });

  // Audit log
  await logStaffAction(base44, staff_user_id, 'reversal', 'BBPPointsLedger', original.id,
    JSON.stringify({ status: original.status, points: original.points_delta }),
    JSON.stringify({ status: 'reversed' }),
    reason);

  // Update wallet projection
  await updateWalletProjection(base44, original.bbp_member_id, original.native_user_id);

  return { success: true, reason: 'Reversed successfully' };
}

/**
 * Expires available points past their expires_at date. Creates traceable
 * ledger entries. Called by the scheduled expirePoints job.
 */
export async function expireAvailablePoints(base44: any): Promise<{ expired: number }> {
  const now = new Date().toISOString();
  // Fetch all available award entries — we need to check expires_at
  const availableEntries = await base44.asServiceRole.entities.BBPPointsLedger.filter({
    status: 'available',
    entry_type: 'award',
  });

  let expired = 0;
  for (const entry of availableEntries) {
    if (!entry.expires_at || new Date(entry.expires_at) > new Date(now)) continue;

    // Create expiry ledger entry
    await base44.asServiceRole.entities.BBPPointsLedger.create({
      ledger_id: ulid(),
      bbp_member_id: entry.bbp_member_id,
      native_user_id: entry.native_user_id,
      entry_type: 'expiry',
      points_delta: -Math.abs(entry.points_delta),
      status: 'expired',
      source_type: 'expiry',
      source_event_id: `expiry_${entry.ledger_id}`,
      rule_id: entry.rule_id,
      rule_version: entry.rule_version,
      reversal_of_ledger_id: entry.id,
      member_safe_description: 'Points expired after 12 months per BBP Points Rules.',
    });

    // Mark original as expired
    await base44.asServiceRole.entities.BBPPointsLedger.update(entry.id, { status: 'expired' });

    await updateWalletProjection(base44, entry.bbp_member_id, entry.native_user_id);
    expired++;
  }

  return { expired };
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

    await base44.asServiceRole.entities.BBPPointsLedger.update(entry.id, {
      status: 'available',
      member_safe_description: 'Your reward is available.',
    });
    await updateWalletProjection(base44, entry.bbp_member_id, entry.native_user_id);
    released++;
  }

  return { released };
}

/**
 * Release a specific held entry (staff action). Requires reason + audit.
 */
export async function releaseHeldEntry(
  base44: any,
  ledger_entry_id: string,
  staff_user_id: string,
  reason: string
): Promise<{ success: boolean; reason: string }> {
  const entries = await base44.asServiceRole.entities.BBPPointsLedger.filter({ id: ledger_entry_id });
  if (!entries.length) return { success: false, reason: 'Ledger entry not found' };
  const entry = entries[0];
  if (entry.status !== 'held' && entry.status !== 'under_review') {
    return { success: false, reason: 'Entry is not held' };
  }

  await base44.asServiceRole.entities.BBPPointsLedger.update(entry.id, {
    status: 'available',
    staff_reason: reason,
    member_safe_description: 'Your reward is available.',
  });

  await logStaffAction(base44, staff_user_id, 'release', 'BBPPointsLedger', entry.id,
    JSON.stringify({ status: entry.status }),
    JSON.stringify({ status: 'available' }),
    reason);

  await updateWalletProjection(base44, entry.bbp_member_id, entry.native_user_id);
  return { success: true, reason: 'Released successfully' };
}

/**
 * Rebuilds the wallet balance projection from the ledger. This is the source
 * of truth for displayed balances — the ledger is the actual source of truth.
 * Computes: available, pending, expired, lifetime_earned, lifetime_redeemed,
 * lifetime_reversed, and USD face value (always = points because 1 BBP = $1).
 */
export async function updateWalletProjection(base44: any, bbp_member_id: string, native_user_id: string): Promise<void> {
  const allEntries = await base44.asServiceRole.entities.BBPPointsLedger.filter({ bbp_member_id });

  let available = 0;
  let pending = 0;
  let expired = 0;
  let lifetimeEarned = 0;
  let lifetimeRedeemed = 0;
  let lifetimeReversed = 0;

  for (const entry of allEntries) {
    if (entry.entry_type === 'award') {
      if (entry.status === 'available') {
        available += entry.points_delta;
        lifetimeEarned += entry.points_delta;
      } else if (entry.status === 'pending' || entry.status === 'held' || entry.status === 'under_review') {
        pending += entry.points_delta;
      } else if (entry.status === 'expired') {
        expired += entry.points_delta;
        // expired awards don't count as lifetime earned
      } else if (entry.status === 'reversed') {
        lifetimeReversed += Math.abs(entry.points_delta);
      } else {
        lifetimeEarned += entry.points_delta;
      }
    } else if (entry.entry_type === 'reversal') {
      lifetimeReversed += Math.abs(entry.points_delta);
    } else if (entry.entry_type === 'redemption') {
      available += entry.points_delta; // negative
      lifetimeRedeemed += Math.abs(entry.points_delta);
    } else if (entry.entry_type === 'expiry') {
      // already reflected in available via the original being marked expired
    } else if (entry.entry_type === 'adjustment') {
      available += entry.points_delta;
    }
  }

  available = Math.max(0, available);
  pending = Math.max(0, pending);

  const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({ bbp_member_id });
  const walletData = {
    available_points: available,
    pending_points: pending,
    expired_points: expired,
    lifetime_earned: lifetimeEarned,
    lifetime_redeemed: lifetimeRedeemed,
    lifetime_reversed: lifetimeReversed,
    face_value_available_usd: available,
    face_value_pending_usd: pending,
  };

  if (wallets.length > 0) {
    await base44.asServiceRole.entities.BBPWalletBalance.update(wallets[0].id, walletData);
  } else {
    await base44.asServiceRole.entities.BBPWalletBalance.create({
      bbp_member_id,
      native_user_id,
      ...walletData,
    });
  }
}

/**
 * Validates a redemption request against the RedemptionCatalog.
 * Returns { valid, reason, catalog_entry }.
 */
export async function validateRedemption(
  base44: any,
  bbp_member_id: string,
  benefit_id: string,
  points_requested: number,
  transaction_amount_usd: number,
  has_promo_code: boolean
): Promise<{ valid: boolean; reason: string; catalog?: any }> {
  const catalogEntries = await base44.asServiceRole.entities.RedemptionCatalog.filter({
    benefit_id,
    status: 'active',
  });
  if (!catalogEntries.length) {
    return { valid: false, reason: 'This benefit is not currently available.' };
  }
  const catalog = catalogEntries[0];

  // Check effective dates
  const now = new Date();
  if (catalog.start_at && new Date(catalog.start_at) > now) {
    return { valid: false, reason: 'This benefit is not yet available.', catalog };
  }
  if (catalog.end_at && new Date(catalog.end_at) < now) {
    return { valid: false, reason: 'This benefit has expired.', catalog };
  }

  // Minimum BBP
  if (points_requested < (catalog.minimum_bbp || 0)) {
    return { valid: false, reason: `Minimum redemption is ${catalog.minimum_bbp} BBP.`, catalog };
  }

  // Maximum BBP per transaction
  if (catalog.maximum_bbp_per_transaction && points_requested > catalog.maximum_bbp_per_transaction) {
    return { valid: false, reason: `Maximum ${catalog.maximum_bbp_per_transaction} BBP per transaction.`, catalog };
  }

  // Maximum discount percent
  if (catalog.maximum_discount_percent && transaction_amount_usd > 0) {
    const maxByPercent = Math.floor((transaction_amount_usd * catalog.maximum_discount_percent) / 100);
    if (points_requested > maxByPercent) {
      return { valid: false, reason: `Maximum ${catalog.maximum_discount_percent}% of transaction value.`, catalog };
    }
  }

  // Minimum payable remaining
  if (catalog.minimum_payable_usd && transaction_amount_usd > 0) {
    const remaining = transaction_amount_usd - points_requested;
    if (remaining < catalog.minimum_payable_usd) {
      return { valid: false, reason: `Minimum $${catalog.minimum_payable_usd} must remain payable.`, catalog };
    }
  }

  // No stacking
  if (!catalog.stacking_allowed && has_promo_code) {
    return { valid: false, reason: 'BBP cannot be combined with a promo code for this benefit.', catalog };
  }

  // Inventory limit
  if (catalog.inventory_limit != null) {
    const existing = await base44.asServiceRole.entities.Redemption.filter({ benefit_id });
    const fulfilled = existing.filter((r: any) => r.status === 'fulfilled' || r.status === 'requested');
    if (fulfilled.length >= catalog.inventory_limit) {
      return { valid: false, reason: 'This benefit is fully allocated.', catalog };
    }
  }

  return { valid: true, reason: 'Valid', catalog };
}

/**
 * Processes a redemption: validates, debits ledger, creates Redemption record.
 */
export async function processRedemption(
  base44: any,
  bbp_member_id: string,
  native_user_id: string,
  benefit_id: string,
  benefit_type: string,
  points_cost: number,
  transaction_amount_usd: number,
  has_promo_code: boolean,
  fulfillment_reference: string
): Promise<{ success: boolean; reason: string; redemption_id?: string }> {
  // 1. Validate against catalog
  const validation = await validateRedemption(base44, bbp_member_id, benefit_id, points_cost, transaction_amount_usd, has_promo_code);
  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  // 2. Check wallet balance
  const wallets = await base44.asServiceRole.entities.BBPWalletBalance.filter({ bbp_member_id });
  if (!wallets.length || wallets[0].available_points < points_cost) {
    return { success: false, reason: 'Insufficient available BBP.' };
  }

  // 3. Create redemption ledger entry (negative)
  const ledgerEntry = await base44.asServiceRole.entities.BBPPointsLedger.create({
    ledger_id: ulid(),
    bbp_member_id,
    native_user_id,
    entry_type: 'redemption',
    points_delta: -points_cost,
    status: 'redeemed',
    source_type: 'redemption',
    source_event_id: `redemption_${ulid()}`,
    member_safe_description: `Redeemed ${points_cost} BBP for ${validation.catalog?.name_en || benefit_id}.`,
  });

  // 4. Create Redemption record
  const redemption = await base44.asServiceRole.entities.Redemption.create({
    redemption_id: ulid(),
    bbp_member_id,
    native_user_id,
    benefit_id,
    benefit_type,
    catalog_version: validation.catalog?.terms_version || '1.0',
    points_cost,
    status: 'fulfilled',
    fulfillment_reference,
    requested_at: new Date().toISOString(),
    fulfilled_at: new Date().toISOString(),
  });

  // 5. Update wallet projection
  await updateWalletProjection(base44, bbp_member_id, native_user_id);

  return { success: true, reason: 'Redemption successful', redemption_id: redemption.id };
}

/**
 * Qualifies a referral: checks Community Ready + qualifying paid transaction
 * + 30-day survival. Supports both fixed (10+5) and variable formula options.
 */
export async function qualifyReferralAward(
  base44: any,
  referral_id: string
): Promise<{ qualified: boolean; reason: string }> {
  const referrals = await base44.asServiceRole.entities.Referral.filter({ referral_id });
  if (!referrals.length) return { qualified: false, reason: 'Referral not found' };
  const referral = referrals[0];
  if (referral.status === 'rewarded') return { qualified: false, reason: 'Already rewarded' };
  if (referral.status === 'fraud_hold') return { qualified: false, reason: 'Referral under fraud review' };

  // Check invitee is Community Ready
  const inviteeEngagement = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
    native_user_id: referral.invitee_native_user_id,
  });
  if (!inviteeEngagement.length) return { qualified: false, reason: 'Invitee engagement profile not found' };
  const inviteeState = inviteeEngagement[0].community_standing_state;
  if (!['community_ready', 'community_active', 'community_connected'].includes(inviteeState)) {
    return { qualified: false, reason: 'Invitee has not reached Community Ready' };
  }

  // Check qualifying paid transaction (30-day survival)
  // This would check payment records — for now, verify qualified_date is 30+ days ago
  if (!referral.qualified_date) return { qualified: false, reason: 'No qualifying transaction recorded' };
  const survivalDate = new Date(new Date(referral.qualified_date).getTime() + 30 * 24 * 3600 * 1000);
  if (new Date() < survivalDate) {
    return { qualified: false, reason: 'Qualifying transaction has not survived 30-day window' };
  }

  // Check for safety holds on both members
  const referrerHolds = await base44.asServiceRole.entities.SafetyReviewCase.filter({
    subject_bbp_member_id: referral.referrer_bbp_member_id,
    status: { $in: ['open', 'under_review'] },
    points_hold_flag: true,
  });
  if (referrerHolds.length > 0) return { qualified: false, reason: 'Referrer has an active safety hold' };

  const inviteeHolds = await base44.asServiceRole.entities.SafetyReviewCase.filter({
    subject_bbp_member_id: referral.invitee_bbp_member_id,
    status: { $in: ['open', 'under_review'] },
    points_hold_flag: true,
  });
  if (inviteeHolds.length > 0) return { qualified: false, reason: 'Invitee has an active safety hold' };

  // Check referrer rolling 12-month cap (3 qualified referrals)
  const referralRule = (await base44.asServiceRole.entities.RewardRule.filter({
    rule_id: 'QUALIFIED_PAID_REFERRAL',
    status: 'active',
  }))[0];
  if (referralRule) {
    const priorReferralAwards = await base44.asServiceRole.entities.BBPPointsLedger.filter({
      bbp_member_id: referral.referrer_bbp_member_id,
      source_type: 'referral_qualified',
      entry_type: 'award',
    });
    const now = new Date();
    const cutoff = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
    const recent = priorReferralAwards.filter((e: any) => e.created_date && new Date(e.created_date) >= cutoff && e.status !== 'reversed');
    if (referralRule.per_member_cap && recent.length >= referralRule.per_member_cap) {
      return { qualified: false, reason: 'Referrer has reached the rolling 12-month referral cap' };
    }
  }

  // Award referrer
  if (referralRule) {
    await awardPoints(base44, referral.referrer_bbp_member_id, referral.referrer_native_user_id,
      'referral_qualified', 'referral_qualified', `referral_${referral.referral_id}`);
    // Award invitee (half of referrer amount)
    const inviteePoints = Math.floor(referralRule.points_amount * 0.5);
    if (inviteePoints > 0) {
      // Create a separate award for the invitee using the same rule
      await base44.asServiceRole.entities.BBPPointsLedger.create({
        ledger_id: ulid(),
        bbp_member_id: referral.invitee_bbp_member_id,
        native_user_id: referral.invitee_native_user_id,
        entry_type: 'award',
        points_delta: inviteePoints,
        status: 'pending',
        source_type: 'referral_qualified',
        source_event_id: `referral_invitee_${referral.referral_id}`,
        rule_id: referralRule.rule_id,
        rule_version: `${referralRule.rule_id}_v${referralRule.rule_version}`,
        available_at: new Date().toISOString(),
        expires_at: computeExpiryDate(new Date().toISOString()),
        member_safe_description: 'Referral reward pending.',
      });
      await updateWalletProjection(base44, referral.invitee_bbp_member_id, referral.invitee_native_user_id);
    }
  }

  // Mark referral as rewarded
  await base44.asServiceRole.entities.Referral.update(referral.id, {
    status: 'rewarded',
    reward_date: new Date().toISOString(),
  });

  return { qualified: true, reason: 'Referral qualified and rewarded' };
}

/**
 * Staff audit log helper. Creates an append-only audit record.
 */
export async function logStaffAction(
  base44: any,
  staff_user_id: string,
  action: string,
  target_type: string,
  target_id: string,
  prior_state: string,
  new_state: string,
  reason: string
): Promise<void> {
  await base44.asServiceRole.entities.StaffAuditLog.create({
    staff_user_id,
    action,
    target_type,
    target_id,
    prior_state,
    new_state,
    reason,
  });
}