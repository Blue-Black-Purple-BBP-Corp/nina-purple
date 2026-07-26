import React, { useEffect, useRef, useState } from 'react';
import { Music, Play, Volume2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

// Public file served from /public/audio — space encoded for the URL.
const AUDIO_SRC = '/audio/NinaPurple%20x%20Martinique.m4a';

export default function ExperiencesAudio() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Autoplay the moment the audio is ready to play. Waiting for `canplay`
    // avoids calling play() before enough has buffered (a common cause of
    // silent autoplay failure).
    const tryPlay = () => {
      audio.play()
        .then(() => { setPlaying(true); setBlocked(false); })
        .catch((err) => {
          if (err && err.name === 'NotAllowedError') setBlocked(true);
          /* autoplay blocked — surface a one-tap affordance */
        });
    };
    if (audio.readyState >= 3) {
      tryPlay();
    } else {
      audio.addEventListener('canplay', tryPlay, { once: true });
    }
    // Browsers that block autoplay until a gesture: resume on first interaction.
    const onFirstGesture = () => {
      if (audio.paused) tryPlay();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);
    window.addEventListener('touchstart', onFirstGesture);
    return () => {
      audio.removeEventListener('canplay', tryPlay);
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
    };
  }, []);

  return (
    <div
      className="fixed bottom-5 left-5 z-[90] glass-card rounded-2xl px-3 py-2.5 flex items-center gap-2.5 animate-fade-in-up"
      style={{ width: 'min(20rem, calc(100vw - 7rem))' }}
      role="region"
      aria-label={isFr ? 'Lecteur audio Nina Purple' : 'Nina Purple audio player'}
    >
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => { const a = audioRef.current; if (a) { a.play().then(() => { setPlaying(true); setBlocked(false); }).catch(() => {}); } }}
          className="relative flex items-center justify-center w-8 h-8 rounded-full shrink-0"
          style={{ background: 'rgba(245,168,0,0.12)', border: '1px solid rgba(245,168,0,0.3)' }}
          aria-label={isFr ? 'Lire la musique' : 'Play music'}
        >
          {blocked
            ? <Play className="w-4 h-4 text-[#F5A800]" fill="currentColor" />
            : <Music className="w-4 h-4 text-[#F5A800]" />}
          {playing && !blocked && (
            <span className="absolute inset-0 rounded-full border border-[#F5A800]/50 animate-ping" />
          )}
          {blocked && (
            <span className="absolute inset-0 rounded-full border border-[#F5A800]/60 animate-ping" />
          )}
        </button>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-widest text-[#F5A800] font-semibold">
            {blocked
              ? (isFr ? 'Appuyez pour écouter' : 'Tap to play')
              : (isFr ? 'En lecture' : 'Now Playing')}
          </div>
          <div className="text-[11px] text-[#F0E6FF]/80 font-medium truncate max-w-[7rem]">
            Nina Purple × Martinique
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        autoPlay
        loop
        controls
        preload="auto"
        className="flex-1 min-w-0 h-8"
        style={{ filter: 'invert(0.9) hue-rotate(180deg)' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}