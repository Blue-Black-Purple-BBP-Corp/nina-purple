import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { isAdminRole } from '../../shared/adminAudit.ts';

// Read the append-only AdminAuditLog. Admin or super_admin.
// (The platform does not allow promoting the app owner to super_admin, so
// admin access is required for the owner to read their own logs. Append-only
// integrity is preserved by update:false / delete:false on the entity.)
//
// Query: ?from=ISO&to=ISO&limit=100&offset=0
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isAdminRole(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const fromStr = body.from || url.searchParams.get('from');
    const toStr = body.to || url.searchParams.get('to');
    const limit = Math.min(parseInt(String(body.limit ?? url.searchParams.get('limit') ?? '100'), 10), 500);
    const offset = parseInt(String(body.offset ?? url.searchParams.get('offset') ?? '0'), 10);

    let entries = await base44.asServiceRole.entities.AdminAuditLog.list('-created_date', 500);

    if (fromStr) {
      const from = new Date(fromStr);
      entries = entries.filter(e => new Date(e.created_date) >= from);
    }
    if (toStr) {
      const to = new Date(toStr);
      entries = entries.filter(e => new Date(e.created_date) <= to);
    }

    const total = entries.length;
    const paged = entries.slice(offset, offset + limit).map(e => ({
      id: e.id,
      created_date: e.created_date,
      actor_admin_id: e.actor_admin_id,
      actor_role: e.actor_role,
      action: e.action,
      target_type: e.target_type,
      target_id: e.target_id,
      reason: e.reason,
      changes: e.changes,
    }));

    return Response.json({ entries: paged, total, offset, limit });
  } catch (error) {
    console.error('[getAdminAuditLog] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});