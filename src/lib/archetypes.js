// Centralized dating archetype configuration.
//
// Stable internal codes (blue, black, purple) are the ONLY values stored in
// UserProfile.dating_archetype. They must never change — no migration, no enum
// rename. All member-facing labels and descriptions come from this config;
// components must never hard-code archetype names or descriptions.
//
// 1 BBP = $1 is unrelated to archetypes; this config is display-only.

export const DATING_ARCHETYPES = {
  blue: {
    code: 'blue',
    color_key: 'blue',
    color: '#60A5FA',
    display_name_en: 'Blue — The Traveler',
    description_en: "I am a person who needs freedom and prefers movement — diversity is essential to me. I want casual yet conscious connections with people who value communication and being upfront. Long-term commitment isn't where I am.",
    display_name_fr: 'Blue — Le Voyageur',
    description_fr: "Je suis une personne qui a besoin de liberté et qui préfère le mouvement — la diversité est essentielle pour moi. Je recherche des connexions décontractées, mais conscientes, avec des personnes qui valorisent la communication et la franchise. Je ne suis pas à l'étape d'un engagement à long terme.",
    sort_order: 1,
    active: true,
  },
  black: {
    code: 'black',
    color_key: 'black',
    color: '#9CA3AF',
    display_name_en: 'Black — The Seeker',
    description_en: "I want to experience passion, talk about hopes and dreams, learn about myself, and maybe share something cosmic 💫. But I could be ready for something serious if what I have been looking for has been found.",
    display_name_fr: 'Black — Le Chercheur',
    description_fr: "Je veux vivre de la passion, parler de mes espoirs et de mes rêves, apprendre à mieux me connaître et peut-être partager quelque chose de cosmique 💫. Je pourrais toutefois être prêt·e pour quelque chose de sérieux si je trouve enfin ce que je cherche.",
    sort_order: 2,
    active: true,
  },
  purple: {
    code: 'purple',
    color_key: 'purple',
    color: '#A855F7',
    display_name_en: 'Purple — The Enlightened',
    description_en: "I know what I am looking for, and the ultimate state of happiness for me involves spending time with someone who has similar goals. I am looking for a life partner and am serious about a long-term conscious union.",
    display_name_fr: "Purple — L\u2019Éveillé·e",
    description_fr: "Je sais ce que je cherche, et mon état de bonheur ultime implique de partager du temps avec une personne qui a des objectifs semblables aux miens. Je cherche un·e partenaire de vie et je souhaite construire une union consciente à long terme.",
    sort_order: 3,
    active: true,
  },
};

// Color map for components that need code → color lookup (e.g. Home orb).
export const ARCHETYPE_COLORS = {
  blue: DATING_ARCHETYPES.blue.color,
  black: DATING_ARCHETYPES.black.color,
  purple: DATING_ARCHETYPES.purple.color,
};

// Returns the archetype config object for a stable code, or null.
export function getArchetypeByCode(code) {
  return DATING_ARCHETYPES[code] || null;
}

// Returns the localized full display name (e.g. "Purple — The Enlightened")
// for a stable code. Falls back to the raw code only if the code is unknown.
export function getArchetypeLabel(code, lang = 'en') {
  const a = DATING_ARCHETYPES[code];
  if (!a) return code || '';
  return lang === 'fr' ? a.display_name_fr : a.display_name_en;
}

// Returns the localized full description for a stable code.
export function getArchetypeDescription(code, lang = 'en') {
  const a = DATING_ARCHETYPES[code];
  if (!a) return '';
  return lang === 'fr' ? a.description_fr : a.description_en;
}

// Returns the hex color for a stable code.
export function getArchetypeColor(code) {
  const a = DATING_ARCHETYPES[code];
  return a ? a.color : '#A855F7';
}

// Returns all active archetypes sorted by sort_order.
export function getActiveArchetypes() {
  return Object.values(DATING_ARCHETYPES)
    .filter(a => a.active)
    .sort((a, b) => a.sort_order - b.sort_order);
}