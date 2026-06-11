import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Globe, User, Clock, Check } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

const MOCK_EVENTS = [
  { id: '1', title_en: "BLERD'S UNITE: Black Nerd Cosplay", title_fr: "BLERD'S UNITE: Cosplay Nerd", host: 'Marcus D.', date: 'July 16, Sun', time: '4:00 PM', type: 'onsite', event_type: 'meet_greet', topic_en: 'Fandom & Conscious Connection', topic_fr: 'Fandom & Connexion Consciente', booked: false, spots: 24 },
  { id: '2', title_en: 'Consciousness Talks', title_fr: 'Conversations de Conscience', host: 'Safiya Abbas', date: 'July 16, Sun', time: '8:00 PM', type: 'online', event_type: 'consciousness_talk', topic_en: 'What does consciousness mean to you?', topic_fr: 'Que signifie la conscience pour vous ?', booked: true, spots: 50 },
  { id: '3', title_en: 'Jamaican Fire Dance Night', title_fr: 'Soirée Danse Feu Jamaïcaine', host: 'Bianca P.', date: 'July 13, Sat', time: '2:00 PM', type: 'onsite', event_type: 'cultural', topic_en: 'Cultural celebration & connection', topic_fr: 'Célébration culturelle & connexion', booked: false, spots: 40 },
  { id: '4', title_en: 'Speed Dating: Conscious Edition', title_fr: 'Speed Dating : Édition Consciente', host: 'Nina Purple', date: 'July 28, Sat', time: '7:00 PM', type: 'online', event_type: 'speed_dating', topic_en: 'Rapid conscious connections', topic_fr: 'Connexions conscientes rapides', booked: false, spots: 30 },
  { id: '5', title_en: 'Samba Lovers Night', title_fr: 'Soirée Amateurs de Samba', host: 'Ricardo M.', date: 'July 28, Sat', time: '8:00 PM', type: 'onsite', event_type: 'cultural', topic_en: 'Music, dance & community', topic_fr: 'Musique, danse & communauté', booked: false, spots: 35 },
];

const EVENT_TYPE_COLORS = {
  meet_greet: '#F5A800',
  consciousness_talk: '#7B2FBE',
  cultural: '#A855F7',
  speed_dating: '#60A5FA',
  workshop: '#9CA3AF',
};

export default function Events() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState(MOCK_EVENTS);

  const filtered = filter === 'booked' ? events.filter(e => e.booked) : events;

  const handleBook = (id) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, booked: !e.booked } : e));
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('events.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{t('events.subtitle')}</p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: t('events.all') },
          { id: 'booked', label: t('events.booked') },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === tab.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((event, i) => {
          const typeColor = EVENT_TYPE_COLORS[event.event_type] || '#7B2FBE';
          return (
            <motion.div key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-3xl overflow-hidden transition-all duration-600 hover:border-[rgba(245,168,0,0.12)]"
            >
              {/* Color band */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${typeColor}, transparent)` }} />

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-xl text-[#F0E6FF] leading-tight">
                    {lang === 'fr' ? event.title_fr : event.title_en}
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${event.type === 'online' ? 'bg-[rgba(96,165,250,0.1)] text-[#60A5FA] border border-[rgba(96,165,250,0.2)]' : 'bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)]'}`}>
                    {event.type === 'online' ? t('events.online') : t('events.onsite')}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-sm text-[#F0E6FF]/50">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {event.host}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {event.time}
                  </span>
                </div>

                {/* Topic */}
                <div className="px-3 py-2 rounded-xl text-sm text-[#F0E6FF]/70 leading-relaxed"
                  style={{ background: `${typeColor}08`, border: `1px solid ${typeColor}15` }}>
                  <span className="text-[#F0E6FF]/40 text-xs uppercase tracking-wider block mb-1">{t('events.topic')}</span>
                  {lang === 'fr' ? event.topic_fr : event.topic_en}
                </div>

                <div className="golden-thread" />

                {/* Book button */}
                <button onClick={() => handleBook(event.id)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${event.booked
                    ? 'bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.3)] text-[#F5A800]'
                    : 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400 shadow-[0_0_15px_rgba(245,168,0,0.2)]'}`}>
                  {event.booked ? (
                    <><Check className="w-4 h-4" /> {t('events.booked_label')}</>
                  ) : (
                    t('events.book_now')
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-[#F0E6FF]/20 mx-auto mb-3" />
            <p className="text-[#F0E6FF]/40">{lang === 'fr' ? 'Aucune réservation pour le moment' : 'No bookings yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}