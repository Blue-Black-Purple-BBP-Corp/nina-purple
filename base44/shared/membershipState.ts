// Authoritative membership-entitlement calculator. Single source of truth for
// whether a member may access paid functionality. Imported by
// getMemberAccessEntitlement, unlockConnection, sendMessage, revealPhotos,
// getPhotoAccess, and the AppLayout route guard.
//
// MODEL (decision 1 + 3): strict membership gating. A member may perform paid
// actions (unlock, outreach, reveal) ONLY when holding an active entitlement:
//   - trial_active          (Founding Member 3-month trial, server-confirmed)
//   - membership_active      ($20/mo subscription active)
//   - grace_period           (short post-failure window, if configured)
//   - cancelled_active_until_period_end (cancelled but paid through period end)
// past_due, cancelled_expired, payment_required, suspended, and restricted
// block all paid actions. Staff in Member mode are treated as ordinary members
// and do NOT bypass this rule.
//
// Interaction Credits are a separate prepaid wallet (decision 2) and are
// debited only after the membership entitlement check passes.

import { hasActiveMembership as hasLegacyMembership } from './planLimits.ts';
import { evaluateFoundingEligibility } from './foundingMembers.ts';

// Membership status values (member-safe).
export const MEMBERSHIP_STATUS = {
  ONBOARDING_INCOMPLETE: 'onboarding_incomplete',
  PAYMENT_REQUIRED: 'payment_required',
  TRIAL_ACTIVE: 'trial_active',
  MEMBERSHIP_ACTIVE: 'membership_active',
  GRACE_PERIOD: 'grace_period',
  PAYMENT_PAST_DUE: 'payment_past_due',
  CANCELLED_ACTIVE: 'cancelled_active_until_period_end',
  CANCELLED_EXPIRED: 'cancelled_expired',
  SUSPENDED: 'suspended',
  RESTRICTED: 'restricted',
  ADMIN_MEMBER_MODE: 'admin_member_mode',
};

// States that grant paid-action entitlement.
const ENTITLED_STATES = new Set([
  MEMBERSHIP_STATUS.TRIAL_ACTIVE,
  MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE,
  MEMBERSHIP_STATUS.GRACE_PERIOD,
  MEMBERSHIP_STATUS.CANCELLED_ACTIVE,
]);

// Grace period after a payment failure, in days. 0 = no grace (past_due blocks
// immediately). Configurable via AppSetting 'grace_period_days'.
export const DEFAULT_GRACE_PERIOD_DAYS = 0;

export function isEntitledForPaidActions(membership_status) {
  return ENTITLED_STATES.has(membership_status);
}

