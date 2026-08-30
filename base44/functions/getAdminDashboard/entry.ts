import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { isAdminRole } from '../../shared/adminAudit.ts';

// Unified Admin Dashboard data endpoint.
// Returns aggregate stats + the pending verification and moderation queues
// in a single call so the dashboard landing page renders without N+1 requests.
//
// Auth: admin or super_admin (role checked server-side).
// Optional query: ?from=ISO&to=ISO  — scopes the "new this period" member count.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isAdminRole(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const fromStr = url.searchParams.get('from');
    const toStr = url.searchParams.get('to');
    const from = fromStr ? new Date(fromStr) : null;
    const to = toStr ? new Date(toStr) : null;

    // Load everything in parallel. High limits cover the full cohort.
    const [profiles, verifications, moderation] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.list('-created_date', 1000),
      base44.asServiceRole.entities.VerificationRequest.list('-created_date', 200),
      base44.asServiceRole.entities.ModerationItem.list('-created_date', 200),
    ]);

    const pendingVerifications = verifications.filter(v => v.status === 'pending' || v.status === 'in_progress');
    const pendingModeration = moderation.filter(m => m.status === 'pending');

    const stats = {
      total_members: profiles.length,
      verified_members: profiles.filter(p => p.is_verified).length,
      pending_verifications: pendingVerifications.length,
      pending_moderation: pendingModeration.length,
      suspended_accounts: profiles.filter(p => p.account_status === 'suspended').length,
      limited_review_accounts: profiles.filter(p => p.account_status === 'limited_review').length,
      new_this_period: profiles.filter(p => {
        const created = new Date(p.created_date);
        if (from && created < from) return false;
        if (to && created > to) return false;
        return true;
      }).length,
    };

    // Enrich queue items with display name + email where possible.
    const profileByUserId = {};
    for (const p of profiles) { profileByUserId[p.user_id] = p; }

    const enrichVerification = (v) => ({
      id: v.id,
      verification_type: v.verification_type,
      status: v.status,
      native_user_id: v.native_user_id,
      display_name: profileByUserId[v.native_user_id]?.display_name || null,
      requested_at: v.requested_at || v.created_date,
      reason: v.staff_reason || null,
    });

    const enrichModeration = (m) => ({
      id: m.id,
      item_type: m.item_type,
      reason: m.reason,
      status: m.status,
      priority: m.priority || 0,
      target_user_id: m.target_user_id,
      target_display_name: profileByUserId[m.target_user_id]?.display_name || null,
      reported_by_user_id: m.reported_by_user_id,
      created_date: m.created_date,
    });

    return Response.json({
      stats,
      verifications: pendingVerifications.map(enrichVerification),
      moderation: pendingModeration.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(enrichModeration),
    });
  } catch (error) {
    console.error('[getAdminDashboard] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});