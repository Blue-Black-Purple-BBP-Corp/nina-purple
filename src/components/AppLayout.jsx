import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircle, Calendar, User, Star, LogIn, Loader2 } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import NinaAvatar from './NinaAvatar';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const location = useLocation();
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      setIsAuthenticated(auth);
      setAuthChecked(true);
    });
  }, []);

  const navItems = [
    { path: '/home', icon: Home, label: t('nav.home') },
    { path: '/connections', icon: Users, label: t('nav.connections') },
    { path: '/messages', icon: MessageCircle, label: t('nav.messages') },
    { path: '/events', icon: Calendar, label: t('nav.events') },
    { path: '/community', icon: Star, label: t('nav.community') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const isActive = (path) => location.pathname === path;

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0510]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0510] flex flex-col items-center justify-center px-6 gap-8 text-center">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <NinaAvatar size="xl" glow />
        <div className="space-y-2">
          <h2 className="font-serif text-3xl text-[#F0E6FF]">
            {lang === 'fr' ? 'Bon retour' : 'Welcome back'}
          </h2>
          <p className="text-[#F0E6FF]/50 text-sm max-w-xs">
            {lang === 'fr'
              ? 'Connectez-vous pour accéder à votre espace Nina Purple'
              : 'Sign in to access your Nina Purple sanctuary'}
          </p>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          <button
            onClick={() => base44.auth.redirectToLogin(location.pathname)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.3)]">
            <LogIn className="w-5 h-5" />
            {lang === 'fr' ? 'Se connecter' : 'Sign In'}
          </button>
          <a href="/onboarding"
            className="block w-full py-3 glass-card rounded-full text-[#F0E6FF]/60 text-sm hover:text-[#F5A800] transition-colors">
            {lang === 'fr' ? 'Pas encore membre ? Commencer' : "New here? Begin your journey"}
          </a>
          <a href="/"
            className="block text-[#F0E6FF]/20 text-xs hover:text-[#F0E6FF]/40 transition-colors pt-1">
            {lang === 'fr' ? '← Retour à l\'accueil' : '← Back to home'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0510] flex flex-col">
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(180deg, rgba(11,5,16,0.95) 0%, rgba(11,5,16,0) 100%)', backdropFilter: 'blur(20px)' }}>
        <Link to="/home" className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/bcc45d7e3_CopyofNPhorizontalcopia.png"
            alt="Nina Purple"
            className="h-8 object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24 pt-16">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0510] [data-theme='light']_&:bg-white"
        style={{ backdropFilter: 'blur(40px)', borderTop: '0.5px solid rgba(240,230,255,0.08)' }}>
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-300 min-w-[52px] ${
                isActive(path)
                  ? 'text-[#F5A800]'
                  : 'text-[#F0E6FF]/40 hover:text-[#F0E6FF]/70'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all ${isActive(path) ? 'drop-shadow-[0_0_8px_rgba(245,168,0,0.6)]' : ''}`} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
              {isActive(path) && (
                <div className="absolute bottom-0 w-1 h-1 rounded-full bg-[#F5A800]" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}