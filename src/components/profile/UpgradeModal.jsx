import React, { useState } from 'react';
import { X } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';

const ALL_PLANS = [
  {
    key: 'solar', color: '#A78BFA', icon: '☀️',
    label_en: 'Solar', label_fr: 'Solaire',
    desc_en: 'Free forever',
    desc_fr: 'Gratuit pour toujours',
    perks_en: ['Browse compatible profiles', 'Answer 21 matching questions', 'Join community rooms', '5 free messages/month'],
    perks_fr: ['Parcourir les profils compatibles', 'Répondre aux 21 questions', 'Rejoindre les salons communautaires', '5 messages gratuits/mois'],
    durations: [],
  },
  {
    key: 'lunar', color: '#7B2FBE', icon: '🌙',
    label_en: 'Lunar', label_fr: 'Lunaire',
    desc_en: 'Deepen your search',
    desc_fr: 'Approfondissez votre recherche',
    perks_en: ['Everything in Solar', 'Unlock up to 10 profiles/month', '30 messages/month', 'See who viewed your profile'],
    perks_fr: ['Tout ce qui est dans Solaire', "Débloquer jusqu'à 10 profils/mois", '30 messages/mois', 'Voir qui a consulté votre profil'],
    durations: [
      { key: 'lunar_14d', label_en: '14 days', label_fr: '14 jours', price: '$5' },
      { key: 'lunar_1m',  label_en: '1 month',  label_fr: '1 mois',  price: '$10' },
      { key: 'lunar_3m',  label_en: '3 months', label_fr: '3 mois',  price: '$27.50' },
      { key: 'lunar_6m',  label_en: '6 months', label_fr: '6 mois',  price: '$55' },
      { key: 'lunar_1y',  label_en: '1 year',   label_fr: '1 an',    price: '$110' },
    ],
  },
  {
    key: 'stellar', color: '#A855F7', icon: '⭐',
    label_en: 'Stellar', label_fr: 'Stellaire',
    desc_en: 'Expand your horizons',
    desc_fr: 'Élargissez vos horizons',
    perks_en: ['Everything in Lunar', 'Unlock up to 25 profiles/month', '100 messages/month', 'Nina AI conversation suggestions', 'Priority in search results'],
    perks_fr: ['Tout ce qui est dans Lunaire', "Débloquer jusqu'à 25 profils/mois", '100 messages/mois', 'Suggestions IA de Nina', 'Priorité dans les résultats'],
    durations: [
      { key: 'stellar_14d', label_en: '14 days', label_fr: '14 jours', price: '$10' },
      { key: 'stellar_1m',  label_en: '1 month',  label_fr: '1 mois',  price: '$15' },
      { key: 'stellar_3m',  label_en: '3 months', label_fr: '3 mois',  price: '$41.25' },
      { key: 'stellar_6m',  label_en: '6 months', label_fr: '6 mois',  price: '$82.50' },
      { key: 'stellar_1y',  label_en: '1 year',   label_fr: '1 an',    price: '$165' },
    ],
  },
  {
    key: 'galactic', color: '#F5A800', icon: '🌌',
    label_en: 'Galactic', label_fr: 'Galactique',
    desc_en: 'Unlimited consciousness',
    desc_fr: 'Conscience illimitée',
    perks_en: ['Everything in Stellar', 'Unlimited profile unlocks', 'Unlimited messages', 'Gallery unlock included', 'BBP rewards on every interaction', 'Lifetime option available'],
    perks_fr: ['Tout ce qui est dans Stellaire', 'Déblocages de profil illimités', 'Messages illimités', 'Déverrouillage de galerie inclus', 'Récompenses BBP sur chaque interaction', 'Option à vie disponible'],
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

const PLANS = ALL_PLANS.filter(p => p.key !== 'solar');

export default function UpgradeModal({ isOpen, onClose, lang, currentTier }) {
  const [selectedPlan, setSelectedPlan] = useState('galactic');
  const [selectedDuration, setSelectedDuration] = useState('galactic_1m');

  if (!isOpen) return null;

  const activePlan = ALL_PLANS.find(p => p.key === selectedPlan);

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Choisir un Abonnement' : 'Choose a Plan'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          {/* Plan selector — all 4 tiers */}
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_PLANS.map(plan => {
              const isSel = selectedPlan === plan.key;
              return (
                <button key={plan.key}
                  onClick={() => { setSelectedPlan(plan.key); if (plan.durations.length) setSelectedDuration(plan.durations[0].key); }}
                  className="py-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5"
                  style={{
                    background: isSel ? plan.color : 'rgba(240,230,255,0.05)',
                    color: isSel ? '#0B0510' : plan.color,
                    border: `1.5px solid ${isSel ? plan.color : 'rgba(240,230,255,0.08)'}`,
                  }}>
                  <span>{plan.icon}</span>
                  <span>{lang === 'fr' ? plan.label_fr : plan.label_en}</span>
                </button>
              );
            })}
          </div>

          {/* Plan description + perks */}
          {activePlan && (
            <div className="rounded-2xl px-4 py-4 space-y-3"
              style={{ background: `${activePlan.color}0d`, border: `1px solid ${activePlan.color}25` }}>
              <div>
                <p className="font-serif text-base font-semibold" style={{ color: activePlan.color }}>
                  {activePlan.icon} {lang === 'fr' ? activePlan.label_fr : activePlan.label_en}
                </p>
                <p className="text-[#F0E6FF]/50 text-xs mt-0.5">
                  {lang === 'fr' ? activePlan.desc_fr : activePlan.desc_en}
                </p>
              </div>
              <ul className="space-y-1.5">
                {(lang === 'fr' ? activePlan.perks_fr : activePlan.perks_en).map((perk, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#F0E6FF]/70">
                    <span style={{ color: activePlan.color }} className="mt-0.5">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duration selector — only for paid plans */}
          {activePlan && activePlan.durations.length > 0 && (
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

          {activePlan?.key === 'solar' ? (
            <button onClick={onClose}
              className="w-full py-4 rounded-full font-bold text-sm text-[#0B0510] hover:opacity-90 transition-all"
              style={{ background: '#A78BFA' }}>
              {lang === 'fr' ? 'Continuer avec Solaire (Gratuit)' : 'Continue with Solar (Free)'}
            </button>
          ) : (
            <CheckoutButton
              priceKey={selectedDuration}
              className="w-full py-4 rounded-full font-bold text-sm text-[#0B0510] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(245,168,0,0.2)]"
              style={{ background: activePlan?.color || '#F5A800' }}>
              {lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to Payment'}
            </CheckoutButton>
          )}
        </div>
      </div>
    </>
  );
}