// Shared Founding Member entitlement logic. The Founding Member tag
// (UserProfile.is_founding_member) is the eligibility source; the
// FoundingMemberBenefit entity is the authoritative entitlement record that
// tracks the one-time 3-month Stripe trial.
//
// Eligibility is evaluated server-side only. A member can never self-assign
// founding status (RLS blocks it). Only one benefit per member; a member with
// an active/redeemed/expired/revoked benefit cannot receive a second trial.

import { evaluateOnboardingCompletion } from './onboardingState.ts';

export const TRIAL_DURATION_DAYS = 90;
export const FOUNDING_MEMBER_CAP = 222;
export const FOUNDING_PRICE_KEY = 'nina_membership_1m';
export const FOUNDING_PRICE_ID = Deno.env?.get?.('STRIPE_PRICE_NINA_MEMBERSHIP_1M') || 'price_1UACzrJyNPXqDP7PTGpZfkVe';

// Count currently active founding members — benefits with eligibility_status
// 'active' (trial in progress) or 'eligible' (claimed, not yet started),
// excluding deleted/anonymized accounts. Used for the 222-cap eligibility rule.
// Slots reopen on churn: if a founding member's account is deleted or their
// benefit expires/is revoked, the count decreases and a new signup can fill
// that slot.
async function countActiveFoundingMembers(base44) {
  const [activeBenefits, eligibleBenefits] = await Promise.all([
    base44.asServiceRole.entities.FoundingMemberBenefit.filter({ eligibility_status: 'active' }, '-created_date', 500),
    base44.asServiceRole.entities.FoundingMemberBenefit.filter({ eligibility_status: 'eligible' }, '-created_date', 500),
  ]);
  const userIds = [...new Set([...activeBenefits, ...eligibleBenefits].map((b) => b.native_user_id))];
  if (userIds.length === 0) return 0;

  // Batch-fetch all relevant profiles in a single query (was: one
  // UserProfile.filter call per user — up to 222 individual API calls,
  // which triggered Base44 platform rate limits on every paid action
  // that calls evaluateFoundingEligibility: unlockConnection,
  // acceptConnection, requestPhotoReveal).
  const profiles = await base44.asServiceRole.entities.UserProfile.filter(
    { user_id: { $in: userIds } },
    '-created_date',
    500,
  );
  return profiles.filter((p) => p.account_status !== 'permanently_removed').length;
}

async function getBbpMemberId(base44, native_user_id) {
  try {
    const eng = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id });
    return eng[0]?.bbp_member_id || null;
  } catch {
    return null;
  }
}

// Evaluate eligibility for the current user. Server-side, authoritative.
// Returns { eligibility_status, benefit?, trial_ends_at?, legacy_grant?, reason? }.
export async function evaluateFoundingEligibility(base44, native_user_id) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id });
  const profile = profiles[0];
  if (!profile) return { eligibility_status: 'ineligible', reason: 'no_profile' };

  const benefits = await base44.asServiceRole.entities.FoundingMemberBenefit.filter({ native_user_id });
  const findStatus = (s) => benefits.find((b) => b.eligibility_status === s);

  const active = findStatus('active');
  if (active) return { eligibility_status: 'active', benefit: active, trial_ends_at: active.trial_ends_at };
  const redeemed = findStatus('redeemed');
  if (redeemed) return { eligibility_status: 'redeemed', benefit: redeemed };
  const expired = findStatus('expired');
  if (expired) return { eligibility_status: 'expired', benefit: expired };
  const revoked = findStatus('revoked');
  if (revoked) return { eligibility_status: 'revoked', benefit: revoked };

  // Legacy admin grant (billing_exempt_until in the future) → treat as active.
  if (profile.billing_exempt_until && new Date(profile.billing_exempt_until) > new Date()) {
    return { eligibility_status: 'active', trial_ends_at: profile.billing_exempt_until, legacy_grant: true };
  }

  // Already paying an active subscription → not eligible for a free trial.
  if (profile.subscription_status === 'active') {
    return { eligibility_status: 'redeemed', reason: 'active_subscription' };
  }

  // If the user already has an 'eligible' benefit (claimed a slot), they
  // bypass the 222 cap — the slot was already reserved.
  const existingEligible = findStatus('eligible');
  if (existingEligible) {
    return { eligibility_status: 'eligible', benefit: existingEligible };
  }

  if (!profile.is_founding_member) {
    return { eligibility_status: 'ineligible', reason: 'not_founding_member' };
  }

  // 222 cap: count currently active founding members (active + eligible
  // benefits, excluding deleted/anonymized accounts). If the cap is reached,
  // new users see the standard $20/month offer. Slots reopen on churn.
  const activeCount = await countActiveFoundingMembers(base44);
  if (activeCount >= FOUNDING_MEMBER_CAP) {
    return { eligibility_status: 'ineligible', reason: 'founding_cap_reached', active_count: activeCount };
  }

  return { eligibility_status: 'eligible' };
}

