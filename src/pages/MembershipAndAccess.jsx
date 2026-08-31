import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Check, Lock, Unlock, MessageCircle, Camera, Users, Calendar, Star, ArrowRight, CreditCard, Loader2, Sparkles } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getMemberAccessEntitlement', {});
        if (res.data?.data) setEntitlement(res.data.data);
        else if (res.data) setEntitlement(res.data);
      } catch (e) {
        console.warn('getMemberAccessEntitlement failed:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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