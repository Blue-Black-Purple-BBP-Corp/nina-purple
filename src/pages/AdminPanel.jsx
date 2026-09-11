import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useStaffSession } from '@/lib/StaffSessionContext';
import { useLang } from '@/lib/LanguageContext';
import AdminShell from '@/components/admin/AdminShell';

// Standardized tab components (server-side asServiceRole + requirePrivilegedContext)
import StatsOverview from '@/components/admin/StatsOverview';
import VerificationQueue from '@/components/admin/VerificationQueue';
import ModerationQueue from '@/components/admin/ModerationQueue';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import ProfileChangeQueue from '@/components/admin/ProfileChangeQueue';
import DateRangeSelector from '@/components/admin/DateRangeSelector';

// Legacy tab components (current client-SDK logic — P1 follow-up to standardize)
import ActiveCitiesAdmin from '@/components/admin/ActiveCitiesAdmin';
import MigrationForm from '@/components/admin/MigrationForm';
import SpecialCodeAdminTable from '@/components/admin/SpecialCodeAdminTable';
import ProgramSettingsPanel from '@/components/admin/ProgramSettingsPanel';
import MatchmakerPanel from '@/components/admin/MatchmakerPanel';
import StaffRewardsConsole from '@/components/bbp/StaffRewardsConsole';
import AmbassadorManager from '@/components/admin/AmbassadorManager';

import { Loader2, Search, Phone, Mail, MapPin, Copy, CheckCircle, XCircle, BellOff, RefreshCw, FileEdit } from 'lucide-react';

const TIER_META = {
  solar:   { color: '#A78BFA', label: 'Solar',    icon: '☀️' },
  lunar:   { color: '#7B2FBE', label: 'Lunar',    icon: '🌙' },
  stellar: { color: '#A855F7', label: 'Stellar',  icon: '⭐' },
  galactic:{ color: '#F5A800', label: 'Galactic', icon: '🌌' },
  nina_membership: { color: '#F5A800', label: 'Membership', icon: '💜' },
};

