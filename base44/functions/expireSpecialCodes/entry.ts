import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

// Scheduled job: marks Special Codes past their expires_at as 'expired'.
// Should run daily. Admin-only (the scheduler invokes with admin context).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) return Response.json({ error: 'Admin access required' }, { status: 403 });
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const codes = await base44.asServiceRole.entities.SpecialCode.filter({ status: 'issued' });
    let expiredCount = 0;
    for (const sc of codes) {
      if (sc.expires_at && new Date(sc.expires_at) < new Date()) {
        await base44.asServiceRole.entities.SpecialCode.update(sc.id, { status: 'expired' });
        expiredCount++;
      }
    }

    return Response.json({ success: true, expired: expiredCount });
  } catch (error) {
    console.error('expireSpecialCodes error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});