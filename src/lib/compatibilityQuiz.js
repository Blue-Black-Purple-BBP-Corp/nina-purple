// Compatibility Profile — ECR-S (attachment) + Mini-IPIP (Big Five)
// Both are open, published research scales. Scoring is client-side only.
// Raw answers stay on-device; only derived tags are synced to the profile.

// ── ECR-S (Wei, Heppner & Maddux, 2007) — 12 items, 7-point Likert ──
// Items are worded in the keyed direction of their subscale (no reverse coding).
export const ECRS_ITEMS = [
  // Anxiety subscale (higher = more attachment anxiety)
  { id: 'ecr1', subscale: 'anxiety', reverse: false,
    en: 'I worry about being alone.',
    fr: "Je m'inquiète d'être seul(e)." },
  { id: 'ecr2', subscale: 'anxiety', reverse: false,
    en: 'I worry that my partner may not really love me.',
    fr: "Je crains que mon partenaire ne m'aime pas vraiment." },
  { id: 'ecr3', subscale: 'anxiety', reverse: false,
    en: 'I worry about being abandoned.',
    fr: "Je m'inquiète d'être abandonné(e)." },
  { id: 'ecr4', subscale: 'anxiety', reverse: false,
    en: 'I worry a lot about my relationships.',
    fr: "Je m'inquiète beaucoup de mes relations." },
  { id: 'ecr5', subscale: 'anxiety', reverse: false,
    en: 'I worry about my partner leaving me.',
    fr: "Je crains que mon partenaire me quitte." },
  { id: 'ecr6', subscale: 'anxiety', reverse: false,
    en: 'I worry about being rejected by my partner.',
    fr: "Je crains d'être rejeté(e) par mon partenaire." },
  // Avoidance subscale (higher = more attachment avoidance)
  { id: 'ecr7', subscale: 'avoidance', reverse: false,
    en: 'I prefer not to show a partner how I feel deep down.',
    fr: "Je préfère ne pas montrer à mon partenaire ce que je ressens au fond." },
  { id: 'ecr8', subscale: 'avoidance', reverse: false,
    en: 'I try to avoid getting too close to my partner.',
    fr: "J'essaie d'éviter de trop me rapprocher de mon partenaire." },
  { id: 'ecr9', subscale: 'avoidance', reverse: false,
    en: 'I feel nervous when a partner gets too close to me.',
    fr: "Je me sens nerveux(se) quand un partenaire se rapproche trop." },
  { id: 'ecr10', subscale: 'avoidance', reverse: false,
    en: 'I find it difficult to let myself depend on a romantic partner.',
    fr: "J'ai du mal à me laisser dépendre d'un partenaire amoureux." },
  { id: 'ecr11', subscale: 'avoidance', reverse: false,
    en: 'I do not feel comfortable opening up to my partner.',
    fr: "Je ne me sens pas à l'aise quand je me confie à mon partenaire." },
  { id: 'ecr12', subscale: 'avoidance', reverse: false,
    en: 'I prefer not to depend on others or to have others depend on me.',
    fr: "Je préfère ne dépendre de personne, ni que l'on dépende de moi." },
];

// ── Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006) — 20 items, 5-point Likert ──
// Reverse-coded items are recoded (6 − raw) before averaging.
export const BIG5_ITEMS = [
  // Extraversion
  { id: 'b5_e1', trait: 'extraversion', reverse: false,
    en: 'I am the life of the party.',
    fr: "Je suis l'âme de la fête." },
  { id: 'b5_e2', trait: 'extraversion', reverse: true,
    en: "I don't talk a lot.",
    fr: 'Je ne parle pas beaucoup.' },
  { id: 'b5_e3', trait: 'extraversion', reverse: true,
    en: 'I tend to stay in the background.',
    fr: "J'ai tendance à rester en retrait." },
  { id: 'b5_e4', trait: 'extraversion', reverse: false,
    en: 'I talk to many different people at parties.',
    fr: 'Je parle à beaucoup de personnes différentes lors des fêtes.' },
  // Agreeableness
  { id: 'b5_a1', trait: 'agreeableness', reverse: true,
    en: 'I feel little concern for others.',
    fr: 'Je me soucie peu des autres.' },
  { id: 'b5_a2', trait: 'agreeableness', reverse: false,
    en: 'I am interested in people.',
    fr: "Je m'intéresse aux gens." },
  { id: 'b5_a3', trait: 'agreeableness', reverse: true,
    en: 'I sometimes insult people.',
    fr: "Il m'arrive d'insulter les gens." },
  { id: 'b5_a4', trait: 'agreeableness', reverse: false,
    en: 'I sympathize with others\u2019 feelings.',
    fr: 'Je compatis aux sentiments des autres.' },
  // Conscientiousness
  { id: 'b5_c1', trait: 'conscientiousness', reverse: false,
    en: 'I get my chores done right away.',
    fr: "Je m'acquitte de mes tâches sans tarder." },
  { id: 'b5_c2', trait: 'conscientiousness', reverse: false,
    en: 'I like order.',
    fr: "J'aime l'ordre." },
  { id: 'b5_c3', trait: 'conscientiousness', reverse: true,
    en: 'I leave my belongings lying around.',
    fr: 'Je laisse traîner mes affaires.' },
  { id: 'b5_c4', trait: 'conscientiousness', reverse: true,
    en: 'I tend to neglect my duties.',
    fr: "J'ai tendance à négliger mes responsabilités." },
  // Neuroticism
  { id: 'b5_n1', trait: 'neuroticism', reverse: false,
    en: 'I get stressed easily.',
    fr: 'Je me stresse facilement.' },
  { id: 'b5_n2', trait: 'neuroticism', reverse: true,
    en: 'I relax easily.',
    fr: 'Je me détends facilement.' },
  { id: 'b5_n3', trait: 'neuroticism', reverse: false,
    en: 'I worry about a lot of things.',
    fr: "Je m'inquiète pour beaucoup de choses." },
  { id: 'b5_n4', trait: 'neuroticism', reverse: true,
    en: 'I seldom feel down.',
    fr: 'Je me sens rarement abattu(e).' },
  // Openness
  { id: 'b5_o1', trait: 'openness', reverse: false,
    en: 'I have a vivid imagination.',
    fr: "J'ai une imagination fertile." },
  { id: 'b5_o2', trait: 'openness', reverse: true,
    en: "I don't have a good imagination.",
    fr: "Je n'ai pas une bonne imagination." },
  { id: 'b5_o3', trait: 'openness', reverse: false,
    en: 'I have excellent ideas.',
    fr: "J'ai d'excellentes idées." },
  { id: 'b5_o4', trait: 'openness', reverse: true,
    en: 'I have difficulty understanding abstract ideas.',
    fr: "J'ai du mal à comprendre les idées abstraites." },
];

