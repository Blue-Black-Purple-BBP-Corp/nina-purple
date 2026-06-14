import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Clock, Check, Loader2, Globe, MapPin, Plus, X, Share2, Link as LinkIcon, Copy } from 'lucide-react';
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

const EVENT_TYPES_EN = ['meet_greet', 'consciousness_talk', 'cultural', 'speed_dating', 'workshop'];
const EVENT_TYPE_LABELS = {
  meet_greet:         { en: 'Meet & Greet',          fr: 'Rencontre' },
  consciousness_talk: { en: 'Consciousness Talk',    fr: 'Conversation Conscience' },
  cultural:           { en: 'Cultural',              fr: 'Culturel' },
  speed_dating:       { en: 'Speed Dating',          fr: 'Speed Dating' },
  workshop:           { en: 'Workshop',              fr: 'Atelier' },
};

function ShareSheet({ event, onClose, lang }) {
  const [copied, setCopied] = useState(false);
  const eventUrl = `${window.location.origin}/events`;
  const title = lang === 'fr' ? (event.title_fr || event.title_en) : event.title_en;
  const text = `${title} — ${event.event_date}${event.event_time ? ' · ' + event.event_time : ''}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(event.connection_link || eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = (platform) => {
    const encoded = encodeURIComponent(text);
    const link = encodeURIComponent(event.connection_link || eventUrl);
    const urls = {
      whatsapp: `https://wa.me/?text=${encoded}%20${link}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${encoded}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encoded}&url=${link}`,
      email:    `mailto:?subject=${encodeURIComponent(title)}&body=${encoded}%0A${link}`,
      sms:      `sms:?body=${encoded}%20${link}`,
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/80 backdrop-blur-md z-[60]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="fixed bottom-0 left-0 right-0 z-[70] p-4 md:inset-0 md:flex md:items-center md:justify-center">
        <div className="glass-card-gold rounded-3xl rounded-b-none md:rounded-3xl p-6 max-w-sm mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-[#F0E6FF]">{lang === 'fr' ? 'Partager l\'événement' : 'Share Event'}</h3>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          <p className="text-[#F0E6FF]/60 text-sm truncate">{lang === 'fr' ? (event.title_fr || event.title_en) : event.title_en}</p>

          {event.connection_link && (
            <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2">
              <LinkIcon className="w-4 h-4 text-[#F5A800] shrink-0" />
              <span className="text-[#F0E6FF]/60 text-xs truncate flex-1">{event.connection_link}</span>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'whatsapp', label: 'WhatsApp', bg: '#25D366', emoji: '💬' },
              { id: 'facebook', label: 'Facebook', bg: '#1877F2', emoji: '👤' },
              { id: 'twitter',  label: 'X / Twitter', bg: '#000000', emoji: '𝕏' },
              { id: 'email',    label: 'Email',    bg: '#7B2FBE', emoji: '✉️' },
              { id: 'sms',      label: 'SMS',      bg: '#34C759', emoji: '📱' },
            ].map(p => (
              <button key={p.id} onClick={() => share(p.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:opacity-80 transition-all"
                style={{ background: `${p.bg}20`, border: `1px solid ${p.bg}40` }}>
                <span className="text-xl">{p.emoji}</span>
                <span className="text-[#F0E6FF]/50 text-[9px]">{p.label}</span>
              </button>
            ))}
          </div>

          <button onClick={copyLink}
            className="w-full py-3 glass-card rounded-xl flex items-center justify-center gap-2 text-sm text-[#F0E6FF]/70 hover:text-[#F5A800] transition-colors">
            <Copy className="w-4 h-4" />
            {copied ? (lang === 'fr' ? 'Copié !' : 'Copied!') : (lang === 'fr' ? 'Copier le lien' : 'Copy link')}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function CreateEventModal({ onClose, onCreated, lang, currentUser, userProfile }) {
  const [form, setForm] = useState({
    title_en: '', title_fr: '', host_name: userProfile?.display_name || currentUser?.full_name || '',
    event_date: '', event_time: '', location_type: 'online', location: '',
    connection_link: '', event_type: 'meet_greet', topic_en: '', topic_fr: '',
    max_attendees: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title_en || !form.event_date) return;
    setSaving(true);
    const created = await base44.entities.Event.create({
      ...form,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      attendees_count: 0,
      is_active: true,
    });
    onCreated(created);
    setSaving(false);
    onClose();
  };

  const inputClass = "w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(245,168,0,0.4)] bg-transparent placeholder-[rgba(240,230,255,0.25)]";
  const labelClass = "block text-[#F0E6FF]/50 text-xs uppercase tracking-wide mb-1";

  return (
    <>
      <div className="fixed inset-0 bg-[#0B0510]/90 backdrop-blur-md z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
        <div className="bg-[#1F1026] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-purple-500/30 p-6 pointer-events-auto space-y-4 max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Créer un événement' : 'Create Event'}</h2>
            <button onClick={onClose} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]"><X className="w-5 h-5" /></button>
          </div>

          <div>
            <label className={labelClass}>{lang === 'fr' ? 'Titre (EN)' : 'Title (EN)'} <span className="text-[#F5A800]">*</span></label>
            <input value={form.title_en} onChange={e => set('title_en', e.target.value)} className={inputClass} placeholder="Event title in English" />
          </div>
          <div>
            <label className={labelClass}>{lang === 'fr' ? 'Titre (FR)' : 'Title (FR)'}</label>
            <input value={form.title_fr} onChange={e => set('title_fr', e.target.value)} className={inputClass} placeholder="Titre de l'événement en français" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{lang === 'fr' ? 'Date' : 'Date'} <span className="text-[#F5A800]">*</span></label>
              <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{lang === 'fr' ? 'Heure' : 'Time'}</label>
              <input type="time" value={form.event_time} onChange={e => set('event_time', e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{lang === 'fr' ? 'Type' : 'Event Type'}</label>
            <select value={form.event_type} onChange={e => set('event_type', e.target.value)}
              className="w-full glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none bg-[#1F1026] border border-[rgba(240,230,255,0.08)]">
              {EVENT_TYPES_EN.map(k => (
                <option key={k} value={k} className="bg-[#1F1026]">
                  {lang === 'fr' ? EVENT_TYPE_LABELS[k].fr : EVENT_TYPE_LABELS[k].en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{lang === 'fr' ? 'Format' : 'Format'}</label>
            <div className="flex gap-2">
              {['online', 'onsite'].map(t => (
                <button key={t} onClick={() => set('location_type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${form.location_type === t ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60'}`}>
                  {t === 'online' ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {t === 'online' ? (lang === 'fr' ? 'En ligne' : 'Online') : (lang === 'fr' ? 'Présentiel' : 'In-person')}
                </button>
              ))}
            </div>
          </div>

          {form.location_type === 'online' ? (
            <div>
              <label className={labelClass}>{lang === 'fr' ? 'Lien de connexion (Zoom, Meet…)' : 'Connection link (Zoom, Meet…)'}</label>
              <input value={form.connection_link} onChange={e => set('connection_link', e.target.value)}
                className={inputClass} placeholder="https://zoom.us/j/..." />
            </div>
          ) : (
            <div>
              <label className={labelClass}>{lang === 'fr' ? 'Lieu / Adresse' : 'Location / Address'}</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} className={inputClass} placeholder="123 Main St, City" />
            </div>
          )}

          <div>
            <label className={labelClass}>{lang === 'fr' ? 'Sujet / Description' : 'Topic / Description'}</label>
            <textarea value={form.topic_en} onChange={e => set('topic_en', e.target.value)} rows={2}
              className={`${inputClass} resize-none`} placeholder="What's this event about?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{lang === 'fr' ? 'Nom de l\'hôte' : 'Host name'}</label>
              <input value={form.host_name} onChange={e => set('host_name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{lang === 'fr' ? 'Places max.' : 'Max spots'}</label>
              <input type="number" value={form.max_attendees} onChange={e => set('max_attendees', e.target.value)} className={inputClass} placeholder="∞" min="1" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !form.title_en || !form.event_date}
            className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? (lang === 'fr' ? 'Création…' : 'Creating…') : (lang === 'fr' ? 'Créer l\'événement' : 'Create Event')}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Events() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [bookedIds, setBookedIds] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [shareEvent, setShareEvent] = useState(null);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);
    const [profiles, data] = await Promise.all([
      base44.entities.UserProfile.filter({ user_id: user.id }),
      base44.entities.Event.filter({ is_active: true }, 'event_date', 50),
    ]);
    setUserProfile(profiles[0] || null);
    setEvents(data);
    setLoading(false);
  };

  const canCancel = (event) => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date + (event.event_time ? 'T' + event.event_time : ''));
    const now = new Date();
    const hoursUntil = (eventDate - now) / (1000 * 60 * 60);
    return hoursUntil >= 48;
  };

  const handleBook = async (event) => {
    if (bookingId === event.id) return;
    setBookingId(event.id);
    const isBooked = bookedIds.has(event.id);

    if (isBooked) {
      if (!canCancel(event)) {
        alert(lang === 'fr'
          ? 'Vous ne pouvez annuler que 48 heures ou plus avant l\'événement. Un frais de non-présentation de 10 $ USD s\'applique.'
          : 'You can only cancel 48+ hours before an event. A $10 USD no-show fee applies.');
        setBookingId(null);
        return;
      }
    }

    const newCount = isBooked
      ? Math.max(0, (event.attendees_count || 1) - 1)
      : (event.attendees_count || 0) + 1;
    await base44.entities.Event.update(event.id, { attendees_count: newCount });
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees_count: newCount } : e));
    setBookedIds(prev => {
      const next = new Set(prev);
      isBooked ? next.delete(event.id) : next.add(event.id);
      return next;
    });

    // Send confirmation email
    base44.functions.invoke('sendBookingEmail', {
      event_id: event.id,
      action: isBooked ? 'cancel' : 'book',
    }).catch(() => {});

    setBookingId(null);
  };

  const filtered = filter === 'booked' ? events.filter(e => bookedIds.has(e.id))
    : filter === 'mine' ? events.filter(e => e.host_name === (userProfile?.display_name || currentUser?.full_name))
    : events;

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" /></div>;
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('events.title')}</h1>
          <p className="text-[#F0E6FF]/40 text-sm">{t('events.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(245,168,0,0.25)] shrink-0 ml-3">
          <Plus className="w-4 h-4" />
          {lang === 'fr' ? 'Créer' : 'Create'}
        </button>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'all',    label: t('events.all') },
          { id: 'booked', label: t('events.booked') },
          { id: 'mine',   label: lang === 'fr' ? 'Mes événements' : 'My Events' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${filter === tab.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Calendar className="w-12 h-12 text-[#F0E6FF]/20 mx-auto" />
          <p className="text-[#F0E6FF]/40">
            {filter === 'booked' ? (lang === 'fr' ? 'Aucune réservation pour le moment' : 'No bookings yet')
              : filter === 'mine' ? (lang === 'fr' ? 'Vous n\'avez pas encore créé d\'événement' : 'You haven\'t created any events yet')
              : (lang === 'fr' ? 'Aucun événement à venir' : 'No upcoming events')}
          </p>
          {filter !== 'booked' && (
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all">
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Créer le premier événement' : 'Create the first event'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((event, i) => {
            const typeColor = EVENT_TYPE_COLORS[event.event_type] || '#7B2FBE';
            const isBooked = bookedIds.has(event.id);
            const spotsLeft = event.max_attendees ? event.max_attendees - (event.attendees_count || 0) : null;
            const isFull = spotsLeft !== null && spotsLeft <= 0;
            const isMyEvent = event.host_name === (userProfile?.display_name || currentUser?.full_name);

            return (
              <motion.div key={event.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass-card rounded-3xl overflow-hidden hover:border-[rgba(245,168,0,0.12)] transition-all duration-600">
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${typeColor}, transparent)` }} />
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-serif text-xl text-[#F0E6FF] leading-tight">
                        {lang === 'fr' ? (event.title_fr || event.title_en) : event.title_en}
                      </h3>
                      {isMyEvent && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)] mt-1 inline-block">
                          {lang === 'fr' ? 'Mon événement' : 'My event'}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 shrink-0 ${event.location_type === 'online'
                      ? 'bg-[rgba(96,165,250,0.1)] text-[#60A5FA] border border-[rgba(96,165,250,0.2)]'
                      : 'bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)]'}`}>
                      {event.location_type === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {event.location_type === 'online' ? t('events.online') : t('events.onsite')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-[#F0E6FF]/50">
                    {event.host_name && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{event.host_name}</span>}
                    {event.event_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{event.event_date}</span>}
                    {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.event_time}</span>}
                  </div>

                  {(event.topic_en || event.topic_fr) && (
                    <div className="px-3 py-2 rounded-xl text-sm text-[#F0E6FF]/70 leading-relaxed"
                      style={{ background: `${typeColor}08`, border: `1px solid ${typeColor}15` }}>
                      <span className="text-[#F0E6FF]/40 text-xs uppercase tracking-wider block mb-1">{t('events.topic')}</span>
                      {lang === 'fr' ? (event.topic_fr || event.topic_en) : event.topic_en}
                    </div>
                  )}

                  {event.connection_link && isBooked && (
                    <a href={event.connection_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] text-[#60A5FA] text-sm hover:opacity-80 transition-opacity">
                      <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{lang === 'fr' ? 'Rejoindre l\'événement' : 'Join event'}</span>
                    </a>
                  )}

                  {event.location && event.location_type === 'onsite' && (
                    <div className="flex items-center gap-2 text-sm text-[#F0E6FF]/50">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {spotsLeft !== null && (
                    <p className={`text-xs ${spotsLeft <= 5 ? 'text-red-400' : 'text-[#F0E6FF]/30'}`}>
                      {isFull
                        ? (lang === 'fr' ? 'Complet' : 'Full')
                        : (lang === 'fr' ? `${spotsLeft} place${spotsLeft !== 1 ? 's' : ''} restante${spotsLeft !== 1 ? 's' : ''}` : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`)}
                    </p>
                  )}

                  <div className="golden-thread" />

                  <div className="flex gap-2">
                    <button onClick={() => handleBook(event)}
                      disabled={(!isBooked && isFull) || bookingId === event.id}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isBooked
                          ? 'bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.3)] text-[#F5A800]'
                          : 'bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400 shadow-[0_0_15px_rgba(245,168,0,0.2)]'}`}>
                      {bookingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" />
                        : isBooked ? <><X className="w-4 h-4" /> {lang === 'fr' ? 'Annuler' : 'Cancel'}</>
                        : t('events.book_now')}
                    </button>
                    <button onClick={() => setShareEvent(event)}
                      className="px-4 py-3 glass-card rounded-xl text-[#F0E6FF]/50 hover:text-[#F5A800] transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  {isBooked && (
                    <p className="text-[#F0E6FF]/25 text-[10px] text-center">
                      {lang === 'fr' ? 'Annulation gratuite 48h+ avant l\'événement · Frais de non-présentation 10 $ USD' : 'Free cancellation 48h+ before event · $10 USD no-show fee'}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateEventModal
            onClose={() => setShowCreate(false)}
            onCreated={(e) => setEvents(prev => [e, ...prev])}
            lang={lang}
            currentUser={currentUser}
            userProfile={userProfile}
          />
        )}
      </AnimatePresence>

      {/* Share Sheet */}
      <AnimatePresence>
        {shareEvent && (
          <ShareSheet event={shareEvent} onClose={() => setShareEvent(null)} lang={lang} />
        )}
      </AnimatePresence>
    </div>
  );
}