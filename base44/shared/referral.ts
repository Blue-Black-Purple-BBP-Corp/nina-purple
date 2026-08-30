// Referral link engine — shared logic for the $5-per-new-user referral program.
//
// Each member gets a unique alphanumeric referral code themed around conscious
// relationships (a curated word + a short random suffix). When a new member
// completes onboarding with a referrer's code, the referrer earns 5 BBP
// ($5 USD member value; 1 BBP = $1). Idempotent: one award per (referrer, invitee).
//
// Reuses the BBP ledger + wallet projection from bbpRules.ts so balances stay
// consistent with the rest of the rewards engine. MUST be called server-side
// (asServiceRole). NEVER trusts a client-submitted points amount.

import { ulid, computeExpiryDate, updateWalletProjection } from './bbpRules.ts';

export const REFERRAL_REWARD_BBP = 5;

// Curated conscious-relationship words. Uppercase, alpha-only, 3-8 chars.
// These form the readable, shareable prefix of each member's referral code.
const CONSCIOUS_WORDS = [
  'AURA', 'SOUL', 'BOND', 'ALIGN', 'BLOOM', 'NEXUS', 'SACRED', 'TWIN',
  'HARMONY', 'RESONATE', 'CONNECT', 'PRESENCE', 'HEART', 'SPIRIT', 'UNION',
  'LIGHT', 'EMBER', 'LUMEN', 'KINDRED', 'ATTUNE', 'ECHO', 'MUSE', 'ZENITH',
  'ORBIT', 'TIDE', 'ROOT', 'OASIS', 'SANGHA', 'WEAVE', 'THREAD', 'SPARK',
  'FLAME', 'GLOW', 'DAWN', 'NOVA', 'SERENE', 'TRUE', 'DEEP', 'WHOLE',
  'OPEN', 'GENTLE', 'BRAVE', 'PURE', 'WISE', 'CALM', 'HOPE', 'LOVE',
  'TRUST', 'CARE', 'HONOR', 'SHARE', 'DREAM', 'VOW', 'PACT', 'KINSHIP',
  'GRACE', 'TENDER', 'CHERISH', 'NURTURE', 'FAITH', 'DEVOTION', 'ANCHOR',
  'HAVEN', 'EMBRACE', 'ENTWINE', 'MIRROR', 'ALLY', 'BLISS', 'RADIANCE',
];

// Crockford Base32 (no ambiguous chars O/0/I/1/U) for the random suffix.
const ENCODING = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function randomSuffix(len: number): string {
  let str = '';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) str += ENCODING[bytes[i] % 32];
  return str;
}

/**
 * Generates a unique referral code: CONSCIOUS_WORD + 3-char random suffix
 * (e.g. AURA7K3, SOULX9P). Collision-checked against existing UserProfile.referral_code.
 */
export async function generateUniqueReferralCode(base44: any): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const word = CONSCIOUS_WORDS[Math.floor(Math.random() * CONSCIOUS_WORDS.length)];
    const code = `${word}${randomSuffix(3)}`;
    const existing = await base44.asServiceRole.entities.UserProfile.filter({ referral_code: code });
    if (existing.length === 0) return code;
  }
  // Extremely unlikely fallback: longer suffix.
  const word = CONSCIOUS_WORDS[Math.floor(Math.random() * CONSCIOUS_WORDS.length)];
  return `${word}${randomSuffix(5)}`;
}

/**
 * Returns the member's referral code, generating + persisting one if missing.
 */
export async function ensureReferralCode(base44: any, user_id: string): Promise<string> {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id });
  if (!profiles.length) throw new Error('Profile not found');
  const profile = profiles[0];
  if (profile.referral_code) return profile.referral_code;
  const code = await generateUniqueReferralCode(base44);
  await base44.asServiceRole.entities.UserProfile.update(profile.id, { referral_code: code });
  return code;
}

/**
 * Processes a referral signup: resolves the referrer by referral_code, creates
 * a Referral record (rewarded), and awards REFERRAL_REWARD_BBP to the referrer.
 * Idempotent: skips if a Referral already exists for this (referrer, invitee)
 * pair, or if a ledger entry with the same source_event_id already exists.
 *
 * Called from createProfile when onboarding completes with a referred_by_code.
 */
