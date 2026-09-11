import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Returns the number of distinct members who have vouched for the target user.
// Public count only — no voucher identities are exposed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id || user.id;

    const vouches = await base44.asServiceRole.entities.PeerVouch.filter({
      vouched_for_user_id: targetUserId,
    });

    return Response.json({ success: true, count: vouches.length });
  } catch (error) {
    console.error('[getVouchCount] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});