import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Compatibility score matrix for each question.
// Key format: "optA_optB" (sorted alphabetically), value 1-4.
const SCORE_MATRIX = {
  // Q11 core values: a=Honesty, b=Compassion, c=Ambition, d=Adventure
  q11: { aa:4, ab:4, ac:2, ad:2, bb:4, bc:2, bd:3, cc:3, cd:3, dd:3 },
  // Q12 success: a=Financial, b=Fulfillment, c=Impact, d=Growth
  q12: { aa:3, ab:2, ac:2, ad:3, bb:4, bc:4, bd:3, cc:4, cd:4, dd:3 },
  // Q13 conflict: a=OpenComm, b=CoolOff, c=WinWin, d=Avoid
  q13: { aa:4, ab:3, ac:4, ad:2, bb:3, bc:3, bd:2, cc:4, cd:2, dd:1 },
  // Q14 spirituality: a=Central, b=Guidance, c=NotImportant, d=Exploring
  q14: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:4, cd:3, dd:3 },
  // Q15 personal growth: a=Extreme, b=Somewhat, c=NotPriority, d=Unsure
  q15: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:2, cd:2, dd:2 },
  // Q16 stress: a=Exercise, b=Support, c=Hobbies, d=Struggle
  q16: { aa:4, ab:4, ac:3, ad:2, bb:3, bc:3, bd:2, cc:3, cd:2, dd:1 },
  // Q17 living env: a=Urban, b=Rural, c=Mix, d=Flexible
  q17: { aa:4, ab:1, ac:3, ad:3, bb:4, bc:3, bd:3, cc:3, cd:4, dd:3 },
  // Q18 family: a=TopPriority, b=Important, c=Neutral, d=NotPriority
  q18: { aa:4, ab:3, ac:2, ad:1, bb:4, bc:3, bd:2, cc:3, cd:3, dd:3 },
  // Q19 work-life: a=Balance, b=WorkFirst, c=PersonalFirst, d=Struggle
  q19: { aa:4, ab:2, ac:3, ad:3, bb:2, bc:1, bd:2, cc:3, cd:3, dd:2 },
  // Q20 relationship goal: a=Companionship, b=Marriage, c=NonTraditional, d=Uncertain
  q20: { aa:4, ab:3, ac:2, ad:3, bb:4, bc:1, bd:2, cc:4, cd:2, dd:3 },
  // Q21 money: a=Budget, b=Spending, c=NotFocused, d=Struggle
  q21: { aa:4, ab:2, ac:2, ad:3, bb:3, bc:2, bd:1, cc:2, cd:1, dd:1 },
  // Q22 gender roles: a=Traditional, b=Egalitarian, c=OpenDiscuss, d=Unsure
  q22: { aa:4, ab:1, ac:2, ad:2, bb:4, bc:3, bd:3, cc:3, cd:3, dd:2 },
  // Q23 leisure: a=Physical, b=Creative, c=HomeRelax, d=Social
  q23: { aa:4, ab:3, ac:2, ad:3, bb:4, bc:3, bd:3, cc:3, cd:2, dd:4 },
  // Q24 communication: a=ActiveListen, b=EmotionCheck, c=NonVerbal, d=Struggle
  q24: { aa:4, ab:3, ac:4, ad:2, bb:3, bc:3, bd:2, cc:3, cd:2, dd:1 },
  // Q25 intellectual: a=Extreme, b=Moderate, c=NotPriority, d=Unsure
  q25: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:3, cd:2, dd:2 },
  // Q26 boundaries: a=Clear, b=Adaptive, c=Struggle, d=Learning
  q26: { aa:4, ab:3, ac:2, ad:3, bb:2, bc:1, bd:2, cc:1, cd:2, dd:2 },
  // Q27 change: a=Embrace, b=Uncomfortable, c=Resist, d=Difficulty
  q27: { aa:4, ab:3, ac:2, ad:2, bb:3, bc:2, bd:2, cc:2, cd:1, dd:1 },
  // Q28 diversity: a=Respect, b=Debate, c=Avoid, d=Struggle
  q28: { aa:4, ab:4, ac:3, ad:2, bb:3, bc:2, bd:1, cc:2, cd:2, dd:1 },
  // Q29 activism: a=Active, b=Supportive, c=NotPriority, d=Exploring
  q29: { aa:4, ab:3, ac:1, ad:2, bb:3, bc:2, bd:3, cc:3, cd:2, dd:2 },
  // Q30 emotional intimacy: a=Open, b=SelfSufficient, c=Slow, d=Struggle
  q30: { aa:4, ab:2, ac:3, ad:2, bb:2, bc:2, bd:1, cc:3, cd:2, dd:1 },
  // Q31 partner growth: a=Mutual, b=Individual, c=Respect, d=Unsure
  q31: { aa:4, ab:3, ac:3, ad:3, bb:3, bc:2, bd:2, cc:3, cd:2, dd:2 },
};

// Category weights from the doc
const WEIGHTS = {
  values_beliefs: 0.35,    // q11,q12,q14,q15,q18,q21,q22,q29
  relationship_goals: 0.30, // q20,q30,q31,q13,q26,q28,q24
  personality: 0.20,        // q16,q19,q27
  shared_interests: 0.15,   // q23,q25
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
  if (!optA || !optB) return null; // skip unanswered
  const matrix = SCORE_MATRIX[qKey];
  if (!matrix) return null;
  const key = getKey(optA, optB);
  return matrix[key] ?? null;
}

function computeScore(answersA, answersB) {
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
      // Normalize: max per question = 4
      const normalized = (catSum / (catCount * 4)) * 100;
      categoryScores[cat] = Math.round(normalized);
      totalWeighted += normalized * WEIGHTS[cat];
      totalWeight += WEIGHTS[cat];
    }
  }

  const overall = totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : 0;
  return { overall, categoryScores };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { target_user_id } = await req.json();
  if (!target_user_id) return Response.json({ error: 'target_user_id required' }, { status: 400 });

  // Fetch both users' answers
  const [myAnswersArr, theirAnswersArr] = await Promise.all([
    base44.entities.MatchingAnswers.filter({ user_id: user.id }),
    base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: target_user_id }),
  ]);

  if (!myAnswersArr.length || !theirAnswersArr.length) {
    return Response.json({ error: 'One or both users have no matching answers' }, { status: 404 });
  }

  const myAnswers = myAnswersArr[0];
  const theirAnswers = theirAnswersArr[0];

  const { overall, categoryScores } = computeScore(myAnswers, theirAnswers);

  return Response.json({ compatibility: overall, categoryScores });
});