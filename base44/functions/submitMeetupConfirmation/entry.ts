import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ulid } from '../../shared/bbpRules.ts';

// Creates a one-sided MeetupConfirmation when a member initiates "We've met"
// within an active mutual connection. Validates:
// - Active mutual connection exists
// - Neither party has blocked the other (simplified: no block check in MVP)
// - Connection is at least MIN_CONNECTION_AGE_HOURS old
// - Member has not exceeded monthly confirmation cap
// - One rewardable confirmation per pair during cooldown
//
// This is NOT identity verification. It is a voluntary community signal.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { connection_id, action } = body;

    if (action === 'initiate') {
      return await initiateMeetup(base44, user, connection_id);
    } else if (action === 'respond') {
      return await respondToMeetup(base44, user, body);
    } else if (action === 'get_status') {
      return await getMeetupStatus(base44, user, body);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('submitMeetupConfirmation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function initiateMeetup(base44: any, user: any, connection_id: string) {
  // Validate connection exists and user is part of it
  const connections = await base44.asServiceRole.entities.Connection.filter({ id: connection_id });
  if (!connections.length) {
    return Response.json({ error: 'Connection not found' }, { status: 404 });
  }
  const conn = connections[0];

  const isFrom = conn.from_user_id === user.id;
  const isTo = conn.to_user_id === user.id;
  if (!isFrom && !isTo) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Connection must be active (connected status)
  if (conn.status !== 'connected') {
    return Response.json({ error: 'Connection is not active' }, { status: 400 });
  }

  // Connection age check (min 24 hours)
  const connAge = Date.now() - new Date(conn.created_date).getTime();
  const MIN_AGE_HOURS = 24;
  if (connAge < MIN_AGE_HOURS * 3600 * 1000) {
    return Response.json({
      error: 'Connection is too recent. Please wait before confirming a meeting.',
    }, { status: 400 });
  }

  // Get both members' engagement profiles
  const counterpartId = isFrom ? conn.to_user_id : conn.from_user_id;
  const [myProfiles, counterpartProfiles] = await Promise.all([
    base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id: user.id }),
    base44.asServiceRole.entities.MemberEngagementProfile.filter({ native_user_id: counterpartId }),
  ]);

  if (!myProfiles.length || !counterpartProfiles.length) {
    return Response.json({ error: 'Engagement profiles not found' }, { status: 404 });
  }

  const myEngagement = myProfiles[0];
  const counterpartEngagement = counterpartProfiles[0];

  // Check for existing meetup confirmation for this pair (pair cooldown)
  const PAIR_COOLDOWN_DAYS = 90;
  const cooldownStart = new Date(Date.now() - PAIR_COOLDOWN_DAYS * 24 * 3600 * 1000).toISOString();
  const existingMeetups = await base44.asServiceRole.entities.MeetupConfirmation.filter({
    reporter_bbp_member_id: myEngagement.bbp_member_id,
    counterpart_bbp_member_id: counterpartEngagement.bbp_member_id,
  });
  const recentMeetup = existingMeetups.find((m: any) =>
    m.created_date && new Date(m.created_date) >= new Date(cooldownStart) &&
    m.reporter_status !== 'declined' && m.reporter_status !== 'expired'
  );
  if (recentMeetup) {
    return Response.json({
      error: 'A confirmation for this connection already exists recently.',
    }, { status: 409 });
  }

  // Monthly cap check (max 5 per member per month)
  const MONTHLY_CAP = 5;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const myMeetups = await base44.asServiceRole.entities.MeetupConfirmation.filter({
    reporter_bbp_member_id: myEngagement.bbp_member_id,
  });
  const thisMonth = myMeetups.filter((m: any) =>
    m.created_date && new Date(m.created_date) >= new Date(monthStart) &&
    m.reporter_status !== 'declined' && m.reporter_status !== 'expired'
  );
  if (thisMonth.length >= MONTHLY_CAP) {
    return Response.json({
      error: 'Monthly confirmation cap reached.',
    }, { status: 429 });
  }

  // Create the one-sided confirmation
  const now = new Date().toISOString();
  const confirmation = await base44.asServiceRole.entities.MeetupConfirmation.create({
    confirmation_id: `meetup_${ulid()}`,
    connection_id,
    reporter_bbp_member_id: myEngagement.bbp_member_id,
    reporter_native_user_id: user.id,
    counterpart_bbp_member_id: counterpartEngagement.bbp_member_id,
    counterpart_native_user_id: counterpartId,
    reporter_status: 'confirmed',
    counterpart_status: 'pending',
    initiated_at: now,
    eligibility_status: 'pending',
  });

  return Response.json({
    success: true,
    confirmation,
    message: 'Confirmation initiated. The other member will be notified.',
  });
}

