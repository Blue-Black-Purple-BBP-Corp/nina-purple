import React, { useState } from 'react';
import { X } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';

const PLANS = [
  {
    key: 'lunar', color: '#7B2FBE',
    label_en: 'Lunar', label_fr: 'Lunaire',
    durations: [
      { key: 'lunar_14d', label_en: '14 days', label_fr: '14 jours', price: '$5' },
      { key: 'lunar_1m',  label_en: '1 month',  label_fr: '1 mois',  price: '$10' },
      { key: 'lunar_3m',  label_en: '3 months', label_fr: '3 mois',  price: '$27.50' },
      { key: 'lunar_6m',  label_en: '6 months', label_fr: '6 mois',  price: '$55' },
      { key: 'lunar_1y',  label_en: '1 year',   label_fr: '1 an',    price: '$110' },
    ],
  },
  {
    key: 'stellar', color: '#A855F7',
    label_en: 'Stellar', label_fr: 'Stellaire',
    durations: [
      { key: 'stellar_14d', label_en: '14 days', label_fr: '14 jours', price: '$10' },
      { key: 'stellar_1m',  label_en: '1 month',  label_fr: '1 mois',  price: '$15' },
      { key: 'stellar_3m',  label_en: '3 months', label_fr: '3 mois',  price: '$41.25' },
      { key: 'stellar_6m',  label_en: '6 months', label_fr: '6 mois',  price: '$82.50' },
      { key: 'stellar_1y',  label_en: '1 year',   label_fr: '1 an',    price: '$165' },
    ],
  },
  {
    key: 'galactic', color: '#F5A800',
    label_en: 'Galactic', label_fr: 'Galactique',
    durations: [
      { key: 'galactic_7d',   label_en: '7 days',   label_fr: '7 jours',  price: '$7' },
      { key: 'galactic_14d',  label_en: '14 days',  label_fr: '14 jours', price: '$14' },
      { key: 'galactic_1m',   label_en: '1 month',  label_fr: '1 mois',   price: '$20' },
      { key: 'galactic_3m',   label_en: '3 months', label_fr: '3 mois',   price: '$55' },
      { key: 'galactic_6m',   label_en: '6 months', label_fr: '6 mois',   price: '$110' },
      { key: 'galactic_1y',   label_en: '1 year',   label_fr: '1 an',     price: '$220' },
      { key: 'galactic_life', label_en: 'Lifetime', label_fr: 'À vie',    price: '$400' },
    ],
  },
];

export default function UpgradeModal({ isOpen, onClose, lang, currentTier }) {
  const [selectedPlan, setSelectedPlan] = useState('galactic');
  const [selectedDuration, setSelectedDuration] = useState('galactic_1m');

  if (!isOpen) return null;

  const activePlan = PLANS.find(p => p.key === selectedPlan);

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Choisir un Abonnement' : 'Choose a Plan'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          {/* Plan selector */}
          <div className="flex gap-2">
            {PLANS.map(plan => {
              const isSel = selectedPlan === plan.key;
              return (
                <button key={plan.key}
                  onClick={() => { setSelectedPlan(plan.key); setSelectedDuration(plan.durations[0].key); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isSel ? plan.color : 'rgba(240,230,255,0.05)',
                    color: isSel ? '#0B0510' : plan.color,
                    border: `1.5px solid ${isSel ? plan.color : 'rgba(240,230,255,0.08)'}`,
                  }}>
                  {lang === 'fr' ? plan.label_fr : plan.label_en}
                </button>
              );
            })}
          </div>

          {/* Duration selector */}
          {activePlan && (
            <div className="space-y-2">
              <p className="text-[#F0E6FF]/40 text-xs uppercase tracking-wider">{lang === 'fr' ? 'Durée' : 'Duration'}</p>
              <div className="space-y-2">
                {activePlan.durations.map(dur => {
                  const isSel = selectedDuration === dur.key;
                  return (
                    <button key={dur.key}
                      onClick={() => setSelectedDuration(dur.key)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                      style={{
                        background: isSel ? `${activePlan.color}18` : 'rgba(240,230,255,0.03)',
                        border: `1.5px solid ${isSel ? activePlan.color : 'rgba(240,230,255,0.08)'}`,
                      }}>
                      <span className="text-sm" style={{ color: isSel ? activePlan.color : 'rgba(240,230,255,0.7)' }}>
                        {lang === 'fr' ? dur.label_fr : dur.label_en}
                      </span>
                      <span className="font-bold text-sm" style={{ color: isSel ? activePlan.color : 'rgba(240,230,255,0.5)' }}>
                        {dur.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <CheckoutButton
            priceKey={selectedDuration}
            className="w-full py-4 rounded-full font-bold text-sm text-[#0B0510] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(245,168,0,0.2)]"
            style={{ background: activePlan?.color || '#F5A800' }}>
            {lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to Payment'}
          </CheckoutButton>
        </div>
      </div>
    </>
  );
}