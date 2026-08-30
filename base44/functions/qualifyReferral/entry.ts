import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { qualifyReferralAward } from '../../shared/bbpRules.ts';

// Qualifies a referral: checks Community Ready + qualifying paid transaction
// + 30-day survival. Awards both referrer and invitee per the active rule.
// Can be called by staff console or scheduled job.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { referral_id } = body;

    if (!referral_id) {
      return Response.json({ error: 'Missing referral_id' }, { status: 400 });
    }

    const result = await qualifyReferralAward(base44, referral_id);

    return Response.json(result);
  } catch (error) {
    console.error('qualifyReferral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}