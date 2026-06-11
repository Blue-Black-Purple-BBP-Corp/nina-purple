import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Camera, MessageCircle, X, Check } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation, getPricingForCompatibility } from '@/lib/i18n';
import PricingModal from '@/components/PricingModal';
import NinaSpeech from '@/components/NinaSpeech';

const MOCK_PROFILES = [
  { id: '1', name: 'Darrell G.', age: 36, city: 'London', archetype: 'purple', compatibility: 92, pronouns: 'He/Him', status: 'Single', orientation: 'Straight', bio: "I'm athletic, and being outside is a massive part of my life. I'm passionate about genuine connection.", is_unlocked: false },
  { id: '2', name: 'Imani M.', age: 28, city: 'Paris', archetype: 'blue', compatibility: 87, pronouns: 'She/Her', status: 'Single', orientation: 'Fluid', bio: "After being stuck in the house for so long, I realize I want to spend time with good-quality people!", is_unlocked: true },
  { id: '3', name: 'Ricardo M.', age: 36, city: 'New York', archetype: 'black', compatibility: 78, pronouns: 'They/Them', status: 'Single', orientation: 'Gay', bio: "I'm athletic and being outside is a huge part of my life. Passionate about true connection.", is_unlocked: false },
  { id: '4', name: 'Jhardel O.', age: 28, city: 'New Jersey', archetype: 'purple', compatibility: 71, pronouns: 'Non-Binary', status: 'Divorced', orientation: 'Fluid', bio: "After being stuck inside, I want quality time with like-minded individuals!", is_unlocked: false },
  { id: '5', name: 'Tamara L.', age: 36, city: 'Melbourne', archetype: 'blue', compatibility: 65, pronouns: 'She/Her', status: 'Divorced', orientation: 'Lesbian', bio: "I just moved here 3 months ago and I love it! Hoping to meet someone to show me around.", is_unlocked: false },
  { id: '6', name: 'Lupita M.', age: 31, city: 'Mexico City', archetype: 'purple', compatibility: 88, pronouns: 'She/Her', status: 'Single', orientation: 'Straight', bio: "I'm looking for a love that looks like this. For real — looking for a feeling I've never felt.", is_unlocked: false },
];

const ARCHETYPE_META = {
  blue: { color: '#60A5FA', label_en: 'The Traveler', label_fr: 'Le Voyageur' },
  black: { color: '#9CA3AF', label_en: 'The Seeker', label_fr: 'Le Chercheur' },
  purple: { color: '#A855F7', label_en: 'The Enlightened', label_fr: "L'Éveillé" },
};

