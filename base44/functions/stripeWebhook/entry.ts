import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CREDIT_AMOUNTS = {
  credits_10: 10,
  credits_25: 25,
  credits_50: 50,
};

const SUBSCRIPTION_TIERS = {
  lunar: 'lunar',
  stellar: 'stellar',
  galactic: 'galactic',
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

      if (SUBSCRIPTION_TIERS[price_key]) {
        // Update subscription tier
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          subscription_tier: SUBSCRIPTION_TIERS[price_key],
        });
        console.info('Updated subscription to', price_key, 'for user:', user_id);
      } else if (CREDIT_AMOUNTS[price_key]) {
        // Add credits
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
      // Optionally downgrade to solar tier — requires mapping customer to user_id
    }

  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});