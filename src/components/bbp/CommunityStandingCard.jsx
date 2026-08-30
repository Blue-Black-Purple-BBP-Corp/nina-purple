import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, Wallet, Compass, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STANDING_STATES = [
  { key: 'getting_started', label_en: 'Getting Started', label_fr: 'Démarrage', color: '#6B7280' },
  { key: 'profile_complete', label_en: 'Profile Complete', label_fr: 'Profil Complet', color: '#60A5FA' },
  { key: 'community_ready', label_en: 'Community Ready', label_fr: 'Prêt pour la Communauté', color: '#7B2FBE' },
  { key: 'community_active', label_en: 'Community Active', label_fr: 'Actif dans la Communauté', color: '#A855F7' },
  { key: 'community_connected', label_en: 'Community Connected', label_fr: 'Connecté à la Communauté', color: '#F5A800' },
];

function getNextAction(state, lang, orientationDone) {
  const fr = lang === 'fr';
  switch (state) {
    case 'getting_started':
      return fr ? 'Complétez votre profil et les questions de compatibilité' : 'Complete your profile and compatibility questions';
    case 'profile_complete':
      return orientationDone
        ? (fr ? 'Confirmez votre compte pour devenir Prêt pour la Communauté' : 'Confirm your account to become Community Ready')
        : (fr ? 'Terminez l\'orientation communautaire' : 'Complete Community Orientation');
    case 'community_ready':
      return fr ? 'Participez à un événement ou invitez un ami' : 'Attend an event or invite a friend';
    case 'community_active':
      return fr ? 'Continuez à participer pour bâtir des connexions réciproques' : 'Keep participating to build reciprocal connections';
    case 'community_connected':
      return fr ? 'Vous avez bâti des connexions réciproques qualifiantes' : 'You\'ve built qualifying reciprocal connections';
    default:
      return '';
  }
}

export default function CommunityStandingCard({ lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEngagement();
  }, []);

  const loadEngagement = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getEngagementProfile', {});
      if (res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.warn('getEngagementProfile failed:', e.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center justify-center min-h-[120px]">
        <Loader2 className="w-5 h-5 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { engagement_profile: ep, wallet } = data;
  const currentState = ep?.community_standing_state || 'getting_started';
  const stateIndex = STANDING_STATES.findIndex(s => s.key === currentState);
  const orientationDone = !!ep?.orientation_acknowledged_version;
  const isFr = lang === 'fr';

  const current = STANDING_STATES[stateIndex];

  return (
    <div className="glass-card-orchid rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5 text-[#7B2FBE]" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-base text-[#F0E6FF]">
            {isFr ? 'Position Communautaire' : 'Community Standing'}
          </h3>
          <p className="text-[#F0E6FF]/40 text-xs">
            {isFr ? 'Reconnaît la participation, non l\'identité' : 'Recognizes participation, not identity'}
          </p>
        </div>
      </div>

      {/* Current state badge */}
      <div className="flex items-center gap-2">
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
          style={{ background: `${current.color}15`, color: current.color, border: `1px solid ${current.color}30` }}
        >
          <Award className="w-3 h-3" />
          {isFr ? current.label_fr : current.label_en}
        </div>
      </div>

      {/* Progress milestones */}
      <div className="flex items-center gap-1">
        {STANDING_STATES.map((s, i) => (
          <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
              style={{
                background: i <= stateIndex ? s.color : 'rgba(240,230,255,0.05)',
                border: `1px solid ${i <= stateIndex ? s.color : 'rgba(240,230,255,0.1)'}`,
              }}
            >
              {i <= stateIndex && <Check className="w-3 h-3 text-[#0B0510]" />}
            </div>
          </div>
        ))}
      </div>

      {/* Next action */}
      <div className="p-3 rounded-xl bg-[rgba(245,168,0,0.05)] border border-[rgba(245,168,0,0.15)]">
        <p className="text-[#F0E6FF]/60 text-xs leading-relaxed">
          <span className="text-[#F5A800] font-medium">{isFr ? 'Prochaine étape: ' : 'Next step: '}</span>
          {getNextAction(currentState, lang, orientationDone)}
        </p>
      </div>

      {/* Wallet summary + links */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/wallet"
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card-gold text-[#F5A800] text-xs font-medium hover:opacity-80 transition-opacity"
        >
          <Wallet className="w-3.5 h-3.5" />
          {wallet?.available_points || 0} BBP
          <ChevronRight className="w-3 h-3" />
        </Link>
        {!orientationDone && currentState !== 'getting_started' && (
          <Link
            to="/wallet"
            className="text-[#7B2FBE] text-xs hover:underline"
          >
            {isFr ? 'Orientation →' : 'Orientation →'}
          </Link>
        )}
      </div>

      {/* What this means */}
      <p className="text-[#F0E6FF]/30 text-xs leading-relaxed">
        {isFr
          ? "La position communautaire reflète votre participation à Nina Purple. Ce n'est pas une vérification d'identité, une garantie de sécurité ou une approbation."
          : "Community Standing reflects your participation in Nina Purple. It is not identity verification, a safety guarantee, or an endorsement of a member."}
      </p>
    </div>
  );
}