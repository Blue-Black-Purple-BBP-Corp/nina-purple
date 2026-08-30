import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getActivePrivilegedSession,
  getActiveRoleAssignments,
  authorizedContexts,
  writeStaffAuditLog,
  checkConflictOfInterest,
} from '../../shared/staffAuth.ts';
import { maskValue } from '../../shared/profileChanges.ts';

// Staff-facing: approve or reject a profile change request. Requires an active
// trust_safety or admin privileged session + conflict-of-interest check.
//
// approve:
//   - email → status 'approved' (platform-support completes the actual auth
//     email update later via completeProfileChange).
//   - full_name / birthdate → applies the change to UserProfile and marks
//     'completed'.
//   - phone → cannot be approved (OTP verification unavailable).
// reject:
//   - marks 'rejected' with a required reason. Audit-logged.
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
      return Response.json({ error: 'Role assignment no longer active.', code: 'role_revoked' }, { status: 403 });
    }

    const { request_id, decision, reason } = await req.json().catch(() => ({}));
    if (!request_id || !['approve', 'reject'].includes(decision)) {
      return Response.json({ error: 'request_id and decision (approve|reject) required' }, { status: 400 });
    }
    if (decision === 'reject' && !reason) {
      return Response.json({ error: 'A reason is required to reject a request.' }, { status: 400 });
    }

    const requests = await base44.asServiceRole.entities.ProfileChangeRequest.filter({ request_id });
    if (!requests.length) return Response.json({ error: 'Request not found' }, { status: 404 });
    const request = requests[0];

    // Phone requests cannot be approved (verification unavailable).
    if (request.field_name === 'phone' && decision === 'approve') {
      return Response.json({ error: 'Phone changes require OTP verification, which is not yet available. Reject or hold the request.' }, { status: 409 });
    }

    // Conflict of interest.
    const coi = await checkConflictOfInterest(base44, user.id, request.native_user_id);
    if (coi.conflict) return Response.json({ error: coi.reason, code: 'conflict_of_interest' }, { status: 403 });

    const reviewable = ['pending_review', 'pending_verification_unavailable', 'under_review'];
    if (!reviewable.includes(request.status)) {
      return Response.json({ error: 'This request is not in a reviewable state.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const ctx = session.operating_context;

    if (decision === 'reject') {
      await base44.asServiceRole.entities.ProfileChangeRequest.update(request.id, {
        status: 'rejected',
        reviewed_by_admin_id: user.id,
        reviewed_at: now,
        review_decision: 'rejected',
        review_reason: reason,
      });
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id, actor_role: session.active_role, operating_context: ctx,
        privileged_session_id: session.privileged_session_id,
        action_type: 'profile_change.rejected', target_entity_type: 'ProfileChangeRequest',
        target_entity_id: request_id, reason_code: request.field_name,
        correlation_id: request.correlation_id, result: 'success',
        previous_state: { status: request.status },
        new_state: { status: 'rejected', reason },
      });
      return Response.json({ success: true, status: 'rejected' });
    }

    // Approve
    if (request.field_name === 'email') {
      await base44.asServiceRole.entities.ProfileChangeRequest.update(request.id, {
        status: 'approved',
        reviewed_by_admin_id: user.id,
        reviewed_at: now,
        review_decision: 'approved',
        review_reason: reason || 'Approved; pending platform-support completion.',
      });
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id, actor_role: session.active_role, operating_context: ctx,
        privileged_session_id: session.privileged_session_id,
        action_type: 'profile_change.approved', target_entity_type: 'ProfileChangeRequest',
        target_entity_id: request_id, reason_code: 'email',
        correlation_id: request.correlation_id, result: 'success',
        previous_state: { status: request.status },
        new_state: { status: 'approved', requested: maskValue('email', request.requested_value) },
      });
      return Response.json({ success: true, status: 'approved', note: 'Email update must be completed via platform support.' });
    }

    // full_name or birthdate: apply to UserProfile and mark completed.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: request.native_user_id });
    if (!profiles.length) return Response.json({ error: 'Target profile not found' }, { status: 404 });
    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
      [request.field_name]: request.requested_value,
    });

    await base44.asServiceRole.entities.ProfileChangeRequest.update(request.id, {
      status: 'completed',
      reviewed_by_admin_id: user.id,
      reviewed_at: now,
      review_decision: 'approved',
      review_reason: reason || 'Approved and applied.',
      completed_at: now,
      completion_notes: `Applied by ${session.active_role} via profile change review.`,
    });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id, actor_role: session.active_role, operating_context: ctx,
      privileged_session_id: session.privileged_session_id,
      action_type: 'profile_change.completed', target_entity_type: 'ProfileChangeRequest',
      target_entity_id: request_id, reason_code: request.field_name,
      correlation_id: request.correlation_id, result: 'success',
      previous_state: { field: request.field_name, value: request.current_value },
      new_state: { field: request.field_name, value: request.requested_value },
    });

    return Response.json({ success: true, status: 'completed' });
  } catch (error) {
    console.error('[reviewProfileChange] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});