import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id, action } = await req.json();

    const event = await base44.asServiceRole.entities.Event.list();
    const match = event.find(e => e.id === event_id);
    if (!match) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const title = match.title_en || match.title_fr || 'Event';
    const date = match.event_date || '';
    const time = match.event_time || '';
    const link = match.connection_link || '';
    const host = match.host_name || 'Nina Purple';

    if (action === 'book') {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Confirmed: ${title} — ${date}`,
        body: `You're booked for:\n\n${title}\nDate: ${date}\nTime: ${time}\nHost: ${host}\n${link ? `Join link: ${link}\n` : ''}\n\nNeed to cancel? Please do so at least 48 hours before the event to avoid a $10 USD no-show fee.\n\n— Nina Purple`,
      });
    } else if (action === 'cancel') {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Cancelled: ${title}`,
        body: `Your booking for "${title}" on ${date}${time ? ` at ${time}` : ''} has been cancelled.\n\n— Nina Purple`,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[sendBookingEmail]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});