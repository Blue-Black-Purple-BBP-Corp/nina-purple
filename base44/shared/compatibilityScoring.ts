// Compatibility scoring engine — shared by calculateCompatibility and generateMatches.
// Extracted so the per-connection scorer and the matching-pool generator use identical logic.

const SCORE_MATRIX = {
  q11: { aa:4, ab:4, ac:2, ad:2, bb:4, bc:2, bd:3, cc:3, cd:3, dd:3 },
  q12: { aa:3, ab:2, ac:2, ad:3, bb:4, bc:4, bd:3, cc:4, cd:4, dd:3 },
  q13: { aa:4, ab:3, ac:4, ad:2, bb:3, bc:3, bd:2, cc:4, cd:2, dd:1 },
  q14: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:4, cd:3, dd:3 },
  q15: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:2, cd:2, dd:2 },
  q16: { aa:4, ab:4, ac:3, ad:2, bb:3, bc:3, bd:2, cc:3, cd:2, dd:1 },
  q17: { aa:4, ab:1, ac:3, ad:3, bb:4, bc:3, bd:3, cc:3, cd:4, dd:3 },
  q18: { aa:4, ab:3, ac:2, ad:1, bb:4, bc:3, bd:2, cc:3, cd:3, dd:3 },
  q19: { aa:4, ab:2, ac:3, ad:3, bb:2, bc:1, bd:2, cc:3, cd:3, dd:2 },
  q20: { aa:4, ab:3, ac:2, ad:3, bb:4, bc:1, bd:2, cc:4, cd:2, dd:3 },
  q21: { aa:4, ab:2, ac:2, ad:3, bb:3, bc:2, bd:1, cc:2, cd:1, dd:1 },
  q22: { aa:4, ab:1, ac:2, ad:2, bb:4, bc:3, bd:3, cc:3, cd:3, dd:2 },
  q23: { aa:4, ab:3, ac:2, ad:3, bb:4, bc:3, bd:3, cc:3, cd:2, dd:4 },
  q24: { aa:4, ab:3, ac:4, ad:2, bb:3, bc:3, bd:2, cc:3, cd:2, dd:1 },
  q25: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:3, cd:2, dd:2 },
  q26: { aa:4, ab:3, ac:2, ad:3, bb:2, bc:1, bd:2, cc:1, cd:2, dd:2 },
  q27: { aa:4, ab:3, ac:2, ad:2, bb:3, bc:2, bd:2, cc:2, cd:1, dd:1 },
  q28: { aa:4, ab:4, ac:3, ad:2, bb:3, bc:2, bd:1, cc:2, cd:2, dd:1 },
  q29: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:3, cd:2, dd:2 },
  q30: { aa:4, ab:2, ac:3, ad:2, bb:2, bc:2, bd:1, cc:3, cd:2, dd:1 },
  q31: { aa:4, ab:3, ac:3, ad:3, bb:3, bc:2, bd:2, cc:3, cd:2, dd:2 },
};

const WEIGHTS = {
  values_beliefs: 0.35,
  relationship_goals: 0.30,
  personality: 0.20,
  shared_interests: 0.15,
};

const CATEGORIES = {
  values_beliefs:    ['q11','q12','q14','q15','q18','q21','q22','q29'],
  relationship_goals:['q20','q30','q31','q13','q26','q28','q24'],
  personality:       ['q16','q19','q27'],
  shared_interests:  ['q23','q25'],
};

function getKey(a, b) {
  const sorted = [a, b].sort();
  return sorted[0] + sorted[1];
}

function scorePair(qKey, optA, optB) {
  if (!optA || !optB) return null;
  const matrix = SCORE_MATRIX[qKey];
  if (!matrix) return null;
  const key = getKey(optA, optB);
  return matrix[key] ?? null;
}

export function computeScore(answersA, answersB) {
  const categoryScores = {};
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const [cat, questions] of Object.entries(CATEGORIES)) {
    let catSum = 0;
    let catCount = 0;
    for (const q of questions) {
      const s = scorePair(q, answersA[q], answersB[q]);
      if (s !== null) { catSum += s; catCount++; }
    }
    if (catCount > 0) {
      const normalized = (catSum / (catCount * 4)) * 100;
      categoryScores[cat] = Math.round(normalized);
      totalWeighted += normalized * WEIGHTS[cat];
      totalWeight += WEIGHTS[cat];
    }
  }

  const overall = totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
  return { overall, categoryScores };
}

