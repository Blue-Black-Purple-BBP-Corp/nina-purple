import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { PLAN_LIMITS, hasActiveMembership } from '../../shared/planLimits.ts';

// Returns the caller's current billing-cycle usage counters and free
// allowances, for display in the profile/dashboard.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const profile = profiles[0];

    const tier = profile.subscription_tier || 'solar';
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.solar;
    const membershipActive = hasActiveMembership(profile);

    return Response.json({
      success: true,
      data: {
        subscription_tier: tier,
        subscription_status: profile.subscription_status || 'none',
        membership_active: membershipActive,
        billing_exempt_until: profile.billing_exempt_until || null,
        subscription_renewal_date: profile.subscription_renewal_date || null,
        free_profile_unlocks: limits.free_profile_unlocks,
        free_profile_unlocks_used: profile.free_profile_unlocks_used || 0,
        free_messages: limits.free_messages,
        free_messages_used: profile.free_messages_used || 0,
      },
    });
  } catch (error) {
    console.error('getUsageCounters error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});