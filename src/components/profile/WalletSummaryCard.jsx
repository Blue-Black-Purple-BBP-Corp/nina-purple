import React, { useState, useEffect } from 'react';
import { Crown, Coins, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

const STATUS_LABELS = {
  active: { en: 'Active', fr: 'Actif', color: '#F5A800' },
  trial_active: { en: 'Trial', fr: 'Essai', color: '#A855F7' },
  payment_required: { en: 'Payment required', fr: 'Paiement requis', color: '#EF4444' },
  past_due: { en: 'Payment due', fr: 'Paiement dû', color: '#EF4444' },
  grace_period: { en: 'Grace period', fr: 'Délai de grâce', color: '#F5A800' },
  cancelled_active_until_period_end: { en: 'Ending soon', fr: 'Se termine bientôt', color: '#F5A800' },
  cancelled_expired: { en: 'Expired', fr: 'Expiré', color: '#9CA3AF' },
  lapsed: { en: 'Lapsed', fr: 'Lapsé', color: '#9CA3AF' },
  billing_exempt: { en: 'Active', fr: 'Actif', color: '#F5A800' },
  admin_member_mode: { en: 'Payment required', fr: 'Paiement requis', color: '#EF4444' },
  none: { en: 'No membership', fr: 'Aucune adhésion', color: '#9CA3AF' },
};

export default function WalletSummaryCard({ onRecharge }) {
  const { lang } = useLang();
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntitlement();
  }, []);

  const loadEntitlement = async () => {
    try {
      const res = await base44.functions.invoke('getMemberAccessEntitlement', {});
      setEntitlement(res.data?.data || res.data || null);
    } catch (e) { /* non-fatal */ }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center justify-center min-h-[90px]">
        <Loader2 className="w-5 h-5 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  const status = entitlement?.membership_status || 'none';
  const statusMeta = STATUS_LABELS[status] || STATUS_LABELS.none;
  const available = entitlement?.wallet_available_balance ?? entitlement?.wallet_credit_balance ?? 0;
  const reserved = entitlement?.wallet_reserved_balance ?? 0;
  const endsAt = entitlement?.membership_ends_at;
  const isUrgent = ['payment_required', 'past_due', 'lapsed', 'none', 'admin_member_mode'].includes(status);

  const fmtDate = (iso) => {
    if (!iso) return null;
    try { return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return iso; }
  };

  return (
    <section className="glass-card rounded-2xl p-4 space-y-3" aria-label={lang === 'fr' ? 'Portefeuille et crédits' : 'Wallet & Credits'}>
      {/* Membership status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4" style={{ color: statusMeta.color }} />
          <span className="text-[#F0E6FF]/50 text-xs uppercase tracking-wide">{lang === 'fr' ? 'Adhésion' : 'Membership'}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium" style={{ color: statusMeta.color }}>{statusMeta[lang]}</span>
          {endsAt && !isUrgent && (
            <p className="text-[#F0E6FF]/30 text-[10px]">
              {['trial_active', 'cancelled_active_until_period_end'].includes(status)
                ? (lang === 'fr' ? `Jusqu'au ${fmtDate(endsAt)}` : `Until ${fmtDate(endsAt)}`)
                : (lang === 'fr' ? `Renouvellement le ${fmtDate(endsAt)}` : `Renews ${fmtDate(endsAt)}`)}
            </p>
          )}
        </div>
      </div>

      <div className="h-px bg-[rgba(240,230,255,0.06)]" />

      {/* BBP Credits row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#F5A800]" />
          <span className="text-[#F0E6FF]/50 text-xs uppercase tracking-wide">{lang === 'fr' ? 'Crédits BBP' : 'BBP Credits'}</span>
        </div>
        <div className="text-right">
          <span className="text-[#F5A800] font-serif text-lg font-bold">{available.toFixed(2)}</span>
          <span className="text-[#F0E6FF]/40 text-xs ml-1">BBP</span>
          {reserved > 0 && (
            <p className="text-[#F0E6FF]/30 text-[10px]">
              {lang === 'fr' ? `Réservés: ${reserved.toFixed(2)} BBP` : `Reserved: ${reserved.toFixed(2)} BBP`}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link to="/wallet"
          className="flex-1 py-2.5 glass-card rounded-xl text-center text-[#F0E6FF]/70 text-xs font-medium hover:border-[rgba(245,168,0,0.3)] hover:text-[#F5A800] transition-all flex items-center justify-center gap-1.5">
          {lang === 'fr' ? 'Voir le portefeuille' : 'View wallet'}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        <button onClick={onRecharge || (() => {})}
          className="flex-1 py-2.5 rounded-xl text-[#0B0510] text-xs font-bold bg-[#F5A800] hover:bg-yellow-400 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#F5A800]/40">
          <Plus className="w-3.5 h-3.5" />
          {lang === 'fr' ? 'Recharger' : 'Recharge BBP Credits'}
        </button>
      </div>

      {/* Manage membership link */}
      <Link to="/membership"
        className="flex items-center justify-between text-[#F0E6FF]/40 text-xs hover:text-[#F5A800] transition-colors pt-0.5">
        <span>{lang === 'fr' ? 'Gérer l\'adhésion et l\'accès' : 'Manage membership & access'}</span>
        <ChevronRight className="w-3 h-3" />
      </Link>
    </section>
  );
}