import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { awardPoints } from '../../shared/bbpRules.ts';

// Records a versioned policy acknowledgement (Community Orientation or BBP
// Points Rules). After storing, evaluates whether Community Ready conditions
// are met and issues the one-time COMMUNITY_ORIENTATION_COMPLETE award.
//
// Community Ready = Profile Complete + current orientation acknowledged + account confirmed.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { policy_type, policy_version, locale } = body;

    if (!policy_type || !policy_version) {
      return Response.json({ error: 'policy_type and policy_version are required' }, { status: 400 });
    }

    // Fetch engagement profile
    const engagementProfiles = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
      native_user_id: user.id,
    });
    if (!engagementProfiles.length) {
      return Response.json({ error: 'Engagement profile not found' }, { status: 404 });
    }
    const engagement = engagementProfiles[0];

    // Check for existing acknowledgement of this version (idempotent)
    const existingAcks = await base44.asServiceRole.entities.PolicyAcknowledgement.filter({
      bbp_member_id: engagement.bbp_member_id,
      policy_type,
      policy_version,
    });
    const alreadyAcknowledged = existingAcks.length > 0;

    if (!alreadyAcknowledged) {
      await base44.asServiceRole.entities.PolicyAcknowledgement.create({
        ack_id: `ack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        bbp_member_id: engagement.bbp_member_id,
        native_user_id: user.id,
        policy_type,
        policy_version,
        locale: locale || 'en',
      });
    }

    // Update engagement profile with orientation version
    if (policy_type === 'community_orientation') {
      await base44.asServiceRole.entities.MemberEngagementProfile.update(engagement.id, {
        orientation_acknowledged_version: policy_version,
      });
    }

    // Issue one-time award per version for orientation
    let awardResult = null;
    if (policy_type === 'community_orientation' && !alreadyAcknowledged) {
      awardResult = await awardPoints(
        base44,
        engagement.bbp_member_id,
        user.id,
        'orientation_complete',
        'orientation_complete',
        `orientation_${policy_version}_${user.id}`
      );
    }

    // Re-fetch updated engagement profile
    const updated = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
      native_user_id: user.id,
    });
    const updatedEngagement = updated[0];

    // Evaluate Community Ready conditions
    // Community Ready = Profile Complete + orientation acknowledged + account confirmed
    const isProfileComplete = updatedEngagement.onboarding_state !== 'getting_started';
    const isOrientationDone = !!updatedEngagement.orientation_acknowledged_version;
    const isAccountConfirmed = updatedEngagement.account_confirmed === true;

    if (isProfileComplete && isOrientationDone && isAccountConfirmed && updatedEngagement.community_standing_state === 'profile_complete') {
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.MemberEngagementProfile.update(updatedEngagement.id, {
        community_standing_state: 'community_ready',
        community_ready_at: updatedEngagement.community_ready_at || now,
      });
    }

    return Response.json({
      success: true,
      already_acknowledged: alreadyAcknowledged,
      award: awardResult,
      community_ready: isProfileComplete && isOrientationDone && isAccountConfirmed,
    });
  } catch (error) {
    console.error('recordPolicyAcknowledgement error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});