export async function processReferralSignup(
  base44: any,
  invitee_user_id: string,
  ref_code: string
): Promise<{ rewarded: boolean; reason: string; referrer_code?: string }> {
  const code = String(ref_code || '').trim().toUpperCase();
  if (!code) return { rewarded: false, reason: 'No referral code' };

  // Resolve referrer by referral_code.
  const referrerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ referral_code: code });
  if (!referrerProfiles.length) {
    return { rewarded: false, reason: 'Referrer not found for code' };
  }
  const referrer = referrerProfiles[0];

  // Self-referral guard.
  if (referrer.user_id === invitee_user_id) {
    return { rewarded: false, reason: 'Self-referral not allowed' };
  }

  // Referrer account-status guard: don't reward suspended/removed referrers.
  if (referrer.account_status && referrer.account_status !== 'active') {
    return { rewarded: false, reason: `Referrer account not active (${referrer.account_status})` };
  }

  // Resolve referrer's bbp_member_id (required for the ledger).
  const referrerEngagement = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
    native_user_id: referrer.user_id,
  });
  if (!referrerEngagement.length) {
    return { rewarded: false, reason: 'Referrer engagement profile not found' };
  }
  const referrer_bbp_member_id = referrerEngagement[0].bbp_member_id;

  // Resolve invitee's bbp_member_id (for the Referral record).
  const inviteeEngagement = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
    native_user_id: invitee_user_id,
  });
  const invitee_bbp_member_id = inviteeEngagement[0]?.bbp_member_id || null;

  // Idempotency: existing Referral for this (referrer, invitee) pair.
  const existingReferrals = await base44.asServiceRole.entities.Referral.filter({
    referrer_native_user_id: referrer.user_id,
    invitee_native_user_id: invitee_user_id,
  });
  if (existingReferrals.length > 0) {
    return { rewarded: false, reason: 'Referral already recorded', referrer_code: code };
  }

  // Idempotency: existing ledger entry for this source_event_id.
  const source_event_id = `referral_signup_${invitee_user_id}`;
  const existingLedger = await base44.asServiceRole.entities.BBPPointsLedger.filter({
    bbp_member_id: referrer_bbp_member_id,
    source_type: 'referral_qualified',
    source_event_id,
    entry_type: 'award',
  });
  if (existingLedger.length > 0) {
    return { rewarded: false, reason: 'Referral already rewarded', referrer_code: code };
  }

  // Safety-hold check: if referrer has an active safety hold, award as 'held'.
  let status = 'available';
  let member_safe_description = 'Your referral reward is available.';
  try {
    const holds = await base44.asServiceRole.entities.SafetyReviewCase.filter({
      subject_bbp_member_id: referrer_bbp_member_id,
      status: { $in: ['open', 'under_review'] },
      points_hold_flag: true,
    });
    if (holds.length > 0) {
      status = 'held';
      member_safe_description = 'Your referral reward is being reviewed and will be available soon.';
    }
  } catch (e) { /* non-fatal — default to available */ }

  const now = new Date().toISOString();

  // Create the Referral record (rewarded).
  await base44.asServiceRole.entities.Referral.create({
    referral_id: ulid(),
    referrer_bbp_member_id,
    referrer_native_user_id: referrer.user_id,
    invite_code: code,
    invitee_bbp_member_id,
    invitee_native_user_id: invitee_user_id,
    status: 'rewarded',
    qualified_date: now,
    reward_date: now,
    risk_status: 'clear',
  });

  // Award 5 BBP to the referrer (append-only ledger entry).
  await base44.asServiceRole.entities.BBPPointsLedger.create({
    ledger_id: ulid(),
    bbp_member_id: referrer_bbp_member_id,
    native_user_id: referrer.user_id,
    entry_type: 'award',
    points_delta: REFERRAL_REWARD_BBP,
    status,
    source_type: 'referral_qualified',
    source_event_id,
    rule_id: 'REFERRAL_SIGNUP',
    rule_version: 'REFERRAL_SIGNUP_v1',
    available_at: now,
    expires_at: computeExpiryDate(now),
    member_safe_description,
  });

  // Update the referrer's wallet projection.
  await updateWalletProjection(base44, referrer_bbp_member_id, referrer.user_id);

  return { rewarded: true, reason: 'Referral rewarded', referrer_code: code };
}