// ── Stored-answer mapping ──
// MatchingAnswers stores long keys (q11_core_values); computeScore uses short keys (q11).
const STORED_KEY_MAP: Record<string, string> = {
  q11_core_values: 'q11', q12_success: 'q12', q13_conflict: 'q13', q14_spirituality: 'q14',
  q15_personal_growth: 'q15', q16_stress: 'q16', q17_living_env: 'q17', q18_family: 'q18',
  q19_work_life: 'q19', q20_relationship_goal: 'q20', q21_money: 'q21', q22_gender_roles: 'q22',
  q23_leisure: 'q23', q24_communication: 'q24', q25_intellectual: 'q25', q26_boundaries: 'q26',
  q27_change: 'q27', q28_diversity: 'q28', q29_activism: 'q29', q30_emotional_intimacy: 'q30',
  q31_partner_growth: 'q31',
};

export const QUESTION_THEMES: Record<string, string> = {
  q11: 'Core values', q12: 'Definition of success', q13: 'Conflict style', q14: 'Spirituality',
  q15: 'Personal growth', q16: 'Stress response', q17: 'Living environment', q18: 'Family',
  q19: 'Work-life balance', q20: 'Relationship goals', q21: 'Money & finances', q22: 'Gender roles',
  q23: 'Leisure', q24: 'Communication', q25: 'Intellectual interests', q26: 'Boundaries',
  q27: 'Attitude toward change', q28: 'Diversity', q29: 'Activism & social engagement',
  q30: 'Emotional intimacy', q31: 'Partner growth',
};

export function mapStoredAnswers(stored: Record<string, any>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [longKey, shortKey] of Object.entries(STORED_KEY_MAP)) {
    if (stored[longKey]) mapped[shortKey] = stored[longKey];
  }
  return mapped;
}

export function computeScoreFromStored(storedA: Record<string, any>, storedB: Record<string, any>) {
  return computeScore(mapStoredAnswers(storedA), mapStoredAnswers(storedB));
}

// ── Attachment style + Big Five supplement (ECR-S / Mini-IPIP results) ──
// These are stored on UserProfile (not MatchingAnswers) and were previously
// disconnected from the matching pipeline. The supplement uses the same 0-4
// scoring pattern as the 21-question SCORE_MATRIX and blends into the overall
// score so the compatibility quiz actually feeds matching.

// Attachment style compatibility (0-4 scale). secure-secure is ideal;
// anxious-avoidant is the classic anxious-avoidant trap (lowest).
const ATTACHMENT_MATRIX: Record<string, Record<string, number>> = {
  secure:  { secure: 4, anxious: 3, avoidant: 2, fearful: 2 },
  anxious: { secure: 3, anxious: 3, avoidant: 1, fearful: 2 },
  avoidant: { secure: 2, anxious: 1, avoidant: 2, fearful: 2 },
  fearful: { secure: 2, anxious: 2, avoidant: 2, fearful: 2 },
};

// Big Five trait similarity (0-4 scale). Closer scores = higher compatibility.
function big5TraitSimilarity(a: number | undefined, b: number | undefined): number | null {
  if (a == null || b == null) return null;
  const diff = Math.abs(a - b);
  if (diff <= 0.5) return 4;
  if (diff <= 1.0) return 3;
  if (diff <= 1.5) return 2;
  if (diff <= 2.0) return 1;
  return 0;
}

// Compute a 0-100 supplement score from ECR-S attachment style + Big Five
// personality traits (stored on UserProfile). Returns null if no data available.
export function computeSupplementScore(profileA: any, profileB: any): number | null {
  const scores: number[] = [];

  // Attachment style compatibility
  const aStyle = profileA?.attachment_style;
  const bStyle = profileB?.attachment_style;
  if (aStyle && bStyle && ATTACHMENT_MATRIX[aStyle]?.[bStyle] != null) {
    scores.push(ATTACHMENT_MATRIX[aStyle][bStyle]);
  }

  // Big Five trait similarity
  const traits = ['big5_openness', 'big5_conscientiousness', 'big5_extraversion', 'big5_agreeableness', 'big5_neuroticism'];
  for (const t of traits) {
    const s = big5TraitSimilarity(profileA?.[t], profileB?.[t]);
    if (s !== null) scores.push(s);
  }

  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg / 4) * 100);
}

// Blend the 21-question base score with the attachment/Big Five supplement.
// 70% base, 30% supplement. If no supplement data, returns base unchanged.
export function blendScores(baseScore: number, supplementScore: number | null): number {
  if (supplementScore === null) return baseScore;
  return Math.round(baseScore * 0.7 + supplementScore * 0.3);
}

