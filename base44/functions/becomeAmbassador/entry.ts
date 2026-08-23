import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Lets an authenticated user opt into the Nina Purple Ambassador program.
// Sets the flag server-side (never trust the client for trust/billing fields),
// logs an admin notification, and emails the admin inbox. Idempotent —
// re-signing up by an existing ambassador is a no-op.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const profile = profiles[0];

    if (profile.is_ambassador) {
      return Response.json({ success: true, already: true });
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      is_ambassador: true,
      ambassador_signup_date: now,
    });

    const escapeHtml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const displayName = profile.full_name || profile.display_name || 'Unknown';
    const safeName = escapeHtml(displayName);
    const safeEmail = escapeHtml(user.email || '');
    const safeCity = escapeHtml(profile.city || 'Unknown');
    const dateStr = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'new_registration',
      title: `New Ambassador: ${safeName}`,
      body: `Name: ${displayName}\nEmail: ${user.email || ''}\nCity: ${profile.city || 'Unknown'}\nSigned up: ${dateStr} (ET)`,
      related_user_id: user.id,
    });

    const emailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">New Ambassador Signup</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          A member just became a Nina Purple Ambassador — Ambassador for humanity.
        </p>
        <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
          <div><strong>Name:</strong> ${safeName}</div>
          <div><strong>Email:</strong> ${safeEmail}</div>
          <div><strong>City:</strong> ${safeCity}</div>
          <div><strong>Signed up:</strong> ${dateStr} (ET)</div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          © 2026 Nina Purple
        </p>
      </div>
    `;

    try {
      await base44.integrations.Core.SendEmail({
        to: 'contact@NinaPurple.Love',
        subject: `New Ambassador: ${safeName}`,
        body: emailBody,
      });
    } catch (emailErr) {
      console.error('Ambassador email failed:', emailErr.message);
    }

    console.info('Ambassador signup:', displayName);
    return Response.json({ success: true });
  } catch (err) {
    console.error('becomeAmbassador error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});