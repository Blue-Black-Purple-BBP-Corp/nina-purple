import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowLeft, Award, Clock, TrendingUp, Info, Loader2, Gift, DollarSign } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import RedemptionCatalogCard from '@/components/bbp/RedemptionCatalogCard';

const SOURCE_LABELS = {
  profile_complete: { en: 'Profile Completion', fr: 'Complétion du Profil' },
  orientation_complete: { en: 'Community Orientation', fr: 'Orientation Communautaire' },
  account_confirmation: { en: 'Account Confirmation', fr: 'Confirmation de Compte' },
  meetup_confirmation: { en: 'Mutual "We\'ve met" Confirmation', fr: 'Confirmation "On s\'est rencontrés"' },
  referral_qualified: { en: 'Qualified Referral', fr: 'Parrainage Qualifié' },
  event_attendance: { en: 'Event Attendance', fr: 'Présence à un Événement' },
  experience_attendance: { en: 'Experience Attendance', fr: 'Présence à une Expérience' },
  profile_refresh: { en: 'Profile Refresh', fr: 'Mise à jour du Profil' },
  community_contribution: { en: 'Community Contribution', fr: 'Contribution Communautaire' },
  social_proof: { en: 'Social Proof', fr: 'Preuve Sociale' },
  redemption: { en: 'Redemption', fr: 'Échange' },
  staff_adjustment: { en: 'Staff Adjustment', fr: 'Ajustement Staff' },
};

const STATUS_LABELS = {
  pending: { en: 'Pending', fr: 'En attente' },
  available: { en: 'Available', fr: 'Disponible' },
  redeemed: { en: 'Redeemed', fr: 'Échangé' },
  reversed: { en: 'Reversed', fr: 'Inversé' },
  expired: { en: 'Expired', fr: 'Expiré' },
  held: { en: 'On Hold', fr: 'Suspendu' },
  under_review: { en: 'Under Review', fr: 'En Révision' },
};

