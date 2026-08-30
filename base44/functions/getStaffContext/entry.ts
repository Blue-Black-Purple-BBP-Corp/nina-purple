import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import {
  getActiveRoleAssignments,
  authorizedContexts,
  getActivePrivilegedSession,
  writeStaffAuditLog,
} from '../../shared/staffAuth.ts';

// Returns the caller's staff context: their authorized operating contexts
// (from active UserRoleAssignments) and any currently-active PrivilegedSession.
// The frontend uses this to render the account menu and privileged-mode banner.
// It does NOT return any sensitive member data — only the caller's own staff
// context. Member-mode data is fetched through the normal member endpoints.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ authenticated: false, assignments: [], active_session: null });

    const assignments = await getActiveRoleAssignments(base44, user.id);
    const contexts = authorizedContexts(assignments);
    const session = await getActivePrivilegedSession(base44, user.id);

    return Response.json({
      authenticated: true,
      native_user_id: user.id,
      user_role: user.role,
      assignments: assignments.map((a) => ({
        role: a.role,
        scope: a.scope,
        status: a.status,
        expires_at: a.expires_at || null,
      })),
      authorized_contexts: contexts,
      active_session: session
        ? {
            privileged_session_id: session.privileged_session_id,
            operating_context: session.operating_context,
            active_role: session.active_role,
            activated_at: session.activated_at,
            expires_at: session.expires_at,
            last_activity_at: session.last_activity_at,
          }
        : null,
    });
  } catch (error) {
    console.error('[getStaffContext] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});