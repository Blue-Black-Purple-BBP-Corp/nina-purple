import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield, ShieldCheck, AlertTriangle, ScrollText, Users, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatsOverview from '@/components/admin/StatsOverview';
import VerificationQueue from '@/components/admin/VerificationQueue';
import ModerationQueue from '@/components/admin/ModerationQueue';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import DateRangeSelector from '@/components/admin/DateRangeSelector';
import { useStaffSession } from '@/lib/StaffSessionContext';

// Unified Admin Dashboard landing page.
// Three-layer security: client role gate -> server-side role re-check inside
// getAdminDashboard -> entity RLS. The audit log tab is super_admin only.
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [data, setData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [tab, setTab] = useState('verification');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const { currentContext } = useStaffSession();

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setMe(u);
      } catch (_) { setMe(null); }
      finally { setLoadingAuth(false); }
    })();
  }, []);

  const isSuperAdmin = me?.role === 'super_admin';
  const isAdminish = me?.role === 'admin' || isSuperAdmin;

  const loadData = async () => {
    setLoadingData(true);
    try {
      const res = await base44.functions.invoke('getAdminDashboard', {
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
      });
      const d = res.data || res;
      setData(d);
    } catch (e) {
      console.error('AdminDashboard load error:', e.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { if (isAdminish) loadData(); }, [isAdminish, dateRange.from, dateRange.to]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (!isAdminish) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <Shield className="w-12 h-12 text-red-400/60" />
        <h2 className="font-serif text-2xl text-[#F0E6FF]">Access Denied</h2>
        <p className="text-[#F0E6FF]/50 text-sm max-w-sm">
          Admin access is required to view the dashboard.
        </p>
        <button onClick={() => navigate('/home')}
          className="mt-2 px-6 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm hover:bg-yellow-400 transition-all">
          Back to Home
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'verification', label: 'Verification', icon: ShieldCheck, count: data?.verifications?.length || 0 },
    ...(currentContext === 'trust_safety' ? [{ id: 'moderation', label: 'Moderation', icon: AlertTriangle, count: data?.moderation?.length || 0 }] : []),
    { id: 'audit', label: 'Audit Log', icon: ScrollText, superOnly: true },
  ];

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#F0E6FF]">Admin Dashboard</h1>
          <p className="text-[#F0E6FF]/40 text-xs mt-1">
            Signed in as <span className="text-[#F5A800]">{me?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/members')}
            className="flex items-center gap-1.5 px-4 py-2 glass-card rounded-xl text-[#F0E6FF]/70 text-sm hover:text-[#F5A800] transition-colors">
            <Users className="w-4 h-4" /> Members
          </button>
          <button onClick={loadData} disabled={loadingData}
            className="flex items-center gap-1.5 px-4 py-2 glass-card rounded-xl text-[#F0E6FF]/70 text-sm hover:text-[#F5A800] transition-colors disabled:opacity-50">
            {loadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
          </button>
        </div>
      </div>

      {/* Stats + date range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-serif text-lg text-[#F0E6FF]/80">Overview</h2>
          <DateRangeSelector from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
        </div>
        {loadingData && !data ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
        ) : (
          <StatsOverview stats={data?.stats} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          if (t.superOnly && !isAdminish) return null;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60'}`}>
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-[#0B0510]/20 text-[#0B0510]' : 'bg-red-500/20 text-red-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'verification' && (
          <VerificationQueue items={data?.verifications || []} onResolved={loadData} />
        )}
        {tab === 'moderation' && (
          <ModerationQueue items={data?.moderation || []} onResolved={loadData} />
        )}
        {tab === 'audit' && isAdminish && (
          <AuditLogViewer canView={isAdminish} dateRange={dateRange} onDateChange={setDateRange} />
        )}
      </div>
    </div>
  );
}