import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Lets an authenticated user submit an ambassador application.
// Prevents duplicate submissions (one active application per user), creates
// the application record, notifies admins by email + in-app notification.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { motivation, weekly_availability, social_presence, references, preferred_interview } = body;

    if (!motivation || !motivation.trim()) {
      return Response.json({ error: 'Motivation is required' }, { status: 400 });
    }

    // Fetch the caller's profile directly (never trust client-supplied identity fields)
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const profile = profiles[0];

    // Already an ambassador — no need to apply
    if (profile.is_ambassador) {
      return Response.json({ success: true, already_ambassador: true });
    }

    // Check for an existing active application (not declined, or declined < 30 days ago)
    const existing = await base44.asServiceRole.entities.AmbassadorApplication.filter(
      { user_id: user.id }
    );
    const hasActive = existing.some(app => {
      if (app.status === 'declined') {
        const declinedDate = app.decision_date ? new Date(app.decision_date) : null;
        if (declinedDate && (Date.now() - declinedDate.getTime()) < 30 * 24 * 60 * 60 * 1000) {
          return true; // declined less than 30 days ago — still counts as active
        }
        return false;
      }
      return app.status !== 'approved';
    });

    if (hasActive) {
      return Response.json({ error: 'You already have an active application under review.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const displayName = profile.full_name || profile.display_name || 'Unknown';
    const city = profile.city || 'Unknown';
    const email = user.email || '';

    const application = await base44.asServiceRole.entities.AmbassadorApplication.create({
      user_id: user.id,
      display_name: displayName,
      city,
      country: profile.country || '',
      email,
      motivation: motivation.trim(),
      weekly_availability: (weekly_availability || '').trim(),
      social_presence: (social_presence || '').trim(),
      references: (references || '').trim(),
      preferred_interview: preferred_interview || 'video',
      status: 'submitted',
      submitted_date: now,
    });

    const escapeHtml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const safeName = escapeHtml(displayName);
    const safeEmail = escapeHtml(email);
    const safeCity = escapeHtml(city);
    const safeMotivation = escapeHtml(motivation.trim());
    const dateStr = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'new_registration',
      title: `Ambassador Application: ${displayName}`,
      body: `Name: ${displayName}\nEmail: ${email}\nCity: ${city}\nMotivation: ${motivation.trim().slice(0, 200)}...\nSubmitted: ${dateStr} (ET)`,
      related_user_id: user.id,
    });

    const emailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">New Ambassador Application</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          A member has applied to become a Nina Purple Ambassador. Review their application in the Admin Panel → Ambassadors tab.
        </p>
        <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
          <div><strong>Name:</strong> ${safeName}</div>
          <div><strong>Email:</strong> ${safeEmail}</div>
          <div><strong>City:</strong> ${safeCity}</div>
          <div><strong>Submitted:</strong> ${dateStr} (ET)</div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(123,47,190,0.15);">
            <strong>Motivation:</strong><br/>${safeMotivation}
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          © 2026 Nina Purple
        </p>
      </div>
    `;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'contact@NinaPurple.Love',
        subject: `Ambassador Application: ${safeName}`,
        body: emailBody,
      });
    } catch (emailErr) {
      console.error('Ambassador application email failed:', emailErr.message);
    }

    console.info('Ambassador application submitted by:', displayName);
    return Response.json({ success: true, application_id: application.id });
  } catch (err) {
    console.error('submitAmbassadorApplication error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});