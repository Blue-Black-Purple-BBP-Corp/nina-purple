import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// User-to-user blocking. block/unblock/list actions.
// On block: also marks any existing Connection between the pair (either
// direction) as 'blocked' so it stops surfacing in Connections/Messages UI.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, target_user_id, reason } = body;

    if (action === 'list') {
      const blocks = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_user_id: user.id });
      return Response.json({ success: true, blocked_user_ids: blocks.map((b) => b.blocked_user_id) });
    }

    if (!target_user_id) return Response.json({ error: 'target_user_id is required' }, { status: 400 });
    if (target_user_id === user.id) return Response.json({ error: 'Cannot block yourself' }, { status: 400 });

    if (action === 'block') {
      const existing = await base44.asServiceRole.entities.BlockedUser.filter({
        blocker_user_id: user.id,
        blocked_user_id: target_user_id,
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.BlockedUser.create({
          blocker_user_id: user.id,
          blocked_user_id: target_user_id,
          reason: reason || null,
          blocked_at: new Date().toISOString(),
        });
      }

      // Mark any existing connection between the pair (either direction) as blocked.
      const [connsFrom, connsTo] = await Promise.all([
        base44.asServiceRole.entities.Connection.filter({ from_user_id: user.id, to_user_id: target_user_id }),
        base44.asServiceRole.entities.Connection.filter({ from_user_id: target_user_id, to_user_id: user.id }),
      ]);
      for (const c of [...connsFrom, ...connsTo]) {
        if (c.status !== 'blocked') {
          await base44.asServiceRole.entities.Connection.update(c.id, { status: 'blocked' });
        }
      }

      return Response.json({ success: true, blocked: true });
    }

    if (action === 'unblock') {
      const existing = await base44.asServiceRole.entities.BlockedUser.filter({
        blocker_user_id: user.id,
        blocked_user_id: target_user_id,
      });
      for (const b of existing) {
        await base44.asServiceRole.entities.BlockedUser.delete(b.id);
      }
      return Response.json({ success: true, blocked: false });
    }

    return Response.json({ error: 'action must be block, unblock, or list' }, { status: 400 });
  } catch (error) {
    console.error('[blockUser] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}