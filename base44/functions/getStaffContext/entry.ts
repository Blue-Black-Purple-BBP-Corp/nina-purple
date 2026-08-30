import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import {
  getActiveRoleAssignments,
  authorizedContexts,
  getActivePrivilegedSession,
  getAuthMethods,
  writeStaffAuditLog,
} from '../../shared/staffAuth.ts';

// Returns the caller's staff context: their authorized operating contexts
// (from active UserRoleAssignments), any currently-active PrivilegedSession,
// and their self-declared auth_methods (sign-in methods they have used). The
// frontend uses this to render the account menu, the privileged-mode banner,
// and the auth-method-aware step-up modal. It does NOT return any sensitive
// member data — only the caller's own staff context.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ authenticated: false, assignments: [], authorized_contexts: [], auth_methods: [], active_session: null });

    const assignments = await getActiveRoleAssignments(base44, user.id);
    const contexts = authorizedContexts(assignments);
    const session = await getActivePrivilegedSession(base44, user.id);
    const auth_methods = await getAuthMethods(base44, user.id);

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
      auth_methods: auth_methods,
      active_session: session
        ? {
            privileged_session_id: session.privileged_session_id,
            operating_context: session.operating_context,
            active_role: session.active_role,
            auth_method: session.auth_method || null,
            identity_provider: session.identity_provider || null,
            session_assurance_level: session.session_assurance_level || null,
            step_up_verified_at: session.step_up_verified_at || null,
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