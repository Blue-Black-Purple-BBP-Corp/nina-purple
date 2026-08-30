import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { awardPoints } from '../../shared/bbpRules.ts';

// Awards event/experience attendance BBP from authoritative check-in records.
// NEVER awards based on RSVP, waitlist, booking request, or payment attempt.
// Called by staff console after verifying authoritative check-in.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { bbp_member_id, event_id, attendance_type, is_first_attendance } = body;

    if (!bbp_member_id || !event_id || !attendance_type) {
      return Response.json({ error: 'Missing required fields: bbp_member_id, event_id, attendance_type' }, { status: 400 });
    }

    // attendance_type: 'event' or 'experience'
    // is_first_attendance: boolean — if true, use FIRST_EVENT_ATTENDANCE rule
    const action_type = attendance_type === 'experience'
      ? 'experience_attendance'
      : is_first_attendance
        ? 'event_attendance' // first attendance uses same action_type, rule_id distinguishes
        : 'event_attendance';

    const rule_id = attendance_type === 'experience'
      ? 'EXPERIENCE_ATTENDANCE'
      : is_first_attendance
        ? 'FIRST_EVENT_ATTENDANCE'
        : 'EVENT_ATTENDANCE';

    // Resolve the rule to get the correct action_type mapping
    const rules = await base44.asServiceRole.entities.RewardRule.filter({ rule_id, status: 'active' });
    if (!rules.length) {
      return Response.json({ error: `No active rule for ${rule_id}` }, { status: 404 });
    }
    const rule = rules[0];

    // Resolve native_user_id
    const profiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({ bbp_member_id });
    if (!profiles.length) {
      return Response.json({ error: 'Member engagement profile not found' }, { status: 404 });
    }
    const native_user_id = profiles[0].native_user_id;

    // Use event_id as source_event_id for idempotency
    const source_event_id = `${rule_id}_${event_id}_${bbp_member_id}`;

    const result = await awardPoints(base44, bbp_member_id, native_user_id,
      rule.action_type, rule.action_type === 'event_attendance' ? 'event_attendance' : 'experience_attendance',
      source_event_id);

    return Response.json(result);
  } catch (error) {
    console.error('recordAttendanceReward error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}