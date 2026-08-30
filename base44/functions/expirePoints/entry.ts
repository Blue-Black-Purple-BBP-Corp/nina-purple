import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { expireAvailablePoints } from '../../shared/bbpRules.ts';

// Scheduled daily job — expires available points past their 12-month
// expires_at date. Creates traceable ledger entries. Does not affect
// pending, held, or reversed points.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — verify admin or service invocation
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await expireAvailablePoints(base44);

    return Response.json(result);
  } catch (error) {
    console.error('expirePoints error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}