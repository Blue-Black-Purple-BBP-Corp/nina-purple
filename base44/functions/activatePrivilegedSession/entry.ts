import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import {
  PRIVILEGED_CONTEXTS,
  SESSION_MAX_LIFETIME_MINUTES,
  getActiveRoleAssignments,
  authorizedContexts,
  getActivePrivilegedSession,
  _endSession,
  writeStaffAuditLog,
} from '../../shared/staffAuth.ts';

// Activates a privileged session in a given operating context.
//
// Requires:
//   1. an authenticated user
//   2. an active UserRoleAssignment authorizing the requested context
//   3. recent re-authentication: the caller must supply `reauth_password`,
//      which is verified server-side via loginViaEmailPassword. This proves
//      the human at the keyboard still knows the credentials.
//
// Any previously-active session for the user is ended first (one live context
// at a time). Activation is logged to the append-only audit trail.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const { context, reauth_password } = await req.json().catch(() => ({}));
    if (!context || !PRIVILEGED_CONTEXTS.includes(context)) {
      return Response.json({ error: 'Invalid operating context' }, { status: 400 });
    }
    if (!reauth_password || !String(reauth_password).trim()) {
      return Response.json({ error: 'Re-authentication password is required' }, { status: 400 });
    }

    // 1. Verify the user holds an active assignment for this context.
    const assignments = await getActiveRoleAssignments(base44, user.id);
    const ctxs = authorizedContexts(assignments);
    if (!ctxs.includes(context)) {
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id,
        actor_role: user.role,
        action_type: 'privileged_session.activation_denied',
        target_entity_type: 'PrivilegedSession',
        reason_code: 'no_role_assignment',
        result: 'denied',
      });
      return Response.json({ error: 'You are not authorized for this workspace.' }, { status: 403 });
    }

    // 2. Re-authenticate: verify the password server-side.
    try {
      await base44.auth.loginViaEmailPassword(user.email, String(reauth_password));
    } catch (e) {
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id,
        actor_role: user.role,
        action_type: 'privileged_session.reauth_failed',
        target_entity_type: 'User',
        target_entity_id: user.id,
        reason_code: 'invalid_credentials',
        result: 'denied',
      });
      return Response.json({ error: 'Re-authentication failed. Please re-enter your password.' }, { status: 401 });
    }

    // 3. End any existing active session (one live context at a time).
    const existing = await getActivePrivilegedSession(base44, user.id);
    if (existing) {
      await _endSession(base44, existing, 'superseded');
    }

    // 4. Determine the active role for this context (prefer the assignment whose scope matches).
    const matching = assignments.find((a) => a.scope === context || a.scope === 'all' || authorizedContexts([a]).includes(context));
    const activeRole = matching?.role || 'admin';

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_LIFETIME_MINUTES * 60 * 1000);
    const sessionId = crypto.randomUUID();

    const session = await base44.asServiceRole.entities.PrivilegedSession.create({
      privileged_session_id: sessionId,
      native_user_id: user.id,
      active_role: activeRole,
      operating_context: context,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_activity_at: now.toISOString(),
      reauthenticated_at: now.toISOString(),
    });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      actor_role: activeRole,
      operating_context: context,
      privileged_session_id: sessionId,
      action_type: 'privileged_session.activated',
      target_entity_type: 'PrivilegedSession',
      target_entity_id: sessionId,
      reason_code: 'manual_activation',
      new_state: { operating_context: context, active_role: activeRole, expires_at: expiresAt.toISOString() },
    });

    return Response.json({
      success: true,
      session: {
        privileged_session_id: sessionId,
        operating_context: context,
        active_role: activeRole,
        activated_at: session.activated_at,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error('[activatePrivilegedSession] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});