// Create or reuse an 'eligible' benefit for a claiming founding member. This
// benefit is the idempotency anchor for the Stripe checkout (its benefit_id is
// the idempotency key), so repeated taps/refresh/back-forward reuse the same
// benefit and the same checkout session.
export async function getOrCreateClaimBenefit(base44, native_user_id) {
  const existing = await base44.asServiceRole.entities.FoundingMemberBenefit.filter({
    native_user_id,
    eligibility_status: 'eligible',
  });
  if (existing.length) return existing[0];

  const benefit_id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const now = new Date().toISOString();
  const bbp_member_id = await getBbpMemberId(base44, native_user_id);

  return await base44.asServiceRole.entities.FoundingMemberBenefit.create({
    benefit_id,
    native_user_id,
    bbp_member_id: bbp_member_id || null,
    eligibility_source: 'founding_member_tag',
    eligibility_status: 'eligible',
    benefit_type: 'three_month_membership_trial',
    trial_duration_days: TRIAL_DURATION_DAYS,
    granted_at: now,
    claimed_at: now,
    audit_correlation_id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  });
}

// Activate a founding-member trial after Stripe confirms checkout. Sets the
// benefit active, activates membership, and completes onboarding if all data
// is present. Called from stripeWebhook (idempotent via WebhookEvent).
export async function activateFoundingTrial(base44, user_id, session, benefit_id) {
  const now = new Date();
  const trialEnds = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;

  const benefits = await base44.asServiceRole.entities.FoundingMemberBenefit.filter({ benefit_id });
  if (benefits[0]) {
    await base44.asServiceRole.entities.FoundingMemberBenefit.update(benefits[0].id, {
      eligibility_status: 'active',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds,
      subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      stripe_price_id: FOUNDING_PRICE_ID,
      redemption_reference: session.id,
    });
  }

  let onboardingCompleted = false;
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id });
  if (profiles[0]) {
    const profile = profiles[0];
    const answers = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id });
    const completion = await evaluateOnboardingCompletion(base44, user_id, profile, answers[0]);
    const updateData = {
      subscription_tier: 'nina_membership',
      subscription_status: 'trial_active',
      subscription_renewal_date: trialEnds,
      membership_selection_status: 'trial_active',
      membership_subscription_reference: subscriptionId,
      membership_checkout_reference: null,
      membership_confirmation_deadline: null,
    };
    if (completion.isComplete && profile.onboarding_status !== 'complete') {
      updateData.onboarding_status = 'complete';
      updateData.onboarding_complete = true;
      updateData.onboarding_completed_at = now.toISOString();
      updateData.onboarding_version = '1.0';
      updateData.onboarding_step = null;
      updateData.onboarding_current_step = 'completion';
      onboardingCompleted = true;
    }
    await base44.asServiceRole.entities.UserProfile.update(profile.id, updateData);
  }

  try {
    const { writeStaffAuditLog } = await import('./staffAuth.ts');
    await writeStaffAuditLog(base44, {
      actor_native_user_id: user_id,
      action_type: 'founding_member.trial_activated',
      target_entity_type: 'FoundingMemberBenefit',
      target_entity_id: benefit_id,
      new_state: { subscription_id: subscriptionId, trial_ends_at: trialEnds, onboarding_complete: onboardingCompleted },
    });
  } catch (e) {
    console.warn('[foundingMembers] audit log failed:', e?.message || e);
  }

  return { trial_ends_at: trialEnds, onboarding_completed: onboardingCompleted };
}