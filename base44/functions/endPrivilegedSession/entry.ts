import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { getActivePrivilegedSession, _endSession, writeStaffAuditLog } from '../../shared/staffAuth.ts';

// Ends the caller's active privileged session (return to member mode).
// Also used to record forced/expired endings. Always logged.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });

    const { reason } = await req.json().catch(() => ({}));
    const endReason = reason || 'manual_exit';

    const session = await getActivePrivilegedSession(base44, user.id);
    if (!session) {
      return Response.json({ success: true, already_inactive: true });
    }

    await _endSession(base44, session, endReason);

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      actor_role: session.active_role,
      operating_context: session.operating_context,
      privileged_session_id: session.privileged_session_id,
      action_type: 'privileged_session.ended',
      target_entity_type: 'PrivilegedSession',
      target_entity_id: session.privileged_session_id,
      reason_code: endReason,
      previous_state: { operating_context: session.operating_context, active_role: session.active_role },
    });

    return Response.json({ success: true, ended: true });
  } catch (error) {
    console.error('[endPrivilegedSession] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});