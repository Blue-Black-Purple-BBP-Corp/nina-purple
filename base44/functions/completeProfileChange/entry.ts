import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getActivePrivilegedSession,
  getActiveRoleAssignments,
  authorizedContexts,
  writeStaffAuditLog,
} from '../../shared/staffAuth.ts';

// Staff-facing: mark an approved EMAIL change as completed, after platform
// support has updated the member's auth email out-of-band. The app does not
// mutate the auth email itself (Base44 does not expose it); this only closes
// the request record and audit trail. Requires trust_safety/admin privileged
// session.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await getActivePrivilegedSession(base44, user.id);
    if (!session || !['trust_safety', 'admin'].includes(session.operating_context)) {
      return Response.json({ error: 'A privileged trust_safety or admin session is required.', code: 'privileged_session_required' }, { status: 403 });
    }
    const assignments = await getActiveRoleAssignments(base44, user.id);
    if (!authorizedContexts(assignments).includes(session.operating_context)) {
      return Response.json({ error: 'Role assignment no longer active.' }, { status: 403 });
    }

    const { request_id, completion_notes } = await req.json().catch(() => ({}));
    if (!request_id) return Response.json({ error: 'request_id required' }, { status: 400 });

    const requests = await base44.asServiceRole.entities.ProfileChangeRequest.filter({ request_id });
    if (!requests.length) return Response.json({ error: 'Request not found' }, { status: 404 });
    const request = requests[0];

    if (request.field_name !== 'email') {
      return Response.json({ error: 'Only email changes are completed via this endpoint.' }, { status: 400 });
    }
    if (request.status !== 'approved') {
      return Response.json({ error: 'Only approved requests can be marked completed.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.ProfileChangeRequest.update(request.id, {
      status: 'completed',
      completed_at: now,
      completion_notes: completion_notes || 'Email updated via platform support.',
    });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id, actor_role: session.active_role, operating_context: session.operating_context,
      privileged_session_id: session.privileged_session_id,
      action_type: 'profile_change.completed', target_entity_type: 'ProfileChangeRequest',
      target_entity_id: request_id, reason_code: 'email',
      correlation_id: request.correlation_id, result: 'success',
      previous_state: { status: 'approved' },
      new_state: { status: 'completed', completion_notes: completion_notes || '' },
    });

    return Response.json({ success: true, status: 'completed' });
  } catch (error) {
    console.error('[completeProfileChange] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});