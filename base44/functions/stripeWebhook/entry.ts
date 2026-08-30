import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';

const CREDIT_AMOUNTS = {
  wallet_5: 5,
  wallet_10: 10,
  wallet_25: 25,
  wallet_50: 50,
  wallet_100: 100,
};

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripeWebhook] Signature verification failed:', err.message);
    return new Response('Webhook Error: ' + err.message, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    // ── Idempotency: skip already-processed events ──
    const existing = await base44.asServiceRole.entities.WebhookEvent.filter({ event_id: event.id });
    if (existing && existing.length) {
      console.info('[stripeWebhook] Duplicate event skipped:', event.id);
      return Response.json({ received: true, duplicate: true });
    }

    // ── Write idempotency record FIRST (before any money mutations) ──
    // This prevents double-crediting on Stripe retries if the isolate crashes mid-handler.
    await base44.asServiceRole.entities.WebhookEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, price_key } = session.metadata || {};

      console.info('[stripeWebhook] checkout.session.completed — user:', user_id, 'price_key:', price_key);

      if (!user_id) {
        console.warn('[stripeWebhook] No user_id in session metadata, skipping');
      } else {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id });
        if (!profiles.length) {
          console.warn('[stripeWebhook] No profile found for user_id:', user_id);
        } else {
          const profile = profiles[0];
          const tier = price_key ? price_key.split('_')[0] : '';
          const validTiers = ['lunar', 'stellar', 'galactic'];

          if (price_key === 'nina_membership_1m') {
            await base44.asServiceRole.entities.UserProfile.update(profile.id, {
              subscription_tier: 'nina_membership',
              subscription_status: 'active',
            });
            console.info('[stripeWebhook] Activated Nina Purple Membership for user:', user_id);
          } else if (validTiers.includes(tier)) {
            await base44.asServiceRole.entities.UserProfile.update(profile.id, { subscription_tier: tier });
            console.info('[stripeWebhook] Updated subscription to', tier, 'for user:', user_id);
          } else if (CREDIT_AMOUNTS[price_key]) {
            const newBalance = (profile.credit_balance || 0) + CREDIT_AMOUNTS[price_key];
            await base44.asServiceRole.entities.UserProfile.update(profile.id, { credit_balance: newBalance });
            console.info('[stripeWebhook] Added', CREDIT_AMOUNTS[price_key], 'credits — new balance:', newBalance);
          }
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      console.info('[stripeWebhook] Subscription cancelled:', subscription.id);
      const metadata = subscription.metadata || {};
      const subUserId = metadata.user_id;
      if (subUserId) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: subUserId });
        if (profiles.length) {
          const p = profiles[0];
          if (p.subscription_tier === 'nina_membership') {
            await base44.asServiceRole.entities.UserProfile.update(p.id, { subscription_status: 'lapsed' });
            console.info('[stripeWebhook] Membership lapsed for user:', subUserId);
          } else {
            await base44.asServiceRole.entities.UserProfile.update(p.id, { subscription_tier: 'solar' });
            console.info('[stripeWebhook] Downgraded user to solar tier:', subUserId);
          }
        }
      } else {
        console.warn('[stripeWebhook] subscription.deleted: no user_id in metadata:', subscription.id);
      }
    }

    // ── Renewal: reset usage counters and update renewal date ──
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          const subUserId = sub.metadata?.user_id;
          if (subUserId) {
            const renewalDate = new Date(sub.current_period_end * 1000).toISOString();
            const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: subUserId });
            if (profiles.length) {
              await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
                subscription_renewal_date: renewalDate,
                free_profile_unlocks_used: 0,
                free_messages_used: 0,
                subscription_status: 'active',
              });
              console.info('[stripeWebhook] Renewal — reset counters for user:', subUserId, 'next renewal:', renewalDate);
            }
          }
        } catch (e) {
          console.error('[stripeWebhook] invoice.paid handler error:', e.message);
        }
      }
    }

    // ── Payment failure alerting (Medium 11) ──
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const custEmail = invoice.customer_email || '(unknown email)';
      console.error('[stripeWebhook] Payment FAILED — invoice:', invoice.id, 'customer:', custEmail);
      try {
        await base44.asServiceRole.entities.AdminNotification.create({
          type: 'system',
          title: 'Payment Failed',
          body: `Invoice ${invoice.id} failed for customer ${custEmail}. Amount due: ${invoice.amount_due}. Manual follow-up may be required.`,
          is_read: false,
        });
      } catch (notifErr) {
        console.error('[stripeWebhook] Failed to create payment-failure notification:', notifErr.message);
      }
    }

    // ── Refund / chargeback: flag for staff review ──
    // Photo-reveal entitlements are credit-based (wallet top-ups), not tied
    // 1:1 to a Stripe charge, so auto-revocation is not directly traceable.
    // Flag the event for staff to review entitlement policy manually.
    if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
      const charge = event.data.object;
      console.info('[stripeWebhook] Refund/dispute event:', event.type, 'charge:', charge.id);
      try {
        await base44.asServiceRole.entities.AdminNotification.create({
          type: 'system',
          title: event.type === 'charge.refunded' ? 'Payment Refunded' : 'Chargeback Dispute',
          body: `Charge ${charge.id} for customer ${charge.customer || '(unknown)'}. Review photo-reveal entitlements if applicable.`,
          is_read: false,
        });
      } catch (notifErr) {
        console.error('[stripeWebhook] refund notification failed:', notifErr.message);
      }
    }

  } catch (err) {
    console.error('[stripeWebhook] Handler error:', err.message, err.stack);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});