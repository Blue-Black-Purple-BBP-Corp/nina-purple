import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { evaluateFoundingEligibility, TRIAL_DURATION_DAYS } from '../../shared/foundingMembers.ts';
import { computeMembershipStatus, MEMBERSHIP_STATUS } from '../../shared/membershipState.ts';
import { evaluateOnboardingCompletion } from '../../shared/onboardingState.ts';

// Authoritative server-side membership-offer function. Single source of truth
// for what a member should see at the onboarding membership step and on the
// Membership & Access page. The client never decides offer branching — it
// renders based on this response.
//
// Decision rules (in priority order):
//   1. Active founding trial or active paid subscription → already_active
//   2. Awaiting Stripe/webhook confirmation → awaiting_payment_confirmation
//   3. Founding Member tag + eligible benefit + onboarding complete + not suspended → founding_member_trial
//   4. Past-due subscription → payment_update_required
//   5. Expired/cancelled subscription → membership_reactivation
//   6. Standard new member → standard_membership
//   7. Ambiguous state → support_review_required

const POST_TRIAL_PRICE_USD = 20;
const CURRENT_MEMBERSHIP_PRICE_USD = 20;
const CONFIRMATION_DEADLINE_MINUTES = 30;

export const OFFER_TYPES = {
  FOUNDING_MEMBER_TRIAL: 'founding_member_trial',
  STANDARD_MEMBERSHIP: 'standard_membership',
  ALREADY_ACTIVE: 'already_active',
  PAYMENT_UPDATE_REQUIRED: 'payment_update_required',
  MEMBERSHIP_REACTIVATION: 'membership_reactivation',
  AWAITING_PAYMENT_CONFIRMATION: 'awaiting_payment_confirmation',
  SUPPORT_REVIEW_REQUIRED: 'support_review_required',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const offer = await buildOffer(base44, user.id);
    return Response.json(offer);
  } catch (error) {
    console.error('[getMembershipOfferForMember] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

export async function buildOffer(base44, native_user_id) {
  const [profiles, foundingElig] = await Promise.all([
    base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id }),
    evaluateFoundingEligibility(base44, native_user_id),
  ]);
  const profile = profiles[0] || null;
  const foundingBenefit = foundingElig.benefit || null;

  // Onboarding completion check
  let onboardingComplete = false;
  let onboardingCurrentStep = profile?.onboarding_current_step || null;
  if (profile) {
    const answers = await base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: native_user_id });
    const completion = await evaluateOnboardingCompletion(base44, native_user_id, profile, answers[0]);
    onboardingComplete = completion.isComplete;
  }

  const membership_status = computeMembershipStatus(profile, foundingBenefit);

  // ── 1. Already active (trial or paid) ──
  if ([
    MEMBERSHIP_STATUS.TRIAL_ACTIVE,
    MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE,
    MEMBERSHIP_STATUS.GRACE_PERIOD,
    MEMBERSHIP_STATUS.CANCELLED_ACTIVE,
  ].includes(membership_status)) {
    return buildResponse({
      offer_type: OFFER_TYPES.ALREADY_ACTIVE,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'not_started',
      onboarding_current_step: onboardingCurrentStep,
      membership_selection_status: profile?.membership_selection_status || 'pending',
      membership_ends_at: profile?.subscription_renewal_date || foundingBenefit?.trial_ends_at || null,
      subscription_reference: profile?.membership_subscription_reference || null,
      checkout_action_allowed: false,
      checkout_in_progress: false,
      awaiting_payment_confirmation: false,
      next_action: 'none',
      member_safe_reason: null,
    });
  }

  // ── 2. Awaiting payment confirmation ──
  // Checkout was created but webhook has not yet confirmed. This is the
  // critical state that prevents the redirect loop after Stripe success.
  const selStatus = profile?.membership_selection_status;
  const checkoutRef = profile?.membership_checkout_reference;
  const deadline = profile?.membership_confirmation_deadline;
  const deadlinePassed = deadline && new Date(deadline) < new Date();

  if (selStatus && ['founding_trial_checkout_created', 'standard_membership_checkout_created', 'awaiting_payment_confirmation'].includes(selStatus)
      && checkoutRef && !deadlinePassed) {
    return buildResponse({
      offer_type: OFFER_TYPES.AWAITING_PAYMENT_CONFIRMATION,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'awaiting_payment_confirmation',
      onboarding_current_step: onboardingCurrentStep || 'membership',
      membership_selection_status: selStatus,
      membership_ends_at: null,
      subscription_reference: checkoutRef,
      checkout_action_allowed: false, // never create a new checkout while pending
      checkout_in_progress: true,
      awaiting_payment_confirmation: true,
      next_action: 'wait_for_confirmation',
      member_safe_reason: null,
    });
  }

  // If the confirmation deadline passed, treat as checkout_failed — return to membership step
  if (selStatus && ['founding_trial_checkout_created', 'standard_membership_checkout_created', 'awaiting_payment_confirmation'].includes(selStatus)
      && deadlinePassed) {
    // Clear the stale pending state so the member can retry
    if (profile) {
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        membership_selection_status: 'checkout_failed',
        membership_last_error_code_member_safe: 'confirmation_timeout',
        onboarding_status: profile.onboarding_status === 'awaiting_payment_confirmation' ? 'awaiting_membership' : profile.onboarding_status,
      });
    }
    // Fall through to standard/founding offer below
  }

  // ── Account suspended/restricted ──
  if ([MEMBERSHIP_STATUS.SUSPENDED, MEMBERSHIP_STATUS.RESTRICTED].includes(membership_status)) {
    return buildResponse({
      offer_type: OFFER_TYPES.SUPPORT_REVIEW_REQUIRED,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'not_started',
      onboarding_current_step: onboardingCurrentStep,
      membership_selection_status: selStatus || 'pending',
      membership_ends_at: null,
      subscription_reference: null,
      checkout_action_allowed: false,
      checkout_in_progress: false,
      awaiting_payment_confirmation: false,
      next_action: 'contact_support',
      member_safe_reason: membership_status === MEMBERSHIP_STATUS.SUSPENDED ? 'account_suspended' : 'account_restricted',
    });
  }

  // ── 4. Past-due → payment update required ──
  if (membership_status === MEMBERSHIP_STATUS.PAYMENT_PAST_DUE) {
    return buildResponse({
      offer_type: OFFER_TYPES.PAYMENT_UPDATE_REQUIRED,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'not_started',
      onboarding_current_step: onboardingCurrentStep,
      membership_selection_status: selStatus || 'pending',
      membership_ends_at: profile?.subscription_renewal_date || null,
      subscription_reference: profile?.membership_subscription_reference || null,
      checkout_action_allowed: true,
      checkout_in_progress: false,
      awaiting_payment_confirmation: false,
      next_action: 'update_payment_method',
      member_safe_reason: 'payment_past_due',
    });
  }

  // ── 5. Expired/cancelled → reactivation ──
  if (membership_status === MEMBERSHIP_STATUS.CANCELLED_EXPIRED) {
    return buildResponse({
      offer_type: OFFER_TYPES.MEMBERSHIP_REACTIVATION,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'not_started',
      onboarding_current_step: onboardingCurrentStep,
      membership_selection_status: selStatus || 'pending',
      membership_ends_at: null,
      subscription_reference: null,
      checkout_action_allowed: true,
      checkout_in_progress: false,
      awaiting_payment_confirmation: false,
      next_action: 'reactivate_membership',
      member_safe_reason: 'membership_expired',
    });
  }

  // ── 3. Founding Member trial eligible ──
  // Requires: founding tag + eligible benefit + onboarding prerequisites + not suspended + no active sub
  if (foundingElig.eligibility_status === 'eligible' && onboardingComplete && profile?.account_status === 'active') {
    return buildResponse({
      offer_type: OFFER_TYPES.FOUNDING_MEMBER_TRIAL,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'awaiting_membership',
      onboarding_current_step: onboardingCurrentStep || 'membership',
      membership_selection_status: selStatus || 'pending',
      membership_ends_at: null,
      subscription_reference: null,
      checkout_action_allowed: true,
      checkout_in_progress: false,
      awaiting_payment_confirmation: false,
      next_action: 'start_founding_trial',
      member_safe_reason: null,
    });
  }

  // ── 6. Standard membership ──
  // Onboarding incomplete but at membership step, or founding member with used benefit
  if (profile?.account_status === 'active') {
    return buildResponse({
      offer_type: OFFER_TYPES.STANDARD_MEMBERSHIP,
      profile, foundingElig, membership_status,
      onboarding_status: profile?.onboarding_status || 'awaiting_membership',
      onboarding_current_step: onboardingCurrentStep || 'membership',
      membership_selection_status: selStatus || 'pending',
      membership_ends_at: null,
      subscription_reference: null,
      checkout_action_allowed: true,
      checkout_in_progress: false,
      awaiting_payment_confirmation: false,
      next_action: 'start_membership',
      member_safe_reason: null,
    });
  }

  // ── 7. Ambiguous → support review ──
  return buildResponse({
    offer_type: OFFER_TYPES.SUPPORT_REVIEW_REQUIRED,
    profile, foundingElig, membership_status,
    onboarding_status: profile?.onboarding_status || 'not_started',
    onboarding_current_step: onboardingCurrentStep,
    membership_selection_status: selStatus || 'pending',
    membership_ends_at: null,
    subscription_reference: null,
    checkout_action_allowed: false,
    checkout_in_progress: false,
    awaiting_payment_confirmation: false,
    next_action: 'contact_support',
    member_safe_reason: 'ambiguous_state',
  });
}