async function respondToMeetup(base44: any, user: any, body: any) {
  const { confirmation_id, response } = body;

  if (!['confirmed', 'deferred', 'declined', 'reported'].includes(response)) {
    return Response.json({ error: 'Invalid response' }, { status: 400 });
  }

  const confirmations = await base44.asServiceRole.entities.MeetupConfirmation.filter({
    id: confirmation_id,
  });
  if (!confirmations.length) {
    return Response.json({ error: 'Confirmation not found' }, { status: 404 });
  }
  const confirmation = confirmations[0];

  // Only the counterpart can respond
  if (confirmation.counterpart_native_user_id !== user.id) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  const now = new Date().toISOString();
  await base44.asServiceRole.entities.MeetupConfirmation.update(confirmation.id, {
    counterpart_status: response,
    counterpart_responded_at: now,
  });

  // If reported, create a SafetyReviewCase
  if (response === 'reported') {
    await base44.asServiceRole.entities.SafetyReviewCase.create({
      case_id: `case_${ulid()}`,
      subject_bbp_member_id: confirmation.reporter_bbp_member_id,
      source_type: 'meetup_report',
      source_event_id: confirmation.confirmation_id,
      status: 'open',
      points_hold_flag: true,
    });
    return Response.json({
      success: true,
      message: 'Your report has been received. No points will be awarded.',
    });
  }

  // If both confirmed, evaluate mutual meetup
  if (response === 'confirmed') {
    const { awardPoints } = await import('../../shared/bbpRules.ts');
    const updated = await base44.asServiceRole.entities.MeetupConfirmation.filter({ id: confirmation_id });
    const meetup = updated[0];

    if (meetup.reporter_status === 'confirmed' && meetup.counterpart_status === 'confirmed') {
      // Mutual confirmation
      await base44.asServiceRole.entities.MeetupConfirmation.update(meetup.id, {
        mutual_confirmed_at: now,
        eligibility_status: 'eligible',
      });

      // Award both members (pending, 72 hours)
      const reporterAward = await awardPoints(
        base44,
        meetup.reporter_bbp_member_id,
        meetup.reporter_native_user_id,
        'meetup_confirmation',
        'meetup_confirmation',
        meetup.confirmation_id
      );
      const counterpartAward = await awardPoints(
        base44,
        meetup.counterpart_bbp_member_id,
        meetup.counterpart_native_user_id,
        'meetup_confirmation',
        'meetup_confirmation',
        meetup.confirmation_id
      );

      return Response.json({
        success: true,
        mutual_confirmed: true,
        reporter_award: reporterAward,
        counterpart_award: counterpartAward,
        message: 'Mutual confirmation recorded. Points are pending for 72 hours.',
      });
    }
  }

  // For deferred/declined, no points awarded
  return Response.json({
    success: true,
    mutual_confirmed: false,
    message: response === 'deferred'
      ? 'Confirmation deferred. You can respond later.'
      : 'This confirmation could not be completed.',
  });
}

async function getMeetupStatus(base44: any, user: any, body: any) {
  const { connection_id } = body;

  // Get all meetup confirmations where user is reporter or counterpart for this connection
  const [myProfiles] = await base44.asServiceRole.entities.MemberEngagementProfile.filter({
    native_user_id: user.id,
  });
  if (!myProfiles) {
    return Response.json({ success: true, confirmations: [] });
  }

  const allConfirmations = await base44.asServiceRole.entities.MeetupConfirmation.filter({
    connection_id,
  });
  const myConfirmations = allConfirmations.filter(
    (c: any) => c.reporter_bbp_member_id === myProfiles.bbp_member_id ||
                c.counterpart_bbp_member_id === myProfiles.bbp_member_id
  );

  return Response.json({
    success: true,
    confirmations: myConfirmations,
  });
}