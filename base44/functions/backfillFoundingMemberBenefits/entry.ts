import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { writeAuditLog, isAdminRole } from '../../shared/adminAudit.ts';

// Admin: backfills FoundingMemberBenefit records for existing Founding Members
// (is_founding_member === true) so they are consistent with the new entitlement
// model. Idempotent — skips members who already have a benefit.
//
//   - billing_exempt_until in the future  → benefit 'active' (legacy grant preserved)
//   - billing_exempt_until in the past     → benefit 'expired'
//   - active paid subscription             → benefit 'redeemed' + flagged for staff review
//   - otherwise (no grant, not paying)     → benefit 'eligible' (may claim the trial)
//
// Never revokes an existing grant or alters a paying member's subscription.
// dry_run (default) reports counts without writing.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !isAdminRole(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run !== false;

    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 1000);
    const founding = allProfiles.filter((p) => p.is_founding_member);

    const now = new Date();
    let createdActive = 0, createdRedeemed = 0, createdExpired = 0, createdEligible = 0, flagged = 0, skipped = 0;

    for (const p of founding) {
      const existing = await base44.asServiceRole.entities.FoundingMemberBenefit.filter({ native_user_id: p.user_id });
      if (existing.length) { skipped++; continue; }

      let bbp = null;
      try {
        const eng = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id: p.user_id });
        bbp = eng[0]?.bbp_member_id || null;
      } catch {}

      const billingExemptActive = p.billing_exempt_until && new Date(p.billing_exempt_until) > now;
      const hasActiveSub = p.subscription_status === 'active';

      let status, trialEnds = null;
      const trialStart = p.founding_member_since || p.created_date;
      if (hasActiveSub) {
        status = 'redeemed';
      } else if (billingExemptActive) {
        status = 'active';
        trialEnds = p.billing_exempt_until;
      } else if (p.billing_exempt_until) {
        status = 'expired';
        trialEnds = p.billing_exempt_until;
      } else {
        status = 'eligible';
      }

      if (dryRun) {
        if (status === 'active') createdActive++;
        else if (status === 'redeemed') createdRedeemed++;
        else if (status === 'expired') createdExpired++;
        else createdEligible++;
        if (hasActiveSub) flagged++;
        continue;
      }

      await base44.asServiceRole.entities.FoundingMemberBenefit.create({
        benefit_id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        native_user_id: p.user_id,
        bbp_member_id: bbp,
        eligibility_source: 'founding_member_tag',
        eligibility_status: status,
        benefit_type: 'three_month_membership_trial',
        trial_duration_days: 90,
        granted_at: trialStart,
        trial_started_at: (status !== 'eligible') ? trialStart : null,
        trial_ends_at: trialEnds,
        audit_correlation_id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      });

      if (status === 'active') createdActive++;
      else if (status === 'redeemed') createdRedeemed++;
      else if (status === 'expired') createdExpired++;
      else createdEligible++;

      if (hasActiveSub) {
        flagged++;
        try {
          await base44.asServiceRole.entities.AdminNotification.create({
            type: 'system',
            title: `Founding Member review: ${p.display_name || p.user_id}`,
            body: `Founding Member ${p.user_id} has an active paid subscription AND founding status. Review whether a trial is appropriate. Benefit marked redeemed.`,
            related_user_id: p.user_id,
          });
        } catch {}
      }

      try {
        await writeAuditLog(base44, {
          actor_admin_id: user.id,
          actor_role: user.role,
          action: 'founding_member.backfill',
          target_type: 'FoundingMemberBenefit',
          target_id: p.user_id,
          reason: `Backfill benefit → ${status}`,
          changes: { subject_user_id: p.user_id, status },
        });
      } catch {}
    }

    return Response.json({
      dry_run: dryRun,
      total_founding: founding.length,
      created_active: createdActive,
      created_redeemed: createdRedeemed,
      created_expired: createdExpired,
      created_eligible: createdEligible,
      flagged_for_review: flagged,
      already_had_benefit: skipped,
    });
  } catch (error) {
    console.error('[backfillFoundingMemberBenefits] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});