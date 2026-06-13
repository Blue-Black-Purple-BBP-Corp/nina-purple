import React, { useState, useEffect } from 'react';
import { X, Wallet, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

const WALLET_PACKS = [
  { key: 'wallet_5',   amount: '$5',   desc_en: 'Good for a few unlocks',          desc_fr: 'Idéal pour quelques déverrouillages' },
  { key: 'wallet_10',  amount: '$10',  desc_en: 'Explore more connections',         desc_fr: 'Explorez davantage de connexions' },
  { key: 'wallet_25',  amount: '$25',  desc_en: 'Most popular',                     desc_fr: 'Le plus populaire', popular: true },
  { key: 'wallet_50',  amount: '$50',  desc_en: 'Best value for active daters',     desc_fr: 'Idéal pour les célibataires actifs' },
  { key: 'wallet_100', amount: '$100', desc_en: 'Maximum access & messaging power', desc_fr: 'Accès et messagerie illimités' },
];

export default function CreditsModal({ isOpen, onClose }) {
  const { lang } = useLang();
  const [loading, setLoading] = useState(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      base44.auth.me().then(u => u && setUserId(u.id)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFund = async (key) => {
    if (window.self !== window.top) {
      alert(lang === 'fr'
        ? 'Le paiement fonctionne uniquement depuis l\'application publiée.'
        : 'Payment only works from the published app, not the preview.');
      return;
    }
    setLoading(key);
    try {
      const origin = window.location.origin;
      const res = await base44.functions.invoke('createCheckout', {
        price_key: key,
        success_url: `${origin}/home?wallet=funded`,
        cancel_url: `${origin}/home`,
        user_id: userId,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        alert(lang === 'fr' ? 'Impossible de démarrer le paiement.' : 'Could not start checkout.');
      }
    } catch (err) {
      console.error('Wallet fund error:', err);
      alert(lang === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 pointer-events-auto animate-fade-in-up">

          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F5A800]" />
              <h2 className="text-xl font-serif text-[#F0E6FF]">
                {lang === 'fr' ? 'Recharger mon Portefeuille' : 'Fund My Wallet'}
              </h2>
            </div>
            <button onClick={onClose} className="text-purple-300 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[#F0E6FF]/50 text-xs mb-5">
            {lang === 'fr'
              ? 'Les fonds USD sont utilisés pour déverrouiller des profils et envoyer des messages.'
              : 'USD funds are used to unlock profiles and send messages.'}
          </p>

          <div className="space-y-3">
            {WALLET_PACKS.map(pack => (
              <div
                key={pack.key}
                className={`rounded-2xl p-4 border flex items-center justify-between ${
                  pack.popular
                    ? 'bg-[rgba(245,168,0,0.08)] border-[rgba(245,168,0,0.3)]'
                    : 'bg-[#150C1E] border-purple-900/30'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#F0E6FF] font-bold text-lg">{pack.amount}</span>
                    {pack.popular && (
                      <span className="text-[8px] uppercase tracking-widest bg-[#F5A800] text-[#0B0510] px-2 py-0.5 rounded-full font-bold">
                        {lang === 'fr' ? 'Populaire' : 'Popular'}
                      </span>
                    )}
                  </div>
                  <div className="text-[#F0E6FF]/40 text-xs mt-0.5">
                    {lang === 'fr' ? pack.desc_fr : pack.desc_en}
                  </div>
                </div>
                <button
                  onClick={() => handleFund(pack.key)}
                  disabled={!!loading}
                  className="px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(245,168,0,0.2)] disabled:opacity-50 flex items-center gap-1"
                >
                  {loading === pack.key && <Loader2 className="w-3 h-3 animate-spin" />}
                  {lang === 'fr' ? 'Ajouter' : 'Add'}
                </button>
              </div>
            ))}
          </div>

          <p className="text-[#F0E6FF]/25 text-xs text-center mt-4">
            {lang === 'fr' ? 'Paiement sécurisé via Stripe · USD' : 'Secure payment via Stripe · USD'}
          </p>
        </div>
      </div>
    </>
  );
}