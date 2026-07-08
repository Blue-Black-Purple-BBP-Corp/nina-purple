import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PRICING_TABLE } from '@/lib/i18n';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import BBPConversionChart from '@/components/BBPConversionChart';

const TABS = [
  { id: 'membership',  en: 'Membership',        fr: 'Abonnement' },
  { id: 'unlock',      en: 'Profile Unlock',   fr: 'Déverrouillage' },
  { id: 'micro',       en: 'Messaging',         fr: 'Messagerie' },
  { id: 'guarantee',   en: 'Value Guarantee',  fr: 'Garantie de valeur' },
];

const MEMBERSHIP_ROWS = [
  { key: '7d',   en: '7 days',   fr: '7 jours',   solar: 'Free', lunar: 'N/A',     stellar: 'N/A',     galactic: '$7' },
  { key: '14d',  en: '14 days',  fr: '14 jours',  solar: 'Free', lunar: '$5',      stellar: '$10',     galactic: '$14' },
  { key: '1m',   en: '1 month',  fr: '1 mois',    solar: 'Free', lunar: '$10',     stellar: '$15',     galactic: '$20' },
  { key: '3m',   en: '3 months', fr: '3 mois',    solar: 'Free', lunar: '$27.50',  stellar: '$41.25',  galactic: '$55' },
  { key: '6m',   en: '6 months', fr: '6 mois',    solar: 'Free', lunar: '$55',     stellar: '$82.50',  galactic: '$110' },
  { key: '1y',   en: '1 year',   fr: '1 an',      solar: 'Free', lunar: '$110',    stellar: '$165',    galactic: '$220' },
  { key: 'life', en: 'Lifetime', fr: 'À vie',      solar: 'N/A',  lunar: 'N/A',     stellar: 'N/A',     galactic: '$400' },
];

const MICRO_ROWS = (lang) => [
  {
    action: lang === 'fr' ? 'Message — Haute Compatibilité' : 'Messaging — High Match',
    cond:   lang === 'fr' ? 'Profil déverrouillé, 90%+ compatibilité' : 'Unlocked profile, 90%+ compatibility',
    cost:   '$0.01 / msg',
  },
  {
    action: lang === 'fr' ? 'Message — Faible Compatibilité' : 'Messaging — Low Match',
    cond:   lang === 'fr' ? 'Profil déverrouillé, <20% compatibilité' : 'Unlocked profile, <20% compatibility',
    cost:   '$0.09 / msg',
  },
  {
    action: lang === 'fr' ? 'Message Froid' : 'Cold Message',
    cond:   lang === 'fr' ? 'Correspondance pas encore déverrouillée' : 'Match not yet unlocked',
    cost:   '$1.00 / msg',
  },
  {
    action: lang === 'fr' ? 'Déverrouillage Galerie' : 'Gallery Unlock',
    cond:   lang === 'fr' ? 'Profil non entièrement déverrouillé' : 'Profile not fully unlocked',
    cost:   lang === 'fr' ? '$10.00 (gratuit si déjà déverrouillé)' : '$10.00 (free if already unlocked)',
  },
];

