import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { computeScoreFromStored, mapStoredAnswers, QUESTION_THEMES } from '../../shared/compatibilityScoring.ts';

// Admin-only: returns the top 3 matches for a selected user (by compatibility
// score), with an AI-generated strengths / friction_points analysis per match.
// Analyses are cached in MatchAnalysis and only regenerated when either user's
// compatibility answers have changed (answer_hash mismatch).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id } = await req.json();
    if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });

    // Top 3 connections by compatibility_score where the selected user is the matcher.
    const conns = await base44.asServiceRole.entities.Connection.filter({ from_user_id: user_id });
    const top = conns
      .sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0))
      .slice(0, 3);

    if (top.length === 0) return Response.json({ matches: [] });

    const [myAnswersArr, myProfilesArr] = await Promise.all([
      base44.asServiceRole.entities.MatchingAnswers.filter({ user_id }),
      base44.asServiceRole.entities.UserProfile.filter({ user_id }),
    ]);
    const myAnswers = myAnswersArr[0] || {};
    const myProfile = myProfilesArr[0] || {};

    const results = await Promise.all(top.map(async (conn) => {
      const tid = conn.to_user_id;
      const [tAnswersArr, tProfilesArr] = await Promise.all([
        base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: tid }),
        base44.asServiceRole.entities.UserProfile.filter({ user_id: tid }),
      ]);
      const tAnswers = tAnswersArr[0] || {};
      const tProfile = tProfilesArr[0] || {};

      const hash = makeHash(myAnswers, tAnswers);
      const [aId, bId] = sortedPair(user_id, tid);

      // Cache lookup.
      const cached = await base44.asServiceRole.entities.MatchAnalysis.filter({
        user_a_id: aId, user_b_id: bId,
      });
      const existing = cached.find((c) => c.answer_hash === hash);
      if (existing) {
        return {
          connection_id: conn.id,
          to_user_id: tid,
          display_name: tProfile.display_name,
          city: tProfile.city,
          dating_archetype: tProfile.dating_archetype,
          compatibility_score: conn.compatibility_score || 0,
          strengths: existing.strengths || [],
          friction_points: existing.friction_points || [],
          cached: true,
        };
      }

      // Generate fresh analysis.
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: buildAnalysisPrompt(myAnswers, tAnswers, myProfile, tProfile),
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            friction_points: { type: 'array', items: { type: 'string' } },
          },
          required: ['strengths', 'friction_points'],
        },
      });
      const llm = (llmRes && typeof llmRes === 'object') ? llmRes : {};

      const stored = await base44.asServiceRole.entities.MatchAnalysis.create({
        user_a_id: aId,
        user_b_id: bId,
        answer_hash: hash,
        strengths: Array.isArray(llm.strengths) ? llm.strengths : [],
        friction_points: Array.isArray(llm.friction_points) ? llm.friction_points : [],
      });

      return {
        connection_id: conn.id,
        to_user_id: tid,
        display_name: tProfile.display_name,
        city: tProfile.city,
        dating_archetype: tProfile.dating_archetype,
        compatibility_score: conn.compatibility_score || 0,
        strengths: stored.strengths,
        friction_points: stored.friction_points,
        cached: false,
      };
    }));

    return Response.json({ matches: results });
  } catch (error) {
    console.error('getMatchmakerAnalysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function sortedPair(a: string, b: string): [string, string] {
  return [a, b].sort() as [string, string];
}

const STORED_KEYS = [
  'q11_core_values', 'q12_success', 'q13_conflict', 'q14_spirituality', 'q15_personal_growth',
  'q16_stress', 'q17_living_env', 'q18_family', 'q19_work_life', 'q20_relationship_goal',
  'q21_money', 'q22_gender_roles', 'q23_leisure', 'q24_communication', 'q25_intellectual',
  'q26_boundaries', 'q27_change', 'q28_diversity', 'q29_activism', 'q30_emotional_intimacy',
  'q31_partner_growth',
];

function makeHash(a: any, b: any): string {
  const sa = STORED_KEYS.map((k) => a[k] || '_').join('');
  const sb = STORED_KEYS.map((k) => b[k] || '_').join('');
  const s = sa + '|' + sb;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function buildAnalysisPrompt(a: any, b: any, pa: any, pb: any): string {
  const ma = mapStoredAnswers(a);
  const mb = mapStoredAnswers(b);
  const { categoryScores } = computeScoreFromStored(a, b);
  const lines: string[] = [];
  for (const [short, theme] of Object.entries(QUESTION_THEMES)) {
    const av = ma[short] || '—';
    const bv = mb[short] || '—';
    const align = av === bv ? 'aligned' : 'differs';
    lines.push(`- ${theme}: A=${av}, B=${bv} (${align})`);
  }
  return `You are a compatibility analyst for Nina Purple, a conscious dating community.
Two members have been matched based on 21 introspective questions across four categories.

Category alignment: Values & Beliefs ${categoryScores.values_beliefs ?? 0}%, Relationship Goals ${categoryScores.relationship_goals ?? 0}%, Personality ${categoryScores.personality ?? 0}%, Shared Interests ${categoryScores.shared_interests ?? 0}%.

Member A — Archetype: ${pa.dating_archetype || 'unspecified'}, City: ${pa.city || 'unknown'}
Member B — Archetype: ${pb.dating_archetype || 'unspecified'}, City: ${pb.city || 'unknown'}

Per-question answers (a/b/c/d choice letters):
${lines.join('\n')}

Produce a balanced, constructive analysis:
- "strengths": 2-4 areas where their answers align well.
- "friction_points": 2-4 areas where they differ and may need to navigate carefully — frame as growth opportunities, not red flags.

Do not reference phone, address, payment, or any data outside the answers provided.`;
}