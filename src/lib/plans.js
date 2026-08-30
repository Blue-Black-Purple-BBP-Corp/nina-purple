// Therapy Add-On — weekly recurring subscription, available to all members
export const THERAPY_ADDON = {
  key: 'therapy_weekly',
  color: '#F5A800',
  icon: '🧠',
  label_en: 'Therapy Add-On',
  label_fr: 'Supplément Thérapie',
  desc_en: '1× weekly individual or couple therapy + 1× weekly group therapy',
  desc_fr: '1× thérapie individuelle ou de couple hebdomadaire + 1× thérapie de groupe hebdomadaire',
  price_en: '$100 / week',
  price_fr: '$100 / semaine',
  recurring: true,
  price_key: 'therapy_weekly',
};

// ═══ Single Membership Plan ═══
// Replaces the former Solar/Lunar/Stellar/Galactic tiers.
// $20/month, recurring, cancel anytime.
// Entitlements: profile browsing, 1 free profile unlock/month, 30 free
// messages/month, community rooms, Experiences access. Beyond the free
// allowance, interactions route through the existing interaction-pricing
// table (unchanged).
export const NINA_MEMBERSHIP = {
  key: 'nina_membership',
  profile_type: 'individual',
  color: '#F5A800',
  icon: '💜',
  label_en: 'Nina Purple Membership',
  label_fr: 'Adhésion Nina Purple',
  desc_en: 'Full access — cancel anytime',
  desc_fr: 'Accès complet — annulez à tout moment',
  price_en: '$20 / month',
  price_fr: '$20 / mois',
  perks_en: [
    'Browse all compatible profiles',
    '1 free profile unlock per month',
    '30 free messages per month (community + 1:1, excluding your own rooms)',
    'Full community rooms access',
    'Access to Nina Purple Experiences',
  ],
  perks_fr: [
    'Parcourir tous les profils compatibles',
    '1 déverrouillage de profil gratuit par mois',
    '30 messages gratuits par mois (communauté + 1:1, hors vos propres salons)',
    'Accès complet aux salons communautaires',
    'Accès aux Expériences Nina Purple',
  ],
  durations: [
    { key: 'nina_membership_1m', label_en: '1 month', label_fr: '1 mois', price: '$20' },
  ],
};

export const ALL_PLANS = [NINA_MEMBERSHIP];
export const INDIVIDUAL_PLANS = [NINA_MEMBERSHIP];
export const COUPLE_PLANS = [NINA_MEMBERSHIP];

export function getPlansByType(type) {
  return [NINA_MEMBERSHIP];
}