export const LIKERT_7 = {
  min: 1, max: 7,
  labels_en: ['Strongly disagree', 'Disagree', 'Slightly disagree', 'Neutral', 'Slightly agree', 'Agree', 'Strongly agree'],
  labels_fr: ['Fortement en désaccord', 'En désaccord', 'Légèrement en désaccord', 'Neutre', 'Légèrement en accord', 'En accord', 'Fortement en accord'],
};

export const LIKERT_5 = {
  min: 1, max: 5,
  labels_en: ['Very inaccurate', 'Moderately inaccurate', 'Neither accurate nor inaccurate', 'Moderately accurate', 'Very accurate'],
  labels_fr: ['Très inexact', 'Plutôt inexact', 'Ni exact ni inexact', 'Plutôt exact', 'Très exact'],
};

export const BIG5_TRAITS = [
  { key: 'openness', en: 'Openness', fr: 'Ouverture' },
  { key: 'conscientiousness', en: 'Conscientiousness', fr: 'Conscience' },
  { key: 'extraversion', en: 'Extraversion', fr: 'Extraversion' },
  { key: 'agreeableness', en: 'Agreeableness', fr: 'Agréabilité' },
  { key: 'neuroticism', en: 'Neuroticism', fr: 'Névrosisme' },
];

const mean = (vals) => {
  const v = vals.filter((x) => x != null && !Number.isNaN(x));
  if (!v.length) return 0;
  return v.reduce((a, b) => a + b, 0) / v.length;
};

// Attachment: anxiety & avoidance means (1-7), style label
export function scoreAttachment(answers) {
  const anxiety = mean(ECRS_ITEMS.filter((i) => i.subscale === 'anxiety').map((i) => answers[i.id]));
  const avoidance = mean(ECRS_ITEMS.filter((i) => i.subscale === 'avoidance').map((i) => answers[i.id]));
  let style = 'secure';
  if (anxiety >= 4 && avoidance >= 4) style = 'fearful';
  else if (anxiety >= 4) style = 'anxious';
  else if (avoidance >= 4) style = 'avoidant';
  return { anxiety: Math.round(anxiety * 100) / 100, avoidance: Math.round(avoidance * 100) / 100, style };
}

// Big Five: per-trait means (1-5), reverse-coded
export function scoreBigFive(answers) {
  const result = {};
  for (const trait of BIG5_TRAITS) {
    const vals = BIG5_ITEMS.filter((i) => i.trait === trait.key).map((i) => {
      const raw = answers[i.id];
      if (raw == null) return null;
      return i.reverse ? 6 - raw : raw;
    });
    result[trait.key] = Math.round(mean(vals) * 100) / 100;
  }
  return result;
}

// Derive a level label from a 1-5 trait score
export function traitLevel(score) {
  if (score < 3) return 'low';
  if (score < 3.8) return 'moderate';
  return 'high';
}

export const ATTACHMENT_META = {
  secure: {
    color: '#F5A800',
    en: 'Secure',
    fr: 'Sécure',
    desc_en: 'You feel comfortable with closeness and autonomy. You trust others and rely on them while staying yourself.',
    desc_fr: "Vous êtes à l'aise avec la proximité et l'autonomie. Vous faites confiance et comptez sur l'autre tout en restant vous-même.",
  },
  anxious: {
    color: '#A855F7',
    en: 'Anxious',
    fr: 'Anxieux(se)',
    desc_en: 'You seek closeness and reassurance. Connection matters deeply, and you may worry about your partner\u2019s availability.',
    desc_fr: 'Vous recherchez la proximité et la réassurance. La connexion compte profondément, et l\u2019attention de l\u2019autre peut vous préoccuper.',
  },
  avoidant: {
    color: '#7B2FBE',
    en: 'Avoidant',
    fr: 'Évitant(e)',
    desc_en: 'You value independence and self-reliance. Closeness can feel uncomfortable, and you protect your autonomy.',
    desc_fr: "Vous valorisez l'indépendance et l'autonomie. La proximité peut être inconfortable, et vous protégez votre liberté.",
  },
  fearful: {
    color: '#60A5FA',
    en: 'Fearful',
    fr: 'Craintif(ve)',
    desc_en: 'You long for closeness yet fear being hurt. You move between reaching out and pulling away.',
    desc_fr: 'Vous désirez la proximité mais craignez d\u2019être blessé(e). Vous alternez entre vous rapprocher et vous éloigner.',
  },
};

export const LEVEL_LABEL = {
  low: { en: 'Low', fr: 'Bas' },
  moderate: { en: 'Moderate', fr: 'Modéré' },
  high: { en: 'High', fr: 'Élevé' },
};