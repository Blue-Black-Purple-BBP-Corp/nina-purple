// Shared plan-limit configuration and pricing helpers used by backend functions.
// Kept here to avoid duplicating billing-critical logic across functions.

// ── Legacy tiers (kept for backward compat with existing subscribers until
//    they renew onto the single nina_membership plan) ──
export const PLAN_LIMITS = {
  solar:   { unlocks_per_month: 0,    messages_per_month: 5,        gallery_unlock_free: false, priority_search: false, see_viewers: false, free_profile_unlocks: 0,  free_messages: 0  },
  lunar:   { unlocks_per_month: 1,    messages_per_month: 30,       gallery_unlock_free: false, priority_search: false, see_viewers: true,  free_profile_unlocks: 1,  free_messages: 30 },
  stellar: { unlocks_per_month: 2,    messages_per_month: 100,      gallery_unlock_free: false, priority_search: true,  see_viewers: true,  free_profile_unlocks: 2,  free_messages: 100 },
  galactic:{ unlocks_per_month: 3,    messages_per_month: Infinity, gallery_unlock_free: true,  priority_search: true,  see_viewers: true,  free_profile_unlocks: 3,  free_messages: Infinity },
  // ── New single plan ──
  // 1 free profile unlock + 30 free messages per billing cycle.
  // Beyond the free allowance, interactions fall through to the paid
  // interaction-pricing table (unchanged). counters reset on the user's
  // individual subscription_renewal_date, not calendar month start.
  nina_membership: { unlocks_per_month: Infinity, messages_per_month: Infinity, gallery_unlock_free: false, priority_search: false, see_viewers: false, free_profile_unlocks: 1, free_messages: 30 },
};

// Server-authoritative pricing table — mirrors src/lib/i18n.js PRICING_TABLE.
// Only the billing-critical fields (unlock cost + per-message cost) are needed server-side.
export const PRICING_TABLE = [
  { min: 90, max: 100, unlock: 20,  msg: 0.01 },
  { min: 80, max: 89,  unlock: 40,  msg: 0.02 },
  { min: 70, max: 79,  unlock: 60,  msg: 0.03 },
  { min: 60, max: 69,  unlock: 80,  msg: 0.04 },
  { min: 50, max: 59,  unlock: 100, msg: 0.05 },
  { min: 40, max: 49,  unlock: 120, msg: 0.06 },
  { min: 30, max: 39,  unlock: 140, msg: 0.07 },
  { min: 20, max: 29,  unlock: 160, msg: 0.08 },
  { min: 0,  max: 19,  unlock: 180, msg: 0.09 },
];

export function getPricingForCompatibility(score) {
  return PRICING_TABLE.find(p => score >= p.min && score <= p.max) || PRICING_TABLE[PRICING_TABLE.length - 1];
}

// Returns the user's individual billing-cycle start date.
// For nina_membership, this is their subscription_renewal_date.
// Falls back to calendar month start for legacy tiers.
export function getBillingCycleStart(profile) {
  if (profile?.subscription_tier === 'nina_membership' && profile?.subscription_renewal_date) {
    const renewal = new Date(profile.subscription_renewal_date);
    // If renewal hasn't passed yet this cycle, the cycle started at the previous renewal
    const now = new Date();
    if (renewal <= now) return renewal;
    // Renewal is in the future — previous cycle start was one month ago
    // (approximate; Stripe provides the exact current_period_start in webhooks)
    const prev = new Date(renewal);
    prev.setMonth(prev.getMonth() - 1);
    return prev;
  }
  // Legacy: calendar month start
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Checks whether a user has an active (or billing-exempt) membership.
export function hasActiveMembership(profile) {
  if (!profile) return false;
  if (profile.subscription_status === 'active' || profile.subscription_status === 'billing_exempt') return true;
  // billing_exempt_until date still in the future
  if (profile.billing_exempt_until && new Date(profile.billing_exempt_until) > new Date()) return true;
  // Legacy paid tiers still active
  if (['lunar', 'stellar', 'galactic'].includes(profile.subscription_tier)) return true;
  return false;
}

// Legacy helper — kept for any code that still calls getMonthStart.
export function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}