import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import Stripe from 'npm:stripe@14';
import {
  evaluateFoundingEligibility,
  getOrCreateClaimBenefit,
  FOUNDING_PRICE_ID,
  TRIAL_DURATION_DAYS,
} from '../../shared/foundingMembers.ts';
import { writeStaffAuditLog } from '../../shared/staffAuth.ts';

// Member-facing: starts the Founding Member 3-month free trial by creating a
// Stripe Checkout session in subscription mode with a 90-day trial on the
// nina_membership price. The member enters a payment method (required by
// Stripe for trials); after 90 days the subscription auto-renews at $20/mo
// unless cancelled.
//
// Security/idempotency:
//   - Eligibility is re-checked server-side on every call (never trusts client).
//   - One benefit per member; an existing 'eligible' benefit is reused so the
//     Stripe idempotency key (fmt_<benefit_id>) returns the same checkout
//     session on repeated taps/refresh/back-forward — no duplicate sessions,
//     subscriptions, or charges.
//   - The benefit is NOT marked active here — only the webhook
//     (checkout.session.completed) flips it to 'active' after Stripe confirms.
//
// Legacy billing (lunar/stellar/galactic) is untouched.

const ALLOWED_ORIGINS = [
  'https://ninapurple.love',
  'https://www.ninapurple.love',
  'https://app.ninapurple.love',
];

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Re-check eligibility server-side.
    const elig = await evaluateFoundingEligibility(base44, user.id);
    if (elig.eligibility_status !== 'eligible') {
      return Response.json({
        error: 'You are not eligible for the Founding Member trial.',
        code: 'not_eligible',
        eligibility_status: elig.eligibility_status,
      }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reqOrigin = new URL(req.url).origin;
    const allowed = [...ALLOWED_ORIGINS, reqOrigin];
    const safe = (u) => {
      if (!u) return null;
      try { return allowed.includes(new URL(u).origin) ? u : null; } catch { return null; }
    };
    const success_url = safe(body.success_url) || `${reqOrigin}/home?payment=success`;
    const cancel_url = safe(body.cancel_url) || `${reqOrigin}/onboarding`;

    // Create or reuse the claim benefit (idempotency anchor).
    const benefit = await getOrCreateClaimBenefit(base44, user.id);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: FOUNDING_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DURATION_DAYS,
        metadata: {
          base44_app_id: Deno.env.get('BASE44_APP_ID'),
          user_id: user.id,
          founding_member_trial: 'true',
          benefit_id: benefit.benefit_id,
        },
      },
      success_url,
      cancel_url,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        founding_member_trial: 'true',
        benefit_id: benefit.benefit_id,
      },
    }, { idempotencyKey: `fmt_${benefit.benefit_id}` });

    await writeStaffAuditLog(base44, {
      actor_native_user_id: user.id,
      action_type: 'founding_member.trial_started',
      target_entity_type: 'FoundingMemberBenefit',
      target_entity_id: benefit.benefit_id,
      correlation_id: benefit.audit_correlation_id,
      new_state: { session_id: session.id, benefit_id: benefit.benefit_id },
    });

    console.info('[startFoundingMemberTrial] session created:', session.id, 'user:', user.id, 'benefit:', benefit.benefit_id);
    return Response.json({ url: session.url, session_id: session.id, benefit_id: benefit.benefit_id });
  } catch (error) {
    console.error('[startFoundingMemberTrial] error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});