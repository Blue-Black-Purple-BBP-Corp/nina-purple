import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Admin-only: updates an ambassador application's status through the pipeline.
// Actions: in_review, schedule_interview, approve, decline.
// On approve, also sets is_ambassador=true on the user's profile.
// Emails the applicant at each stage transition so they always know where they stand.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { application_id, action } = body;

    if (!application_id || !action) {
      return Response.json({ error: 'application_id and action are required' }, { status: 400 });
    }

    const apps = await base44.asServiceRole.entities.AmbassadorApplication.filter({ id: application_id });
    if (!apps.length) return Response.json({ error: 'Application not found' }, { status: 404 });
    const app = apps[0];

    const escapeHtml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const safeName = escapeHtml(app.display_name || 'there');
    const safeEmail = app.email || '';
    const now = new Date().toISOString();

    let update = {};
    let emailSubject = '';
    let emailBody = '';

    if (action === 'in_review') {
      update = { status: 'in_review', reviewed_date: now };
      emailSubject = 'Your Nina Purple Ambassador Application — Under Review';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif;">Hello ${safeName},</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Thank you for applying to become a Nina Purple Ambassador. Your application is now under review.
            We will be in touch within 5 business days with next steps, which may include a short video or phone interview.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'schedule_interview') {
      const { interview_type, interview_date, interview_link, interview_phone, interview_notes } = body;
      if (!interview_date) return Response.json({ error: 'interview_date is required' }, { status: 400 });
      update = {
        status: 'interview_scheduled',
        interview_type: interview_type || app.preferred_interview || 'video',
        interview_date,
        interview_link: (interview_link || '').trim(),
        interview_phone: (interview_phone || '').trim(),
        interview_notes: (interview_notes || '').trim(),
      };
      const dateStr = new Date(interview_date).toLocaleString('en-CA', {
        timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short',
      });
      const interviewDetail = (update.interview_type === 'video' && update.interview_link)
        ? `Video Meeting: ${escapeHtml(update.interview_link)}`
        : (update.interview_type === 'phone' && update.interview_phone)
          ? `Phone Call: ${escapeHtml(update.interview_phone)}`
          : 'Details to follow';
      emailSubject = 'Your Nina Purple Ambassador Interview';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif;">Hello ${safeName},</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Great news! We would love to speak with you about your ambassador application.
          </p>
          <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; margin: 20px 0; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
            <div><strong>When:</strong> ${escapeHtml(dateStr)} (ET)</div>
            <div><strong>Format:</strong> ${escapeHtml(update.interview_type === 'video' ? 'Video meeting' : 'Phone call')}</div>
            <div><strong>Details:</strong> ${interviewDetail}</div>
            ${update.interview_notes ? `<div style="margin-top:8px;"><strong>Notes:</strong> ${escapeHtml(update.interview_notes)}</div>` : ''}
          </div>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            The interview will take about 20 minutes. Please be in a quiet space and ready to discuss your motivation and community vision.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'approve') {
      const { decision_feedback } = body;
      update = {
        status: 'approved',
        decision_feedback: (decision_feedback || '').trim(),
        decision_date: now,
      };
      // Set is_ambassador on the profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: app.user_id });
      if (profiles.length) {
        await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
          is_ambassador: true,
          ambassador_signup_date: now,
        });
      }
      emailSubject = 'Welcome, Nina Purple Ambassador!';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif;">Congratulations, ${safeName}!</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            We are delighted to welcome you as a Nina Purple Ambassador — Ambassador for humanity.
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Your ambassador badge is now active on your profile. You will receive a separate welcome package with resources, event hosting guidelines, and your referral tracking link.
          </p>
          ${decision_feedback ? `<div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; color: #1A0A2E;"><strong>From the team:</strong><br/>${escapeHtml(decision_feedback)}</div>` : ''}
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Thank you for carrying conscious love further. We are honored to have you.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'decline') {
      const { decision_feedback } = body;
      update = {
        status: 'declined',
        decision_feedback: (decision_feedback || '').trim(),
        decision_date: now,
      };
      emailSubject = 'Your Nina Purple Ambassador Application';
      emailBody = `
        <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7B2FBE; font-family: Playfair Display, serif;">Hello ${safeName},</h2>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Thank you for your interest in becoming a Nina Purple Ambassador. We appreciate the time and care you put into your application.
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            At this time, we are not moving forward with your application. This is not a reflection of your worth — it is about fit and timing for our current community needs.
          </p>
          ${decision_feedback ? `<div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; color: #1A0A2E;"><strong>Feedback:</strong><br/>${escapeHtml(decision_feedback)}</div>` : ''}
          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            You are welcome to re-apply after 30 days. In the meantime, we invite you to continue being an active part of the community.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
        </div>
      `;
    } else if (action === 'update_notes') {
      const { admin_notes } = body;
      update = { admin_notes: (admin_notes || '').trim() };
      // No email for internal notes
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    await base44.asServiceRole.entities.AmbassadorApplication.update(application_id, update);

    // Send email to applicant (except for internal notes)
    if (action !== 'update_notes' && safeEmail) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: safeEmail,
          subject: emailSubject,
          body: emailBody,
        });
      } catch (emailErr) {
        console.error('Applicant email failed:', emailErr.message);
      }
    }

    console.info(`Ambassador application ${application_id} → ${action} by admin ${user.id}`);
    return Response.json({ success: true, status: update.status || 'updated' });
  } catch (err) {
    console.error('updateAmbassadorApplication error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});