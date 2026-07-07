import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Monthly membership value per tier (in dollars = BBP points, 1:1)
    const PLAN_MONTHLY_VALUE = {
      lunar: 10,
      stellar: 15,
      galactic: 20,
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tiers = Object.keys(PLAN_MONTHLY_VALUE);
    const results = [];

    for (const tier of tiers) {
      let profiles = [];
      try {
        profiles = await base44.asServiceRole.entities.UserProfile.filter({ subscription_tier: tier });
      } catch (e) {
        console.error(`Error fetching ${tier} profiles:`, e.message);
        continue;
      }

      for (const profile of profiles) {
        try {
          // Check for connections (matches) created in the past 30 days
          let connections = [];
          try {
            connections = await base44.asServiceRole.entities.Connection.filter({ from_user_id: profile.user_id });
          } catch (e) {
            console.error(`Error fetching connections for ${profile.user_id}:`, e.message);
          }

          const recentConnections = connections.filter(
            (c) => c.created_date && new Date(c.created_date) >= thirtyDaysAgo
          );

          if (recentConnections.length === 0) {
            // No match this month — convert membership value to BBP
            const consecutive = (profile.consecutive_no_match_months || 0) + 1;
            const percentage = Math.min(30 + (consecutive - 1) * 10, 80);
            const membershipValue = PLAN_MONTHLY_VALUE[tier] || 0;
            const bbpEarned = Math.round((membershipValue * percentage) / 100 * 100) / 100;

            await base44.asServiceRole.entities.UserProfile.update(profile.id, {
              bbp_rewards: (profile.bbp_rewards || 0) + bbpEarned,
              consecutive_no_match_months: consecutive,
              last_bbp_conversion_date: now.toISOString(),
            });

            results.push({
              user_id: profile.user_id,
              tier,
              consecutive_months: consecutive,
              percentage,
              bbp_earned: bbpEarned,
            });
          } else {
            // Had matches — reset counter
            if (profile.consecutive_no_match_months > 0) {
              await base44.asServiceRole.entities.UserProfile.update(profile.id, {
                consecutive_no_match_months: 0,
              });
              results.push({
                user_id: profile.user_id,
                tier,
                consecutive_months: 0,
                percentage: 0,
                bbp_earned: 0,
                reset: true,
              });
            }
          }
        } catch (e) {
          console.error(`Error processing profile ${profile.id}:`, e.message);
        }
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      conversions: results.filter((r) => r.bbp_earned > 0).length,
      results,
    });
  } catch (error) {
    console.error('BBP conversion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});