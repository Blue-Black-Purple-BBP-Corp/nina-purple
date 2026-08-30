import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { writeAuditLog, isAdminRole } from '../../shared/adminAudit.ts';

// Approve or reject a single VerificationRequest.
// On approve, applies the operational effect to the member's profile based on
// verification_type (phone -> phone_verified, account_review -> is_verified).
// Every decision writes an append-only AdminAuditLog entry in the same call.
//
// Auth: admin or super_admin.
// Body: { request_id, decision: 'approve'|'reject', reason, rejection_reason? }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isAdminRole(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { request_id, decision, reason, rejection_reason } = await req.json().catch(() => ({}));
    if (!request_id) return Response.json({ error: 'request_id is required' }, { status: 400 });
    if (decision !== 'approve' && decision !== 'reject') {
      return Response.json({ error: 'decision must be approve or reject' }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return Response.json({ error: 'reason is required' }, { status: 400 });
    }

    const reqs = await base44.asServiceRole.entities.VerificationRequest.filter({ id: request_id });
    if (!reqs.length) return Response.json({ error: 'Verification request not found' }, { status: 404 });
    const vr = reqs[0];

    const now = new Date().toISOString();
    const newStatus = decision === 'approve' ? 'approved' : 'rejected';
    const priorState = { status: vr.status, reviewed_by_id: vr.reviewed_by_id };

    const updateData = {
      status: newStatus,
      reviewed_by_id: user.id,
      reviewed_at: now,
      completed_at: now,
      staff_reason: reason.trim(),
      rejection_reason: decision === 'reject' ? (rejection_reason || reason.trim()) : null,
    };

    const updated = await base44.asServiceRole.entities.VerificationRequest.update(request_id, updateData);

    // Apply operational effect on the member's profile.
    let profileEffect = null;
    if (decision === 'approve') {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: vr.native_user_id });
      if (profiles.length) {
        const p = profiles[0];
        const patch = {};
        if (vr.verification_type === 'phone') patch.phone_verified = true;
        if (vr.verification_type === 'account_review') patch.is_verified = true;
        if (Object.keys(patch).length) {
          await base44.asServiceRole.entities.UserProfile.update(p.id, patch);
          profileEffect = patch;
        }
      }
    }

    await writeAuditLog(base44, {
      actor_admin_id: user.id,
      actor_role: user.role,
      action: `verification.${decision}`,
      target_type: 'VerificationRequest',
      target_id: request_id,
      reason: reason.trim(),
      changes: { prior: priorState, next: updateData, profile_effect: profileEffect, verification_type: vr.verification_type, subject_user_id: vr.native_user_id },
    });

    return Response.json({ success: true, verification_request: updated, profile_effect: profileEffect });
  } catch (error) {
    console.error('[reviewVerification] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});