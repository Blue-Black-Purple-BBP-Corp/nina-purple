import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { releasePending } from '../../shared/bbpRules.ts';

// Scheduled job: releases pending BBP Points rewards whose available_at
// timestamp has passed and who have no active safety hold.
// Run via a scheduled automation (recommended: every 1 hour).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins or the system (scheduled job) can trigger this
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const result = await releasePending(base44);

    return Response.json({
      success: true,
      released: result.released,
    });
  } catch (error) {
    console.error('releasePendingRewards error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});