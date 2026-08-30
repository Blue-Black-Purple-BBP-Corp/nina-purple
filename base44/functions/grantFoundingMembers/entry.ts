import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { writeAuditLog, isAdminRole } from '../../shared/adminAudit.ts';

// Grants Founding Member status + 3 free months to every user whose
// signup_sequence_number <= founding_member_cutoff (stored in AppSetting).
//
// Idempotent + re-runnable:
//   - dry_run (default): returns the exact count + list of newly-eligible users WITHOUT applying.
//   - apply (dry_run: false): grants the badge + billing_exempt_until = now + 3 months.
//   - Raising the cutoff picks up newly-eligible users on the next run.
//   - Lowering the cutoff NEVER revokes an existing grant (grants are permanent).
//   - Does NOT touch MembershipCoupon records.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isAdminRole(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false; // default to dry-run for safety

    // Read the admin-editable cutoff from AppSetting
    const settings = await base44.asServiceRole.entities.AppSetting.filter({ key: 'founding_member_cutoff' });
    const cutoff = settings[0] ? parseInt(settings[0].value, 10) : 222;
    if (isNaN(cutoff)) {
      return Response.json({ error: 'Invalid founding_member_cutoff setting' }, { status: 500 });
    }

    // Load all profiles (high limit to cover the full cohort)
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 1000);

    // Eligible: has a signup_sequence_number <= cutoff AND not already a founding member
    const eligible = allProfiles.filter(p =>
      p.signup_sequence_number != null &&
      p.signup_sequence_number <= cutoff &&
      !p.is_founding_member
    );

    if (dryRun) {
      return Response.json({
        dry_run: true,
        cutoff,
        newly_eligible_count: eligible.length,
        users: eligible.map(p => ({
          profile_id: p.id,
          user_id: p.user_id,
          display_name: p.display_name,
          signup_sequence_number: p.signup_sequence_number,
        })),
      });
    }

    // Apply grants
    const now = new Date();
    const exemptUntil = new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months
    let granted = 0;
    for (const p of eligible) {
      await base44.asServiceRole.entities.UserProfile.update(p.id, {
        is_founding_member: true,
        founding_member_since: now.toISOString(),
        billing_exempt_until: exemptUntil.toISOString(),
        subscription_status: 'billing_exempt',
      });
      await base44.asServiceRole.entities.AdminNotification.create({
        type: 'system',
        title: `Founding Member granted: ${p.display_name || p.user_id}`,
        body: `User ID: ${p.user_id}\nSignup #: ${p.signup_sequence_number}\nGranted: ${now.toISOString()}\nBilling exempt until: ${exemptUntil.toISOString()}`,
        related_user_id: p.user_id,
      });
      await writeAuditLog(base44, {
        actor_admin_id: user.id,
        actor_role: user.role,
        action: 'founding_member.grant',
        target_type: 'UserProfile',
        target_id: p.id,
        reason: `Founding Member grant (cutoff ${cutoff}, signup #${p.signup_sequence_number})`,
        changes: { subject_user_id: p.user_id, billing_exempt_until: exemptUntil.toISOString(), subscription_status: 'billing_exempt' },
      });
      granted++;
    }

    return Response.json({
      dry_run: false,
      cutoff,
      granted_count: granted,
      newly_eligible_count: eligible.length,
    });
  } catch (error) {
    console.error('[grantFoundingMembers] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});