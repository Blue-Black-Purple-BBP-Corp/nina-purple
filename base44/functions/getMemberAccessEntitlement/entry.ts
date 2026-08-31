import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildMemberAccessEntitlement } from '../../shared/membershipState.ts';
import { getRecentLedger } from '../../shared/interactionCredits.ts';
import { getActivePrivilegedSession } from '../../shared/staffAuth.ts';

// Single authoritative member-access entitlement service. Called by the
// AppLayout route guard, the Membership & Access page, the Wallet page, and
// the paywall. Returns the full access object: membership status, allowed/
// locked features, wallet balance, founding benefit, and next action.
//
// Staff in Member mode (no active privileged session) are flagged
// admin_member_mode and never bypass the membership-entitlement rule.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Determine staff context: is the actor staff, and are they in a privileged
    // session right now? Member mode = staff with no privileged session.
    let staffContext = null;
    try {
      const staffRoles = ['admin', 'super_admin', 'trust_safety', 'rewards_finance', 'engineering_operations'];
      const isStaff = staffRoles.includes(user.role);
      let hasPrivilegedSession = false;
      if (isStaff) {
        try {
          const priv = await getActivePrivilegedSession(base44, user.id);
          hasPrivilegedSession = !!priv;
        } catch { hasPrivilegedSession = false; }
      }
      staffContext = { isStaff, hasPrivilegedSession };
    } catch {}

    // Grace period from AppSetting (default 0 = no grace).
    let gracePeriodDays = 0;
    try {
      const settings = await base44.asServiceRole.entities.AppSetting.filter({ key: 'grace_period_days' });
      if (settings[0] && settings[0].value) gracePeriodDays = parseInt(settings[0].value, 10) || 0;
    } catch {}

    const entitlement = await buildMemberAccessEntitlement(base44, user.id, { gracePeriodDays, staffContext });
    const recent_ledger = await getRecentLedger(base44, user.id, 10);

    return Response.json({ success: true, data: { ...entitlement, recent_ledger } });
  } catch (error) {
    console.error('[getMemberAccessEntitlement] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});