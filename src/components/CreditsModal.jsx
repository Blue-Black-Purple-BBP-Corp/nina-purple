import React from 'react';
import { X, Zap } from 'lucide-react';
import CheckoutButton from './CheckoutButton';
import { useLang } from '@/lib/LanguageContext';

const CREDIT_PACKS = [
  { key: 'credits_10', amount: 10,  price: '$10', label_en: '10 Credits',  label_fr: '10 Crédits',  desc_en: 'Great for exploring',     desc_fr: 'Idéal pour explorer' },
  { key: 'credits_25', amount: 25,  price: '$25', label_en: '25 Credits',  label_fr: '25 Crédits',  desc_en: 'Most popular',             desc_fr: 'Le plus populaire',   popular: true },
  { key: 'credits_50', amount: 50,  price: '$50', label_en: '50 Credits',  label_fr: '50 Crédits',  desc_en: 'Best value',               desc_fr: 'Meilleur rapport' },
];

export default function CreditsModal({ isOpen, onClose, userId }) {
  const { lang } = useLang();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 pointer-events-auto animate-fade-in-up">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-serif text-[#F0E6FF] flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#F5A800]" />
                {lang === 'fr' ? 'Acheter des Crédits' : 'Buy Credits'}
              </h2>
              <p className="text-[#F0E6FF]/50 text-xs mt-1">
                {lang === 'fr' ? 'Utilisés pour déverrouiller des profils et envoyer des messages' : 'Used to unlock profiles and send messages'}
              </p>
            </div>
            <button onClick={onClose} className="text-purple-300 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {CREDIT_PACKS.map(pack => (
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
                    <span className="text-[#F0E6FF] font-semibold">
                      {lang === 'fr' ? pack.label_fr : pack.label_en}
                    </span>
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
                <CheckoutButton
                  priceKey={pack.key}
                  userId={userId}
                  className="px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(245,168,0,0.2)]"
                >
                  {pack.price}
                </CheckoutButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}