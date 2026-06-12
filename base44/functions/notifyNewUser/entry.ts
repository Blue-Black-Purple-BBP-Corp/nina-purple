import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_EMAIL = 'contact@ninapurple.love';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data, event } = await req.json();

    const profile = data || {};
    const displayName = profile.display_name || 'Unknown';
    const city = profile.city || 'Unknown';
    const tier = profile.subscription_tier || 'solar';
    const lang = profile.language || 'en';
    const archetype = profile.dating_archetype || 'N/A';
    const createdDate = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' });

    const subject = `🌟 New Nina Purple Member: ${displayName}`;
    const body = `
A new member has joined Nina Purple!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤  Name:       ${displayName}
📍  City:       ${city}
🌌  Archetype:  ${archetype}
⭐  Plan:       ${tier.charAt(0).toUpperCase() + tier.slice(1)}
🌐  Language:   ${lang.toUpperCase()}
🕐  Joined:     ${createdDate} (ET)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Profile ID: ${profile.user_id || 'N/A'}

— Nina Purple Platform
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ADMIN_EMAIL,
      from_name: 'Nina Purple',
      subject,
      body,
    });

    console.info('New user notification sent for:', displayName);
    return Response.json({ sent: true });
  } catch (err) {
    console.error('notifyNewUser error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});