import React, { useState, useEffect } from 'react';
import { Loader2, Ticket, Search, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Admin-only table listing all SpecialCode records with inline editing of
// feedback_status and reward_months. When admin sets feedback_status to
// 'verified' and reward_months is set, billing_exempt_until is applied
// server-side via the updateSpecialCode function.
export default function SpecialCodeAdminTable() {
  const [codes, setCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [allCodes, allUsers] = await Promise.all([
        base44.entities.SpecialCode.list('-issued_at', 200),
        base44.entities.User.list(),
      ]);
      setCodes(allCodes);
      setUsers(allUsers);
    } catch (e) {
      console.error('SpecialCode load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const getUserName = (userId) => {
    const u = userMap[userId];
    return u?.full_name || u?.email || (userId ? userId.slice(-8) : '—');
  };

  const handleUpdate = async (codeId, field, value) => {
    setUpdating(codeId);
    try {
      await base44.functions.invoke('updateSpecialCode', { code_id: codeId, [field]: value });
      await load();
    } catch (e) {
      console.error('Update failed:', e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = codes.filter(c => {
    if (!search) return true;
    const name = getUserName(c.issued_to_user_id).toLowerCase();
    return name.includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: codes.length,
    issued: codes.filter(c => c.status === 'issued').length,
    redeemed: codes.filter(c => c.status === 'redeemed').length,
    expired: codes.filter(c => c.status === 'expired').length,
    verified: codes.filter(c => c.feedback_status === 'verified').length,
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-[#F5A800]" />
          <h2 className="font-serif text-xl text-[#F0E6FF]">Special Codes</h2>
          <span className="text-[#F0E6FF]/40 text-sm">
            {stats.total} total · {stats.issued} issued · {stats.redeemed} redeemed · {stats.expired} expired · {stats.verified} verified
          </span>
        </div>
        <button onClick={load} className="text-[#F0E6FF]/40 hover:text-[#F5A800] text-sm flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by user or code..."
          className="w-full glass-card rounded-xl pl-10 pr-4 py-2.5 text-[#F0E6FF] text-sm outline-none"
        />
      </div>

      <div className="space-y-2">
        <div className="hidden md:grid grid-cols-12 gap-2 text-[#F0E6FF]/30 text-xs uppercase tracking-wide px-4 py-2">
          <div className="col-span-2">User</div>
          <div className="col-span-2">Code</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Issued</div>
          <div className="col-span-2">Expires</div>
          <div className="col-span-2">Feedback</div>
          <div className="col-span-1">Reward</div>
        </div>

        {filtered.map(sc => {
          const canEdit = sc.status === 'redeemed';
          return (
            <div key={sc.id} className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <div className="md:col-span-2 text-[#F0E6FF] text-sm font-medium truncate">
                {getUserName(sc.issued_to_user_id)}
              </div>
              <div className="md:col-span-2 font-mono text-[#F5A800] text-sm font-bold tracking-wider">{sc.code}</div>
              <div className="md:col-span-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  sc.status === 'issued' ? 'bg-blue-500/10 text-blue-400' :
                  sc.status === 'redeemed' ? 'bg-green-500/10 text-green-400' :
                  'bg-red-500/10 text-red-400'
                }`}>{sc.status}</span>
              </div>
              <div className="md:col-span-2 text-[#F0E6FF]/50 text-xs">
                {sc.issued_at ? new Date(sc.issued_at).toLocaleDateString() : '—'}
              </div>
              <div className="md:col-span-2 text-[#F0E6FF]/50 text-xs">
                {sc.expires_at ? new Date(sc.expires_at).toLocaleDateString() : '—'}
              </div>
              <div className="md:col-span-2">
                <select
                  value={sc.feedback_status || 'pending'}
                  onChange={e => handleUpdate(sc.id, 'feedback_status', e.target.value)}
                  disabled={updating === sc.id || !canEdit}
                  className="glass-card rounded-lg px-2 py-1 text-[#F0E6FF] text-xs outline-none bg-[#1F1026] disabled:opacity-40 w-full"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <select
                  value={sc.reward_months || ''}
                  onChange={e => handleUpdate(sc.id, 'reward_months', Number(e.target.value))}
                  disabled={updating === sc.id || !canEdit}
                  className="glass-card rounded-lg px-2 py-1 text-[#F0E6FF] text-xs outline-none bg-[#1F1026] disabled:opacity-40 w-full"
                >
                  <option value="">—</option>
                  <option value="1">1m</option>
                  <option value="2">2m</option>
                  <option value="3">3m</option>
                </select>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#F0E6FF]/30">No special codes found</div>
        )}
      </div>
    </div>
  );
}