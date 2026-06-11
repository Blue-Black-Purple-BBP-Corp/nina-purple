import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Coins, Shield, Camera, ChevronRight as ChevronRightIcon, Crown, Edit3, Award, Users } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import PricingModal from '@/components/PricingModal';
import NinaAvatar from '@/components/NinaAvatar';

const TIER_META = {
  solar: { color: '#F0E6FF', label_en: 'Solar', label_fr: 'Solaire', icon: '☀️' },
  lunar: { color: '#7B2FBE', label_en: 'Lunar', label_fr: 'Lunaire', icon: '🌙' },
  stellar: { color: '#A855F7', label_en: 'Stellar', label_fr: 'Stellaire', icon: '⭐' },
  galactic: { color: '#F5A800', label_en: 'Galactic', label_fr: 'Galactique', icon: '🌌' },
};

export default function Profile() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [tier] = useState('solar');
  const tierMeta = TIER_META[tier];

  const sections = [
    { icon: Camera, label: t('profile.photos'), sub: lang === 'fr' ? 'Gérer la confidentialité des photos' : 'Manage photo privacy' },
    { icon: Coins, label: t('profile.credits'), sub: '$0.00', action: lang === 'fr' ? 'Ajouter' : 'Add credits' },
    { icon: Award, label: t('profile.rewards'), sub: '0 BBP' },
    { icon: Crown, label: t('profile.subscription'), sub: lang === 'fr' ? tierMeta.label_fr : tierMeta.label_en, action: t('profile.upgrade') },
    { icon: Shield, label: t('profile.privacy'), sub: lang === 'fr' ? 'Photos cachées par défaut' : 'Photos hidden by default' },
    { icon: Users, label: t('profile.refer'), sub: lang === 'fr' ? 'Invitez des amis' : 'Invite friends & earn rewards' },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-6">{t('profile.title')}</h1>
        
        {/* Avatar area */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(123,47,190,0.3)' }}>
            <span className="text-white font-serif text-4xl">Y</span>
          </div>
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#F5A800] rounded-full flex items-center justify-center">
            <Edit3 className="w-3.5 h-3.5 text-[#0B0510]" />
          </button>
        </div>

        <h2 className="font-serif text-2xl text-[#F0E6FF]">Your Name</h2>
        <p className="text-[#F0E6FF]/40 text-sm">Your City</p>

        {/* Tier badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-2"
          style={{ background: `${tierMeta.color}10`, border: `1px solid ${tierMeta.color}30` }}>
          <span className="text-sm">{tierMeta.icon}</span>
          <span className="text-sm font-medium" style={{ color: tierMeta.color }}>
            {lang === 'fr' ? tierMeta.label_fr : tierMeta.label_en}
          </span>
        </div>
      </motion.div>

      {/* Profile completeness */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#F0E6FF]/70 text-sm">{t('profile.completeness')}</span>
          <span className="text-[#F5A800] font-bold">60%</span>
        </div>
        <div className="w-full bg-[rgba(240,230,255,0.05)] rounded-full h-1.5 mb-2">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-[#7B2FBE] to-[#F5A800]" style={{ width: '60%' }} />
        </div>
        <p className="text-[#F0E6FF]/40 text-xs">
          {lang === 'fr' ? 'Ajoutez des photos pour augmenter votre score de correspondance' : 'Add photos to increase your match score'}
        </p>
      </motion.div>

      {/* Nina message */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="glass-card-gold rounded-2xl p-4 flex items-start gap-3">
        <NinaAvatar size="sm" glow />
        <p className="text-[#F0E6FF]/70 text-sm leading-relaxed">
          {lang === 'fr'
            ? '"Chaque question à laquelle vous répondez est un investissement dans une connexion plus profonde."'
            : '"Every question you answer is an investment in a deeper connection."'}
        </p>
      </motion.div>

      {/* Profile sections */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="space-y-2">
        {sections.map((section, i) => (
          <motion.button key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            onClick={section.label === t('profile.credits') ? () => setPricingOpen(true) : undefined}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-[rgba(245,168,0,0.15)] transition-all group text-left">
            <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center group-hover:bg-[rgba(123,47,190,0.2)] transition-all shrink-0">
              <section.icon className="w-5 h-5 text-[#7B2FBE]" />
            </div>
            <div className="flex-1">
              <p className="text-[#F0E6FF] text-sm font-medium">{section.label}</p>
              <p className="text-[#F0E6FF]/40 text-xs">{section.sub}</p>
            </div>
            <div className="flex items-center gap-2">
              {section.action && (
                <span className="text-[#F5A800] text-xs">{section.action}</span>
              )}
              <ChevronRightIcon className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Pricing link */}
      <div className="text-center">
        <button onClick={() => setPricingOpen(true)}
          className="text-[#F5A800] text-sm underline underline-offset-4 hover:opacity-80 transition-opacity">
          {lang === 'fr' ? 'Voir la tarification des interactions' : 'View interaction pricing'}
        </button>
      </div>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}