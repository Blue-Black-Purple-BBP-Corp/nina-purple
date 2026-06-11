import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { PRICING_TABLE } from '@/lib/i18n';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export default function PricingModal({ isOpen, onClose }) {
  const scrollRef = useRef(null);
  const { lang } = useLang();
  const { t } = useTranslation(lang);

  useEffect(() => {
    if (isOpen && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <div className="bg-[#1F1026] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-purple-500/30 flex flex-col pointer-events-auto animate-fade-in-up">
          
          <div className="p-6 border-b border-purple-900/50 flex justify-between items-center bg-[#2D1B36] rounded-t-3xl">
            <h2 className="text-2xl font-serif text-[#F0E6FF]">{t('pricing.title')}</h2>
            <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors p-2">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10">
            <p className="text-[#F0E6FF]/70 text-base">{t('pricing.subtitle')}</p>

            {/* Profile Unlock Costs */}
            <section>
              <h3 className="text-xl font-serif text-[#F5A800] mb-6">{t('pricing.profile_unlock')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/30">
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">{t('pricing.compatibility')}</th>
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">Tier</th>
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">{t('pricing.unlock_cost')}</th>
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">{t('pricing.msg_cost')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#F0E6FF]/80">
                    {PRICING_TABLE.map((row, idx) => (
                      <tr key={idx} className="border-b border-purple-900/30 hover:bg-purple-500/5 transition-colors">
                        <td className="py-4 px-4 font-medium">{row.label_en}</td>
                        <td className="py-4 px-4 text-sm">{lang === 'fr' ? row.tier_fr : row.tier_en}</td>
                        <td className="py-4 px-4 text-[#F5A800] font-bold">${row.unlock}</td>
                        <td className="py-4 px-4 text-sm">${row.msg.toFixed(2)} / msg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Micro Interactions */}
            <section>
              <h3 className="text-xl font-serif text-[#F5A800] mb-6">
                {lang === 'fr' ? 'Coûts de Micro-Interaction' : 'Micro-Interaction Costs'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/30">
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">
                        {lang === 'fr' ? 'Action' : 'Action'}
                      </th>
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">
                        {lang === 'fr' ? 'Condition' : 'Condition'}
                      </th>
                      <th className="py-4 px-4 text-purple-200 font-semibold text-sm uppercase tracking-wider">
                        {lang === 'fr' ? 'Coût' : 'Cost'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[#F0E6FF]/80">
                    {[
                      {
                        action: lang === 'fr' ? 'Message — Correspondance Élevée' : 'Messaging — High Match',
                        cond: lang === 'fr' ? 'Profil déverrouillé, 90%+ compatibilité' : 'Profile unlocked, 90%+ compatibility',
                        cost: '$0.01 / msg'
                      },
                      {
                        action: lang === 'fr' ? 'Message — Correspondance Faible' : 'Messaging — Low Match',
                        cond: lang === 'fr' ? 'Profil déverrouillé, moins de 20% compatibilité' : 'Profile unlocked, <20% compatibility',
                        cost: '$0.09 / msg'
                      },
                      {
                        action: lang === 'fr' ? 'Message Froid' : 'Cold Message',
                        cond: lang === 'fr' ? 'Correspondance pas encore déverrouillée' : 'Match not yet unlocked',
                        cost: '$1.00 / msg'
                      },
                      {
                        action: lang === 'fr' ? 'Déverrouillage de la Galerie' : 'Gallery Unlock',
                        cond: lang === 'fr' ? 'Profil non entièrement déverrouillé' : 'Profile not fully unlocked',
                        cost: lang === 'fr' ? '$10.00 (gratuit si déjà déverrouillé)' : '$10.00 (free if already unlocked)'
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-purple-900/30 hover:bg-purple-500/5 transition-colors">
                        <td className="py-4 px-4 font-medium">{row.action}</td>
                        <td className="py-4 px-4 text-sm">{row.cond}</td>
                        <td className="py-4 px-4 text-[#F5A800] font-bold">{row.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-purple-900/50 bg-[#0B0510] rounded-b-3xl flex justify-end">
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