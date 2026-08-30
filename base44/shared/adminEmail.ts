// Shared helper: send admin notification emails via Resend.
// Base44's built-in SendEmail integration only reaches registered app users,
// so admin notifications to contact@ninapurple.love (an external inbox) must
// go through Resend, which supports arbitrary external recipients.
//
// Requires the RESEND_API_KEY secret to be set on the app.

const ADMIN_EMAIL = 'contact@ninapurple.love';
const FROM_EMAIL = 'Nina Purple <noreply@ninapurple.love>';

export async function sendAdminEmail(subject: string, htmlBody: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    const msg = 'RESEND_API_KEY secret is not set — admin email cannot be sent';
    console.error('[adminEmail]', msg);
    return { success: false, error: msg };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const msg = `Resend API error ${res.status}: ${errText}`;
      console.error('[adminEmail]', msg);
      return { success: false, error: msg };
    }

    const data = await res.json();
    console.info('[adminEmail] Sent to', ADMIN_EMAIL, '— id:', data.id);
    return { success: true };
  } catch (err) {
    const msg = `Resend request failed: ${err.message}`;
    console.error('[adminEmail]', msg);
    return { success: false, error: msg };
  }
}