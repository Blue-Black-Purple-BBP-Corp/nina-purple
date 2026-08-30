import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Camera, MessageCircle, Loader2, Heart } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation, getPricingForCompatibility } from '@/lib/i18n';
import PricingModal from '@/components/PricingModal';
import FoundingMemberBadge from '@/components/FoundingMemberBadge';
import { base44 } from '@/api/base44Client';
import { usePlanLimits } from '@/hooks/usePlanLimits';

const ARCHETYPE_META = {
  blue:   { color: '#60A5FA', label_en: 'The Traveler',    label_fr: 'Le Voyageur' },
  black:  { color: '#9CA3AF', label_en: 'The Seeker',      label_fr: 'Le Chercheur' },
  purple: { color: '#A855F7', label_en: 'The Enlightened', label_fr: "L'Éveillé" },
};

const getCompatibilityColor = (score) => {
  if (score >= 90) return '#F5A800';
  if (score >= 75) return '#A855F7';
  if (score >= 60) return '#7B2FBE';
  return '#6B7280';
};

export default function Connections() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [filter, setFilter] = useState('all');
  const [connections, setConnections] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUnlock, setSelectedUnlock] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [limitError, setLimitError] = useState('');
  const { data: limitsData, refresh: refreshLimits } = usePlanLimits();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);
    refreshLimits();

    // Load connections where current user is involved
    const conns = await base44.entities.Connection.filter({ from_user_id: user.id });

    // Load profiles via server-mediated projection (enforces connection check, hides PII)
    const toIds = [...new Set(conns.map(c => c.to_user_id))];
    let profileMap = {};
    if (toIds.length > 0) {
      try {
        const res = await base44.functions.invoke('getConnectionProfiles', { user_ids: toIds });
        profileMap = res.data?.profiles || {};
      } catch (e) {
        console.warn('getConnectionProfiles failed:', e.message);
      }
    }

    setConnections(conns);
    setProfiles(profileMap);
    setLoading(false);
  };

  const confirmUnlock = async () => {
    if (!selectedUnlock) return;
    setLimitError('');
    // Unlock is authorized server-side — the client never writes is_unlocked / unlock_cost_paid.
    try {
      const res = await base44.functions.invoke('unlockConnection', {
        connection_id: selectedUnlock.id,
        action: 'unlock',
      });
      if (res.data?.success) {
        const paid = res.data.unlock_cost_paid ?? 0;
        setConnections(prev => prev.map(c => c.id === selectedUnlock.id ? { ...c, is_unlocked: true, unlock_cost_paid: paid } : c));
        setSelectedUnlock(null);
        setLimitError('');
        refreshLimits();
      } else {
        setLimitError(res.data?.reason || (lang === 'fr' ? 'Déverrouillage refusé.' : 'Unlock denied.'));
      }
    } catch (e) {
      setLimitError(e?.response?.data?.reason || e?.response?.data?.error || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
    }
  };

  const handleGalleryUnlock = async (conn) => {
    setLimitError('');
    // Gallery unlock is authorized server-side — the client never writes gallery_unlocked.
    try {
      const res = await base44.functions.invoke('unlockConnection', {
        connection_id: conn.id,
        action: 'gallery_unlock',
      });
      if (res.data?.success) {
        setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, gallery_unlocked: true } : c));
      } else {
        setLimitError(lang === 'fr'
          ? 'Le déverrouillage de galerie n\'est pas inclus dans votre plan. Passez à Galactic pour un accès gratuit.'
          : 'Gallery unlock is not included in your plan. Upgrade to Galactic for free access.');
        setPricingOpen(true);
      }
    } catch (e) {
      setLimitError(lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.');
    }
  };

  const filtered = connections.filter(c => {
    const p = profiles[c.to_user_id];
    if (filter === 'all') return true;
    return p?.dating_archetype === filter;
  });

  // Check if current user's own profile is coupled
  const [myProfile, setMyProfile] = useState(null);
  useEffect(() => {
    if (currentUser) {
      base44.entities.UserProfile.filter({ user_id: currentUser.id }).then(res => setMyProfile(res[0]));
    }
  }, [currentUser]);

  const tabs = [
    { id: 'all',    label: t('connections.all') },
    { id: 'blue',   label: t('connections.travelers') },
    { id: 'black',  label: t('connections.seekers') },
    { id: 'purple', label: t('connections.enlightened') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Couple mode banner — this user is paired, not in matching pool */}
      {myProfile?.paired_status === 'paired' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-orchid rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-[#7B2FBE] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-sm text-[#F0E6FF] mb-1">
                {lang === 'fr' ? 'Vous êtes en couple' : 'You are coupled'}
              </h3>
              <p className="text-[#F0E6FF]/50 text-xs leading-relaxed">
                {lang === 'fr'
                  ? "Votre profil est associé à un partenaire. Vous ne faites plus partie du pool de matching individuel. Vos connexions existantes restent visibles ci-dessous."
                  : "Your profile is linked with a partner. You are no longer part of the individual matching pool. Your existing connections remain visible below."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('connections.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">
          {lang === 'fr' ? `${connections.length} correspondance${connections.length !== 1 ? 's' : ''}` : `${connections.length} match${connections.length !== 1 ? 'es' : ''}`}
        </p>
        {limitsData && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
              style={{ color: limitsData.tier === 'galactic' ? '#F5A800' : limitsData.tier === 'stellar' ? '#A855F7' : limitsData.tier === 'lunar' ? '#7B2FBE' : '#A78BFA',
                       borderColor: 'rgba(240,230,255,0.15)', background: 'rgba(240,230,255,0.05)' }}>
              {limitsData.tier}
            </span>
            <span className="text-[#F0E6FF]/40 text-xs">
              {lang === 'fr'
                ? `Déverrouillages : ${limitsData.usage.unlocks_used} / ${limitsData.limits.unlocks_per_month === 'unlimited' ? '∞' : limitsData.limits.unlocks_per_month} ce mois`
                : `Unlocks: ${limitsData.usage.unlocks_used} / ${limitsData.limits.unlocks_per_month === 'unlimited' ? '∞' : limitsData.limits.unlocks_per_month} this month`}
            </span>
          </div>
        )}
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${filter === tab.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[rgba(123,47,190,0.1)] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-[#7B2FBE]" />
          </div>
          <p className="text-[#F0E6FF]/60 text-base font-serif">
            {lang === 'fr' ? 'Vos correspondances apparaîtront ici' : 'Your matches will appear here'}
          </p>
          <p className="text-[#F0E6FF]/30 text-sm">
            {lang === 'fr' ? 'Complétez votre profil pour commencer à être mis en correspondance.' : 'Complete your profile to start being matched.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((conn, i) => {
            const profile = profiles[conn.to_user_id];
            if (!profile) return null;
            const score = conn.compatibility_score || 0;
            const pricing = getPricingForCompatibility(score);
            const compColor = getCompatibilityColor(score);
            const archetypeMeta = ARCHETYPE_META[profile.dating_archetype] || ARCHETYPE_META.purple;

            return (
              <motion.div key={conn.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card rounded-3xl overflow-hidden transition-all duration-600"
                style={{ borderColor: conn.is_unlocked ? `${compColor}30` : 'rgba(240,230,255,0.06)' }}>

                {/* Photo area */}
                <div className="px-5 pt-5 pb-3">
                  <div className="w-full h-32 rounded-2xl mb-3 relative overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2D1B3D, #1F1026)' }}>
                    {conn.is_unlocked && profile.photos?.[0] ? (
                      <img src={profile.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : conn.is_unlocked ? (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center">
                        <span className="text-white font-serif text-2xl">{profile.display_name?.[0]}</span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 backdrop-blur-xl" />
                        <div className="relative z-10 text-center">
                          <Lock className="w-8 h-8 text-[#F0E6FF]/30 mx-auto mb-2" />
                          <p className="text-[#F0E6FF]/40 text-xs">{t('connections.locked')}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-[#F0E6FF]">{profile.display_name}, {profile.age}</h3>
                      <p className="text-[#F0E6FF]/50 text-sm">{profile.city} · {profile.gender_pronoun}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-2xl font-bold" style={{ color: compColor, textShadow: `0 0 20px ${compColor}60` }}>
                        {score}%
                      </div>
                      <p className="text-[#F0E6FF]/30 text-[10px]">{t('connections.compatibility_score')}</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-xs border"
                    style={{ color: archetypeMeta.color, borderColor: `${archetypeMeta.color}30`, background: `${archetypeMeta.color}10` }}>
                    {lang === 'fr' ? archetypeMeta.label_fr : archetypeMeta.label_en}
                  </span>
                  {profile.relationship_status && (
                    <span className="px-2.5 py-1 rounded-full text-xs border border-[rgba(240,230,255,0.1)] text-[#F0E6FF]/50">{profile.relationship_status}</span>
                  )}
                  {profile.sexual_orientation && (
                    <span className="px-2.5 py-1 rounded-full text-xs border border-[rgba(240,230,255,0.1)] text-[#F0E6FF]/50">{profile.sexual_orientation}</span>
                  )}
                  {profile.paired_status === 'paired' && (
                    <span className="px-2.5 py-1 rounded-full text-xs border flex items-center gap-1"
                      style={{ color: '#7B2FBE', borderColor: 'rgba(123,47,190,0.3)', background: 'rgba(123,47,190,0.1)' }}>
                      <Heart className="w-3 h-3" />
                      {lang === 'fr' ? 'Maintenant en couple' : 'Now coupled'}
                    </span>
                  )}
                  {profile.is_founding_member && <FoundingMemberBadge />}
                </div>

                {conn.is_unlocked && profile.bio && (
                  <div className="px-5 pb-4">
                    <p className="text-[#F0E6FF]/60 text-sm leading-relaxed line-clamp-2">{profile.bio}</p>
                  </div>
                )}

                <div className="golden-thread mx-5" />

                {/* Actions */}
                <div className="p-4 flex gap-2">
                  {!conn.is_unlocked ? (
                    <button onClick={() => setSelectedUnlock(conn)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.3)] text-[#F5A800] hover:bg-[rgba(245,168,0,0.2)]">
                      <Unlock className="w-4 h-4" />
                      {t('connections.unlock')} · ${pricing.unlock}
                    </button>
                  ) : (
                    <>
                      <button className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400 transition-all">
                        <MessageCircle className="w-4 h-4" />
                        {t('connections.send_message')} · ${pricing.msg.toFixed(2)}
                      </button>
                      {!conn.gallery_unlocked && (
                        <button onClick={() => handleGalleryUnlock(conn)}
                          className="px-4 py-3 glass-card rounded-xl text-[#F0E6FF]/60 hover:text-[#F5A800] transition-all"
                          title={lang === 'fr' ? 'Déverrouiller la galerie' : 'Unlock gallery'}>
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unlock Modal */}
      <AnimatePresence>
        {selectedUnlock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]"
              onClick={() => setSelectedUnlock(null)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-[70] p-4 md:inset-0 md:flex md:items-center md:justify-center">
              <div className="glass-card-gold rounded-3xl rounded-b-none md:rounded-3xl p-6 max-w-sm mx-auto w-full space-y-4">
                <div className="text-center">
                  <div className="font-serif text-3xl font-bold text-[#F5A800] mb-1">
                    {selectedUnlock.compatibility_score || 0}%
                  </div>
                  <p className="text-[#F0E6FF]/60 text-sm">
                    {lang === 'fr'
                      ? `Compatibilité avec ${profiles[selectedUnlock.to_user_id]?.display_name}. Plus votre compatibilité est élevée, moins vous payez.`
                      : `Compatibility with ${profiles[selectedUnlock.to_user_id]?.display_name}. Higher compatibility = lower cost.`}
                  </p>
                </div>
                <div className="golden-thread" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#F0E6FF]/60">{t('connections.unlock')}</span>
                    <span className="text-[#F5A800] font-bold">${getPricingForCompatibility(selectedUnlock.compatibility_score || 0).unlock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#F0E6FF]/60">{lang === 'fr' ? 'Coût par message' : 'Per message cost'}</span>
                    <span className="text-[#F0E6FF]/80">${getPricingForCompatibility(selectedUnlock.compatibility_score || 0).msg.toFixed(2)}</span>
                  </div>
                </div>
                {limitError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
                    {limitError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setSelectedUnlock(null); setLimitError(''); }}
                    className="flex-1 py-3 glass-card rounded-xl text-[#F0E6FF]/60 text-sm hover:opacity-80 transition-all">
                    {t('common.cancel')}
                  </button>
                  <button onClick={confirmUnlock}
                    className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-xl font-bold text-sm hover:bg-yellow-400 transition-all">
                    {lang === 'fr' ? 'Investir' : 'Invest'}
                  </button>
                </div>
                <button onClick={() => setPricingOpen(true)} className="w-full text-center text-[#F0E6FF]/30 text-xs hover:opacity-80">
                  {lang === 'fr' ? 'Voir tous les tarifs →' : 'View full pricing →'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}