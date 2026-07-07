import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'nina_cookie_consent';

export default function CookieConsent() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
    setVisible(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, 'dismissed'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] px-4 pb-4 md:pb-6 pointer-events-none">
      <div className="max-w-3xl mx-auto glass-card rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-[0_-4px_30px_rgba(0,0,0,0.3)] pointer-events-auto">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-[rgba(245,168,0,0.12)] flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4 text-[#F5A800]" />
          </div>
          <p className="text-xs leading-relaxed text-foreground/70">
            {lang === 'fr'
              ? <>Nous utilisons des cookies essentiels pour l'authentification, la langue et le thème. Pas de publicité ni de pistage tiers. Voir notre <Link to="/privacy" className="text-[#F5A800] underline">politique de confidentialité</Link>.</>
              : <>We use essential cookies for authentication, language, and theme. No advertising or third-party tracking. See our <Link to="/privacy" className="text-[#F5A800] underline">Privacy Policy</Link>.</>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleAccept}
            className="px-4 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-xs font-bold uppercase tracking-wide hover:bg-yellow-400 transition-all">
            {lang === 'fr' ? 'Accepter' : 'Accept'}
          </button>
          <button onClick={handleDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
            title={lang === 'fr' ? 'Fermer' : 'Close'}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}