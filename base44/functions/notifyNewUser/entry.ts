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

    console.info('Admin notification created for:', displayName);
    return Response.json({ success: true });
  } catch (err) {
    console.error('notifyNewUser error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});