// Human-readable option labels per question (a/b/c/d), from the matching algorithm spec.
export const QUESTION_OPTIONS: Record<string, Record<string, string>> = {
  q11: { a: 'Honesty and integrity', b: 'Compassion and empathy', c: 'Ambition and achievement', d: 'Adventure and spontaneity' },
  q12: { a: 'Financial stability and career advancement', b: 'Personal fulfillment and happiness', c: 'Making a positive impact on others', d: 'Continuous growth and self-improvement' },
  q13: { a: 'Open communication and compromise', b: 'Taking time to cool off', c: 'Seeking a win-win solution', d: 'Avoiding conflicts altogether' },
  q14: { a: 'Central part of life and decision-making', b: 'Provides guidance and moral compass', c: 'Not important personally', d: 'Still exploring and defining beliefs' },
  q15: { a: 'Extremely important; always seeking self-improvement', b: 'Somewhat important; own pace', c: "Not a priority; content with who I am", d: 'Unsure; still figuring out approach' },
  q16: { a: 'Regular exercise and self-care', b: 'Seek support from loved ones/professionals', c: 'Immersed in hobbies I enjoy', d: 'Struggle with managing stress' },
  q17: { a: 'Urban city life', b: 'Peaceful suburban/rural setting', c: 'A mix of both', d: 'Flexible and open' },
  q18: { a: 'Family is top priority', b: 'Family important, but so are personal goals', c: 'Neutral; value independence', d: 'Not a priority; different definition of family' },
  q19: { a: 'Strive for a healthy balance', b: 'Work is a top priority', c: 'Personal life is more important', d: 'Struggle to maintain balance' },
  q20: { a: 'Companionship and building a life together', b: 'Marriage and starting a family', c: 'Exploring non-traditional/open relationship', d: 'Uncertain about long-term goals' },
  q21: { a: 'Budgeting and saving', b: 'Comfortable spending', c: 'Not focused on finances', d: 'Struggle with money management' },
  q22: { a: 'Embrace traditional gender roles', b: 'Prefer egalitarian approach', c: 'Open to discussing and finding balance', d: 'Unsure; still exploring views' },
  q23: { a: 'Physical activities and outdoors', b: 'Creative hobbies and arts', c: 'Relaxing at home', d: 'Socializing and exploring new places' },
  q24: { a: 'Active listening and expressing thoughts openly', b: 'Keeping emotions in check', c: 'Non-verbal cues and body language', d: 'Struggle with effective communication' },
  q25: { a: 'Extremely important; seek mental stimulation', b: 'Moderately important', c: 'Not a priority; focus on emotional connection', d: 'Unsure; still figuring out preference' },
  q26: { a: 'Communicate boundaries clearly and respect others', b: 'Adapt to others without asserting own', c: 'Struggle to establish and maintain boundaries', d: 'Still learning about boundaries' },
  q27: { a: 'Embrace change as growth opportunity', b: 'Uncomfortable but try to adapt', c: 'Prefer stability and resist change', d: 'Difficult to handle change; need support' },
  q28: { a: 'Respect and appreciate different perspectives', b: 'Engage in healthy debates', c: 'Avoid discussing sensitive topics', d: 'Struggle to accept differing opinions' },
  q29: { a: 'Actively involved in social causes', b: 'Supportive but not actively engaged', c: 'Not a priority; focus on personal matters', d: 'Still exploring views and involvement' },
  q30: { a: 'Openly express emotions; safe space for vulnerability', b: 'Comfortable with emotional self-sufficiency', c: 'Emotional intimacy develops slowly', d: 'Struggle with emotional intimacy' },
  q31: { a: 'Encourage and support growth for both', b: 'Focus on own growth, expect same from partner', c: "Growth is individual; respect partner's choices", d: 'Unsure; still figuring out approach' },
};

// Detailed breakdown: per-question pairwise score (X/4) + category sums, for
// grounding the Matchmaker admin prompt in the actual scoring mechanism.
export function computeDetailed(mappedA: Record<string, string>, mappedB: Record<string, string>) {
  const perQuestion: any[] = [];
  for (const [short, theme] of Object.entries(QUESTION_THEMES)) {
    const a = mappedA[short];
    const b = mappedB[short];
    const score = scorePair(short, a, b);
    perQuestion.push({ q: short, theme, a: a || null, b: b || null, score, max: 4 });
  }
  const categoryBreakdown: Record<string, any> = {};
  for (const [cat, questions] of Object.entries(CATEGORIES)) {
    let sum = 0, count = 0;
    for (const q of questions) {
      const s = scorePair(q, mappedA[q], mappedB[q]);
      if (s !== null) { sum += s; count++; }
    }
    categoryBreakdown[cat] = { sum, max: count * 4, count, pct: count > 0 ? Math.round((sum / (count * 4)) * 100) : 0 };
  }
  const { overall, categoryScores } = computeScore(mappedA, mappedB);
  return { overall, categoryScores, categoryBreakdown, perQuestion };
}