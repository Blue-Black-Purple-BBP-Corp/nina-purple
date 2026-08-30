import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { evaluateFoundingEligibility } from '../../shared/foundingMembers.ts';

// Member-facing: returns the current user's Founding Member trial eligibility.
// Used by the onboarding membership step to render the Founding Member offer vs.
// the standard plan. Server-side authoritative; the client never decides.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const elig = await evaluateFoundingEligibility(base44, user.id);
    return Response.json({ ...elig });
  } catch (error) {
    console.error('[getFoundingMemberEligibility] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});