export default function AdminPanel() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const { currentContext } = useStaffSession();

  // ── Section selection (local state, not sub-routes) ──
  const [section, setSection] = useState('overview');

  // ── Auth user (for role display + audit-log gate) ──
  const [me, setMe] = useState(null);

  // ── Standardized data: getAdminDashboard (stats, verifications, moderation) ──
  const [dashData, setDashData] = useState(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  // ── Legacy data: members + notifications (client-SDK, P1 follow-up) ──
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingLegacy, setLoadingLegacy] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [copied, setCopied] = useState(null);

  const isSuperAdmin = me?.role === 'super_admin';
  const isAdminish = me?.role === 'admin' || isSuperAdmin;

  // ── Load auth user ──
  useEffect(() => {
    (async () => {
      try { const u = await base44.auth.me(); setMe(u); }
      catch (_) { setMe(null); }
    })();
  }, []);

  // ── Standardized dashboard data (asServiceRole + requirePrivilegedContext server-side) ──
  const loadDash = useCallback(async () => {
    setLoadingDash(true);
    try {
      const res = await base44.functions.invoke('getAdminDashboard', {
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      });
      setDashData(res.data || res);
    } catch (e) {
      console.error('AdminPanel loadDash error:', e.message);
    } finally {
      setLoadingDash(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => { if (isAdminish) loadDash(); }, [isAdminish, loadDash]);

  // ── Legacy member/notification data (client-SDK — P1 follow-up to standardize) ──
  // The former me.role gate is removed: AdminShell + PrivilegedRoute already gate access.
  const loadLegacy = useCallback(async () => {
    setLoadingLegacy(true);
    try {
      const [allProfiles, allUsers, allNotifs] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.User.list(),
        base44.entities.AdminNotification.list('-created_date', 50),
      ]);
      setProfiles(allProfiles);
      setUsers(allUsers);
      setNotifications(allNotifs);
    } catch (err) {
      console.error('AdminPanel loadLegacy error:', err.message);
    } finally {
      setLoadingLegacy(false);
    }
  }, []);

  useEffect(() => { loadLegacy(); }, [loadLegacy]);

  // ── Derived member data ──
  const mergedMembers = useMemo(() => {
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });
    return profiles.map(p => ({
      ...p,
      email: userMap[p.user_id]?.email || null,
      full_name: userMap[p.user_id]?.full_name || null,
    }));
  }, [profiles, users]);

  const filteredProfiles = useMemo(() => {
    return mergedMembers.filter(p => {
      const name = (p.display_name || p.full_name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      const query = search.toLowerCase();
      if (query && !name.includes(query) && !email.includes(query) && !city.includes(query)) return false;
      if (filter === 'unverified_phone' && p.phone_verified) return false;
      if (filter === 'unverified' && p.is_verified) return false;
      if (filter === 'no_phone' && p.phone) return false;
      return true;
    });
  }, [mergedMembers, search, filter]);

  const memberStats = useMemo(() => ({
    total: mergedMembers.length,
    verified: mergedMembers.filter(p => p.is_verified).length,
    phoneVerified: mergedMembers.filter(p => p.phone_verified).length,
    withPhone: mergedMembers.filter(p => p.phone).length,
  }), [mergedMembers]);

  // ── Legacy handlers ──
  const markRead = async (id) => {
    await base44.entities.AdminNotification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleTogglePhoneVerify = async (profile) => {
    setUpdating(profile.id);
    await base44.entities.UserProfile.update(profile.id, { phone_verified: !profile.phone_verified });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, phone_verified: !p.phone_verified } : p));
    setUpdating(null);
  };

  const handleToggleVerified = async (profile) => {
    setUpdating(profile.id);
    await base44.entities.UserProfile.update(profile.id, { is_verified: !profile.is_verified });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_verified: !p.is_verified } : p));
    setUpdating(null);
  };

  const unreadNotifs = notifications.filter(n => !n.is_read).length;
  const phonePending = mergedMembers.filter(p => p.phone && !p.phone_verified);

  // ── Section content ──
  const renderSection = () => {
    switch (section) {
      // ── Overview (standardized) ──
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Aperçu' : 'Overview'}</h2>
              <DateRangeSelector from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
            </div>
            {loadingDash && !dashData
              ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
              : <StatsOverview stats={dashData?.stats} />}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { label: isFr ? 'Membres (legacy)' : 'Members (legacy)', value: memberStats.total, color: '#7B2FBE' },
                { label: isFr ? 'Vérifiés' : 'Verified', value: memberStats.verified, color: '#22C55E' },
                { label: isFr ? 'Tél. vérifiés' : 'Phone Verified', value: memberStats.phoneVerified, color: '#3B82F6' },
                { label: isFr ? 'Avec téléphone' : 'Has Phone', value: memberStats.withPhone, color: '#F5A800' },
              ].map((s, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[#F0E6FF]/40 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Members (legacy client-SDK — P1 follow-up) ──
      case 'members':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Membres' : 'Members'}</h2>
              <button onClick={loadLegacy} className="flex items-center gap-1.5 text-[#F0E6FF]/40 hover:text-[#F5A800] text-sm">
                <RefreshCw className="w-3.5 h-3.5" /> {isFr ? 'Rafraîchir' : 'Refresh'}
              </button>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={isFr ? 'Rechercher par nom, courriel ou ville...' : 'Search by name, email, or city...'}
                  className="w-full glass-card rounded-xl pl-10 pr-4 py-2.5 text-[#F0E6FF] text-sm outline-none" />
              </div>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="glass-card rounded-xl px-3 py-2.5 text-[#F0E6FF] text-sm outline-none bg-[#1F1026]">
                <option value="all">{isFr ? 'Tous les membres' : 'All Members'}</option>
                <option value="unverified_phone">{isFr ? 'Téléphone non vérifié' : 'Phone Not Verified'}</option>
                <option value="unverified">{isFr ? 'Non vérifié' : 'Not Fully Verified'}</option>
                <option value="no_phone">{isFr ? 'Pas de téléphone' : 'No Phone Number'}</option>
              </select>
            </div>
            {loadingLegacy ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-3 text-[#F0E6FF]/30 text-xs uppercase tracking-wide px-4 py-2">
                  <div className="col-span-2">{isFr ? 'Membre' : 'Member'}</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-1">{isFr ? 'Ville' : 'Location'}</div>
                  <div className="col-span-1">{isFr ? 'Niveau' : 'Tier'}</div>
                  <div className="col-span-1">Phone</div>
                  <div className="col-span-1">{isFr ? 'Inscrit' : 'Joined'}</div>
                  <div className="col-span-2">{isFr ? 'Statut' : 'Status'}</div>
                  <div className="col-span-2">{isFr ? 'Actions' : 'Actions'}</div>
                </div>
                {filteredProfiles.map(profile => {
                  const meta = TIER_META[profile.subscription_tier] || TIER_META.solar;
                  const displayName = profile.display_name || profile.full_name || '—';
                  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div key={profile.id} className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 items-center">
                      <div className="md:col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">{initials}</span>
                        </div>
                        <div>
                          <div className="text-[#F0E6FF] font-medium text-sm">{displayName}</div>
                          <div className="text-[#F0E6FF]/30 text-xs">ID: {profile.id?.slice(-8)}</div>
                        </div>
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2 text-xs">
                        {profile.email ? (
                          <>
                            <Mail className="w-3 h-3 text-[#F0E6FF]/30 shrink-0" />
                            <span className="text-[#F0E6FF]/70 truncate">{profile.email}</span>
                            <button onClick={() => { navigator.clipboard.writeText(profile.email); setCopied(profile.id); setTimeout(() => setCopied(null), 2000); }}
                              className="text-[#F0E6FF]/20 hover:text-[#F5A800] transition-colors shrink-0" title="Copy email">
                              <Copy className="w-3 h-3" />
                            </button>
                            {copied === profile.id && <span className="text-green-400 text-[10px]">Copied!</span>}
                          </>
                        ) : <span className="text-[#F0E6FF]/20">—</span>}
                      </div>
                      <div className="md:col-span-1 flex items-center gap-1 text-[#F0E6FF]/50 text-sm">
                        <MapPin className="w-3 h-3" />{profile.city || '—'}
                      </div>
                      <div className="md:col-span-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                      <div className="md:col-span-1 text-xs">
                        {profile.phone ? <span className="text-[#F0E6FF]/60">{profile.phone}</span> : <span className="text-[#F0E6FF]/20">—</span>}
                      </div>
                      <div className="md:col-span-1 text-[#F0E6FF]/30 text-xs">
                        {new Date(profile.created_date).toLocaleDateString()}
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-1">
                          {profile.is_verified ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                          {profile.phone_verified ? <Phone className="w-3 h-3 text-blue-400" /> : null}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <button onClick={() => handleToggleVerified(profile)} disabled={updating === profile.id}
                          className={`text-xs px-3 py-1.5 rounded-full transition-all ${profile.is_verified ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                          {updating === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (profile.is_verified ? (isFr ? 'Annuler' : 'Unverify') : (isFr ? 'Vérifier' : 'Verify'))}
                        </button>
                        {profile.phone && (
                          <button onClick={() => handleTogglePhoneVerify(profile)} disabled={updating === profile.id}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all ${profile.phone_verified ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}>
                            {updating === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (profile.phone_verified ? (isFr ? 'Annuler tél.' : 'Unverify Phone') : (isFr ? 'Vérifier tél.' : 'Verify Phone'))}
                          </button>
                        )}
                        {!profile.phone && <span className="text-[#F0E6FF]/15 text-xs italic">{isFr ? 'Pas de tél.' : 'No phone'}</span>}
                      </div>
                    </div>
                  );
                })}
                {filteredProfiles.length === 0 && <div className="text-center py-12 text-[#F0E6FF]/30">{isFr ? 'Aucun membre trouvé' : 'No members found'}</div>}
              </div>
            )}
          </div>
        );

      // ── Ambassadors (reconnected — real data) ──
      case 'ambassadors':
        return <AmbassadorManager />;

      // ── Phone Verification (legacy client-SDK — P1 follow-up) ──
      case 'phone':
        return (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Vérification téléphone' : 'Phone Verification'}</h2>
            <p className="text-[#F0E6FF]/40 text-sm">
              {isFr
                ? 'Membres nécessitant une vérification par téléphone. Nina Purple se réserve le droit de vérifier tous les individus par téléphone.'
                : 'Members requiring phone verification. Nina Purple reserves the right to verify all individuals by phone and restrict access if unable to confirm human identity.'}
            </p>
            {phonePending.map(profile => (
              <div key={profile.id} className="glass-card-gold rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(245,168,0,0.1)] flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#F5A800]" />
                  </div>
                  <div>
                    <div className="text-[#F0E6FF] font-medium">{profile.display_name || profile.full_name || '—'}</div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[#F5A800] font-mono text-sm">{profile.phone}</span>
                      {profile.email && <span className="text-[#F0E6FF]/40 text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>}
                    </div>
                    <div className="text-[#F0E6FF]/30 text-xs">{profile.city || ''}</div>
                  </div>
                </div>
                <button onClick={() => handleTogglePhoneVerify(profile)} disabled={updating === profile.id}
                  className="px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/30 hover:bg-green-500/20 transition-all">
                  {updating === profile.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isFr ? 'Marquer vérifié' : 'Mark Verified')}
                </button>
              </div>
            ))}
            {phonePending.length === 0 && (
              <div className="text-center py-12 text-[#F0E6FF]/30">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                {isFr ? 'Tous les numéros vérifiés' : 'All phone numbers verified'}
              </div>
            )}
          </div>
        );

      // ── Migration (legacy client-SDK — P1 follow-up) ──
      case 'migration':
        return (
          <div className="max-w-2xl mx-auto">
            <MigrationForm onCreated={loadLegacy} />
          </div>
        );

      // ── Verification (standardized) ──
      case 'verification':
        return (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Vérification' : 'Verification'}</h2>
            <VerificationQueue items={dashData?.verifications || []} onResolved={loadDash} />
          </div>
        );

      // ── Change Requests (standardized — fetches own data via getProfileChangeRequests) ──
      case 'change_requests':
        return (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#F0E6FF] flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-[#F5A800]" />
              {isFr ? 'Demandes de modification' : 'Change Requests'}
            </h2>
            <ProfileChangeQueue />
          </div>
        );

      // ── Moderation (standardized — trust_safety context) ──
      case 'moderation':
        return (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Modération' : 'Moderation'}</h2>
            {currentContext === 'trust_safety' ? (
              <ModerationQueue items={dashData?.moderation || []} onResolved={loadDash} />
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center text-[#F0E6FF]/40">
                {isFr ? 'La modération nécessite le contexte trust_safety.' : 'Moderation requires the trust_safety context.'}
              </div>
            )}
          </div>
        );

      // ── Rewards (legacy client-SDK — P1 follow-up) ──
      case 'rewards':
        return <StaffRewardsConsole />;

      // ── Special Codes (legacy client-SDK — P1 follow-up) ──
      case 'special_codes':
        return <SpecialCodeAdminTable />;

      // ── Program Settings (legacy client-SDK — P1 follow-up) ──
      case 'program':
        return <ProgramSettingsPanel />;

      // ── Matchmaker (legacy client-SDK — P1 follow-up) ──
      case 'matchmaker':
        return <MatchmakerPanel />;

      // ── Cities (legacy client-SDK — P1 follow-up) ──
      case 'cities':
        return <ActiveCitiesAdmin />;

      // ── Notifications (legacy client-SDK — P1 follow-up) ──
      case 'notifications':
        return (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#F0E6FF]">
              {isFr ? 'Notifications' : 'Notifications'}{unreadNotifs ? ` (${unreadNotifs})` : ''}
            </h2>
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-[#F0E6FF]/30">
                <BellOff className="w-8 h-8 mx-auto mb-2" />
                {isFr ? 'Aucune notification' : 'No notifications yet'}
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`glass-card rounded-2xl p-4 ${!n.is_read ? 'border-[rgba(245,168,0,0.3)]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-[#F5A800]' : 'bg-[#F0E6FF]/20'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full">
                            {n.type === 'new_registration' ? 'Registration' : n.type === 'account_deletion' ? 'Deletion' : n.type === 'phone_verification' ? 'Phone' : n.type}
                          </span>
                          <span className="text-[#F0E6FF]/20 text-xs">{new Date(n.created_date).toLocaleString()}</span>
                        </div>
                        <div className="text-[#F0E6FF] font-medium mt-1">{n.title}</div>
                        <pre className="text-[#F0E6FF]/50 text-sm mt-1 whitespace-pre-wrap font-sans">{n.body}</pre>
                      </div>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-[#F5A800] hover:underline shrink-0">
                        {isFr ? 'Marquer lu' : 'Mark read'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );

      // ── Audit Log (standardized — admin/super_admin) ──
      case 'audit':
        return (
          <div className="space-y-4">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{isFr ? 'Journal d\'audit' : 'Audit Log'}</h2>
            <AuditLogViewer canView={isAdminish} dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminShell activeSection={section} onSectionChange={setSection} me={me}>
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
        {renderSection()}
      </div>
    </AdminShell>
  );
}