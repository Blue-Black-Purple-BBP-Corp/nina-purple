import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PRICING_TABLE } from '@/lib/i18n';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { NINA_MEMBERSHIP, THERAPY_ADDON } from '@/lib/plans';
import BBPConversionChart from '@/components/BBPConversionChart';

const TABS = [
  { id: 'membership',  en: 'Membership',        fr: 'Abonnement' },
  { id: 'unlock',      en: 'Profile Unlock',   fr: 'Déverrouillage' },
  { id: 'micro',       en: 'Messaging',         fr: 'Messagerie' },
  { id: 'guarantee',   en: 'Value Guarantee',  fr: 'Garantie de valeur' },
];

// First message is included free with the connection unlock. Every message
// after that is charged the per-message rate for the connection's
// compatibility tier (see the Profile Unlock tab). Gallery Unlock (photo
// reveal) is a flat fee, free if the profile is already fully unlocked.
const MICRO_ROWS = (lang) => [
  {
    action: lang === 'fr' ? 'Premier message' : 'First message',
    cond:   lang === 'fr'
      ? 'Inclus gratuitement avec le déverrouillage de la connexion.'
      : 'Included free with the connection unlock.',
    cost:   lang === 'fr' ? 'Inclus gratuitement' : 'Included free',
  },
  {
    action: lang === 'fr' ? 'Messages suivants' : 'Messages after that',
    cond:   lang === 'fr'
      ? 'Facturés selon le niveau de compatibilité de la connexion (voir l\u2019onglet Déverrouillage de Profil).'
      : 'Charged per the connection\u2019s compatibility tier (see the Profile Unlock tab).',
    cost:   lang === 'fr' ? 'Selon compatibilité' : 'Varies by compatibility',
  },
  {
    action: lang === 'fr' ? 'Déverrouillage de la Galerie' : 'Gallery Unlock',
    cond:   lang === 'fr'
      ? 'Révélation des photos privées. Gratuit si le profil est déjà entièrement déverrouillé.'
      : 'Reveals private photos. Free if the profile is already fully unlocked.',
    cost:   lang === 'fr' ? '10,00 $ (gratuit si déverrouillé)' : '$10.00 (free if unlocked)',
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
                      <div className="text-[#F0E6FF]/40 text-[10px] mt-0.5">${row.msg.toFixed(2)}/msg</div>
                    </div>
                  </div>
                ))}
                <p className="text-[#F0E6FF]/30 text-xs text-center pt-2 px-2">
                  {lang === 'fr' ? 'Coût de déverrouillage selon la compatibilité' : 'Unlock cost by compatibility'}
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
                {membershipType === 'couple' && (
                  <p className="text-center text-[#F0E6FF]/40 text-xs pb-1">
                    {lang === 'fr' ? 'Même prix — chaque membre a son propre compte.' : 'Same price — each member has their own account.'}
                  </p>
                )}

                {/* Membership card */}
                <div className="glass-card-gold rounded-2xl p-5 flex flex-col gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{NINA_MEMBERSHIP.icon}</div>
                    <h3 className="font-serif text-lg font-bold" style={{ color: NINA_MEMBERSHIP.color }}>
                      {lang === 'fr' ? NINA_MEMBERSHIP.label_fr : NINA_MEMBERSHIP.label_en}
                    </h3>
                    <p className="text-[#F0E6FF]/50 text-xs mt-0.5">
                      {lang === 'fr' ? NINA_MEMBERSHIP.desc_fr : NINA_MEMBERSHIP.desc_en}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-serif font-bold text-[#F5A800]">
                      {lang === 'fr' ? NINA_MEMBERSHIP.price_fr : NINA_MEMBERSHIP.price_en}
                    </span>
                  </div>
                  <div className="border-t border-purple-900/30" />
                  <ul className="space-y-2">
                    {(lang === 'fr' ? NINA_MEMBERSHIP.perks_fr : NINA_MEMBERSHIP.perks_en).map((perk, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-xs text-[#F0E6FF]/70 leading-relaxed">
                        <span className="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                          style={{ background: `${NINA_MEMBERSHIP.color}18`, color: NINA_MEMBERSHIP.color }}>✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Therapy Add-On */}
                <div className="glass-card-gold rounded-2xl p-4 flex items-center gap-3">
                  <div className="text-2xl">{THERAPY_ADDON.icon}</div>
                  <div className="flex-1">
                    <div className="text-[#F0E6FF] font-medium text-sm">
                      {lang === 'fr' ? THERAPY_ADDON.label_fr : THERAPY_ADDON.label_en}
                    </div>
                    <div className="text-[#F0E6FF]/40 text-xs mt-0.5">
                      {lang === 'fr' ? THERAPY_ADDON.desc_fr : THERAPY_ADDON.desc_en}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#F5A800] font-bold text-sm">{lang === 'fr' ? THERAPY_ADDON.price_fr : THERAPY_ADDON.price_en}</div>
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