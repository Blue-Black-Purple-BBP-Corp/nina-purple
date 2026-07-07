import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Check, X, Loader2, Info } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { QUESTIONS_21 } from '@/pages/Onboarding';

export default function CoupleComparison({ myProfile, partnerUserId, isFr }) {
  const [myAnswers, setMyAnswers] = useState(null);
  const [partnerAnswers, setPartnerAnswers] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [partnerConsent, setPartnerConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [partnerUserId]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [myAns, partnerAns, partnerProf] = await Promise.all([
        base44.entities.MatchingAnswers.filter({ user_id: user.id }),
        base44.asServiceRole.entities.MatchingAnswers.filter({ user_id: partnerUserId }),
        base44.asServiceRole.entities.UserProfile.filter({ user_id: partnerUserId }),
      ]);
      setMyAnswers(myAns[0] || null);
      setPartnerAnswers(partnerAns[0] || null);
      setPartnerProfile(partnerProf[0] || null);
      setConsentGiven(myProfile?.couple_consent_given || false);
      setPartnerConsent(partnerProf[0]?.couple_consent_given || false);
    } catch (e) {
      console.error('Failed to load comparison data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConsent = async () => {
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.UserProfile.update(myProfile.id, { couple_consent_given: true });
      setConsentGiven(true);
      // Check if partner also consented via backend
      const res = await base44.functions.invoke('linkPartner', { action: 'get_status' });
    } catch (e) {
      console.error('Consent failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#7B2FBE] animate-spin" />
      </div>
    );
  }

  if (!myAnswers || !partnerAnswers) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Users className="w-8 h-8 text-[#7B2FBE] mx-auto mb-3" />
        <p className="text-[#F0E6FF]/60 text-sm">
          {isFr
            ? "En attente des réponses de votre partenaire. La comparaison côte à côte sera disponible une fois que vous aurez tous les deux complété vos questions de compatibilité."
            : "Waiting for your partner's responses. The side-by-side comparison will be available once you have both completed your compatibility questions."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center mx-auto mb-3">
          <Heart className="w-7 h-7 text-[#7B2FBE]" />
        </div>
        <h2 className="font-serif text-2xl text-[#F0E6FF] mb-1">
          {isFr ? 'Votre comparaison de couple' : 'Your Couple Comparison'}
        </h2>
        <p className="text-[#F0E6FF]/50 text-sm">
          {isFr
            ? 'Voyez où vous et votre partenaire vous alignez — et où vous différez.'
            : 'See where you and your partner align — and where you differ.'}
        </p>
      </div>

      {/* Comparison list */}
      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
        {QUESTIONS_21.map((q, i) => {
          const myAns = myAnswers[q.key];
          const partnerAns = partnerAnswers[q.key];
          const myLabel = myAns ? (isFr ? q.options_fr[q.opt_keys.indexOf(myAns)] : q.options_en[q.opt_keys.indexOf(myAns)]) : '—';
          const partnerLabel = partnerAns ? (isFr ? q.options_fr[q.opt_keys.indexOf(partnerAns)] : q.options_en[q.opt_keys.indexOf(partnerAns)]) : '—';
          const aligned = myAns && partnerAns && myAns === partnerAns;
          return (
            <div key={q.key} className={`glass-card rounded-xl p-3 ${aligned ? 'border-[rgba(245,168,0,0.3)]' : ''}`}>
              <p className="text-[#F0E6FF]/70 text-xs font-medium mb-2">
                {i + 1}. {isFr ? q.fr : q.en}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-lg p-2 text-xs ${aligned ? 'bg-[rgba(245,168,0,0.08)]' : 'bg-[rgba(240,230,255,0.04)]'}`}>
                  <p className="text-[#F0E6FF]/40 text-[10px] uppercase tracking-wider mb-0.5">{isFr ? 'Vous' : 'You'}</p>
                  <p className="text-[#F0E6FF]/80">{myLabel}</p>
                </div>
                <div className={`rounded-lg p-2 text-xs ${aligned ? 'bg-[rgba(245,168,0,0.08)]' : 'bg-[rgba(240,230,255,0.04)]'}`}>
                  <p className="text-[#F0E6FF]/40 text-[10px] uppercase tracking-wider mb-0.5">{partnerProfile?.display_name || (isFr ? 'Partenaire' : 'Partner')}</p>
                  <p className="text-[#F0E6FF]/80">{partnerLabel}</p>
                </div>
              </div>
              {aligned && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#F5A800]">
                  <Check className="w-3 h-3" /> {isFr ? 'Alignés' : 'Aligned'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Consent gate */}
      <div className="glass-card-orchid rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" />
          <p className="text-[#F0E6FF]/60 text-xs leading-relaxed">
            {isFr
              ? "Pour finaliser votre profil de couple, vous devez tous les deux consulter les réponses de l'autre et donner votre consentement. Votre profil de couple sera utilisé uniquement pour l'expérience Nina Purple — il ne fait PAS partie du pool de matching/dating."
              : "To finalize your couple profile, you both need to review each other's responses and give your consent. Your couple profile will be used for the Nina Purple Experience only — it is NOT part of the dating/matching pool."}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${consentGiven ? 'bg-[#F5A800]' : 'bg-[rgba(240,230,255,0.1)]'}`}>
            {consentGiven ? <Check className="w-3 h-3 text-[#0B0510]" /> : <span className="text-[#F0E6FF]/30 text-[10px]">1</span>}
          </div>
          <span className={consentGiven ? 'text-[#F5A800]' : 'text-[#F0E6FF]/50'}>
            {isFr ? 'Votre consentement' : 'Your consent'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${partnerConsent ? 'bg-[#F5A800]' : 'bg-[rgba(240,230,255,0.1)]'}`}>
            {partnerConsent ? <Check className="w-3 h-3 text-[#0B0510]" /> : <span className="text-[#F0E6FF]/30 text-[10px]">2</span>}
          </div>
          <span className={partnerConsent ? 'text-[#F5A800]' : 'text-[#F0E6FF]/50'}>
            {isFr ? 'Consentement de votre partenaire' : 'Your partner\'s consent'}
          </span>
        </div>

        {!consentGiven ? (
          <button onClick={handleConsent} disabled={submitting}
            className="w-full py-3 bg-[#7B2FBE] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#9B4FDE] transition-all disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isFr ? "J'ai lu et j'accepte" : "I've read and I agree"}</>}
          </button>
        ) : !partnerConsent ? (
          <p className="text-center text-[#F0E6FF]/40 text-xs">
            {isFr ? 'En attente du consentement de votre partenaire…' : 'Waiting for your partner\'s consent…'}
          </p>
        ) : (
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-[#F5A800]" />
            </div>
            <p className="text-[#F5A800] text-sm font-medium">
              {isFr ? 'Profil de couple finalisé !' : 'Couple profile finalized!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}