export default function Connections() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [filter, setFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [unlockModal, setUnlockModal] = useState(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [pulseId, setPulseId] = useState(null);

  const filtered = filter === 'all' ? profiles : profiles.filter(p => p.archetype === filter);

  const handleUnlock = (profile) => {
    setUnlockModal(profile);
  };

  const confirmUnlock = () => {
    const pricing = getPricingForCompatibility(unlockModal.compatibility);
    setPulseId(unlockModal.id);
    setProfiles(prev => prev.map(p => p.id === unlockModal.id ? { ...p, is_unlocked: true } : p));
    setUnlockModal(null);
    setTimeout(() => setPulseId(null), 1000);
  };

  const tabs = [
    { id: 'all', label: t('connections.all') },
    { id: 'blue', label: t('connections.travelers') },
    { id: 'black', label: t('connections.seekers') },
    { id: 'purple', label: t('connections.enlightened') },
  ];

  const getCompatibilityColor = (score) => {
    if (score >= 90) return '#F5A800';
    if (score >= 75) return '#A855F7';
    if (score >= 60) return '#7B2FBE';
    return '#6B7280';
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('connections.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{t('connections.subtitle')}</p>
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

      {/* Profile grid */}
      <div className="space-y-4">
        {filtered.map((profile, i) => {
          const pricing = getPricingForCompatibility(profile.compatibility);
          const archetypeMeta = ARCHETYPE_META[profile.archetype];
          const compColor = getCompatibilityColor(profile.compatibility);

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`glass-card rounded-3xl overflow-hidden transition-all duration-600 ${pulseId === profile.id ? 'animate-golden-ripple' : ''}`}
              style={{ borderColor: profile.is_unlocked ? `${compColor}30` : 'rgba(240,230,255,0.06)' }}
            >
              {/* Compatibility header */}
              <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                <div className="flex-1">
                  {/* Blurred photo area */}
                  <div className="w-full h-32 rounded-2xl mb-3 relative overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2D1B3D, #1F1026)' }}>
                    {!profile.is_unlocked && (
                      <>
                        <div className="absolute inset-0 backdrop-blur-xl" />
                        <div className="relative z-10 text-center">
                          <Lock className="w-8 h-8 text-[#F0E6FF]/30 mx-auto mb-2" />
                          <p className="text-[#F0E6FF]/40 text-xs">{t('connections.locked')}</p>
                        </div>
                      </>
                    )}
                    {profile.is_unlocked && (
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] mx-auto flex items-center justify-center">
                          <span className="text-white font-serif text-2xl">{profile.name[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-[#F0E6FF]">{profile.name}, {profile.age}</h3>
                      <p className="text-[#F0E6FF]/50 text-sm">{profile.city} · {profile.pronouns}</p>
                    </div>
                    {/* Compatibility orb */}
                    <div className="text-right">
                      <div className="font-serif text-2xl font-bold" style={{ color: compColor, textShadow: `0 0 20px ${compColor}60` }}>
                        {profile.compatibility}%
                      </div>
                      <p className="text-[#F0E6FF]/30 text-[10px]">{t('connections.compatibility_score')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archetype badge + tags */}
              <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs border" style={{ color: archetypeMeta.color, borderColor: `${archetypeMeta.color}30`, background: `${archetypeMeta.color}10` }}>
                  {lang === 'fr' ? archetypeMeta.label_fr : archetypeMeta.label_en}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs border border-[rgba(240,230,255,0.1)] text-[#F0E6FF]/50">{profile.status}</span>
                <span className="px-2.5 py-1 rounded-full text-xs border border-[rgba(240,230,255,0.1)] text-[#F0E6FF]/50">{profile.orientation}</span>
              </div>

              {/* Bio */}
              {profile.is_unlocked && (
                <div className="px-5 pb-4">
                  <p className="text-[#F0E6FF]/60 text-sm leading-relaxed line-clamp-2">{profile.bio}</p>
                </div>
              )}

              {/* Golden thread */}
              <div className="golden-thread mx-5" />

              {/* Actions */}
              <div className="p-4 flex gap-2">
                {!profile.is_unlocked ? (
                  <button onClick={() => handleUnlock(profile)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.3)] text-[#F5A800] hover:bg-[rgba(245,168,0,0.2)]">
                    <Unlock className="w-4 h-4" />
                    {t('connections.unlock')} • ${pricing.unlock}
                  </button>
                ) : (
                  <>
                    <button className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400 transition-all">
                      <MessageCircle className="w-4 h-4" />
                      {t('connections.send_message')} · ${pricing.msg.toFixed(2)}
                    </button>
                    <button className="px-4 py-3 glass-card rounded-xl text-[#F0E6FF]/60 hover:text-[#F5A800] transition-all">
                      <Camera className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unlock Modal */}
      <AnimatePresence>
        {unlockModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]"
              onClick={() => setUnlockModal(null)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-[70] p-4 md:inset-0 md:flex md:items-center md:justify-center">
              <div className="glass-card-gold rounded-3xl rounded-b-none md:rounded-3xl p-6 max-w-sm mx-auto w-full space-y-4">
                {/* Nina note */}
                <div className="text-center">
                  <div className="font-serif text-2xl text-[#F5A800] mb-1">
                    {getPricingForCompatibility(unlockModal.compatibility).compatibility || unlockModal.compatibility}%
                  </div>
                  <p className="text-[#F0E6FF]/60 text-sm">
                    {lang === 'fr'
                      ? `Compatibilité avec ${unlockModal.name}. Plus votre compatibilité est élevée, moins vous payez.`
                      : `Compatibility with ${unlockModal.name}. Higher compatibility = lower cost.`}
                  </p>
                </div>
                <div className="golden-thread" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#F0E6FF]/60">{t('connections.unlock')}</span>
                    <span className="text-[#F5A800] font-bold">${getPricingForCompatibility(unlockModal.compatibility).unlock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#F0E6FF]/60">{lang === 'fr' ? 'Coût par message' : 'Per message cost'}</span>
                    <span className="text-[#F0E6FF]/80">${getPricingForCompatibility(unlockModal.compatibility).msg.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setUnlockModal(null)}
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