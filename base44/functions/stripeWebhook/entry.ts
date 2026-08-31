import Stripe from 'npm:stripe@14';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.36';
import { setViewerEntitlementsStatus, reactivateViewerEntitlements } from '../../shared/photoAccess.ts';

const CREDIT_AMOUNTS = {
  wallet_5: 5,
  wallet_10: 10,
  wallet_25: 25,
  wallet_50: 50,
  wallet_100: 100,
};

// Map a Stripe subscription object to the expanded subscription_status enum
// (decision 3). Preserves founding-trial and legacy billing_exempt markers.
function mapStripeSubStatus(sub, profile) {
  const isFounding = sub.metadata?.founding_member_trial === 'true';
  const status = sub.status;
  const cancelAtPeriodEnd = sub.cancel_at_period_end;

  if (isFounding && status === 'trialing') return 'trial_active';

  switch (status) {
    case 'active':
      return cancelAtPeriodEnd ? 'cancelled_active_until_period_end' : 'active';
    case 'trialing':
      return 'trial_active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'cancelled_expired';
    case 'unpaid':
    case 'incomplete':
      return 'past_due';
    default:
      return profile?.subscription_status || 'none';
  }
}

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

      // ── Founding Member trial checkout: activate benefit + membership ──
      if (session.metadata?.founding_member_trial === 'true' && session.metadata?.benefit_id && user_id) {
        try {
          const { activateFoundingTrial } = await import('../../shared/foundingMembers.ts');
          await activateFoundingTrial(base44, user_id, session, session.metadata.benefit_id);
          console.info('[stripeWebhook] Founding Member trial activated for user:', user_id);
        } catch (e) {
          console.error('[stripeWebhook] Founding trial activation failed:', e.message);
        }
      } else if (!user_id) {
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
            // Credit via the append-only ledger (decision 2). Idempotent on the
            // Stripe event ID, so duplicate webhook deliveries don't double-credit.
            try {
              const { creditFromTopup } = await import('../../shared/interactionCredits.ts');
              const res = await creditFromTopup(base44, {
                native_user_id: user_id,
                amount: CREDIT_AMOUNTS[price_key],
                source_reference: session.id,
                idempotency_key: `topup-${event.id}`,
                correlation_id: event.id,
                description: `Added $${CREDIT_AMOUNTS[price_key].toFixed(2)} to your wallet`,
              });
              console.info('[stripeWebhook] Credited', CREDIT_AMOUNTS[price_key], 'via ledger — balance:', res.balance_after, 'idempotent:', res.idempotent);
            } catch (ledgerErr) {
              console.error('[stripeWebhook] Ledger credit failed:', ledgerErr.message);
            }
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

          // ── Expire all active photo-reveal entitlements for this viewer ──
          try {
            const n = await setViewerEntitlementsStatus(base44, subUserId, 'expired', 'subscription_ended');
            if (n) console.info('[stripeWebhook] Entitlements expired for user:', subUserId, 'count:', n);
          } catch (entErr) {
            console.warn('[stripeWebhook] Entitlement expire failed:', entErr.message);
          }
        }
      } else {
        console.warn('[stripeWebhook] subscription.deleted: no user_id in metadata:', subscription.id);
      }

      // ── Founding Member trial: mark benefit expired on cancellation ──
      if (metadata.founding_member_trial === 'true' && metadata.benefit_id) {
        try {
          const b = await base44.asServiceRole.entities.FoundingMemberBenefit.filter({ benefit_id: metadata.benefit_id });
          if (b[0] && ['eligible', 'active'].includes(b[0].eligibility_status)) {
            await base44.asServiceRole.entities.FoundingMemberBenefit.update(b[0].id, {
              eligibility_status: 'expired',
              revoked_at: new Date().toISOString(),
            });
            console.info('[stripeWebhook] Founding Member benefit expired:', metadata.benefit_id);
          }
        } catch (fbErr) {
          console.error('[stripeWebhook] Founding benefit expire failed:', fbErr.message);
        }
      }
    }

    // ── Subscription state updates: map Stripe status → subscription_status ──
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const subUserId = sub.metadata?.user_id;
      if (subUserId) {
        try {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: subUserId });
          if (profiles.length) {
            const p = profiles[0];
            const newStatus = mapStripeSubStatus(sub, p);
            const renewalDate = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : p.subscription_renewal_date;
            await base44.asServiceRole.entities.UserProfile.update(p.id, {
              subscription_status: newStatus,
              subscription_renewal_date: renewalDate,
            });
            console.info('[stripeWebhook] subscription.updated →', newStatus, 'for user:', subUserId);

            // ── Proactive photo-reveal entitlement status sync (decision 5) ──
            // past_due/cancelled_expired → inactive (zero-day grace). active/
            // trial_active → reactivate any previously-inactive entitlements.
            // cancelled_active_until_period_end stays entitled through period end.
            try {
              if (newStatus === 'past_due' || newStatus === 'cancelled_expired' || newStatus === 'lapsed') {
                const n = await setViewerEntitlementsStatus(base44, subUserId, 'inactive_due_to_membership', 'membership_inactive');
                if (n) console.info('[stripeWebhook] Entitlements inactivated for user:', subUserId, 'count:', n);
              } else if (newStatus === 'active' || newStatus === 'trial_active') {
                const n = await reactivateViewerEntitlements(base44, subUserId);
                if (n) console.info('[stripeWebhook] Entitlements reactivated for user:', subUserId, 'count:', n);
              }
            } catch (entErr) {
              console.warn('[stripeWebhook] Entitlement sync failed:', entErr.message);
            }
          }
        } catch (e) {
          console.error('[stripeWebhook] subscription.updated handler error:', e.message);
        }
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

              // ── Founding Member trial: first paid invoice (post-trial) → redeemed ──
              if (sub.metadata?.founding_member_trial === 'true' && sub.metadata?.benefit_id && (invoice.amount_paid || 0) > 0) {
                try {
                  const b = await base44.asServiceRole.entities.FoundingMemberBenefit.filter({ benefit_id: sub.metadata.benefit_id });
                  if (b[0] && b[0].eligibility_status === 'active') {
                    await base44.asServiceRole.entities.FoundingMemberBenefit.update(b[0].id, { eligibility_status: 'redeemed' });
                    console.info('[stripeWebhook] Founding Member trial redeemed for benefit:', sub.metadata.benefit_id);
                  }
                } catch (fbErr) {
                  console.error('[stripeWebhook] Founding benefit redeem failed:', fbErr.message);
                }
              }
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
      // ── Mark the charge owner's active entitlements as refunded ──
      // The charge metadata carries the user_id (set at checkout). Refunds
      // revoke that viewer's active reveal entitlements.
      try {
        const chargeUserId = charge.metadata?.user_id;
        if (chargeUserId) {
          const n = await setViewerEntitlementsStatus(base44, chargeUserId, 'refunded', 'refund_or_chargeback');
          if (n) console.info('[stripeWebhook] Entitlements refunded for user:', chargeUserId, 'count:', n);
        }
      } catch (entErr) {
        console.warn('[stripeWebhook] Refund entitlement sync failed:', entErr.message);
      }
    }

  } catch (err) {
    console.error('[stripeWebhook] Handler error:', err.message, err.stack);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});