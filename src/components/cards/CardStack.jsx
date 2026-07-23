import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Sparkles, Lock } from 'lucide-react';

// Reusable card-stack UI for the Connection Cards modules.
// No text input, no server calls. Decks may carry an optional `gate`
// (a soft pacing confirmation screen, NOT a payment gate).
//
// decks: [{ id, label_en, label_fr, color, cards: [{en, fr}], gate?: {...} }]
export default function CardStack({ decks, lang }) {
  const isFr = lang === 'fr';
  const [activeDeckId, setActiveDeckId] = useState(decks[0]?.id);
  const [indices, setIndices] = useState(() => Object.fromEntries(decks.map((d) => [d.id, 0])));
  const [unlocked, setUnlocked] = useState(() => new Set(decks.filter((d) => !d.gate).map((d) => d.id)));
  const [pendingGate, setPendingGate] = useState(null);
  const [dir, setDir] = useState(1);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];
  const index = indices[activeDeckId] ?? 0;
  const total = activeDeck?.cards?.length || 0;
  const card = activeDeck?.cards?.[index];
  const gate = decks.find((d) => d.id === pendingGate)?.gate;

  const selectDeck = (d) => {
    if (d.gate && !unlocked.has(d.id)) { setPendingGate(d.id); return; }
    setActiveDeckId(d.id);
  };

  const confirmGate = () => {
    if (!pendingGate) return;
    setUnlocked((prev) => { const n = new Set(prev); n.add(pendingGate); return n; });
    setActiveDeckId(pendingGate);
    setPendingGate(null);
  };

  const go = (delta) => {
    setDir(delta);
    setIndices((prev) => ({ ...prev, [activeDeckId]: Math.min(total - 1, Math.max(0, (prev[activeDeckId] ?? 0) + delta)) }));
  };

  const shuffle = () => {
    setIndices((prev) => ({ ...prev, [activeDeckId]: Math.floor(Math.random() * total) }));
    setDir(0);
  };

  if (!activeDeck) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Deck tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 px-0.5">
        {decks.map((d) => {
          const active = d.id === activeDeckId;
          const isLocked = d.gate && !unlocked.has(d.id);
          return (
            <button
              key={d.id}
              onClick={() => selectDeck(d)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                active ? 'text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]'
              }`}
              style={active ? { background: d.color } : {}}
            >
              {isLocked && <Lock className="w-3 h-3" />}
              {isFr ? d.label_fr : d.label_en}
            </button>
          );
        })}
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {pendingGate && gate ? (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card-gold rounded-3xl p-8 max-w-sm text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[rgba(245,168,0,0.15)] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-[#F5A800]" />
              </div>
              <h3 className="font-serif text-lg text-[#F0E6FF] mb-2">{isFr ? gate.title_fr : gate.title_en}</h3>
              <p className="text-[#F0E6FF]/60 text-sm leading-relaxed mb-6">{isFr ? gate.body_fr : gate.body_en}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setPendingGate(null)}
                  className="px-5 py-2.5 rounded-full glass-card text-[#F0E6FF]/60 text-sm hover:text-[#F0E6FF] transition-all"
                >
                  {isFr ? 'Pas encore' : 'Not yet'}
                </button>
                <button
                  onClick={confirmGate}
                  className="px-6 py-2.5 rounded-full bg-[#F5A800] text-[#0B0510] text-sm font-bold hover:bg-yellow-400 transition-all"
                >
                  {isFr ? gate.cta_fr : gate.cta_en}
                </button>
              </div>
            </motion.div>
          ) : card ? (
            <motion.div
              key={`${activeDeckId}-${index}`}
              initial={{ opacity: 0, x: dir > 0 ? 40 : dir < 0 ? -40 : 0, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: dir > 0 ? -40 : dir < 0 ? 40 : 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="glass-card rounded-3xl p-8 w-full max-w-sm min-h-[260px] flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5" style={{ background: `${activeDeck.color}18` }}>
                <Sparkles className="w-5 h-5" style={{ color: activeDeck.color }} />
              </div>
              <p className="text-[#F0E6FF] text-lg leading-relaxed font-serif italic">{isFr ? card.fr : card.en}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {!pendingGate && (
        <div className="flex items-center justify-center gap-5 mt-5">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-[#F0E6FF]/70 hover:text-[#F5A800] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[#F0E6FF]/40 text-xs font-medium tabular-nums">{index + 1} / {total}</span>
          <button
            onClick={() => go(1)}
            disabled={index === total - 1}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-[#F0E6FF]/70 hover:text-[#F5A800] disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={shuffle}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-[#F0E6FF]/70 hover:text-[#F5A800] transition-all"
            title={isFr ? 'Tirer au hasard' : 'Shuffle'}
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}