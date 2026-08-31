import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import CheckoutButton from '@/components/CheckoutButton';
import { ALL_PLANS, INDIVIDUAL_PLANS, COUPLE_PLANS, NINA_MEMBERSHIP } from '@/lib/plans';
import { base44 } from '@/api/base44Client';

const PLANS = ALL_PLANS.filter(p => p.key !== 'solar');

export default function UpgradeModal({ isOpen, onClose, lang, currentTier }) {
  const [selectedPlan, setSelectedPlan] = useState('nina_membership');
  const [selectedDuration, setSelectedDuration] = useState('1m');
  const [userId, setUserId] = useState('');
  const [profileType, setProfileType] = useState('individual');

  useEffect(() => {
    if (isOpen) {
      base44.auth.me().then(u => {
        if (u) {
          setUserId(u.id);
          base44.entities.UserProfile.filter({ user_id: u.id }).then(res => {
            if (res[0]?.profile_type === 'couple') {
              setProfileType('couple');
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const plans = profileType === 'couple' ? COUPLE_PLANS : INDIVIDUAL_PLANS;
  const activePlan = plans.find(p => p.key === selectedPlan) || ALL_PLANS.find(p => p.key === selectedPlan);

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#1F1026] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 space-y-5 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Choisir un Abonnement' : 'Choose a Plan'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          {/* Single current membership */}
          <div className="flex items-center gap-3 px-1 py-1">
            <span className="text-2xl">{NINA_MEMBERSHIP.icon}</span>
            <div>
              <p className="font-serif text-base font-semibold" style={{ color: NINA_MEMBERSHIP.color }}>
                {lang === 'fr' ? NINA_MEMBERSHIP.label_fr : NINA_MEMBERSHIP.label_en}
              </p>
              <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? NINA_MEMBERSHIP.price_fr : NINA_MEMBERSHIP.price_en}</p>
            </div>
          </div>

          {profileType === 'couple' && (
            <p className="text-center text-[#F0E6FF]/40 text-xs">
              {lang === 'fr' ? 'Les prix sont par personne — chaque membre a son propre compte.' : 'Prices are per person — each member has their own account.'}
            </p>
          )}

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
                {(lang === 'fr' ? activePlan.perks_fr : activePlan.perks_en).map((perk, i) => {
                  const isExpLink = /Nina Purple Experiences|Expériences Nina Purple/i.test(perk);
                  return (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#F0E6FF]/70">
                    <span style={{ color: activePlan.color }} className="mt-0.5">✓</span>
                    {isExpLink ? (
                      <Link to="/experiences" className="text-[#F5A800] underline underline-offset-2 hover:opacity-80 transition-opacity font-medium">{perk}</Link>
                    ) : perk}
                  </li>
                  );
                })}
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

          <CheckoutButton
            priceKey="nina_membership_1m"
            userId={userId}
            className="w-full py-4 rounded-full font-bold text-sm text-[#0B0510] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(245,168,0,0.2)]"
            style={{ background: '#F5A800' }}>
            {lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to Payment'}
          </CheckoutButton>
        </div>
      </div>
    </>
  );
}