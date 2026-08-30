import React, { useState, useEffect } from 'react';
import { Gift, Loader2, Check, AlertCircle } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

export default function RedemptionCatalogCard({ availablePoints, onRedeemed }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      // RedemptionCatalog is admin-only, but we can show a static list
      // based on the seeded benefits. The actual validation happens server-side.
      const items = [
        { benefit_id: 'CONNECTION_CREDIT', benefit_type: 'connection_discount', name: isFr ? 'Crédit de Connexion' : 'Connection Credit', desc: isFr ? '1 BBP couvre 1 $ de frais de connexion.' : '1 BBP offsets $1 of connection cost.', min: 5, max: 10 },
        { benefit_id: 'EVENT_TICKET_DISCOUNT', benefit_type: 'event_ticket_discount', name: isFr ? 'Remise sur Billet' : 'Event Ticket Discount', desc: isFr ? '1 BBP couvre 1 $ du prix du billet.' : '1 BBP offsets $1 of ticket price.', min: 5, max: 10 },
        { benefit_id: 'EXPERIENCE_WAITLIST_PRIORITY', benefit_type: 'experience_waitlist_priority', name: isFr ? 'Priorité Liste d\'Attente' : 'Experience Waitlist Priority', desc: isFr ? '5 BBP pour un avantage de priorité.' : '5 BBP for priority benefit.', min: 5, max: 5 },
        { benefit_id: 'EXPERIENCE_BOOKING_DISCOUNT', benefit_type: 'experience_booking_discount', name: isFr ? 'Remise sur Expérience' : 'Experience Booking Discount', desc: isFr ? '1 BBP couvre 1 $ de réservation.' : '1 BBP offsets $1 of booking.', min: 5, max: 25 },
        { benefit_id: 'SUBSCRIPTION_PERK', benefit_type: 'subscription_perk', name: isFr ? 'Avantage d\'Abonnement' : 'Subscription Perk', desc: isFr ? '5 BBP pour un avantage temporel.' : '5 BBP for a time-bounded perk.', min: 5, max: 5 },
      ];
      setCatalog(items);
    } catch (e) {
      console.warn('Catalog load failed:', e.message);
    }
    setLoading(false);
  };

  const handleRedeem = async (item) => {
    setError('');
    setSuccess('');
    if (availablePoints < item.min) {
      setError(isFr ? `Solde insuffisant. Minimum ${item.min} BBP requis.` : `Insufficient balance. Minimum ${item.min} BBP required.`);
      return;
    }
    setRedeeming(item.benefit_id);
    try {
      const res = await base44.functions.invoke('redeemBBP', {
        benefit_id: item.benefit_id,
        benefit_type: item.benefit_type,
        points_cost: item.min,
      });
      if (res.data?.success) {
        setSuccess(isFr ? `${item.min} BBP échangés avec succès !` : `${item.min} BBP redeemed successfully!`);
        if (onRedeemed) onRedeemed();
      } else {
        setError(res.data?.reason || (isFr ? 'Échec de l\'échange.' : 'Redemption failed.'));
      }
    } catch (e) {
      setError(e.message || (isFr ? 'Erreur lors de l\'échange.' : 'Error during redemption.'));
    }
    setRedeeming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Gift className="w-4 h-4 text-[#F5A800]" />
        <h3 className="font-serif text-base text-[#F0E6FF]">
          {isFr ? 'Catalogue d\'Échange' : 'Redemption Catalog'}
        </h3>
      </div>

      {/* No-stacking disclosure */}
      <div className="glass-card rounded-xl p-3 text-xs text-[#F0E6FF]/50 leading-relaxed">
        {isFr
          ? 'Un seul instrument de remise par transaction. Les BBP ne peuvent pas être combinés avec un code promo. Aucune valeur monétaire, aucun transfert, aucun remboursement.'
          : 'One discount instrument per transaction. BBP cannot be combined with a promo code. No cash value, no transfers, no refunds.'}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
          <Check className="w-3.5 h-3.5 shrink-0" /> {success}
        </div>
      )}

      {catalog.map(item => {
        const canAfford = availablePoints >= item.min;
        return (
          <div key={item.benefit_id} className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[#F0E6FF] text-sm font-medium">{item.name}</p>
                <p className="text-[#F0E6FF]/50 text-xs mt-1">{item.desc}</p>
                <p className="text-[#F0E6FF]/40 text-xs mt-1">
                  {isFr ? `Minimum: ${item.min} BBP · Maximum: ${item.max} BBP` : `Minimum: ${item.min} BBP · Maximum: ${item.max} BBP`}
                </p>
              </div>
              <button
                onClick={() => handleRedeem(item)}
                disabled={!canAfford || redeeming === item.benefit_id}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                  canAfford
                    ? 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400'
                    : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                }`}
              >
                {redeeming === item.benefit_id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : isFr ? 'Échanger' : 'Redeem'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}