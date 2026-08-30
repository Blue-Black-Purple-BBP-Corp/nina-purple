import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// User-facing: redeems a Special Code. Marks it as redeemed and returns the
// feedback form URL. The admin separately sets reward_months and verifies
// feedback, at which point billing_exempt_until is applied.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code } = await req.json().catch(() => ({}));
    if (!code) return Response.json({ error: 'Code is required' }, { status: 400 });

    // Look up the code — must belong to this user and be in 'issued' status
    const codes = await base44.asServiceRole.entities.SpecialCode.filter({ code: code.toUpperCase().trim() });
    const sc = codes[0];
    if (!sc) return Response.json({ error: 'Invalid code' }, { status: 404 });
    if (sc.issued_to_user_id !== user.id) return Response.json({ error: 'This code was not issued to you' }, { status: 403 });
    if (sc.status === 'redeemed') return Response.json({ error: 'This code has already been redeemed' }, { status: 400 });
    if (sc.status === 'expired') return Response.json({ error: 'This code has expired' }, { status: 400 });

    // Check expiry
    if (sc.expires_at && new Date(sc.expires_at) < new Date()) {
      await base44.asServiceRole.entities.SpecialCode.update(sc.id, { status: 'expired' });
      return Response.json({ error: 'This code has expired' }, { status: 400 });
    }

    // Mark as redeemed
    const updated = await base44.asServiceRole.entities.SpecialCode.update(sc.id, {
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      feedback_status: 'pending',
    });

    return Response.json({
      success: true,
      code: updated,
      feedback_form_url: sc.feedback_form_url || null,
      message: 'Code redeemed. Complete the feedback form to receive your reward months.',
    });
  } catch (error) {
    console.error('redeemSpecialCode error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});