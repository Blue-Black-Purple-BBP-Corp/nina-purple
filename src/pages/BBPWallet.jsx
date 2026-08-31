import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowLeft, Award, Clock, TrendingUp, Info, Loader2, Gift, DollarSign, Crown, Camera, Coins, ArrowRight, Check } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import RedemptionCatalogCard from '@/components/bbp/RedemptionCatalogCard';
import CreditsModal from '@/components/CreditsModal';

const LEDGER_LABELS = {
  credit_purchase: { en: 'Wallet top-up', fr: 'Recharge du portefeuille' },
  debit_unlock: { en: 'Connection unlock', fr: 'Déverrouillage de connexion' },
  debit_outreach: { en: 'Initial message', fr: 'Message initial' },
  debit_reveal: { en: 'Photo reveal', fr: 'Révélation de photo' },
  reversal: { en: 'Reversal / refund', fr: 'Inversion / remboursement' },
  staff_adjustment: { en: 'Team adjustment', fr: 'Ajustement équipe' },
  expiry: { en: 'Credit expired', fr: 'Crédit expiré' },
};

// Unified private Wallet & Credits page. Clearly separates the four member
// balances that have different meanings (decision 5):
//   A. Membership — status, renewal/end, manage
//   B. Interaction Credits — prepaid USD wallet, recharge, transaction history
//   C. Photo Reveal Access — entitlement-based, not a cash wallet
//   D. BBP Points — member-benefit points (only if active)
// Never mixes them into one ambiguous balance.
export default function BBPWallet() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [entitlement, setEntitlement] = useState(null);
  const [bbp, setBbp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => { loadWallet(); }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const [entRes, bbpRes] = await Promise.all([
        base44.functions.invoke('getMemberAccessEntitlement', {}),
        base44.functions.invoke('getEngagementProfile', {}),
      ]);
      setEntitlement(entRes.data?.data || entRes.data || null);
      if (bbpRes.data) setBbp(bbpRes.data);
    } catch (e) {
      console.warn('Wallet load failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  const credits = entitlement?.wallet_credit_balance ?? 0;
  const recentLedger = entitlement?.recent_ledger || [];
  const bbpAvailable = bbp?.wallet?.available_points || 0;
  const bbpPending = bbp?.wallet?.pending_points || 0;
  const membershipStatus = entitlement?.membership_status || 'payment_required';
  const membershipEndsAt = entitlement?.membership_ends_at;

  const statusLabel = (() => {
    const map = {
      trial_active: isFr ? 'Essai actif' : 'Trial active',
      membership_active: isFr ? 'Adhésion active' : 'Membership active',
      grace_period: isFr ? 'Période de grâce' : 'Grace period',
      payment_past_due: isFr ? 'Paiement en retard' : 'Payment past due',
      cancelled_active_until_period_end: isFr ? 'Active jusqu’à la fin' : 'Active until period end',
      cancelled_expired: isFr ? 'Expirée' : 'Expired',
      payment_required: isFr ? 'Aucune adhésion' : 'No membership',
      suspended: isFr ? 'Suspendu' : 'Suspended',
      restricted: isFr ? 'Restreint' : 'Restricted',
      admin_member_mode: isFr ? 'Mode Membre' : 'Member Mode',
    };
    return map[membershipStatus] || membershipStatus;
  })();

  const statusColor = ['trial_active', 'membership_active', 'grace_period', 'cancelled_active_until_period_end'].includes(membershipStatus) ? '#F5A800' : '#9CA3AF';

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="text-foreground/40 hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl text-foreground">{isFr ? 'Portefeuille et crédits' : 'Wallet & credits'}</h1>
      </div>

      {/* A. Membership */}
      <section className="glass-card-gold rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-[#F5A800]" />
          <h2 className="font-serif text-base text-foreground">{isFr ? 'Adhésion' : 'Membership'}</h2>
        </div>
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
            {statusLabel}
          </span>
          <span className="text-foreground/50 text-xs">{entitlement?.plan_name}</span>
        </div>
        {membershipEndsAt && (
          <p className="text-foreground/50 text-xs">
            {['trial_active', 'cancelled_active_until_period_end'].includes(membershipStatus)
              ? (isFr ? `Fin de l’accès le ${new Date(membershipEndsAt).toLocaleDateString(isFr ? 'fr-CA' : 'en-US')}` : `Access ends ${new Date(membershipEndsAt).toLocaleDateString(isFr ? 'fr-CA' : 'en-US')}`)
              : (isFr ? `Renouvellement le ${new Date(membershipEndsAt).toLocaleDateString(isFr ? 'fr-CA' : 'en-US')}` : `Renews ${new Date(membershipEndsAt).toLocaleDateString(isFr ? 'fr-CA' : 'en-US')}`)}
          </p>
        )}
        <Link to="/membership" className="text-[#F5A800] text-xs font-semibold hover:opacity-80 flex items-center gap-1">
          {isFr ? 'Gérer l’adhésion' : 'Manage membership'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* B. Interaction Credits */}
      <section className="glass-card rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#F5A800]" />
          <h2 className="font-serif text-base text-foreground">{isFr ? 'Crédits d’Interaction' : 'Interaction Credits'}</h2>
        </div>
        <div className="text-4xl font-serif font-bold text-[#F5A800]">
          ${credits.toFixed(2)}
          <span className="text-base text-foreground/40 font-body font-normal ml-1">USD</span>
        </div>
        <p className="text-foreground/50 text-xs leading-relaxed">
          {isFr
            ? 'Crédits prépayés utilisés pour déverrouiller des connexions et envoyer un message initial. Les réponses dans une conversation existante sont gratuites.'
            : 'Prepaid credits used to unlock connections and send an initial message. Replies in an existing conversation are free.'}
        </p>
        <button onClick={() => setCreditsOpen(true)}
          className="w-full py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
          <DollarSign className="w-4 h-4" />
          {isFr ? 'Recharger des crédits' : 'Recharge credits'}
        </button>
      </section>

      {/* C. Photo Reveal Access */}
      <section className="glass-card rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#7B2FBE]" />
          <h3 className="font-serif text-sm text-foreground">{isFr ? 'Accès aux photos' : 'Photo Reveal Access'}</h3>
        </div>
        <p className="text-foreground/50 text-xs leading-relaxed">
          {isFr
            ? 'L’accès aux photos d’un autre membre est accordé par déverrouillage de connexion avec vos crédits. Ce n’est pas un solde en espèces.'
            : 'Access to another member’s photos is granted by connection unlock with your credits. This is not a cash balance.'}
        </p>
      </section>

      {/* D. BBP Points */}
      <section className="glass-card-gold rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#F5A800]" />
          <h2 className="font-serif text-base text-foreground">{isFr ? 'Points BBP' : 'BBP Points'}</h2>
        </div>
        <div className="text-3xl font-serif font-bold text-[#F5A800]">
          {bbpAvailable}
          <span className="text-sm text-foreground/40 font-body font-normal ml-1">BBP</span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground/50 text-xs">
          <Clock className="w-3.5 h-3.5" />
          {isFr ? 'En attente' : 'Pending'}: {bbpPending}
        </div>
        <div className="flex items-start gap-2 pt-1">
          <DollarSign className="w-3.5 h-3.5 text-[#F5A800] shrink-0 mt-0.5" />
          <p className="text-foreground/60 text-xs leading-relaxed">
            {isFr
              ? '1 BBP = 1 $ USD pour les avantages éligibles. Les points BBP ne sont pas de l’argent, ne sont pas des crédits d’interaction, et ne peuvent pas être transférés.'
              : '1 BBP = $1.00 USD toward eligible benefits. BBP Points are not cash, are not Interaction Credits, and cannot be transferred.'}
          </p>
        </div>
      </section>

      {/* Recent transactions (Interaction Credits ledger) */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg text-foreground">{isFr ? 'Activité des crédits' : 'Credit activity'}</h2>
        {recentLedger.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <Gift className="w-7 h-7 text-foreground/20 mx-auto mb-2" />
            <p className="text-foreground/40 text-sm">
              {isFr ? 'Aucune activité de crédit pour l’instant.' : 'No credit activity yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLedger.map((entry) => {
              const label = LEDGER_LABELS[entry.entry_type] || { en: entry.entry_type, fr: entry.entry_type };
              const isPositive = (entry.amount_delta || 0) > 0;
              return (
                <div key={entry.ledger_id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">{isFr ? label.fr : label.en}</p>
                    <p className="text-foreground/30 text-[10px]">
                      {new Date(entry.created_date).toLocaleDateString(isFr ? 'fr-CA' : 'en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className={`font-bold text-sm ${isPositive ? 'text-[#F5A800]' : 'text-foreground/70'}`}>
                    {isPositive ? '+' : ''}{(entry.amount_delta || 0).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BBP Redemption Catalog */}
      <RedemptionCatalogCard availablePoints={bbpAvailable} onRedeemed={loadWallet} />

      {/* Support path */}
      <Link to="/contact" className="block text-center text-foreground/40 text-xs hover:text-foreground/60 transition-colors pt-2">
        {isFr ? 'Besoin d’aide avec la facturation ? Contactez le support' : 'Need help with billing? Contact support'}
      </Link>

      <CreditsModal isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </div>
  );
}