function buildResponse({
  offer_type, profile, foundingElig, membership_status,
  onboarding_status, onboarding_current_step, membership_selection_status,
  membership_ends_at, subscription_reference,
  checkout_action_allowed, checkout_in_progress, awaiting_payment_confirmation,
  next_action, member_safe_reason,
}) {
  return {
    onboarding_status,
    onboarding_current_step,
    membership_selection_status,
    membership_status,
    membership_ends_at,
    subscription_reference,
    founding_member_tag: profile?.is_founding_member || false,
    founding_benefit_status: foundingElig?.eligibility_status || 'ineligible',
    offer_type,
    offer_display_name: offerDisplayName(offer_type),
    trial_duration_days: TRIAL_DURATION_DAYS,
    post_trial_price_usd: POST_TRIAL_PRICE_USD,
    current_membership_price_usd: CURRENT_MEMBERSHIP_PRICE_USD,
    checkout_action_allowed,
    checkout_in_progress,
    awaiting_payment_confirmation,
    next_action,
    member_safe_reason,
  };
}

function offerDisplayName(offer_type) {
  switch (offer_type) {
    case OFFER_TYPES.FOUNDING_MEMBER_TRIAL: return 'Nina Purple Founding Member';
    case OFFER_TYPES.STANDARD_MEMBERSHIP: return 'Nina Purple Membership';
    case OFFER_TYPES.ALREADY_ACTIVE: return 'Membership Active';
    case OFFER_TYPES.PAYMENT_UPDATE_REQUIRED: return 'Payment Update Required';
    case OFFER_TYPES.MEMBERSHIP_REACTIVATION: return 'Reactivate Membership';
    case OFFER_TYPES.AWAITING_PAYMENT_CONFIRMATION: return 'Confirming Membership';
    case OFFER_TYPES.SUPPORT_REVIEW_REQUIRED: return 'Support Review Required';
    default: return 'Membership';
  }
}

export { CONFIRMATION_DEADLINE_MINUTES };