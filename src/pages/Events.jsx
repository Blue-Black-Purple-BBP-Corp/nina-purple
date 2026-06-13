import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Clock, Check, Loader2, Globe, MapPin } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

const EVENT_TYPE_COLORS = {
  meet_greet:         '#F5A800',
  consciousness_talk: '#7B2FBE',
  cultural:           '#A855F7',
  speed_dating:       '#60A5FA',
  workshop:           '#9CA3AF',
};

export default function Events() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  // Track which event IDs current user has RSVP'd to (stored in a simple local state for UX)
  const [bookedIds, setBookedIds] = useState(new Set());

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);
    const data = await base44.entities.Event.filter({ is_active: true }, 'event_date', 50);
    setEvents(data);
    setLoading(false);
  };

  const handleBook = async (event) => {
    if (bookingId === event.id) return;
    setBookingId(event.id);
    const isBooked = bookedIds.has(event.id);
    if (!isBooked) {
      // Increment attendee count
      await base44.entities.Event.update(event.id, {
        attendees_count: (event.attendees_count || 0) + 1,
      });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees_count: (e.attendees_count || 0) + 1 } : e));
      setBookedIds(prev => new Set([...prev, event.id]));
    } else {
      await base44.entities.Event.update(event.id, {
        attendees_count: Math.max(0, (event.attendees_count || 1) - 1),
      });
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees_count: Math.max(0, (e.attendees_count || 1) - 1) } : e));
      setBookedIds(prev => { const next = new Set(prev); next.delete(event.id); return next; });
    }
    setBookingId(null);
  };

  const filtered = filter === 'booked'
    ? events.filter(e => bookedIds.has(e.id))
    : events;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('events.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{t('events.subtitle')}</p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'all', label: t('events.all') }, { id: 'booked', label: t('events.booked') }].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === tab.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Calendar className="w-12 h-12 text-[#F0E6FF]/20 mx-auto" />
          <p className="text-[#F0E6FF]/40">
            {filter === 'booked'
              ? (lang === 'fr' ? 'Aucune réservation pour le moment' : 'No bookings yet')
              : (lang === 'fr' ? 'Aucun événement à venir' : 'No upcoming events')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((event, i) => {
            const typeColor = EVENT_TYPE_COLORS[event.event_type] || '#7B2FBE';
            const isBooked = bookedIds.has(event.id);
            const spotsLeft = event.max_attendees ? event.max_attendees - (event.attendees_count || 0) : null;
            const isFull = spotsLeft !== null && spotsLeft <= 0;

            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-3xl overflow-hidden hover:border-[rgba(245,168,0,0.12)] transition-all duration-600">
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${typeColor}, transparent)` }} />
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xl text-[#F0E6FF] leading-tight">
                      {lang === 'fr' ? (event.title_fr || event.title_en) : event.title_en}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${event.location_type === 'online'
                      ? 'bg-[rgba(96,165,250,0.1)] text-[#60A5FA] border border-[rgba(96,165,250,0.2)]'
                      : 'bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)]'}`}>
                      {event.location_type === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {event.location_type === 'online' ? t('events.online') : t('events.onsite')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-[#F0E6FF]/50">
                    {event.host_name && (
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{event.host_name}</span>
                    )}
                    {event.event_date && (
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{event.event_date}</span>
                    )}
                    {event.event_time && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.event_time}</span>
                    )}
                  </div>

                  {(event.topic_en || event.topic_fr) && (
                    <div className="px-3 py-2 rounded-xl text-sm text-[#F0E6FF]/70 leading-relaxed"
                      style={{ background: `${typeColor}08`, border: `1px solid ${typeColor}15` }}>
                      <span className="text-[#F0E6FF]/40 text-xs uppercase tracking-wider block mb-1">{t('events.topic')}</span>
                      {lang === 'fr' ? (event.topic_fr || event.topic_en) : event.topic_en}
                    </div>
                  )}

                  {/* Spots remaining */}
                  {spotsLeft !== null && (
                    <p className={`text-xs ${spotsLeft <= 5 ? 'text-red-400' : 'text-[#F0E6FF]/30'}`}>
                      {isFull
                        ? (lang === 'fr' ? 'Complet' : 'Full')
                        : (lang === 'fr' ? `${spotsLeft} place${spotsLeft !== 1 ? 's' : ''} restante${spotsLeft !== 1 ? 's' : ''}` : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`)}
                    </p>
                  )}

                  <div className="golden-thread" />

                  <button
                    onClick={() => handleBook(event)}
                    disabled={(!isBooked && isFull) || bookingId === event.id}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isBooked
                        ? 'bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.3)] text-[#F5A800]'
                        : 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400 shadow-[0_0_15px_rgba(245,168,0,0.2)]'
                    }`}>
                    {bookingId === event.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isBooked ? (
                      <><Check className="w-4 h-4" /> {t('events.booked_label')}</>
                    ) : (
                      t('events.book_now')
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}