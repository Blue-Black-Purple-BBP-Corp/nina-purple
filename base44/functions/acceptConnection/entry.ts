import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { computeScoreFromStored } from '../../shared/compatibilityScoring.ts';

// Mutual opt-in: the matched person (to_user) accepts a connection that the
// matcher (from_user) has already unlocked. On acceptance the connection
// becomes "connected" and a privacy-filtered Connection Brief is generated
// (category scores only — never raw answers) and stored for both users.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { connection_id } = await req.json();
    if (!connection_id) return Response.json({ error: 'connection_id required' }, { status: 400 });

    let conn = null;
    try {
      const conns = await base44.asServiceRole.entities.Connection.filter({ id: connection_id });
      conn = conns[0] || null;
    } catch (lookupErr) {
      console.error('acceptConnection lookup error:', lookupErr.message);
    }
    if (!conn) return Response.json({ error: 'Connection not found' }, { status: 404 });

    // Only the matched person (to_user) may accept.
    if (conn.to_user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    // The matcher must have opted in (unlocked) first.
    if (!conn.is_unlocked) {
      return Response.json({ error: 'Connection has not been unlocked yet' }, { status: 400 });
    }

    // Idempotent: already connected — return the existing brief if present.
    if (conn.status === 'connected') {
      const existing = await base44.asServiceRole.entities.ConnectionBrief.filter({ connection_id });
      return Response.json({ success: true, brief: existing[0] || null, already_connected: true });
    }
    if (conn.status !== 'pending') {
      return Response.json({ error: 'Connection is not in a pending state' }, { status: 400 });
    }

    // Load both users' compatibility answers.
    const [aArr, bArr] = await Promise.all([
      base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: conn.from_user_id }),
      base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: conn.to_user_id }),
    ]);
    const answersA = aArr[0] || {};
    const answersB = bArr[0] || {};

    const { overall, categoryScores } = computeScoreFromStored(answersA, answersB);

    // Generate the brief — category scores only, no raw answers.
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: buildBriefPrompt(categoryScores, overall),
      response_json_schema: {
        type: 'object',
        properties: {
          critical: { type: 'array', items: { type: 'string' } },
          moderate: { type: 'array', items: { type: 'string' } },
          light: { type: 'array', items: { type: 'string' } },
        },
        required: ['critical', 'moderate', 'light'],
      },
    });
    const llm = (llmRes && typeof llmRes === 'object') ? llmRes : {};

    const brief = await base44.asServiceRole.entities.ConnectionBrief.create({
      connection_id: conn.id,
      user_a_id: conn.from_user_id,
      user_b_id: conn.to_user_id,
      critical: Array.isArray(llm.critical) ? llm.critical : [],
      moderate: Array.isArray(llm.moderate) ? llm.moderate : [],
      light: Array.isArray(llm.light) ? llm.light : [],
    });

    // Mutual opt-in complete.
    await base44.asServiceRole.entities.Connection.update(conn.id, { status: 'connected' });

    return Response.json({ success: true, brief });
  } catch (error) {
    console.error('acceptConnection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildBriefPrompt(cat: any, overall: number): string {
  return `You are a conversation guide for Nina Purple, a conscious dating community.
Two members have been matched. Their compatibility by category:

- Values & Beliefs: ${cat.values_beliefs ?? 0}%
- Relationship Goals: ${cat.relationship_goals ?? 0}%
- Personality: ${cat.personality ?? 0}%
- Shared Interests: ${cat.shared_interests ?? 0}%
- Overall: ${overall}%

Generate conversation-starter questions in three tiers:
- "critical": 2-3 questions on foundational topics worth addressing early (values, life direction).
- "moderate": 2-3 questions on meaningful but less urgent topics.
- "light": 2-3 easy, low-stakes icebreaker questions.

CRITICAL PRIVACY RULE: Do not quote or reveal any user's specific answers. Generate general questions relevant to the compatibility themes involved, phrased so neither party learns anything private about the other beyond what their matched percentage already implies. Questions must be generic and theme-based, never referencing either person's individual responses.`;
}