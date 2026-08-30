import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { maskValue } from '../../shared/profileChanges.ts';

// Returns profile change requests. scope=me (default) returns the caller's own
// requests with full values (their own data). scope=staff (admin only) returns
// all requests with sensitive values masked + display names resolved.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') || 'me';
    const statusFilter = url.searchParams.get('status');

    if (scope === 'staff') {
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const filter: any = statusFilter ? { status: statusFilter } : {};
      const all = await base44.asServiceRole.entities.ProfileChangeRequest.filter(filter, '-requested_at', 100);

      // Resolve display names for the requesting members.
      const userIds = [...new Set(all.map((r: any) => r.native_user_id))];
      const profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: { $in: userIds } });
        for (const p of profiles) profileMap[p.user_id] = p;
      }

      const items = all.map((r: any) => ({
        ...r,
        current_value: maskValue(r.field_name, r.current_value),
        requested_value: maskValue(r.field_name, r.requested_value),
        member_display_name: profileMap[r.native_user_id]?.display_name || '—',
      }));
      return Response.json({ items });
    }

    // Member view: own requests, full values.
    const mine = await base44.entities.ProfileChangeRequest.filter({ native_user_id: user.id }, '-requested_at', 50);
    return Response.json({ items: mine });
  } catch (error) {
    console.error('[getProfileChangeRequests] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});