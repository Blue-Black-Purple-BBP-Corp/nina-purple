// Shared onboarding state logic: stable step identifiers, server-side
// completion evaluation, and coarse-step mapping. Centralizes the completion
// check so getOnboardingStatus, createProfile, backfillOnboardingStatus,
// evaluateProfileCompletion, and the founding-trial webhook all agree.
//
// Photos are read from the Photo entity (private storage), NOT the deprecated
// UserProfile.photos[] array.

export const QUESTION_KEYS = [
  'q11_core_values', 'q12_success', 'q13_conflict', 'q14_spirituality',
  'q15_personal_growth', 'q16_stress', 'q17_living_env', 'q18_family',
  'q19_work_life', 'q20_relationship_goal', 'q21_money', 'q22_gender_roles',
  'q23_leisure', 'q24_communication', 'q25_intellectual', 'q26_boundaries',
  'q27_change', 'q28_diversity', 'q29_activism', 'q30_emotional_intimacy',
  'q31_partner_growth',
];

// Coarse stable step identifiers (survive UI reordering). The granular UI step
// names map onto these so persisted state stays valid across UI changes.
export const COARSE_STEPS = [
  'age_eligibility', 'profile_basics', 'profile_media', 'compatibility', 'membership', 'completion',
];

export function coarseFromGranular(granular) {
  switch (granular) {
    case 'age': case 'guidelines': case 'segmentation': return 'age_eligibility';
    case 'profile': case 'archetype': return 'profile_basics';
    case 'photos': return 'profile_media';
    case 'questions': case 'orientation': return 'compatibility';
    case 'subscription': return 'membership';
    case 'complete': return 'completion';
    default: return null;
  }
}

// Server-side onboarding completion check. Returns { isComplete, fieldsOk,
// photosOk, questionsOk, missing }. Reads photos from the Photo entity.
export async function evaluateOnboardingCompletion(base44, user_id, profile, answers) {
  const requiredFields = [
    !!profile?.display_name,
    !!profile?.city,
    !!profile?.birthdate,
    !!profile?.sexual_orientation,
    !!profile?.gender_pronoun,
    !!profile?.relationship_status,
    !!profile?.dating_archetype,
  ];
  const fieldsOk = requiredFields.every(Boolean);

  let photosCount = 0;
  try {
    const photoRecs = await base44.asServiceRole.entities.Photo.filter({ owner_native_user_id: user_id });
    photosCount = photoRecs.filter((p) => p.status === 'active').length;
  } catch (e) {
    console.warn('[onboardingState] photo count failed:', e?.message || e);
  }
  const photosOk = photosCount >= 3;

  const answeredCount = QUESTION_KEYS.filter((k) => answers?.[k]).length;
  const questionsOk = answeredCount === 21;

  return {
    isComplete: fieldsOk && photosOk && questionsOk,
    fieldsOk,
    photosOk,
    questionsOk,
    missing: {
      fields: requiredFields.filter((f) => !f).length,
      photos: Math.max(0, 3 - photosCount),
      questions: 21 - answeredCount,
    },
  };
}

// Whether a profile currently holds an active membership (paid or billing-exempt).
export function hasMembership(profile) {
  if (!profile) return false;
  if (profile.subscription_status === 'active' || profile.subscription_status === 'billing_exempt') return true;
  if (profile.billing_exempt_until && new Date(profile.billing_exempt_until) > new Date()) return true;
  if (['lunar', 'stellar', 'galactic', 'nina_membership'].includes(profile.subscription_tier)) return true;
  return false;
}