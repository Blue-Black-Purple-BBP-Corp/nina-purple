import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { writeStaffAuditLog } from '../../shared/staffAuth.ts';

// Member-facing: cancel a pending profile change request. The member may
// cancel while the request is pending/under_review/approved (before completion).
// Uses asServiceRole to update (RLS update is admin-only) after verifying
// ownership. Audit-logged.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { request_id } = await req.json().catch(() => ({}));
    if (!request_id) return Response.json({ error: 'request_id required' }, { status: 400 });

    const requests = await base44.asServiceRole.entities.ProfileChangeRequest.filter({
      request_id, native_user_id: user.id,
    });
    if (!requests.length) return Response.json({ error: 'Request not found' }, { status: 404 });
    const request = requests[0];

    const cancellable = ['pending_review', 'pending_verification_unavailable', 'under_review', 'approved'];
    if (!cancellable.includes(request.status)) {
      return Response.json({ error: 'This request can no longer be cancelled.' }, { status: 409 });
    }

    await base44.asServiceRole.entities.ProfileChangeRequest.update(request.id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      action_type: 'profile_change.cancelled',
      target_entity_type: 'ProfileChangeRequest',
      target_entity_id: request_id,
      reason_code: request.field_name,
      correlation_id: request.correlation_id,
      previous_state: { status: request.status },
      new_state: { status: 'cancelled' },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[cancelProfileChange] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});