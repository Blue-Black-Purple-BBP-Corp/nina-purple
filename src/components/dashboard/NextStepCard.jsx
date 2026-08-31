import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Crown, Camera, UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

// State-based priority card. Shows the single most urgent action the member
// should take next. Returns null when no urgent state exists (normal active
// member) so it takes no space on the page.
export default function NextStepCard({ userProfile }) {
  const { lang } = useLang();
  const [entitlement, setEntitlement] = useState(null);
  const [revealIncoming, setRevealIncoming] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [entRes, revealRes] = await Promise.all([
        base44.functions.invoke('getMemberAccessEntitlement', {}),
        base44.functions.invoke('getPhotoRevealRequests', {}),
      ]);
      setEntitlement(entRes.data?.data || entRes.data || null);
      const incoming = (revealRes.data?.incoming || []).filter(r => r.request_status === 'pending_owner_approval');
      setRevealIncoming(incoming.length);
    } catch (e) { /* non-fatal */ }
    setLoading(false);
  };

  if (loading) return null;

  const onboardingStatus = entitlement?.onboarding_status || userProfile?.onboarding_status;
  const membershipStatus = entitlement?.membership_status || 'none';
  const completeness = userProfile?.profile_completeness ?? 0;

  // Priority 1: urgent states
  // 1a. Onboarding incomplete
  if (onboardingStatus && onboardingStatus !== 'complete') {
    return card({
      icon: AlertCircle,
      color: '#EF4444',
      title: lang === 'fr' ? 'Finalisez votre inscription' : 'Complete your onboarding',
      desc: lang === 'fr' ? 'Quelques étapes restent pour activer votre profil.' : 'A few steps remain to activate your profile.',
      to: '/onboarding',
      cta: lang === 'fr' ? 'Continuer' : 'Continue',
      lang,
    });
  }

  // 1b. Membership payment required
  if (['payment_required', 'past_due', 'lapsed', 'none', 'admin_member_mode'].includes(membershipStatus)) {
    return card({
      icon: Crown,
      color: '#F5A800',
      title: lang === 'fr' ? 'Activez votre adhésion' : 'Activate your membership',
      desc: lang === 'fr' ? 'L\'adhésion Nina Purple est requise pour les interactions.' : 'Nina Purple membership is required for interactions.',
      to: '/membership',
      cta: lang === 'fr' ? 'Voir l\'adhésion' : 'View membership',
      lang,
    });
  }

  // 1c. Pending incoming photo-reveal approval
  if (revealIncoming > 0) {
    return card({
      icon: Camera,
      color: '#7B2FBE',
      title: lang === 'fr' ? `${revealIncoming} demande(s) de photo en attente` : `${revealIncoming} photo request(s) awaiting your approval`,
      desc: lang === 'fr' ? 'Un membre demande à voir vos photos. Approuvez ou refusez.' : 'A member is requesting to see your photos. Approve or decline.',
      to: '/wallet',
      cta: lang === 'fr' ? 'Examiner' : 'Review',
      lang,
    });
  }

  // 1d. Required profile info missing (completeness < 60)
  if (completeness < 60) {
    return card({
      icon: AlertCircle,
      color: '#F5A800',
      title: lang === 'fr' ? 'Complétez votre profil' : 'Complete your profile',
      desc: lang === 'fr' ? 'Ajoutez vos informations de base pour de meilleures correspondances.' : 'Add your basic info for better matches.',
      to: '/profile',
      cta: lang === 'fr' ? 'Modifier le profil' : 'Edit profile',
      lang,
    });
  }

  // Priority 2: improvement prompts (only if not urgent)
  // 2a. Compatibility profile incomplete
  if (!userProfile?.attachment_style) {
    return card({
      icon: AlertCircle,
      color: '#7B2FBE',
      title: lang === 'fr' ? 'Profil de compatibilité' : 'Compatibility profile',
      desc: lang === 'fr' ? 'Complétez votre profil de compatibilité pour recevoir des correspondances.' : 'Complete your compatibility profile to receive matches.',
      to: '/compatibility-profile',
      cta: lang === 'fr' ? 'Compléter' : 'Complete',
      lang,
    });
  }

  // No urgent state — normal active member
  return null;
}

function card({ icon: Icon, color, title, desc, to, cta, lang }) {
  return (
    <Link to={to}
      className="block glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-[rgba(245,168,0,0.3)] transition-all group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-[#F0E6FF] text-sm font-medium">{title}</p>
        <p className="text-[#F0E6FF]/50 text-xs leading-relaxed mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[#F5A800] text-xs font-medium">{cta}</span>
        <ChevronRight className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
      </div>
    </Link>
  );
}