export default function BBPWallet() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getEngagementProfile', {});
      if (res.data) setData(res.data);
    } catch (e) {
      console.warn('getEngagementProfile failed:', e.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <p className="text-[#F0E6FF]/50 text-sm">
          {isFr ? 'Impossible de charger le portefeuille.' : 'Unable to load wallet.'}
        </p>
      </div>
    );
  }

  const { wallet, recent_ledger, engagement_profile } = data;
  const available = wallet?.available_points || 0;
  const pending = wallet?.pending_points || 0;
  const lifetimeEarned = wallet?.lifetime_earned || 0;
  const lifetimeRedeemed = wallet?.lifetime_redeemed || 0;
  const lifetimeReversed = wallet?.lifetime_reversed || 0;
  const expired = wallet?.expired_points || 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl text-[#F0E6FF]">
          {isFr ? 'Portefeuille BBP' : 'BBP Wallet'}
        </h1>
      </div>

      {/* Balance card */}
      <div className="glass-card-gold rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#F5A800]" />
          <span className="text-[#F0E6FF]/60 text-sm font-medium">
            {isFr ? 'Solde BBP' : 'BBP Balance'}
          </span>
        </div>
        <div className="text-4xl font-serif font-bold text-[#F5A800]">
          {available}
          <span className="text-lg text-[#F0E6FF]/40 ml-2">BBP</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[rgba(245,168,0,0.05)]">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#F5A800]/60" />
              <span className="text-[#F0E6FF]/50 text-xs">{isFr ? 'En attente' : 'Pending'}</span>
            </div>
            <p className="text-[#F0E6FF] font-bold text-lg">{pending}</p>
          </div>
          <div className="p-3 rounded-xl bg-[rgba(123,47,190,0.05)]">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#7B2FBE]/60" />
              <span className="text-[#F0E6FF]/50 text-xs">{isFr ? 'Total gagné' : 'Lifetime Earned'}</span>
            </div>
            <p className="text-[#F0E6FF] font-bold text-lg">{lifetimeEarned}</p>
          </div>
        </div>
      </div>

      {/* Exact legal summary — required text */}
      <div className="glass-card-gold rounded-2xl p-4 flex items-start gap-3">
        <DollarSign className="w-4 h-4 text-[#F5A800] shrink-0 mt-0.5" />
        <p className="text-[#F0E6FF]/70 text-xs leading-relaxed font-medium">
          {isFr
            ? '1 BBP Point = USD $1.00 toward eligible Nina Purple benefits. BBP Points are not cash, cannot be transferred, and are subject to BBP Points Rules.'
            : '1 BBP Point = USD $1.00 toward eligible Nina Purple benefits. BBP Points are not cash, cannot be transferred, and are subject to BBP Points Rules.'}
        </p>
      </div>

      {/* Face value USD + expiry info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-[#F5A800]/60" />
            <span className="text-[#F0E6FF]/50 text-xs">{isFr ? 'Valeur disponible (USD)' : 'Available Value (USD)'}</span>
          </div>
          <p className="text-[#F5A800] font-bold text-lg">${available}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-[#7B2FBE]/60" />
            <span className="text-[#F0E6FF]/50 text-xs">{isFr ? 'Expiré (à vie)' : 'Expired (lifetime)'}</span>
          </div>
          <p className="text-[#F0E6FF] font-bold text-lg">{expired}</p>
        </div>
      </div>

      {/* Expiry notice */}
      <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#F0E6FF]/40 shrink-0 mt-0.5" />
        <p className="text-[#F0E6FF]/50 text-xs leading-relaxed">
          {isFr
            ? 'Les points disponibles expirent 12 mois après leur date de disponibilité. Les points en attente n\'expirent pas tant qu\'ils sont en attente.'
            : 'Available points expire 12 months after their available date. Pending points do not expire while pending.'}
        </p>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="font-serif text-lg text-[#F0E6FF] mb-3">
          {isFr ? 'Activité récente' : 'Recent Activity'}
        </h2>
        {(!recent_ledger || recent_ledger.length === 0) ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <Gift className="w-8 h-8 text-[#F0E6FF]/20 mx-auto mb-2" />
            <p className="text-[#F0E6FF]/40 text-sm">
              {isFr ? 'Aucune activité pour l\'instant. Complétez votre profil pour gagner des points !' : 'No activity yet. Complete your profile to earn points!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent_ledger.map((entry) => {
              const label = SOURCE_LABELS[entry.source_type] || { en: entry.source_type, fr: entry.source_type };
              const statusLabel = STATUS_LABELS[entry.status] || { en: entry.status, fr: entry.status };
              const isPositive = entry.points_delta > 0;
              return (
                <div key={entry.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F0E6FF] text-sm font-medium truncate">
                      {isFr ? label.fr : label.en}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: entry.status === 'available' ? 'rgba(245,168,0,0.1)' : 'rgba(123,47,190,0.1)',
                          color: entry.status === 'available' ? '#F5A800' : '#7B2FBE',
                        }}
                      >
                        {isFr ? statusLabel.fr : statusLabel.en}
                      </span>
                      <span className="text-[#F0E6FF]/30 text-[10px]">
                        {new Date(entry.created_date).toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className={`font-bold text-sm ${isPositive ? 'text-[#F5A800]' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{entry.points_delta}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redemption Catalog */}
      <div>
        <RedemptionCatalogCard availablePoints={available} onRedeemed={loadWallet} />
      </div>

      {/* BBP Points Rules */}
      <div className="glass-card-orchid rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#7B2FBE]" />
          <h3 className="font-serif text-base text-[#F0E6FF]">
            {isFr ? 'Règles des points BBP' : 'BBP Points Rules'}
          </h3>
        </div>
        <div className="space-y-2 text-xs text-[#F0E6FF]/60 leading-relaxed">
          <p>• {isFr ? 'Compléter le profil de compatibilité: points uniques' : 'Complete compatibility profile: one-time points'}</p>
          <p>• {isFr ? 'Terminer l\'orientation communautaire: points uniques par version' : 'Complete Community Orientation: one-time per version'}</p>
          <p>• {isFr ? 'Assister à un événement: points en attente puis disponibles' : 'Attend an event: pending then available points'}</p>
          <p>• {isFr ? 'Confirmation "On s\'est rencontrés" mutuelle: points en attente 72h' : 'Mutual "We\'ve met" confirmation: 72h pending points'}</p>
          <p>• {isFr ? 'Parrainage qualifié: points partagés après qualification' : 'Qualified referral: split points after qualification'}</p>
        </div>
        <p className="text-[#F0E6FF]/30 text-xs pt-2 border-t border-[rgba(240,230,255,0.05)]">
          {isFr
            ? "Les points sont émis côté serveur uniquement. Aucun transfert, aucune valeur monétaire, aucun échange contre de l'argent."
            : 'Points are issued server-side only. No transfers, no cash value, no cash redemption.'}
        </p>
      </div>
    </div>
  );
}