// Compute the authoritative membership status from profile + founding benefit.
// `foundingBenefit` is the FoundingMemberBenefit record (or null) from
// evaluateFoundingEligibility. `gracePeriodDays` is the configured grace window.
export function computeMembershipStatus(profile, foundingBenefit, gracePeriodDays = DEFAULT_GRACE_PERIOD_DAYS) {
  if (!profile) return MEMBERSHIP_STATUS.PAYMENT_REQUIRED;

  // Account-status overrides (server-enforced).
  if (profile.account_status === 'suspended') return MEMBERSHIP_STATUS.SUSPENDED;
  if (profile.account_status === 'permanently_removed' || profile.account_status === 'limited_review') {
    return MEMBERSHIP_STATUS.RESTRICTED;
  }

  // Onboarding incomplete (caller decides whether to surface this).
  if (profile.onboarding_status && profile.onboarding_status !== 'complete') {
    return MEMBERSHIP_STATUS.ONBOARDING_INCOMPLETE;
  }

  // Legacy billing_exempt grant (special code / founding admin grant).
  if (profile.billing_exempt_until && new Date(profile.billing_exempt_until) > new Date()) {
    return MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE;
  }
  if (profile.subscription_status === 'billing_exempt') {
    return MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE;
  }

  const now = new Date();
  const renewalDate = profile.subscription_renewal_date ? new Date(profile.subscription_renewal_date) : null;

  // Founding Member trial (server-confirmed active benefit).
  if (foundingBenefit?.eligibility_status === 'active' && foundingBenefit?.trial_ends_at && new Date(foundingBenefit.trial_ends_at) > now) {
    return MEMBERSHIP_STATUS.TRIAL_ACTIVE;
  }

  switch (profile.subscription_status) {
    case 'active':
      // Active subscription — confirm paid-through date hasn't passed.
      if (renewalDate && renewalDate < now) {
        // Renewal date passed without a webhook renewal → treat as expired.
        return MEMBERSHIP_STATUS.CANCELLED_EXPIRED;
      }
      return MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE;

    case 'trial_active':
      return MEMBERSHIP_STATUS.TRIAL_ACTIVE;

    case 'past_due':
      // Payment failed. Allow a short grace period if configured; otherwise block.
      if (gracePeriodDays > 0 && renewalDate) {
        const graceEnd = new Date(renewalDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
        if (graceEnd > now) return MEMBERSHIP_STATUS.GRACE_PERIOD;
      }
      return MEMBERSHIP_STATUS.PAYMENT_PAST_DUE;

    case 'grace_period':
      if (renewalDate) {
        const graceEnd = new Date(renewalDate.getTime() + (gracePeriodDays || 3) * 24 * 60 * 60 * 1000);
        if (graceEnd > now) return MEMBERSHIP_STATUS.GRACE_PERIOD;
      }
      return MEMBERSHIP_STATUS.PAYMENT_PAST_DUE;

    case 'cancelled_active_until_period_end':
      if (renewalDate && renewalDate > now) return MEMBERSHIP_STATUS.CANCELLED_ACTIVE;
      return MEMBERSHIP_STATUS.CANCELLED_EXPIRED;

    case 'cancelled_expired':
    case 'lapsed':
      return MEMBERSHIP_STATUS.CANCELLED_EXPIRED;

    case 'suspended':
      return MEMBERSHIP_STATUS.SUSPENDED;

    case 'restricted':
      return MEMBERSHIP_STATUS.RESTRICTED;

    case 'none':
    default:
      // Legacy paid tiers (lunar/stellar/galactic) still count as active for
      // backward compatibility with existing subscribers.
      if (hasLegacyMembership(profile) && ['lunar', 'stellar', 'galactic'].includes(profile.subscription_tier)) {
        return MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE;
      }
      return MEMBERSHIP_STATUS.PAYMENT_REQUIRED;
  }
}

// Member-safe plan label. Legacy subscribers (lunar/stellar/galactic) are shown
// a single neutral label in member-facing UI; the original tier names are
// retained only for invoices/receipts and internal billing/audit/support
// records (not rendered here).
export function planLabel(profile, lang = 'en') {
  if (profile?.subscription_tier === 'nina_membership') {
    return lang === 'fr' ? 'Adhésion Nina Purple' : 'Nina Purple Membership';
  }
  if (['lunar', 'stellar', 'galactic'].includes(profile?.subscription_tier)) {
    return lang === 'fr' ? 'Adhésion Nina Purple (ancienne)' : 'Nina Purple Membership (legacy)';
  }
  return lang === 'fr' ? 'Aucune adhésion' : 'No membership';
}

// Build the full member-access entitlement object.
// `walletBalance` = current interaction-credit balance (USD).
// `gracePeriodDays` from AppSetting (default 0).
export async function buildMemberAccessEntitlement(base44, native_user_id, opts = {}) {
  const { gracePeriodDays = DEFAULT_GRACE_PERIOD_DAYS, staffContext = null } = opts;

  const [profiles, foundingElig] = await Promise.all([
    base44.asServiceRole.entities.UserProfile.filter({ user_id: native_user_id }),
    evaluateFoundingEligibility(base44, native_user_id),
  ]);
  const profile = profiles[0];

  const foundingBenefit = foundingElig.benefit || null;
  const membership_status = computeMembershipStatus(profile, foundingBenefit, gracePeriodDays);

  // Staff in Member mode: if there is an active privileged session, they are NOT
  // in member mode. If no privileged session, they are in member mode and must
  // follow the same rules. The caller passes staffContext to flag admin_member_mode.
  // Staff in Member mode: no privileged session → treated as an ordinary member.
  // They never bypass the membership-entitlement rule (decision 1).
  const isStaffMemberMode = !!(staffContext && staffContext.isStaff && !staffContext.hasPrivilegedSession);
  const effectiveStatus = isStaffMemberMode ? MEMBERSHIP_STATUS.ADMIN_MEMBER_MODE : membership_status;

  // Paid actions require an entitled membership state AND the actor not being a
  // staff member in Member mode.
  const allowed_paid_actions = isEntitledForPaidActions(membership_status) && !isStaffMemberMode;

  const walletBalance = profile?.credit_balance ?? 0;

  // Feature matrix.
  const features = buildFeatureMatrix(membership_status, profile, walletBalance);

  return {
    account_status: profile?.account_status || 'active',
    onboarding_status: profile?.onboarding_status || 'not_started',
    membership_status: effectiveStatus,
    membership_status_raw: membership_status,
    membership_ends_at: profile?.subscription_renewal_date || foundingBenefit?.trial_ends_at || null,
    plan_name: planLabel(profile),
    founding_member_benefit_status: foundingElig.eligibility_status || 'ineligible',
    founding_member_trial_ends_at: foundingBenefit?.trial_ends_at || null,
    allowed_paid_actions,
    wallet_credit_balance: walletBalance,
    photo_reveal_eligibility: features.reveal,
    connection_credit_eligibility: features.unlock,
    allowed_features: features.allowed,
    locked_features: features.locked,
    reason_code_member_safe: reasonCode(membership_status),
    next_action: nextAction(membership_status, profile, foundingElig),
  };
}

function buildFeatureMatrix(membership_status, profile, walletBalance) {
  const entitled = isEntitledForPaidActions(membership_status);
  const allowed = [];
  const locked = [];

  // Discovery / browsing
  if (entitled) {
    allowed.push({ feature: 'browse_compatible_profiles', requirement: 'active_membership' });
    allowed.push({ feature: 'unlock_connection', requirement: 'active_membership + credits', credit_note: 'cost scales with compatibility' });
    allowed.push({ feature: 'send_initial_message', requirement: 'active_membership + credits', credit_note: 'one credit per new conversation; replies are free' });
    allowed.push({ feature: 'reveal_photos', requirement: 'active_membership + credits' });
    allowed.push({ feature: 'community', requirement: 'active_membership' });
    allowed.push({ feature: 'events', requirement: 'active_membership' });
  } else {
    locked.push({ feature: 'browse_compatible_profiles', requirement: 'active_membership', next_action: 'start_membership' });
    locked.push({ feature: 'unlock_connection', requirement: 'active_membership + credits', next_action: 'start_membership' });
    locked.push({ feature: 'send_initial_message', requirement: 'active_membership + credits', next_action: 'start_membership' });
    locked.push({ feature: 'reveal_photos', requirement: 'active_membership + credits', next_action: 'start_membership' });
    locked.push({ feature: 'community', requirement: 'active_membership', next_action: 'start_membership' });
    locked.push({ feature: 'events', requirement: 'active_membership', next_action: 'start_membership' });
  }

  // Account-maintenance features are always allowed.
  allowed.push({ feature: 'view_profile', requirement: 'none' });
  allowed.push({ feature: 'edit_profile', requirement: 'none' });
  allowed.push({ feature: 'manage_billing', requirement: 'none' });
  allowed.push({ feature: 'recharge_credits', requirement: 'none' });
  allowed.push({ feature: 'support', requirement: 'none' });

  return {
    allowed,
    locked,
    unlock: entitled && walletBalance > 0,
    reveal: entitled, // Galactic perk or paid credit
  };
}

function reasonCode(membership_status) {
  switch (membership_status) {
    case MEMBERSHIP_STATUS.ONBOARDING_INCOMPLETE: return 'onboarding_incomplete';
    case MEMBERSHIP_STATUS.PAYMENT_REQUIRED: return 'membership_required';
    case MEMBERSHIP_STATUS.TRIAL_ACTIVE: return 'trial_active';
    case MEMBERSHIP_STATUS.MEMBERSHIP_ACTIVE: return 'membership_active';
    case MEMBERSHIP_STATUS.GRACE_PERIOD: return 'grace_period';
    case MEMBERSHIP_STATUS.PAYMENT_PAST_DUE: return 'payment_past_due';
    case MEMBERSHIP_STATUS.CANCELLED_ACTIVE: return 'cancelled_active_until_period_end';
    case MEMBERSHIP_STATUS.CANCELLED_EXPIRED: return 'membership_expired';
    case MEMBERSHIP_STATUS.SUSPENDED: return 'account_suspended';
    case MEMBERSHIP_STATUS.RESTRICTED: return 'account_restricted';
    default: return 'membership_required';
  }
}

function nextAction(membership_status, profile, foundingElig) {
  switch (membership_status) {
    case MEMBERSHIP_STATUS.ONBOARDING_INCOMPLETE: return 'complete_onboarding';
    case MEMBERSHIP_STATUS.PAYMENT_REQUIRED:
      return foundingElig?.eligibility_status === 'eligible' ? 'start_founding_trial' : 'start_membership';
    case MEMBERSHIP_STATUS.PAYMENT_PAST_DUE: return 'update_payment_method';
    case MEMBERSHIP_STATUS.CANCELLED_ACTIVE: return 'resume_or_let_expire';
    case MEMBERSHIP_STATUS.CANCELLED_EXPIRED: return 'resume_membership';
    case MEMBERSHIP_STATUS.SUSPENDED:
    case MEMBERSHIP_STATUS.RESTRICTED: return 'contact_support';
    default: return 'none';
  }
}