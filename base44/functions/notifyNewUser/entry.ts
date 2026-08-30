import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { sendAdminEmail } from '../../shared/adminEmail.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require an authenticated user — prevents unauthenticated abuse
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event } = await req.json();

    // Fetch the caller's profile directly from the database rather than trusting
    // user-supplied data in the request body. This prevents system-notification
    // spoofing, where an attacker could craft a misleading display_name/city to
    // social-engineer admins viewing the Admin Panel.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const profile = profiles[0] || {};

    // HTML-escape untrusted user-supplied fields before interpolation into the email body
    const escapeHtml = (str) => String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const displayName = profile.full_name || profile.display_name || 'Unknown';
    const city = profile.city || 'Unknown';
    const phone = profile.phone || 'Not provided';
    const tier = profile.subscription_tier || 'solar';
    const lang = profile.language || 'en';
    const archetype = profile.dating_archetype || 'N/A';
    const createdDate = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

    const safeDisplayName = escapeHtml(displayName);
    const safeCity = escapeHtml(city);
    const safePhone = escapeHtml(phone);
    const safeArchetype = escapeHtml(archetype);
    const safeTier = escapeHtml(tier.charAt(0).toUpperCase() + tier.slice(1));
    const safeLang = escapeHtml(lang.toUpperCase());
    const safeProfileId = escapeHtml(user.id);

    const body = [
      `👤 Name: ${displayName}`,
      `📍 City: ${city}`,
      `📞 Phone: ${phone}`,
      `🌌 Archetype: ${archetype}`,
      `⭐ Plan: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      `🌐 Language: ${lang.toUpperCase()}`,
      `🕐 Joined: ${createdDate} (ET)`,
      `Profile ID: ${user.id}`,
    ].join('\n');

    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'new_registration',
      title: `New Member: ${safeDisplayName}`,
      body,
      related_user_id: user.id,
    });

    // Send email notification to admin inbox
    const emailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">New Member Registration</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          A new member has just joined Nina Purple.
        </p>
        <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
          <div>👤 <strong>Name:</strong> ${safeDisplayName}</div>
          <div>📍 <strong>City:</strong> ${safeCity}</div>
          <div>📞 <strong>Phone:</strong> ${safePhone}</div>
          <div>🌌 <strong>Archetype:</strong> ${safeArchetype}</div>
          <div>⭐ <strong>Plan:</strong> ${safeTier}</div>
          <div>🌐 <strong>Language:</strong> ${safeLang}</div>
          <div>🕐 <strong>Joined:</strong> ${createdDate} (ET)</div>
          <div>🆔 <strong>Profile ID:</strong> ${safeProfileId}</div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          © 2026 Nina Purple
        </p>
      </div>
    `;

    const emailResult = await sendAdminEmail(`New Member: ${safeDisplayName}`, emailBody);
    if (!emailResult.success) {
      console.error('Failed to send admin email:', emailResult.error);
    }

    console.info('Admin notification created for:', displayName);
    return Response.json({ success: true });
  } catch (err) {
    console.error('notifyNewUser error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});