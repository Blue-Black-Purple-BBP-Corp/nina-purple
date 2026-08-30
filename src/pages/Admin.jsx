import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MigrationForm from '@/components/admin/MigrationForm';
import SpecialCodeAdminTable from '@/components/admin/SpecialCodeAdminTable';
import ProgramSettingsPanel from '@/components/admin/ProgramSettingsPanel';
import StaffRewardsConsole from '@/components/bbp/StaffRewardsConsole';
// TEMP: import AmbassadorManager from '@/components/admin/AmbassadorManager';
import { Loader2, Search, Phone, Shield, UserCheck, UserX, Ban, CheckCircle, XCircle, Mail, MapPin, Crown, Filter, ChevronDown, MessageSquare, Bell, BellOff, Copy, Award } from 'lucide-react';

const TIER_META = {
  solar:   { color: '#A78BFA', label: 'Solar',    icon: '☀️' },
  lunar:   { color: '#7B2FBE', label: 'Lunar',    icon: '🌙' },
  stellar: { color: '#A855F7', label: 'Stellar',  icon: '⭐' },
  galactic:{ color: '#F5A800', label: 'Galactic', icon: '🌌' },
  nina_membership: { color: '#F5A800', label: 'Membership', icon: '💜' },
};

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // BLOCKER 2 FIX: verify admin role server-side before loading any data
      const me = await base44.auth.me();
      if (!me || me.role !== 'admin') {
        setDenied(true);
        setLoading(false);
        return;
      }
      const [allProfiles, allUsers, allNotifs] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.User.list(),
        base44.entities.AdminNotification.list('-created_date', 50),
      ]);
      setProfiles(allProfiles);
      setUsers(allUsers);
      setNotifications(allNotifs);
    } catch (err) {
      console.error('Admin loadData error:', err.message);
      setDenied(true);
    } finally {
      setLoading(false);
    }
  };

  // Merge UserProfile with User entity data (email, full_name)
  const mergedMembers = useMemo(() => {
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });
    return profiles.map(p => ({
      ...p,
      email: userMap[p.user_id]?.email || null,
      full_name: userMap[p.user_id]?.full_name || null,
    }));
  }, [profiles, users]);

  const markRead = async (id) => {
    await base44.entities.AdminNotification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleTogglePhoneVerify = async (profile) => {
    setUpdating(profile.id);
    await base44.entities.UserProfile.update(profile.id, {
      phone_verified: !profile.phone_verified,
    });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, phone_verified: !profile.phone_verified } : p));
    setUpdating(null);
  };

  const handleToggleVerified = async (profile) => {
    setUpdating(profile.id);
    await base44.entities.UserProfile.update(profile.id, {
      is_verified: !profile.is_verified,
    });
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_verified: !profile.is_verified } : p));
    setUpdating(null);
  };

  const filteredProfiles = mergedMembers.filter(p => {
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

  const stats = {
    total: mergedMembers.length,
    verified: mergedMembers.filter(p => p.is_verified).length,
    phoneVerified: mergedMembers.filter(p => p.phone_verified).length,
    withPhone: mergedMembers.filter(p => p.phone).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <Shield className="w-12 h-12 text-red-400/60" />
        <h2 className="font-serif text-2xl text-[#F0E6FF]">Access Denied</h2>
        <p className="text-[#F0E6FF]/50 text-sm max-w-sm">
          You do not have permission to view this page. Admin access is required.
        </p>
        <button onClick={() => navigate('/home')}
          className="mt-2 px-6 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-[#F0E6FF]">Admin Panel</h1>
        <button onClick={loadData} className="text-[#F0E6FF]/40 hover:text-[#F5A800] text-sm">
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: stats.total, color: '#7B2FBE' },
          { label: 'Fully Verified', value: stats.verified, color: '#22C55E' },
          { label: 'Phone Verified', value: stats.phoneVerified, color: '#3B82F6' },
          { label: 'Has Phone', value: stats.withPhone, color: '#F5A800' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[#F0E6FF]/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'users', label: 'Members' },
          { id: 'ambassadors', label: 'Ambassadors' },
          { id: 'migration', label: 'Migration' },
          { id: 'phone', label: 'Phone Verification' },
          { id: 'rewards', label: 'Rewards' },
          { id: 'special_codes', label: 'Special Codes' },
          { id: 'program', label: 'Program Settings' },
          { id: 'notifications', label: `Notifications${notifications.filter(n => !n.is_read).length ? ` (${notifications.filter(n => !n.is_read).length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or city..."
            className="w-full glass-card rounded-xl pl-10 pr-4 py-2.5 text-[#F0E6FF] text-sm outline-none"
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="glass-card rounded-xl px-3 py-2.5 text-[#F0E6FF] text-sm outline-none bg-[#1F1026]">
          <option value="all">All Members</option>
          <option value="unverified_phone">Phone Not Verified</option>
          <option value="unverified">Not Fully Verified</option>
          <option value="no_phone">No Phone Number</option>
        </select>
      </div>

      {/* Users Table */}
      {tab === 'users' && (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-3 text-[#F0E6FF]/30 text-xs uppercase tracking-wide px-4 py-2">
            <div className="col-span-2">Member</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1">Location</div>
            <div className="col-span-1">Tier</div>
            <div className="col-span-1">Phone</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
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
                      <button
                        onClick={() => { navigator.clipboard.writeText(profile.email); setCopied(profile.id); setTimeout(() => setCopied(null), 2000); }}
                        className="text-[#F0E6FF]/20 hover:text-[#F5A800] transition-colors shrink-0"
                        title="Copy email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copied === profile.id && <span className="text-green-400 text-[10px]">Copied!</span>}
                    </>
                  ) : (
                    <span className="text-[#F0E6FF]/20">—</span>
                  )}
                </div>
                <div className="md:col-span-1 flex items-center gap-1 text-[#F0E6FF]/50 text-sm">
                  <MapPin className="w-3 h-3" />
                  {profile.city || '—'}
                </div>
                <div className="md:col-span-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: meta.color, background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>
                <div className="md:col-span-1 text-xs">
                  {profile.phone ? (
                    <span className="text-[#F0E6FF]/60">{profile.phone}</span>
                  ) : (
                    <span className="text-[#F0E6FF]/20">—</span>
                  )}
                </div>
                <div className="md:col-span-1 text-[#F0E6FF]/30 text-xs">
                  {new Date(profile.created_date).toLocaleDateString()}
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-1">
                    {profile.is_verified ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    {profile.phone_verified ? (
                      <Phone className="w-3 h-3 text-blue-400" />
                    ) : null}
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button onClick={() => handleToggleVerified(profile)} disabled={updating === profile.id}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${profile.is_verified ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                    {updating === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (profile.is_verified ? 'Unverify' : 'Verify')}
                  </button>
                  {profile.phone && (
                    <button onClick={() => handleTogglePhoneVerify(profile)} disabled={updating === profile.id}
                      className={`text-xs px-3 py-1.5 rounded-full transition-all ${profile.phone_verified ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}`}>
                      {updating === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (profile.phone_verified ? 'Unverify Phone' : 'Verify Phone')}
                    </button>
                  )}
                  {!profile.phone && (
                    <span className="text-[#F0E6FF]/15 text-xs italic">No phone</span>
                  )}
                </div>
              </div>
            );
          })}
          {filteredProfiles.length === 0 && (
            <div className="text-center py-12 text-[#F0E6FF]/30">No members found</div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#F0E6FF]/30">
              <BellOff className="w-8 h-8 mx-auto mb-2" />
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`glass-card rounded-2xl p-4 ${!n.is_read ? 'border-[rgba(245,168,0,0.3)]' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? 'bg-[#F5A800]' : 'bg-[#F0E6FF]/20'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          n.type === 'new_registration' ? 'bg-[#7B2FBE]/10 text-[#7B2FBE]' :
                          n.type === 'account_deletion' ? 'bg-red-500/10 text-red-400' :
                          'bg-[#F0E6FF]/10 text-[#F0E6FF]/60'
                        }`}>
                          {n.type === 'new_registration' ? 'Registration' :
                           n.type === 'account_deletion' ? 'Deletion' :
                           n.type === 'phone_verification' ? 'Phone' : n.type}
                        </span>
                        <span className="text-[#F0E6FF]/20 text-xs">
                          {new Date(n.created_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[#F0E6FF] font-medium mt-1">{n.title}</div>
                      <pre className="text-[#F0E6FF]/50 text-sm mt-1 whitespace-pre-wrap font-sans">{n.body}</pre>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)}
                      className="text-xs text-[#F5A800] hover:underline shrink-0">
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Phone Verification Tab */}
      {tab === 'phone' && (
        <div className="space-y-3">
          <p className="text-[#F0E6FF]/40 text-sm">
            Members requiring phone verification. Nina Purple reserves the right to verify all individuals by phone and restrict access if unable to confirm human identity.
          </p>
          {mergedMembers.filter(p => p.phone && !p.phone_verified).map(profile => (
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
              <div className="flex gap-2">
                <button onClick={() => handleTogglePhoneVerify(profile)} disabled={updating === profile.id}
                  className="px-4 py-2 bg-green-500/10 text-green-400 rounded-full text-sm border border-green-500/30 hover:bg-green-500/20 transition-all">
                  {updating === profile.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Mark Verified'}
                </button>
              </div>
            </div>
          ))}
          {mergedMembers.filter(p => p.phone && !p.phone_verified).length === 0 && (
            <div className="text-center py-12 text-[#F0E6FF]/30">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              All phone numbers verified
            </div>
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {tab === 'rewards' && (
        <StaffRewardsConsole />
      )}

      {/* Special Codes Tab */}
      {tab === 'special_codes' && (
        <SpecialCodeAdminTable />
      )}

      {/* Program Settings Tab */}
      {tab === 'program' && (
        <ProgramSettingsPanel />
      )}

      {/* Ambassadors Tab — temporarily disabled for debugging */}
      {tab === 'ambassadors' && (
        <div className="text-center py-12 text-[#F0E6FF]/30">Ambassador manager loading...</div>
      )}

      {/* Migration Tab */}
      {tab === 'migration' && (
        <div className="max-w-2xl mx-auto">
          <MigrationForm onCreated={loadData} />
        </div>
      )}
    </div>
  );
}