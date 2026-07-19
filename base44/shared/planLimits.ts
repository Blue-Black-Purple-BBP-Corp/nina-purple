// Shared plan-limit configuration and pricing helpers used by backend functions.
// Kept here to avoid duplicating billing-critical logic across functions.

export const PLAN_LIMITS = {
  solar:   { unlocks_per_month: 0,    messages_per_month: 5,        gallery_unlock_free: false, priority_search: false, see_viewers: false },
  lunar:   { unlocks_per_month: 1,    messages_per_month: 30,       gallery_unlock_free: false, priority_search: false, see_viewers: true  },
  stellar: { unlocks_per_month: 2,    messages_per_month: 100,      gallery_unlock_free: false, priority_search: true,  see_viewers: true  },
  galactic:{ unlocks_per_month: 3,    messages_per_month: Infinity, gallery_unlock_free: true,  priority_search: true,  see_viewers: true  },
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

export function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}