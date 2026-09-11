import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ChevronLeft, Loader2, MessageCircle, Layers } from 'lucide-react';
import NinaAvatar from '@/components/NinaAvatar';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation, getPricingForCompatibility, NINA_QUESTIONS } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import CardStack from '@/components/cards/CardStack';
import ConnectionBriefCard from '@/components/ConnectionBriefCard';
import { GOING_DEEPER, DEEP_CONNECTION, DEEP_CONNECTION_GATE } from '@/lib/connectionCardContent';
import { usePhotoAccess, primaryPhotoUrl } from '@/hooks/usePhotoAccess';

const ARCHETYPE_COLORS = { blue: '#60A5FA', black: '#9CA3AF', purple: '#A855F7' };

export default function Messages() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [connections, setConnections] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [input, setInput] = useState('');
  const [showNinaSuggestions, setShowNinaSuggestions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [limitError, setLimitError] = useState('');
  const [showCards, setShowCards] = useState(false);
  const { data: limitsData, refresh: refreshLimits } = usePlanLimits();
  const bottomRef = useRef(null);

  // Photos for unlocked conversations come via authorized delivery.
  const convToIds = connections.map(c => c.to_user_id);
  const { photoData } = usePhotoAccess(convToIds, JSON.stringify(convToIds));

  const cardDecks = [
    { id: 'going_deeper', label_en: 'Going Deeper', label_fr: 'Aller plus loin', color: '#7B2FBE', cards: GOING_DEEPER },
    { id: 'deep_connection', label_en: 'Deep Connection', label_fr: 'Connexion profonde', color: '#F5A800', gate: DEEP_CONNECTION_GATE, cards: DEEP_CONNECTION },
  ];

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (activeConvId) loadMessages(activeConvId); }, [activeConvId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);
    const conns = await base44.entities.Connection.filter({ from_user_id: user.id, is_unlocked: true });
    const toIds = [...new Set(conns.map(c => c.to_user_id))];
    let profileMap = {};
    if (toIds.length) {
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

  const loadMessages = async (convId) => {
    setMessagesLoading(true);
    const msgs = await base44.entities.Message.filter({ conversation_id: convId }, '-created_date', 50);
    setMessages(msgs.reverse());
    setMessagesLoading(false);
    // Mark messages as read
    await Promise.all(
      msgs.filter(m => !m.is_read && m.to_user_id === currentUser?.id)
        .map(m => base44.entities.Message.update(m.id, { is_read: true }))
    );
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || !currentUser) return;
    setLimitError('');
    const activeConn = connections.find(c => c.id === activeConvId);
    if (!activeConn) return;
    try {
      const res = await base44.functions.invoke('sendMessage', {
        conversation_id: activeConvId,
        to_user_id: activeConn.to_user_id,
        content: input.trim(),
      });
      if (res.data?.success && res.data?.message) {
        setMessages(prev => [...prev, res.data.message]);
        setInput('');
        setShowNinaSuggestions(false);
        refreshLimits();
      } else {
        setLimitError(res.data?.error || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
      }
    } catch (e) {
      setLimitError(e?.response?.data?.error || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
    }
  };

  if (activeConvId) {
    const activeConn = connections.find(c => c.id === activeConvId);
    const profile = profiles[activeConn?.to_user_id];
    const pricing = getPricingForCompatibility(activeConn?.compatibility_score || 0);
    const archetypeColor = ARCHETYPE_COLORS[profile?.dating_archetype] || '#A855F7';

    return (
      <div className="flex flex-col h-screen bg-[#0B0510] pt-16"
        style={{ background: `radial-gradient(ellipse at bottom center, ${archetypeColor}08 0%, #0B0510 60%)` }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[rgba(240,230,255,0.06)]"
          style={{ background: 'rgba(11,5,16,0.9)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setActiveConvId(null)} className="text-[#F0E6FF]/50 hover:text-[#F0E6FF] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center overflow-hidden shrink-0">
            {primaryPhotoUrl(photoData, activeConn?.to_user_id)
              ? <img src={primaryPhotoUrl(photoData, activeConn?.to_user_id)} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-serif">{profile?.display_name?.[0]}</span>
            }
          </div>
          <div className="flex-1">
            <p className="text-[#F0E6FF] font-medium text-sm">{profile?.display_name}</p>
            <p className="text-[#F0E6FF]/40 text-xs">{activeConn?.compatibility_score || 0}% {t('home.compatibility')}</p>
          </div>
          <button onClick={() => setShowCards(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full glass-card text-[#F0E6FF]/70 text-xs font-medium hover:text-[#F5A800] transition-all"
            title={lang === 'fr' ? 'Cartes de connexion' : 'Connection cards'}>
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'fr' ? 'Cartes' : 'Cards'}</span>
          </button>
          <div className="text-right">
            <div className="text-[#F5A800] text-xs font-medium">${pricing.msg.toFixed(2)}</div>
            <div className="text-[#F0E6FF]/30 text-[10px]">{t('messages.cost_per_msg')}</div>
          </div>
        </div>

        <ConnectionBriefCard connectionId={activeConvId} lang={lang} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messagesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="w-6 h-6 text-[#F5A800]/50 mx-auto" />
              <p className="text-[#F0E6FF]/60 text-sm font-serif">
                {lang === 'fr' ? 'Démarrez la conversation' : 'Start the conversation'}
              </p>
              <p className="text-[#F0E6FF]/40 text-xs leading-relaxed max-w-xs mx-auto">
                {lang === 'fr'
                  ? 'Votre premier message lance la conversation et coûte 1 BBP. Soyez authentique — partagez ce qui vous a attiré dans cette connexion. Les réponses sont gratuites.'
                  : 'Your first message starts the conversation and costs 1 BBP Credit. Be genuine — share what drew you to this connection. Replies are free.'}
              </p>
            </div>
          ) : (
            messages.map(msg => {
              const isOwn = msg.from_user_id === currentUser?.id;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                      {primaryPhotoUrl(photoData, activeConn?.to_user_id)
                        ? <img src={primaryPhotoUrl(photoData, activeConn?.to_user_id)} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-xs font-serif">{profile?.display_name?.[0]}</span>
                      }
                    </div>
                  )}
                  <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${isOwn ? 'bg-[#7B2FBE] text-[#F0E6FF] rounded-tr-sm' : 'glass-card text-[#F0E6FF]/90 rounded-tl-sm'}`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${isOwn ? 'text-[rgba(240,230,255,0.5)]' : 'text-[rgba(240,230,255,0.3)]'}`}>
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isOwn && msg.cost > 0 && <span className="ml-1">· ${msg.cost.toFixed(2)}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Nina suggestions */}
        <AnimatePresence>
          {showNinaSuggestions && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="px-4 pb-2">
              <div className="glass-card-gold rounded-2xl p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <NinaAvatar size="sm" />
                  <span className="text-[#F5A800] text-xs font-medium">{t('messages.nina_suggestion')}</span>
                </div>
                {NINA_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button key={i} onClick={() => { setInput(q); setShowNinaSuggestions(false); }}
                    className="w-full text-left text-xs text-[#F0E6FF]/70 py-2 px-3 rounded-xl hover:bg-[rgba(245,168,0,0.08)] transition-all border border-[rgba(245,168,0,0.1)]">
                    "{q}"
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[rgba(240,230,255,0.06)]"
          style={{ background: 'rgba(11,5,16,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="flex gap-2">
            <button onClick={() => setShowNinaSuggestions(s => !s)}
              className={`p-3 rounded-xl transition-all ${showNinaSuggestions ? 'bg-[rgba(245,168,0,0.15)] text-[#F5A800]' : 'glass-card text-[#F0E6FF]/40 hover:text-[#F5A800]'}`}>
              <Sparkles className="w-4 h-4" />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={t('messages.type_message')}
              className="flex-1 glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(123,47,190,0.4)] bg-transparent placeholder-[rgba(240,230,255,0.2)]"
            />
            <button onClick={handleSend} disabled={!input.trim()}
              className="p-3 bg-[#F5A800] rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(245,168,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed">
              <Send className="w-4 h-4 text-[#0B0510]" />
            </button>
          </div>
          {limitError && (
            <p className="text-red-400 text-xs mt-2 text-center">{limitError}</p>
          )}
        </div>

        {/* Connection cards — Going Deeper & Deep Connection (post-match only) */}
        {showCards && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-0 md:px-6"
            style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowCards(false); }}>
            <div className="w-full max-w-lg bg-[#1F1026] rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Cartes de connexion' : 'Connection Cards'}</h2>
                <button onClick={() => setShowCards(false)} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] text-xl">✕</button>
              </div>
              <div className="h-[60vh]">
                <CardStack decks={cardDecks} lang={lang} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('messages.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{lang === 'fr' ? 'Vos conversations conscientes' : 'Your conscious conversations'}</p>
        {limitsData && (
          <p className="text-[#F0E6FF]/30 text-xs mt-2">
            {lang === 'fr'
              ? `Messages ce mois : ${limitsData.usage.messages_used} / ${limitsData.limits.messages_per_month === 'unlimited' ? '∞' : limitsData.limits.messages_per_month}`
              : `Messages this month: ${limitsData.usage.messages_used} / ${limitsData.limits.messages_per_month === 'unlimited' ? '∞' : limitsData.limits.messages_per_month}`}
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" /></div>
      ) : connections.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[rgba(123,47,190,0.1)] flex items-center justify-center mx-auto">
            <MessageCircle className="w-7 h-7 text-[#7B2FBE]" />
          </div>
          <p className="text-[#F0E6FF]/60 font-serif text-base">
            {lang === 'fr' ? 'Aucune conversation pour l\'instant' : 'No conversations yet'}
          </p>
          <p className="text-[#F0E6FF]/30 text-sm">
            {lang === 'fr' ? 'Déverrouillez une correspondance pour commencer à écrire.' : 'Unlock a match to start messaging.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn, i) => {
            const profile = profiles[conn.to_user_id];
            if (!profile) return null;
            const pricing = getPricingForCompatibility(conn.compatibility_score || 0);
            return (
              <motion.button key={conn.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActiveConvId(conn.id)}
                className="w-full glass-card rounded-2xl p-4 text-left flex items-center gap-3 hover:border-[rgba(245,168,0,0.2)] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0 overflow-hidden">
                  {primaryPhotoUrl(photoData, conn.to_user_id)
                    ? <img src={primaryPhotoUrl(photoData, conn.to_user_id)} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-serif">{profile.display_name?.[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#F0E6FF] font-medium text-sm">{profile.display_name}, {profile.age}</p>
                    <span className="text-[#F5A800] text-xs font-medium">{conn.compatibility_score || 0}%</span>
                  </div>
                  <p className="text-[#F0E6FF]/40 text-xs truncate">
                    {lang === 'fr' ? 'Appuyez pour écrire…' : 'Tap to message…'}
                  </p>
                  <p className="text-[#F0E6FF]/25 text-[10px] mt-0.5">${pricing.msg.toFixed(2)}/msg</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}