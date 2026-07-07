import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook Error: ' + err.message, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, price_key } = session.metadata || {};

      console.info('checkout.session.completed — user:', user_id, 'price_key:', price_key);

      if (!user_id) {
        console.warn('No user_id in session metadata, skipping profile update');
        return Response.json({ received: true });
      }

      // Find the user's profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id });
      if (!profiles.length) {
        console.warn('No profile found for user_id:', user_id);
        return Response.json({ received: true });
      }

      const profile = profiles[0];

      // Extract tier from price_key (e.g., "galactic_1m" → "galactic")
      const tier = price_key ? price_key.split('_')[0] : '';
      const validTiers = ['lunar', 'stellar', 'galactic'];

      if (validTiers.includes(tier)) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          subscription_tier: tier,
        });
        console.info('Updated subscription to', tier, 'for user:', user_id);
      } else if (CREDIT_AMOUNTS[price_key]) {
        const newBalance = (profile.credit_balance || 0) + CREDIT_AMOUNTS[price_key];
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          credit_balance: newBalance,
        });
        console.info('Added', CREDIT_AMOUNTS[price_key], 'credits for user:', user_id, '— new balance:', newBalance);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      console.info('Subscription cancelled:', subscription.id);
      // Downgrade the user back to the free tier
      const metadata = subscription.metadata || {};
      const subUserId = metadata.user_id;
      if (subUserId) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: subUserId });
        if (profiles.length) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, { subscription_tier: 'solar' });
          console.info('Downgraded user to solar tier:', subUserId);
        }
      } else {
        console.warn('subscription.deleted: no user_id in metadata, cannot downgrade', subscription.id);
      }
    }

  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});