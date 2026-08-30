import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { requirePrivilegedContext, checkConflictOfInterest, writeStaffAuditLog } from '../../shared/staffAuth.ts';

// Act on a ModerationItem. Supports three actions:
//   - dismiss:  no account change; item marked dismissed.
//   - warn:     item actioned; target profile set to limited_review (no suspension).
//   - suspend:  item actioned; target profile account_status = suspended, with
//               optional time-bound expiry (suspension_days). Login stays permitted.
// Every action writes an append-only AdminAuditLog entry in the same call.
//
// Auth: admin or super_admin.
// Body: { item_id, action: 'dismiss'|'warn'|'suspend', reason, suspension_days? }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const guard = await requirePrivilegedContext(base44, user, 'trust_safety');
    if (guard.errorResponse) return guard.errorResponse;
    const { session } = guard;

    const { item_id, action, reason, suspension_days } = await req.json().catch(() => ({}));
    if (!item_id) return Response.json({ error: 'item_id is required' }, { status: 400 });
    if (!['dismiss', 'warn', 'suspend'].includes(action)) {
      return Response.json({ error: 'action must be dismiss, warn, or suspend' }, { status: 400 });
    }
    if (!reason || !reason.trim()) {
      return Response.json({ error: 'reason is required' }, { status: 400 });
    }

    const items = await base44.asServiceRole.entities.ModerationItem.filter({ id: item_id });
    if (!items.length) return Response.json({ error: 'Moderation item not found' }, { status: 404 });
    const item = items[0];

    // Conflict of interest: staff cannot act on their own account or on a member
    // they have a connection, conversation, or declared conflict with.
    const coi = await checkConflictOfInterest(base44, user.id, item.target_user_id);
    if (coi.conflict) {
      await writeStaffAuditLog(base44, {
        actor_native_user_id: user.id,
        actor_role: session.active_role,
        operating_context: 'trust_safety',
        privileged_session_id: session.privileged_session_id,
        action_type: 'moderation.action_denied',
        target_entity_type: 'ModerationItem',
        target_entity_id: item_id,
        reason_code: 'conflict_of_interest',
        result: 'denied',
      });
      return Response.json({ error: coi.reason, code: 'conflict_of_interest' }, { status: 403 });
    }

    const now = new Date();
    const priorState = { status: item.status, target_account_status: null };

    // Resolve target profile for warn/suspend.
    let targetProfile = null;
    if (action === 'warn' || action === 'suspend') {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: item.target_user_id });
      targetProfile = profiles[0] || null;
      if (!targetProfile) {
        return Response.json({ error: 'Target user profile not found' }, { status: 404 });
      }
      priorState.target_account_status = targetProfile.account_status;
    }

    let profilePatch = {};
    let actionTaken = '';
    if (action === 'dismiss') {
      actionTaken = 'no action — dismissed';
    } else if (action === 'warn') {
      profilePatch = { account_status: 'limited_review', review_owner: user.id };
      actionTaken = 'warning issued — limited review';
    } else if (action === 'suspend') {
      profilePatch = {
        account_status: 'suspended',
        suspended_at: now.toISOString(),
        suspension_reason_code: reason.trim().slice(0, 120),
        review_owner: user.id,
      };
      if (suspension_days && Number(suspension_days) > 0) {
        const exp = new Date(now.getTime() + Number(suspension_days) * 24 * 60 * 60 * 1000);
        profilePatch.suspension_expires_at = exp.toISOString();
      }
      actionTaken = 'account suspended';
    }

    if (targetProfile && Object.keys(profilePatch).length) {
      await base44.asServiceRole.entities.UserProfile.update(targetProfile.id, profilePatch);
    }

    const modUpdate = {
      status: action === 'dismiss' ? 'dismissed' : 'actioned',
      reviewed_by_admin_id: user.id,
      reviewed_at: now.toISOString(),
      action_taken: actionTaken,
    };
    const updated = await base44.asServiceRole.entities.ModerationItem.update(item_id, modUpdate);

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      actor_role: session.active_role,
      operating_context: 'trust_safety',
      privileged_session_id: session.privileged_session_id,
      action_type: `moderation.${action}`,
      target_entity_type: 'ModerationItem',
      target_entity_id: item_id,
      reason_code: reason.trim(),
      previous_state: priorState,
      new_state: { moderation: modUpdate, profile_patch: profilePatch, subject_user_id: item.target_user_id },
    });

    return Response.json({ success: true, moderation_item: updated, profile_patch: profilePatch });
  } catch (error) {
    console.error('[actionModeration] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});