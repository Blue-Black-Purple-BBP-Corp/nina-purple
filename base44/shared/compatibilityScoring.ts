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