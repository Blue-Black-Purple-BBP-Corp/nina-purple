import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Award, Phone, UserPlus,
  ShieldCheck, FileEdit, AlertTriangle,
  Gift, Ticket, Crown, Sparkles,
  MapPin, Bell, ScrollText,
  LogOut, ArrowLeftToLine, Menu, X, Shield,
} from 'lucide-react';
import { useStaffSession } from '@/lib/StaffSessionContext';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { ninaIcon } from '@/lib/images';

// Dedicated admin shell — top bar + vertical grouped sidebar.
// Does NOT import AppLayout or any member bottom-nav component.
// Section selection is local state lifted into the page (AdminPanel) and
// passed down; the shell is presentational chrome only.

export const NAV_GROUPS = [
  {
    id: 'overview',
    label_en: 'Overview',
    label_fr: 'Aperçu',
    items: [
      { id: 'overview', label_en: 'Overview / Stats', label_fr: 'Aperçu / Stats', icon: LayoutDashboard },
    ],
  },
  {
    id: 'people',
    label_en: 'People',
    label_fr: 'Personnes',
    items: [
      { id: 'members', label_en: 'Members', label_fr: 'Membres', icon: Users },
      { id: 'ambassadors', label_en: 'Ambassadors', label_fr: 'Ambassadeurs', icon: Award },
      { id: 'phone', label_en: 'Phone Verification', label_fr: 'Vérification téléphone', icon: Phone },
      { id: 'migration', label_en: 'Migration', label_fr: 'Migration', icon: UserPlus },
    ],
  },
  {
    id: 'trust_safety',
    label_en: 'Trust & Safety',
    label_fr: 'Confiance et sécurité',
    items: [
      { id: 'verification', label_en: 'Verification', label_fr: 'Vérification', icon: ShieldCheck },
      { id: 'change_requests', label_en: 'Change Requests', label_fr: 'Demandes de modification', icon: FileEdit },
      { id: 'moderation', label_en: 'Moderation', label_fr: 'Modération', icon: AlertTriangle },
    ],
  },
  {
    id: 'programs',
    label_en: 'Programs',
    label_fr: 'Programmes',
    items: [
      { id: 'rewards', label_en: 'Rewards', label_fr: 'Récompenses', icon: Gift },
      { id: 'special_codes', label_en: 'Special Codes', label_fr: 'Codes spéciaux', icon: Ticket },
      { id: 'program', label_en: 'Program Settings', label_fr: 'Paramètres programme', icon: Crown },
      { id: 'matchmaker', label_en: 'Matchmaker', label_fr: 'Entremetteur', icon: Sparkles },
    ],
  },
  {
    id: 'system',
    label_en: 'System',
    label_fr: 'Système',
    items: [
      { id: 'cities', label_en: 'Cities', label_fr: 'Villes', icon: MapPin },
      { id: 'notifications', label_en: 'Notifications', label_fr: 'Notifications', icon: Bell },
      { id: 'audit', label_en: 'Audit Log', label_fr: 'Journal d\'audit', icon: ScrollText },
    ],
  },
];

export default function AdminShell({ activeSection, onSectionChange, me, children }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const navigate = useNavigate();
  const { endSession } = useStaffSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [returning, setReturning] = useState(false);

  const handleReturn = async () => {
    setReturning(true);
    await endSession('manual_exit');
    navigate('/profile');
  };

  const handleSignOut = () => base44.auth.logout('/');

  const selectSection = (id) => {
    onSectionChange(id);
    setMobileNavOpen(false);
  };

  const Sidebar = (
    <nav className="flex flex-col gap-5 h-full overflow-y-auto py-5 px-3">
      {NAV_GROUPS.map(group => (
        <div key={group.id} className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#F0E6FF]/30 px-2 mb-1">
            {isFr ? group.label_fr : group.label_en}
          </p>
          {group.items.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all text-left ${
                  active
                    ? 'bg-[#F5A800] text-[#0B0510] font-semibold shadow-[0_0_18px_rgba(245,168,0,0.25)]'
                    : 'text-[#F0E6FF]/60 hover:text-[#F0E6FF] hover:bg-[rgba(240,230,255,0.04)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{isFr ? item.label_fr : item.label_en}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0B0510] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(240,230,255,0.08)] bg-[#150C1E]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden text-[#F0E6FF]/60 hover:text-[#F0E6FF] p-1"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <img src={ninaIcon} alt="Nina" className="w-8 h-8 object-contain" />
          <div className="leading-tight">
            <h1 className="font-serif text-base text-[#F0E6FF]">Nina Purple</h1>
            <p className="text-[10px] text-[#F0E6FF]/40 uppercase tracking-widest">Admin Console</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(123,47,190,0.18)', border: '1px solid rgba(123,47,190,0.45)', color: '#C792EA' }}>
            <Shield className="w-3 h-3" />
            {isFr ? 'Mode Admin' : 'Admin mode'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:block text-xs text-[#F0E6FF]/40 mr-1">
            {isFr ? 'Connecté :' : 'Signed in:'} <span className="text-[#F5A800]">{me?.role || '—'}</span>
          </span>
          <button
            onClick={handleReturn}
            disabled={returning}
            className="flex items-center gap-1.5 px-3 py-2 glass-card rounded-xl text-[#F0E6FF]/70 text-xs hover:text-[#F5A800] transition-colors disabled:opacity-50"
          >
            <ArrowLeftToLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isFr ? 'Retour au mode membre' : 'Return to Member mode'}</span>
            <span className="sm:hidden">{isFr ? 'Membre' : 'Member'}</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 glass-card rounded-xl text-[#F0E6FF]/60 text-xs hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isFr ? 'Déconnexion' : 'Sign out'}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-[rgba(240,230,255,0.08)] bg-[#0B0510]">
          {Sidebar}
        </aside>

        {/* Mobile sidebar drawer */}
        {mobileNavOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-[#0B0510]/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)} />
            <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#150C1E] border-r border-[rgba(240,230,255,0.1)] lg:hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(240,230,255,0.08)]">
                <span className="font-serif text-sm text-[#F0E6FF]">{isFr ? 'Navigation' : 'Navigation'}</span>
                <button onClick={() => setMobileNavOpen(false)} className="text-[#F0E6FF]/50 hover:text-[#F0E6FF]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 min-h-0">{Sidebar}</div>
            </aside>
          </>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}