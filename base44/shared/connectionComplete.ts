import { computeScoreFromStored } from './compatibilityScoring.ts';

// Shared completion logic for mutual pay-to-connect.
// Called by both unlockConnection (after from_user pays) and acceptConnection
// (after to_user pays). Checks whether BOTH parties have completed their
// payment; if so, generates the Connection Brief and marks the connection as
// connected + unlocked.

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

// Returns { completed: true, brief } if both parties have paid and the
// connection is now connected, or { completed: false, waiting_for } if not.
export async function completeConnectionIfBothPaid(base44: any, connId: string) {
  // Reload the connection to get the latest payment state.
  const conns = await base44.asServiceRole.entities.Connection.filter({ id: connId });
  const conn = conns[0];
  if (!conn) return { completed: false, error: 'Connection not found' };

  // Backward compat: is_unlocked (legacy) counts as from_user having paid.
  const fromPaid = conn.from_unlock_paid || conn.is_unlocked;
  const toPaid = conn.to_unlock_paid;

  if (!fromPaid || !toPaid) {
    return {
      completed: false,
      waiting_for: !fromPaid ? 'from_user' : 'to_user',
    };
  }

  // Already connected — return existing brief if present.
  if (conn.status === 'connected') {
    const existing = await base44.asServiceRole.entities.ConnectionBrief.filter({ connection_id: connId });
    return { completed: true, brief: existing[0] || null, already_connected: true };
  }

  // Load both users' compatibility answers for the brief.
  const [aArr, bArr] = await Promise.all([
    base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: conn.from_user_id }),
    base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: conn.to_user_id }),
  ]);
  const answersA = aArr[0] || {};
  const answersB = bArr[0] || {};

  const { overall, categoryScores } = computeScoreFromStored(answersA, answersB);

  // Generate the brief — category scores only, no raw answers.
  let brief = null;
  const existing = await base44.asServiceRole.entities.ConnectionBrief.filter({ connection_id: connId });
  if (existing.length > 0) {
    brief = existing[0];
  } else {
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

    brief = await base44.asServiceRole.entities.ConnectionBrief.create({
      connection_id: conn.id,
      user_a_id: conn.from_user_id,
      user_b_id: conn.to_user_id,
      critical: Array.isArray(llm.critical) ? llm.critical : [],
      moderate: Array.isArray(llm.moderate) ? llm.moderate : [],
      light: Array.isArray(llm.light) ? llm.light : [],
    });
  }

  // Mutual opt-in complete — mark as connected + unlocked.
  await base44.asServiceRole.entities.Connection.update(conn.id, {
    status: 'connected',
    is_unlocked: true,
    pending_payment_for: null,
  });

  return { completed: true, brief };
}