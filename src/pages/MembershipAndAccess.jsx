import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Check, Lock, Unlock, MessageCircle, Camera, Users, Calendar, Star, ArrowRight, CreditCard, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Private "Membership & access" page. Driven entirely by
// getMemberAccessEntitlement — no hard-coded status text. Shows current
// membership/trial status, plan, trial dates, renewal/cancellation, a feature
// matrix (Feature | Current access | Requirement | Next action), wallet
// balance + recharge, founding benefit status, and the exact next action.
export default function MembershipAndAccess() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [entitlement, setEntitlement] = useState(null);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [entRes, offerRes] = await Promise.all([
          base44.functions.invoke('getMemberAccessEntitlement', {}),
          base44.functions.invoke('getMembershipOfferForMember', {}),
        ]);
        if (entRes.data?.data) setEntitlement(entRes.data.data);
        else if (entRes.data) setEntitlement(entRes.data);
        if (offerRes.data) setOffer(offerRes.data);
      } catch (e) {
        console.warn('Membership access load failed:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startReactivationCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      if (window.self !== window.top) {
        alert(isFr ? 'Le paiement fonctionne uniquement depuis l\'application publiée.' : 'Payment only works from the published app.');
        setCheckoutLoading(false);
        return;
      }
      const origin = window.location.origin;
      const res = await base44.functions.invoke('createCheckout', {
        price_key: 'nina_membership_1m',
        success_url: `${origin}/home?payment=success`,
        cancel_url: `${origin}/membership?payment=cancelled`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      setCheckoutError(e.message || (isFr ? 'Échec du paiement.' : 'Checkout failed.'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (!entitlement) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <p className="text-foreground/50 text-sm">{isFr ? 'Impossible de charger l’accès.' : 'Unable to load access.'}</p>
      </div>
    );
  }

  const status = entitlement.membership_status;
  const statusLabel = (() => {
    const map = {
      onboarding_incomplete: isFr ? 'Inscription incomplète' : 'Onboarding incomplete',
      payment_required: isFr ? 'Aucune adhésion' : 'No membership',
      trial_active: isFr ? 'Essai actif' : 'Trial active',
      membership_active: isFr ? 'Adhésion active' : 'Membership active',
      grace_period: isFr ? 'Période de grâce' : 'Grace period',
      payment_past_due: isFr ? 'Paiement en retard' : 'Payment past due',
      cancelled_active_until_period_end: isFr ? 'Annulée — active jusqu’à la fin' : 'Cancelled — active until period end',
      cancelled_expired: isFr ? 'Annulée / expirée' : 'Cancelled / expired',
      suspended: isFr ? 'Suspendu' : 'Suspended',
      restricted: isFr ? 'Restreint' : 'Restricted',
      admin_member_mode: isFr ? 'Mode Membre (personnel)' : 'Member Mode (staff)',
    };
    return map[status] || status;
  })();

  const statusColor = (() => {
    if (['trial_active', 'membership_active', 'grace_period', 'cancelled_active_until_period_end'].includes(status)) return '#F5A800';
    if (['payment_past_due'].includes(status)) return '#F59E0B';
    return '#9CA3AF';
  })();

  const endsAt = entitlement.membership_ends_at
    ? new Date(entitlement.membership_ends_at).toLocaleDateString(isFr ? 'fr-CA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const featureIcon = (feature) => ({
    browse_compatible_profiles: Users,
    unlock_connection: Unlock,
    send_initial_message: MessageCircle,
    reveal_photos: Camera,
    community: Star,
    events: Calendar,
    view_profile: Users,
    edit_profile: Users,
    manage_billing: CreditCard,
    recharge_credits: CreditCard,
    support: MessageCircle,
  }[feature] || Lock);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="text-foreground/40 hover:text-foreground transition-colors">
          <ArrowRight className="w-5 h-5 rotate-180" />
        </Link>
        <h1 className="font-serif text-2xl text-foreground">{isFr ? 'Adhésion et accès' : 'Membership & access'}</h1>
      </div>

      {/* Status card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card-gold rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#F5A800]" />
          <span className="text-foreground/60 text-sm font-medium">{isFr ? 'Statut de l’adhésion' : 'Membership status'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
            {statusLabel}
          </span>
          <span className="text-foreground/50 text-sm">{entitlement.plan_name}</span>
        </div>
        {endsAt && (
          <p className="text-foreground/50 text-xs">
            {['trial_active', 'cancelled_active_until_period_end'].includes(status)
              ? (isFr ? `Fin de l’accès le ${endsAt}` : `Access ends on ${endsAt}`)
              : (isFr ? `Renouvellement le ${endsAt}` : `Renews on ${endsAt}`)}
          </p>
        )}
        {entitlement.founding_member_benefit_status === 'active' && entitlement.founding_member_trial_ends_at && (
          <div className="flex items-center gap-1.5 text-[#F5A800] text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            {isFr ? `Essai Membre Fondateur jusqu’au ${new Date(entitlement.founding_member_trial_ends_at).toLocaleDateString(isFr ? 'fr-CA' : 'en-US')}` : `Founding Member trial until ${new Date(entitlement.founding_member_trial_ends_at).toLocaleDateString(isFr ? 'fr-CA' : 'en-US')}`}
          </div>
        )}
      </motion.div>

      {/* Reactivation / Payment update / Cancelled message */}
      {new URLSearchParams(window.location.search).get('payment') === 'cancelled' && (
        <div className="px-4 py-3 rounded-xl bg-[rgba(245,168,0,0.08)] border border-[rgba(245,168,0,0.25)] text-[#F5A800] text-sm text-center">
          {isFr ? 'Le paiement n\'a pas été complété. Votre profil a été sauvegardé.' : 'Payment was not completed. Your profile has been saved.'}
        </div>
      )}
      {offer?.offer_type === 'membership_reactivation' && (
        <div className="glass-card-gold rounded-2xl p-5 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="font-serif text-xl text-foreground">{isFr ? 'Réactiver l\'adhésion Nina Purple' : 'Reactivate Nina Purple Membership'}</h2>
            <div className="text-3xl font-serif font-bold text-[#F5A800]">$20<span className="text-base font-body font-normal text-foreground/50">/{isFr ? 'mois' : 'month'}</span></div>
            <p className="text-foreground/50 text-xs">{isFr ? 'Restaurez votre accès membre complet' : 'Restore full member access'}</p>
          </div>
          {checkoutError && <p className="text-red-400 text-xs text-center">{checkoutError}</p>}
          <button onClick={startReactivationCheckout} disabled={checkoutLoading}
            className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Traitement…' : 'Processing…'}</> : <><RefreshCw className="w-4 h-4" /> {isFr ? 'Continuer le paiement' : 'Continue to payment'}</>}
          </button>
        </div>
      )}
      {offer?.offer_type === 'payment_update_required' && (
        <div className="glass-card-gold rounded-2xl p-5 space-y-4">
          <div className="text-center space-y-1">
            <h2 className="font-serif text-xl text-foreground">{isFr ? 'Votre paiement nécessite votre attention' : 'Your membership payment needs attention'}</h2>
            <p className="text-foreground/50 text-sm leading-relaxed">
              {isFr ? 'Mettez à jour votre méthode de paiement pour restaurer votre accès membre complet.' : 'Update your payment method to restore full member access.'}
            </p>
          </div>
          {checkoutError && <p className="text-red-400 text-xs text-center">{checkoutError}</p>}
          <button onClick={startReactivationCheckout} disabled={checkoutLoading}
            className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Traitement…' : 'Processing…'}</> : <><CreditCard className="w-4 h-4" /> {isFr ? 'Mettre à jour' : 'Update payment'}</>}
          </button>
        </div>
      )}
      {offer?.offer_type === 'awaiting_payment_confirmation' && (
        <div className="glass-card-gold rounded-2xl p-5 space-y-3 text-center">
          <Loader2 className="w-6 h-6 text-[#F5A800] animate-spin mx-auto" />
          <h2 className="font-serif text-lg text-foreground">{isFr ? 'Confirmation en cours' : 'Confirming membership'}</h2>
          <p className="text-foreground/50 text-sm">{isFr ? 'Cela peut prendre un moment.' : 'This can take a moment.'}</p>
          <div className="space-y-2">
            <button onClick={startReactivationCheckout} disabled={checkoutLoading}
              className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Traitement…' : 'Processing…'}</> : (isFr ? 'Réessayer le paiement' : 'Retry checkout')}
            </button>
            <button onClick={() => window.location.reload()} className="text-[#F5A800] text-xs font-semibold hover:underline">
              {isFr ? 'Vérifier le statut' : 'Check status'}
            </button>
          </div>
          {checkoutError && <p className="text-red-400 text-xs text-center">{checkoutError}</p>}
        </div>
      )}

      {/* Wallet snapshot */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-foreground/50 text-xs">{isFr ? 'Crédits BBP' : 'BBP Credits'}</p>
          <p className="text-[#F5A800] font-serif text-2xl font-bold">{(entitlement.wallet_available_balance ?? entitlement.wallet_credit_balance ?? 0).toFixed(2)} BBP</p>
        </div>
        <Link to="/wallet" className="px-4 py-2 glass-card-gold rounded-full text-[#F5A800] text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" /> {isFr ? 'Recharger' : 'Recharge'}
        </Link>
      </div>

      {/* Feature matrix */}
      <div className="space-y-3">
        <h2 className="font-serif text-lg text-foreground">{isFr ? 'Accès aux fonctions' : 'Feature access'}</h2>
        {entitlement.allowed_features?.map((f, i) => {
          const Icon = featureIcon(f.feature) || Check;
          return (
            <div key={i} className="glass-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(245,168,0,0.1)] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#F5A800]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium">{f.feature.replace(/_/g, ' ')}</p>
                <p className="text-foreground/40 text-xs">{isFr ? 'Accès accordé' : 'Access granted'} · {f.requirement}</p>
              </div>
              <Check className="w-4 h-4 text-[#F5A800] shrink-0" />
            </div>
          );
        })}
        {entitlement.locked_features?.map((f, i) => {
          const Icon = featureIcon(f.feature) || Lock;
          return (
            <div key={i} className="glass-card rounded-xl p-3 flex items-center gap-3 opacity-70">
              <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-foreground/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground/70 text-sm font-medium">{f.feature.replace(/_/g, ' ')}</p>
                <p className="text-foreground/40 text-xs">{isFr ? 'Verrouillé' : 'Locked'} · {f.requirement}</p>
              </div>
              <Lock className="w-4 h-4 text-foreground/40 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Next action */}
      {entitlement.next_action && entitlement.next_action !== 'none' && (
        <div className="glass-card-orchid rounded-2xl p-4 flex items-center justify-between">
          <p className="text-foreground/70 text-sm">
            {isFr ? 'Prochaine étape' : 'Next step'}: <span className="text-foreground font-medium">{entitlement.next_action.replace(/_/g, ' ')}</span>
          </p>
          <Link to="/wallet" className="text-[#F5A800] text-xs font-semibold hover:opacity-80 flex items-center gap-1">
            {isFr ? 'Gérer' : 'Manage'} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}