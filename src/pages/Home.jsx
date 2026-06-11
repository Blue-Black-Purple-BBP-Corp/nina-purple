import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Camera, Calendar, MessageCircle, Star, TrendingUp, Lock, Coins } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import NinaAvatar from '@/components/NinaAvatar';
import PricingModal from '@/components/PricingModal';

const MOCK_CONNECTIONS = [
  { id: '1', name: 'Darrell G.', age: 36, city: 'London', archetype: 'purple', compatibility: 92, pronouns: 'He/Him' },
  { id: '2', name: 'Imani M.', age: 28, city: 'Paris', archetype: 'blue', compatibility: 87, pronouns: 'She/Her' },
  { id: '3', name: 'Ricardo M.', age: 36, city: 'New York', archetype: 'black', compatibility: 78, pronouns: 'They/Them' },
  { id: '4', name: 'Jhardel O.', age: 28, city: 'New Jersey', archetype: 'purple', compatibility: 71, pronouns: 'Non-Binary' },
];

const MOCK_ROOMS = [
  { id: '1', name_en: 'Community Welcome', name_fr: 'Bienvenue', posts: 24 },
  { id: '2', name_en: 'Conscious Movies', name_fr: 'Films Conscients', posts: 18 },
  { id: '3', name_en: 'Music That Elevates', name_fr: 'Musique Élévatrice', posts: 31 },
];

const ARCHETYPE_COLORS = { blue: '#60A5FA', black: '#9CA3AF', purple: '#A855F7' };

function CompatibilityOrb({ score }) {
  const color = score >= 90 ? '#F5A800' : score >= 75 ? '#A855F7' : score >= 60 ? '#7B2FBE' : '#6B7280';
  return (
    <div className="relative inline-flex items-center justify-center w-12 h-12">
      <div className="absolute inset-0 rounded-full" style={{ background: `${color}15`, boxShadow: `0 0 12px ${color}30` }} />
      <span className="font-serif font-bold text-sm relative z-10" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function Home() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [pricingOpen, setPricingOpen] = useState(false);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay },
  });

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-serif text-2xl text-[#F0E6FF]">{lang === 'fr' ? 'Bienvenue' : 'Welcome'}</h1>
          <p className="text-[#F0E6FF]/40 text-sm">{lang === 'fr' ? 'Votre constellation vous attend' : 'Your constellation awaits'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPricingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 glass-card-gold rounded-full text-[#F5A800] text-xs font-medium"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>$0 {t('home.credits')}</span>
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-3">
        {[
          { icon: Camera, label: t('home.photo_requests'), count: 2, color: '#F5A800' },
          { icon: Calendar, label: t('home.upcoming_events'), count: 3, color: '#7B2FBE' },
          { icon: MessageCircle, label: t('home.new_messages'), count: 1, color: '#A855F7' },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 text-center" style={{ borderColor: `${stat.color}20` }}>
            <div className="relative inline-block">
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
              {stat.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5A800] text-[#0B0510] text-[9px] font-bold flex items-center justify-center">
                  {stat.count}
                </span>
              )}
            </div>
            <p className="text-[#F0E6FF]/50 text-[9px] leading-tight">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Profile completeness */}
      <motion.div {...fadeUp(0.15)} className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#F0E6FF]/70 text-sm">{t('home.profile_complete')}</span>
          <span className="text-[#F5A800] font-bold text-sm">60%</span>
        </div>
        <div className="w-full bg-[rgba(240,230,255,0.05)] rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-[#F5A800]" style={{ width: '60%', boxShadow: '0 0 8px rgba(245,168,0,0.5)' }} />
        </div>
      </motion.div>

      {/* My Connections */}
      <motion.div {...fadeUp(0.2)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-[#F0E6FF]">{t('home.my_connections')}</h2>
          <Link to="/connections" className="text-[#F5A800] text-xs hover:opacity-80 transition-opacity">
            {lang === 'fr' ? 'Voir tout →' : 'View all →'}
          </Link>
        </div>
        <div className="space-y-3">
          {MOCK_CONNECTIONS.slice(0, 3).map((conn, i) => (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-[rgba(245,168,0,0.15)] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                {/* Blurred avatar placeholder */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2D1B3D] to-[#1F1026] flex items-center justify-center relative overflow-hidden"
                  style={{ border: `1px solid ${ARCHETYPE_COLORS[conn.archetype]}30` }}>
                  <Lock className="w-4 h-4 text-[#F0E6FF]/30" />
                  <div className="absolute inset-0 backdrop-blur-sm bg-[rgba(31,16,38,0.4)]" />
                </div>
                <div>
                  <p className="text-[#F0E6FF] font-medium text-sm">{conn.name}, {conn.age}</p>
                  <p className="text-[#F0E6FF]/40 text-xs">{conn.city} · {conn.pronouns}</p>
                </div>
              </div>
              <CompatibilityOrb score={conn.compatibility} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Community Rooms */}
      <motion.div {...fadeUp(0.4)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-[#F0E6FF]">{t('home.chat_rooms')}</h2>
          <Link to="/community" className="text-[#F5A800] text-xs hover:opacity-80 transition-opacity">
            {lang === 'fr' ? 'Voir tout →' : 'View all →'}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {MOCK_ROOMS.map((room, i) => (
            <Link key={room.id} to="/community">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-[rgba(123,47,190,0.3)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#7B2FBE]" />
                  </div>
                  <div>
                    <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? room.name_fr : room.name_en}</p>
                    <p className="text-[#F0E6FF]/40 text-xs">{room.posts} {t('community.posts')}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
}

function ChevronRight({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}