export default function PricingModal({ isOpen, onClose }) {
  const scrollRef = useRef(null);
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [activeTab, setActiveTab] = useState('membership');
  const [membershipType, setMembershipType] = useState('individual');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('unlock');
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="bg-[#1F1026] w-full sm:max-w-2xl h-[92vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-purple-500/30 flex flex-col pointer-events-auto animate-fade-in-up">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-purple-900/50 flex justify-between items-center bg-[#2D1B36] rounded-t-3xl shrink-0">
            <div>
              <h2 className="text-xl font-serif text-[#F0E6FF]">{t('pricing.title')}</h2>
              <p className="text-[#F0E6FF]/50 text-xs mt-0.5">{t('pricing.subtitle')}</p>
            </div>
            <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors p-2 -mr-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Nav */}
          <div className="flex border-b border-purple-900/50 shrink-0 bg-[#1F1026]">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (scrollRef.current) scrollRef.current.scrollTop = 0; }}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#F5A800] border-b-2 border-[#F5A800]'
                    : 'text-[#F0E6FF]/40 hover:text-[#F0E6FF]/70'
                }`}
              >
                {lang === 'fr' ? tab.fr : tab.en}
              </button>
            ))}
          </div>

          {/* Scrollable content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">

            {/* ── PROFILE UNLOCK TAB ── */}
            {activeTab === 'unlock' && (
              <div className="p-4 space-y-2">
                {PRICING_TABLE.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 bg-[#150C1E] border border-purple-900/30"
                  >
                    <div>
                      <div className="text-[#F0E6FF] font-medium text-sm">{row.label_en}</div>
                      <div className="text-[#F0E6FF]/40 text-xs mt-0.5">{lang === 'fr' ? row.tier_fr : row.tier_en}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-[#F5A800] font-bold text-base">${row.unlock}</div>
                      <div className="text-[#F0E6FF]/40 text-xs">${row.msg.toFixed(2)} / msg</div>
                    </div>
                  </div>
                ))}
                <p className="text-[#F0E6FF]/30 text-xs text-center pt-2 px-2">
                  {lang === 'fr' ? 'Coût déverrouillage · Coût par message' : 'Unlock cost · Cost per message'}
                </p>
              </div>
            )}

            {/* ── MEMBERSHIP TAB ── */}
            {activeTab === 'membership' && (
              <div className="p-4 space-y-3">
                {/* Singles / Couples toggle */}
                <div className="flex items-center justify-center gap-2 pb-2">
                  <button onClick={() => setMembershipType('individual')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${membershipType === 'individual' ? 'bg-[#F5A800] text-[#0B0510]' : 'bg-[#150C1E] text-[#F0E6FF]/50 border border-purple-900/30'}`}>
                    {lang === 'fr' ? 'Célibataires' : 'Singles'}
                  </button>
                  <button onClick={() => setMembershipType('couple')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${membershipType === 'couple' ? 'bg-[#7B2FBE] text-white' : 'bg-[#150C1E] text-[#F0E6FF]/50 border border-purple-900/30'}`}>
                    {lang === 'fr' ? 'Couples' : 'Couples'}
                  </button>
                </div>
                {MEMBERSHIP_ROWS.map(row => (
                  <div key={row.key} className="rounded-2xl bg-[#150C1E] border border-purple-900/30 overflow-hidden">
                    <div className="px-4 py-2 bg-[#1F1026] border-b border-purple-900/30">
                      <span className="text-[#F0E6FF]/70 text-xs font-semibold uppercase tracking-wider">
                        {lang === 'fr' ? row.fr : row.en}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-purple-900/30">
                      {[
                        { label: membershipType === 'couple' ? (lang === 'fr' ? 'Solaire C.' : 'Solar C.') : 'Solar', val: row.solar, color: 'text-[#A78BFA]' },
                        { label: membershipType === 'couple' ? (lang === 'fr' ? 'Lunaire C.' : 'Lunar C.') : (lang === 'fr' ? 'Lunaire' : 'Lunar'), val: row.lunar, color: 'text-[#7B2FBE]' },
                        { label: membershipType === 'couple' ? (lang === 'fr' ? 'Stellaire C.' : 'Stellar C.') : (lang === 'fr' ? 'Stellaire' : 'Stellar'), val: row.stellar, color: 'text-[#A855F7]' },
                        { label: membershipType === 'couple' ? (lang === 'fr' ? 'Galactique C.' : 'Galactic C.') : (lang === 'fr' ? 'Galactique' : 'Galactic'), val: row.galactic, color: 'text-[#F5A800]' },
                      ].map(cell => (
                        <div key={cell.label} className="flex flex-col items-center py-3 px-1">
                          <span className="text-[#F0E6FF]/30 text-[10px] uppercase tracking-wide mb-1">{cell.label}</span>
                          <span className={`font-bold text-sm ${cell.color}`}>{cell.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="rounded-xl px-4 py-3 bg-[#150C1E] border border-purple-900/30 text-[#F0E6FF]/40 text-xs">
                  {lang === 'fr'
                    ? '* Plan International : +5$/mois — accès aux profils hors de votre région.'
                    : '* International Plan: +$5/month — access profiles outside your region.'}
                </div>
                {/* Therapy Add-On */}
                <div className="glass-card-gold rounded-2xl p-4 flex items-center gap-3">
                  <div className="text-2xl">🧠</div>
                  <div className="flex-1">
                    <div className="text-[#F0E6FF] font-medium text-sm">
                      {lang === 'fr' ? 'Supplément Thérapie' : 'Therapy Add-On'}
                    </div>
                    <div className="text-[#F0E6FF]/40 text-xs mt-0.5">
                      {lang === 'fr'
                        ? '1× thérapie individuelle ou de couple + 1× thérapie de groupe / semaine'
                        : '1× individual or couple therapy + 1× group therapy / week'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#F5A800] font-bold text-sm">$100{lang === 'fr' ? '/sem' : '/wk'}</div>
                    <div className="text-[#F0E6FF]/30 text-[10px]">{lang === 'fr' ? 'Tous membres' : 'All members'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MICRO-INTERACTIONS TAB ── */}
            {activeTab === 'micro' && (
              <div className="p-4 space-y-2">
                {MICRO_ROWS(lang).map((row, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#150C1E] border border-purple-900/30 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-[#F0E6FF] font-medium text-sm">{row.action}</div>
                        <div className="text-[#F0E6FF]/40 text-xs mt-1 leading-relaxed">{row.cond}</div>
                      </div>
                      <div className="text-[#F5A800] font-bold text-sm shrink-0 mt-0.5">{row.cost}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── VALUE GUARANTEE TAB ── */}
            {activeTab === 'guarantee' && (
              <div className="p-4 space-y-4">
                <div className="rounded-2xl bg-[#150C1E] border border-purple-900/30 p-4">
                  <p className="text-[#F0E6FF]/70 text-sm leading-relaxed">
                    {lang === 'fr'
                      ? "Les correspondances sont offertes selon la disponibilité des candidats. Lorsqu'aucune correspondance ne vous est proposée au cours d'un mois, une part croissante de la valeur de votre abonnement est convertie en points BBP."
                      : "Matches are offered subject to candidate availability. When no match is offered to you in a given month, an increasing share of your membership value is converted into BBP points."}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#150C1E] border border-purple-900/30 p-4">
                  <p className="text-[#F5A800] text-xs font-semibold uppercase tracking-widest mb-3">
                    {lang === 'fr' ? 'Conversion mensuelle en points BBP' : 'Monthly BBP Point Conversion'}
                  </p>
                  <BBPConversionChart />
                  <p className="text-[#F0E6FF]/40 text-xs mt-3 leading-relaxed">
                    {lang === 'fr'
                      ? "Les points BBP peuvent être utilisés pour les interactions sur la plateforme ou pour les Expériences Nina Purple."
                      : "BBP points can be used for platform interactions or toward Nina Purple Experiences."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-purple-900/50 bg-[#0B0510] rounded-b-3xl flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-[0_0_20px_rgba(245,168,0,0.2)]"
            >
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}