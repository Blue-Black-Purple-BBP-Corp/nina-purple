import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { awardPoints } from '../../shared/bbpRules.ts';

// Generic award endpoint — accepts action_type + source_event_id only.
// NEVER trusts a client-submitted points amount.
// Called server-side by other functions or staff console.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { bbp_member_id, action_type, source_type, source_event_id, campaign_id } = body;

    if (!bbp_member_id || !action_type || !source_type || !source_event_id) {
      return Response.json({ error: 'Missing required fields: bbp_member_id, action_type, source_type, source_event_id' }, { status: 400 });
    }

    // Resolve native_user_id from MemberEngagementProfile
    const profiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ bbp_member_id });
    if (!profiles.length) {
      return Response.json({ error: 'Member engagement profile not found' }, { status: 404 });
    }
    const native_user_id = profiles[0].native_user_id;

    const result = await awardPoints(base44, bbp_member_id, native_user_id, action_type, source_type, source_event_id, campaign_id);

    return Response.json(result);
  } catch (error) {
    console.error('awardPoints error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}