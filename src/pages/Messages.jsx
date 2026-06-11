import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ChevronLeft } from 'lucide-react';
import NinaAvatar from '@/components/NinaAvatar';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation, getPricingForCompatibility, NINA_QUESTIONS } from '@/lib/i18n';

const MOCK_CONVERSATIONS = [
  { id: '1', name: 'Imani M.', age: 28, city: 'Paris', compatibility: 87, is_unlocked: true, archetype: 'blue', last_message: "I'm free this Saturday, want to hike up to Overlook Mountain?", time: '2h ago', unread: 1 },
  { id: '2', name: 'Darrell G.', age: 36, city: 'London', compatibility: 92, is_unlocked: false, archetype: 'purple', last_message: lang => lang === 'fr' ? 'Non déverrouillé' : 'Not unlocked yet', time: '', unread: 0 },
];

const MOCK_MESSAGES = [
  { id: '1', from: 'Imani M.', content: "I'm free this Saturday, you want to take that trail hike up to Overlook Mountain? Maybe grab a meal?", own: false, time: '2:30 PM' },
  { id: '2', from: 'me', content: "OMG! Yes! I love that place and you know I love to eat... but I have a few errands to run. What time?", own: true, time: '2:35 PM' },
  { id: '3', from: 'Imani M.', content: "I want to pick a time that works the best for both of us, no pressure. How about you let me know when it gets closer?", own: false, time: '2:40 PM' },
  { id: '4', from: 'me', content: "Awesome, I'm sure I can rearrange some things! I will let you know on Friday before lunch. Super excited to see you!", own: true, time: '2:45 PM' },
  { id: '5', from: 'Imani M.', content: "Likewise :) Talk to you soon!", own: false, time: '2:46 PM' },
];

const ARCHETYPE_COLORS = { blue: '#60A5FA', black: '#9CA3AF', purple: '#A855F7' };

export default function Messages() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [activeConv, setActiveConv] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showNinaSuggestions, setShowNinaSuggestions] = useState(false);

  const activeConvData = MOCK_CONVERSATIONS.find(c => c.id === activeConv);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), from: 'me', content: input, own: true, time: 'Now' }]);
    setInput('');
  };

  if (activeConv) {
    const pricing = getPricingForCompatibility(activeConvData?.compatibility || 0);
    const archetypeColor = ARCHETYPE_COLORS[activeConvData?.archetype] || '#A855F7';

    return (
      <div className="flex flex-col h-screen bg-[#0B0510] pt-16"
        style={{ background: `radial-gradient(ellipse at bottom center, ${archetypeColor}08 0%, #0B0510 60%)` }}>
        {/* Chat header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-[rgba(240,230,255,0.06)]"
          style={{ background: 'rgba(11,5,16,0.9)', backdropFilter: 'blur(20px)' }}>
          <button onClick={() => setActiveConv(null)} className="text-[#F0E6FF]/50 hover:text-[#F0E6FF] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center">
            <span className="text-white font-serif">{activeConvData?.name[0]}</span>
          </div>
          <div className="flex-1">
            <p className="text-[#F0E6FF] font-medium text-sm">{activeConvData?.name}</p>
            <p className="text-[#F0E6FF]/40 text-xs">{activeConvData?.compatibility}% {t('home.compatibility')}</p>
          </div>
          <div className="text-right">
            <div className="text-[#F5A800] text-xs font-medium">${pricing.msg.toFixed(2)}</div>
            <div className="text-[#F0E6FF]/30 text-[10px]">{t('messages.cost_per_msg')}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.own ? 'justify-end' : 'justify-start'} gap-2`}>
              {!msg.own && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0 mt-1">
                  <span className="text-white text-xs font-serif">{activeConvData?.name[0]}</span>
                </div>
              )}
              <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.own
                  ? 'bg-[#7B2FBE] text-[#F0E6FF] rounded-tr-sm'
                  : 'glass-card text-[#F0E6FF]/90 rounded-tl-sm'}`}>
                {msg.content}
                <div className={`text-[10px] mt-1 ${msg.own ? 'text-[rgba(240,230,255,0.5)]' : 'text-[rgba(240,230,255,0.3)]'}`}>
                  {msg.time}
                  {msg.own && <span className="ml-1">· ${pricing.msg.toFixed(2)}</span>}
                </div>
              </div>
            </motion.div>
          ))}
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
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={t('messages.type_message')}
              className="flex-1 glass-card rounded-xl px-4 py-3 text-[#F0E6FF] text-sm outline-none focus:border-[rgba(123,47,190,0.4)] bg-transparent placeholder-[rgba(240,230,255,0.2)]"
            />
            <button onClick={handleSend}
              className="p-3 bg-[#F5A800] rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(245,168,0,0.3)]">
              <Send className="w-4 h-4 text-[#0B0510]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('messages.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{lang === 'fr' ? 'Vos conversations conscientes' : 'Your conscious conversations'}</p>
      </motion.div>

      <div className="space-y-3">
        {MOCK_CONVERSATIONS.map((conv, i) => {
          const pricing = getPricingForCompatibility(conv.compatibility);
          return (
            <motion.button key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => conv.is_unlocked && setActiveConv(conv.id)}
              className={`w-full glass-card rounded-2xl p-4 text-left flex items-center gap-3 transition-all duration-300 ${conv.is_unlocked ? 'hover:border-[rgba(245,168,0,0.2)]' : 'opacity-60'}`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0">
                <span className="text-white font-serif">{conv.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#F0E6FF] font-medium text-sm">{conv.name}, {conv.age}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5A800] text-xs font-medium">{conv.compatibility}%</span>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#F5A800] text-[#0B0510] text-[10px] font-bold flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[#F0E6FF]/40 text-xs truncate">
                  {conv.is_unlocked ? (typeof conv.last_message === 'function' ? conv.last_message(lang) : conv.last_message) : t('connections.locked')}
                </p>
                <p className="text-[#F0E6FF]/25 text-[10px] mt-0.5">${pricing.msg.toFixed(2)}/msg</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}