import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Admin-only: updates an ambassador application's status. Supports:
//   - under_review: admin is reviewing
//   - interview_scheduled: sets interview_type, interview_scheduled_at, interview_link
//   - approved: sets UserProfile.is_ambassador=true, notifies user, creates badge
//   - rejected: sets rejection_reason, notifies user
// On every status change, emails the applicant so they stay informed (transparency).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify admin role
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, action, interview_type, interview_scheduled_at, interview_link, interview_notes, admin_notes, rejection_reason } = body;

    if (!application_id || !action) {
      return Response.json({ error: 'application_id and action are required' }, { status: 400 });
    }

    const apps = await base44.asServiceRole.entities.AmbassadorApplication.filter({ id: application_id });
    if (!apps.length) return Response.json({ error: 'Application not found' }, { status: 404 });
    const app = apps[0];

    const now = new Date().toISOString();
    const update = { reviewed_by: user.id, reviewed_at: now };

    let newStatus = app.status;
    let emailSubject = '';
    let emailBody = '';

    const escapeHtml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const firstName = (app.display_name || 'there').split(' ')[0];

    if (action === 'under_review') {
      newStatus = 'under_review';
      if (admin_notes) update.admin_notes = admin_notes;
      emailSubject = 'Your Ambassador Application — Under Review';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">Your application is under review</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            ${firstName},<br/><br/>
            Thank you for your interest in becoming a Nina Purple Ambassador. Our team is now reviewing your application. We will be in touch soon regarding next steps.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'interview_scheduled') {
      newStatus = 'interview_scheduled';
      update.interview_type = interview_type || 'video';
      update.interview_scheduled_at = interview_scheduled_at;
      update.interview_link = interview_link || '';
      if (interview_notes) update.interview_notes = interview_notes;
      if (admin_notes) update.admin_notes = admin_notes;

      const interviewDate = interview_scheduled_at
        ? new Date(interview_scheduled_at).toLocaleString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'full', timeStyle: 'short' })
        : 'TBD';
      const interviewTypeLabel = (interview_type || 'video') === 'video' ? 'video call' : 'phone call';

      emailSubject = 'Your Ambassador Interview — Scheduled';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">Interview scheduled</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            ${firstName},<br/><br/>
            We loved your application and would like to invite you to a short ${interviewTypeLabel} as part of the ambassador selection process.
          </p>
          <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
            <div><strong>When:</strong> ${escapeHtml(interviewDate)} (ET)</div>
            <div><strong>Type:</strong> ${escapeHtml(interviewTypeLabel)}</div>
            ${interview_link ? `<div><strong>Link:</strong> <a href="${escapeHtml(interview_link)}">${escapeHtml(interview_link)}</a></div>` : ''}
            ${interview_notes ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(123,47,190,0.15);"><strong>Notes:</strong><br/>${escapeHtml(interview_notes)}</div>` : ''}
          </div>
          <p style="color: #333; font-size: 14px; line-height: 1.6; margin-top: 16px;">
            If the time doesn't work, please reply to this email to reschedule.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'approved') {
      newStatus = 'approved';
      update.approved_at = now;
      if (admin_notes) update.admin_notes = admin_notes;

      // Set the ambassador flag on the user's profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: app.user_id });
      if (profiles.length) {
        await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
          is_ambassador: true,
          ambassador_signup_date: now,
        });
      }

      emailSubject = 'Welcome, Nina Purple Ambassador ❤️';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">You're an Ambassador</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            ${firstName},<br/><br/>
            We are honoured to welcome you as a Nina Purple Ambassador — Ambassador for humanity.<br/><br/>
            Your profile now displays the Ambassador badge, signaling to the community that you are a trusted voice for conscious relationships. Thank you for carrying this mission forward.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'rejected') {
      newStatus = 'rejected';
      update.rejection_reason = rejection_reason || '';
      if (admin_notes) update.admin_notes = admin_notes;

      emailSubject = 'Your Ambassador Application';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">Thank you for applying</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            ${firstName},<br/><br/>
            Thank you for your interest in becoming a Nina Purple Ambassador. After careful consideration, we are not moving forward with your application at this time.${rejection_reason ? ` ${escapeHtml(rejection_reason)}` : ''}<br/><br/>
            We encourage you to continue engaging with the community, and you are welcome to reapply in the future.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    update.status = newStatus;
    await base44.asServiceRole.entities.AmbassadorApplication.update(application_id, update);

    // Email the applicant about the status change
    if (app.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: app.email,
          subject: emailSubject,
          body: emailBody,
        });
      } catch (emailErr) {
        console.error('Applicant status email failed:', emailErr.message);
      }
    }

    console.info(`Ambassador application ${application_id} → ${newStatus}`);
    return Response.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('updateAmbassadorApplication error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});