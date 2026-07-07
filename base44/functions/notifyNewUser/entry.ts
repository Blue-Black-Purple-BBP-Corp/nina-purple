import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data, event } = await req.json();

    const profile = data || {};
    const displayName = profile.display_name || 'Unknown';
    const city = profile.city || 'Unknown';
    const phone = profile.phone || 'Not provided';
    const tier = profile.subscription_tier || 'solar';
    const lang = profile.language || 'en';
    const archetype = profile.dating_archetype || 'N/A';
    const createdDate = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

    const body = [
      `👤 Name: ${displayName}`,
      `📍 City: ${city}`,
      `📞 Phone: ${phone}`,
      `🌌 Archetype: ${archetype}`,
      `⭐ Plan: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      `🌐 Language: ${lang.toUpperCase()}`,
      `🕐 Joined: ${createdDate} (ET)`,
      `Profile ID: ${profile.user_id || 'N/A'}`,
    ].join('\n');

    await base44.asServiceRole.entities.AdminNotification.create({
      type: 'new_registration',
      title: `New Member: ${displayName}`,
      body,
      related_user_id: profile.user_id || null,
    });

    // Send email notification to admin inbox
    const emailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7B2FBE; font-family: Playfair Display, serif; margin-bottom: 16px;">New Member Registration</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          A new member has just joined Nina Purple.
        </p>
        <div style="background: #F5F0FF; border: 1px solid rgba(123,47,190,0.2); border-radius: 12px; padding: 20px; font-size: 14px; color: #1A0A2E; line-height: 1.8;">
          <div>👤 <strong>Name:</strong> ${displayName}</div>
          <div>📍 <strong>City:</strong> ${city}</div>
          <div>📞 <strong>Phone:</strong> ${phone}</div>
          <div>🌌 <strong>Archetype:</strong> ${archetype}</div>
          <div>⭐ <strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
          <div>🌐 <strong>Language:</strong> ${lang.toUpperCase()}</div>
          <div>🕐 <strong>Joined:</strong> ${createdDate} (ET)</div>
          <div>🆔 <strong>Profile ID:</strong> ${profile.user_id || 'N/A'}</div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          © 2026 Nina Purple
        </p>
      </div>
    `;

    try {
      await base44.integrations.Core.SendEmail({
        to: 'contact@NinaPurple.Love',
        subject: `New Member: ${displayName}`,
        body: emailBody,
      });
      console.info('Admin email sent to contact@NinaPurple.Love for:', displayName);
    } catch (emailErr) {
      console.error('Failed to send admin email:', emailErr.message);
    }

    console.info('Admin notification created for:', displayName);
    return Response.json({ success: true });
  } catch (err) {
    console.error('notifyNewUser error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});