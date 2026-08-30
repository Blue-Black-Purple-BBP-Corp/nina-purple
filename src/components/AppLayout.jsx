import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, MessageCircle, Calendar, User, Star, LogIn, Loader2, Heart, AlertCircle, RefreshCw } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import NinaAvatar from './NinaAvatar';
import { ninaHorizontal } from '@/lib/images';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [gateState, setGateState] = useState('loading'); // 'loading' | 'error' | 'unauthenticated' | 'ready'

  const checkGate = async () => {
    setGateState('loading');
    try {
      const res = await base44.functions.invoke('getOnboardingStatus', {});
      const data = res.data;
      if (!data?.authenticated) {
        setGateState('unauthenticated');
        return;
      }
      if (data.onboarding_status === 'complete') {
        setGateState('ready');
        return;
      }
      // Incomplete — admins bypass member onboarding so they can reach the dashboard
      try {
        const me = await base44.auth.me();
        if (me && (me.role === 'admin' || me.role === 'super_admin')) {
          setGateState('ready');
          return;
        }
      } catch {}
      // Incomplete — redirect to onboarding via SPA navigate (no full reload)
      navigate('/onboarding', { replace: true });
    } catch (e) {
      console.error('Onboarding gate check failed:', e);
      setGateState('error');
    }
  };

  useEffect(() => {
    checkGate();
  }, []);

  const navItems = [
    { path: '/home', icon: Home, label: t('nav.home') },
    { path: '/connections', icon: Users, label: t('nav.connections') },
    { path: '/messages', icon: MessageCircle, label: t('nav.messages') },
    { path: '/events', icon: Calendar, label: t('nav.events') },
    { path: '/community', icon: Star, label: t('nav.community') },
    { path: '/relationship', icon: Heart, label: lang === 'fr' ? 'Relation' : 'Relationship' },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const isActive = (path) => location.pathname === path;

  if (gateState === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0510]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (gateState === 'error') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0510] gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-[#F0E6FF]/60 text-sm text-center max-w-xs">
          {lang === 'fr' ? 'Une erreur est survenue lors du chargement.' : 'Something went wrong while loading.'}
        </p>
        <button onClick={checkGate} className="px-6 py-3 glass-card rounded-full text-[#F0E6FF] flex items-center gap-2 hover:border-[rgba(245,168,0,0.3)] transition-all">
          <RefreshCw className="w-4 h-4" />
          {lang === 'fr' ? 'Réessayer' : 'Retry'}
        </button>
      </div>
    );
  }

  if (gateState === 'unauthenticated') {
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
          <Link
            to={`/login${location.pathname !== '/' && location.pathname !== '/login' ? `?next=${encodeURIComponent(location.pathname)}` : ''}`}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.3)]">
            <LogIn className="w-5 h-5" />
            {lang === 'fr' ? 'Se connecter' : 'Sign In'}
          </Link>
          <Link to="/register"
            className="block w-full py-3 glass-card rounded-full text-[#F0E6FF]/60 text-sm hover:text-[#F5A800] transition-colors">
            {lang === 'fr' ? 'Pas encore membre ? Commencer' : "New here? Begin your journey"}
          </Link>
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
            src={ninaHorizontal}
            alt="Nina Purple"
            className="h-8 object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
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