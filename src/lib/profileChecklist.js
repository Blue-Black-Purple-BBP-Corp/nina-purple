// Profile completeness checklist — shared definition used by the dashboard
// progress panel. Each item knows how to test whether it is complete and
// where the user goes to complete it.
//
// `isNew: true` marks platform fields that were added after launch — users who
// onboarded earlier will see these flagged as "NEW" in their dashboard so they
// know to fill them in.

export const PROFILE_CHECKLIST = [
  { key: 'display_name', label_en: 'Display name', label_fr: 'Nom affiché',
    isComplete: p => !!p?.display_name?.trim(), isNew: false, action: { modal: 'edit' } },
  { key: 'birthdate', label_en: 'Birthdate', label_fr: 'Date de naissance',
    isComplete: p => !!p?.birthdate, isNew: false, action: { modal: 'edit' } },
  { key: 'city', label_en: 'Location', label_fr: 'Localisation',
    isComplete: p => !!p?.city?.trim(), isNew: false, action: { modal: 'edit' } },
  { key: 'sexual_orientation', label_en: 'Sexual orientation', label_fr: 'Orientation sexuelle',
    isComplete: p => !!p?.sexual_orientation, isNew: false, action: { modal: 'edit' } },
  { key: 'gender_pronoun', label_en: 'Gender pronoun', label_fr: 'Pronon',
    isComplete: p => !!p?.gender_pronoun, isNew: false, action: { modal: 'edit' } },
  { key: 'relationship_status', label_en: 'Relationship status', label_fr: 'Statut relationnel',
    isComplete: p => !!p?.relationship_status, isNew: false, action: { modal: 'edit' } },
  { key: 'dating_archetype', label_en: 'Dating archetype', label_fr: 'Archétype',
    isComplete: p => !!p?.dating_archetype, isNew: false, action: { modal: 'edit' } },
  { key: 'phone', label_en: 'Phone number', label_fr: 'Téléphone',
    isComplete: p => !!p?.phone?.trim(), isNew: false, action: { modal: 'edit' } },
  { key: 'photos', label_en: 'Photos (at least 3)', label_fr: 'Photos (au moins 3)',
    isComplete: p => (p?.photos?.filter(Boolean).length || 0) >= 3, isNew: false, action: { modal: 'photos' } },
  { key: 'bio', label_en: 'Biography', label_fr: 'Biographie',
    isComplete: p => !!p?.bio?.trim(), isNew: true, action: { modal: 'edit' } },
  { key: 'country', label_en: 'Country', label_fr: 'Pays',
    isComplete: p => !!p?.country?.trim(), isNew: true, action: { modal: 'edit' } },
  { key: 'attachment_style', label_en: 'Compatibility profile', label_fr: 'Profil de compatibilité',
    isComplete: p => !!p?.attachment_style, isNew: false, action: { to: '/compatibility-profile' } },
  { key: 'big5', label_en: 'Big 5 personality', label_fr: 'Personnalité Big 5',
    isComplete: p => p?.big5_openness != null, isNew: true, action: { to: '/compatibility-profile' } },
];

// Returns the full checklist with per-item completion state plus aggregate counts.
export function computeChecklist(profile) {
  const items = PROFILE_CHECKLIST.map(item => ({
    ...item,
    complete: item.isComplete(profile),
  }));
  const completed = items.filter(i => i.complete);
  const incomplete = items.filter(i => !i.complete);
  const completeness = Math.round((completed.length / items.length) * 100);
  return { items, completed, incomplete, completeness };
}

// Fields completed since the user's last review = currently complete but NOT
// present in the `reviewed_fields` snapshot taken at the last review.
export function computeNewSinceReview(profile) {
  const reviewed = new Set(profile?.reviewed_fields || []);
  const { completed } = computeChecklist(profile);
  return completed.filter(item => !reviewed.has(item.key));
}

// The list of currently-complete field keys — snapshotted when the user marks
// their profile as reviewed, so the next visit can diff against it.
export function getCompletedFieldKeys(profile) {
  return computeChecklist(profile).completed.map(i => i.key);
}