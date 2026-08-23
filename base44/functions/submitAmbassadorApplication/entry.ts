import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Lets an authenticated member submit an application to the Nina Purple
// Ambassador program. Creates an AmbassadorApplication record with status
// "pending", prevents duplicate pending applications, notifies admins by
// email + in-app notification, and emails the applicant a confirmation.
// The is_ambassador flag on UserProfile is only set later by an admin via
// updateAmbassadorApplication — never by the applicant.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const motivation = (body.motivation || '').trim();
    const relevantExperience = (body.relevant_experience || '').trim();
    const availabilityHoursWeek = Number(body.availability_hours_week) || 0;
    const languages = Array.isArray(body.languages) ? body.languages : [];
    const communityInvolvement = (body.community_involvement || '').trim();

    if (motivation.length < 20) {
      return Response.json({ error: 'Motivation must be at least 20 characters' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const profile = profiles[0];

    // Already an approved ambassador — no need to reapply
    if (profile.is_ambassador) {
      return Response.json({ success: true, already: true });
    }

    // Prevent duplicate active applications (pending / under_review / interview_scheduled)
    const existing = await base44.asServiceRole.entities.AmbassadorApplication.filter({ user_id: user.id });
    const activeStatuses = ['pending', 'under_review', 'interview_scheduled'];
    const activeApp = existing.find(a => activeStatuses.includes(a.status));
    if (activeApp) {
      return Response.json({ error: 'application_already_active', application_id: activeApp.id, status: activeApp.status }, { status: 409 });
    }

    const now = new Date().toISOString();
    const application = await base44.asServiceRole.entities.AmbassadorApplication.create({
      user_id: user.id,
      display_name: profile.full_name || profile.display_name || user.full_name || 'Unknown',
      email: user.email || '',
      city: profile.city || '',
      status: 'pending',
      motivation,
      relevant_experience: relevantExperience,
      availability_hours_week: availabilityHoursWeek,
      languages,
      community_involvement: communityInvolvement,
      submitted_at: now,
    });

    const escapeHtml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const safeName = escapeHtml(application.display_name);
    const safeEmail = escapeHtml(application.email);
    const safeCity = escapeHtml(application.city);
    const safeMotivation = escapeHtml(motivation);
    const dateStr = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

    // Admin notification (in-app + email)
    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'new_registration',
      title: `Ambassador Application: ${application.display_name}`,
      body: `Name: ${application.display_name}\nEmail: ${application.email}\nCity: ${application.city}\nMotivation: ${motivation.slice(0, 200)}...\nSubmitted: ${dateStr} (ET)\nApplication ID: ${application.id}`,
      related_user_id: user.id,
    });

    const adminEmailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">New Ambassador Application</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          A member has applied to become a Nina Purple Ambassador. Review their application in the Admin panel → Ambassadors tab.
        </p>
        <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
          <div><strong>Name:</strong> ${safeName}</div>
          <div><strong>Email:</strong> ${safeEmail}</div>
          <div><strong>City:</strong> ${safeCity}</div>
          <div><strong>Availability:</strong> ${availabilityHoursWeek} hrs/week</div>
          <div><strong>Languages:</strong> ${languages.join(', ') || 'N/A'}</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(123,47,190,0.15);"><strong>Motivation:</strong><br/>${safeMotivation}</div>
          <div><strong>Submitted:</strong> ${dateStr} (ET)</div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
      </div>
    `;

    try {
      await base44.integrations.Core.SendEmail({
        to: 'contact@NinaPurple.Love',
        subject: `Ambassador Application: ${application.display_name}`,
        body: adminEmailBody,
      });
    } catch (emailErr) {
      console.error('Admin email failed:', emailErr.message);
    }

    // Applicant confirmation email
    const applicantEmailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">Thank you for applying</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          ${application.display_name.split(' ')[0]},<br/><br/>
          Your application to become a Nina Purple Ambassador has been received. Our team will review it carefully and contact you within 5-7 days regarding next steps, which may include a short video or phone interview.
        </p>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          You can track your application status anytime from your dashboard.
        </p>
        <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 16px; font-size: 13px; color: #1A0A2E; line-height: 1.6;">
          <strong>Application ID:</strong> ${escapeHtml(application.id)}<br/>
          <strong>Status:</strong> Pending Review<br/>
          <strong>Submitted:</strong> ${dateStr} (ET)
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">© 2026 Nina Purple</p>
      </div>
    `;

    try {
      await base44.integrations.Core.SendEmail({
        to: application.email,
        subject: 'Your Ambassador Application — Received',
        body: applicantEmailBody,
      });
    } catch (emailErr) {
      console.error('Applicant email failed:', emailErr.message);
    }

    console.info('Ambassador application submitted:', application.id);
    return Response.json({ success: true, application_id: application.id });
  } catch (err) {
    console.error('submitAmbassadorApplication error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});