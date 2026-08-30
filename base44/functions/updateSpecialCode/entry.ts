import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { writeAuditLog, isAdminRole } from '../../shared/adminAudit.ts';

// Admin-facing: updates a Special Code's feedback_status and/or reward_months.
// When feedback_status is set to 'verified' and reward_months is set (1-3),
// applies billing_exempt_until = now + reward_months months on the user's
// UserProfile and sets subscription_status to 'billing_exempt'.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isAdminRole(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { code_id, feedback_status, reward_months } = await req.json().catch(() => ({}));
    if (!code_id) return Response.json({ error: 'code_id is required' }, { status: 400 });

    const codes = await base44.asServiceRole.entities.SpecialCode.filter({ id: code_id });
    if (!codes.length) return Response.json({ error: 'Code not found' }, { status: 404 });
    const sc = codes[0];

    const updateData = {};
    if (feedback_status && ['pending', 'submitted', 'verified'].includes(feedback_status)) {
      updateData.feedback_status = feedback_status;
    }
    if (reward_months !== undefined) {
      const rm = Number(reward_months);
      if (rm < 1 || rm > 3) return Response.json({ error: 'reward_months must be 1-3' }, { status: 400 });
      updateData.reward_months = rm;
    }

    const priorState = { feedback_status: sc.feedback_status, reward_months: sc.reward_months };
    const updated = await base44.asServiceRole.entities.SpecialCode.update(code_id, updateData);

    await writeAuditLog(base44, {
      actor_admin_id: user.id,
      actor_role: user.role,
      action: 'special_code.update',
      target_type: 'SpecialCode',
      target_id: code_id,
      reason: `Special code feedback/reward update`,
      changes: { prior: priorState, next: updateData, subject_user_id: sc.issued_to_user_id },
    });

    // Apply billing exemption when feedback is verified and reward_months is set
    if (updateData.feedback_status === 'verified' && updated.reward_months > 0) {
      const now = new Date();
      const exemptUntil = new Date(now);
      exemptUntil.setMonth(exemptUntil.getMonth() + updated.reward_months);

      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: sc.issued_to_user_id });
      if (profiles.length) {
        await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
          billing_exempt_until: exemptUntil.toISOString(),
          subscription_status: 'billing_exempt',
        });
        console.info('[updateSpecialCode] Billing exempt until', exemptUntil.toISOString(), 'for user:', sc.issued_to_user_id);
      }
    }

    return Response.json({ success: true, code: updated });
  } catch (error) {
    console.error('updateSpecialCode error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});