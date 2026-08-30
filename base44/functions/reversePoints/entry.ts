import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { reversePoints } from '../../shared/bbpRules.ts';

// Staff-only: reverses a BBP Points award by creating a compensating ledger
// entry. The original ledger record is preserved (never deleted).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { ledger_entry_id, reason } = body;

    if (!ledger_entry_id || !reason) {
      return Response.json({ error: 'ledger_entry_id and reason are required' }, { status: 400 });
    }

    const result = await reversePoints(base44, ledger_entry_id, user.id, reason);

    return Response.json(result);
  } catch (error) {
    console.error('reversePoints error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});