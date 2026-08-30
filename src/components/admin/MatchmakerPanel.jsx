import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

const ARCHETYPE_META = {
  blue: { color: '#60A5FA', label: 'Traveler' },
  black: { color: '#9CA3AF', label: 'Seeker' },
  purple: { color: '#A855F7', label: 'Enlightened' },
};

export default function MatchmakerPanel() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const [allProfiles, allUsers] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.User.list(),
      ]);
      const userMap = {};
      allUsers.forEach((u) => { userMap[u.id] = u; });
      const q = query.toLowerCase();
      const found = allProfiles
        .map((p) => ({ ...p, email: userMap[p.user_id]?.email || null }))
        .filter((p) => {
          const name = (p.display_name || p.full_name || '').toLowerCase();
          const email = (p.email || '').toLowerCase();
          return name.includes(q) || email.includes(q) || (p.user_id || '').includes(q);
        })
        .slice(0, 10);
      setUsers(found);
    } catch (e) {
      setError(e.message);
    }
    setSearching(false);
  };

  const analyze = async (profile) => {
    setSelected(profile);
    setLoading(true);
    setError('');
    setMatches([]);
    try {
      const res = await base44.functions.invoke('getMatchmakerAnalysis', { user_id: profile.user_id });
      setMatches(res.data?.matches || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#F5A800]" />
          <h3 className="font-serif text-lg text-[#F0E6FF]">Matchmaker</h3>
        </div>
        <p className="text-[#F0E6FF]/40 text-xs mb-3">
          Select any member to view their top 3 matches with an AI-generated compatibility analysis.
          Admin-only — never shown to users.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Search by name, email, or user ID…"
              className="w-full glass-card rounded-xl pl-10 pr-4 py-2.5 text-[#F0E6FF] text-sm outline-none"
            />
          </div>
          <button onClick={runSearch} disabled={searching}
            className="px-5 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-xl font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {users.length > 0 && (
          <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
            {users.map((p) => (
              <button key={p.id} onClick={() => analyze(p)}
                className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 transition-all ${selected?.id === p.id ? 'bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.3)]' : 'glass-card hover:border-[rgba(123,47,190,0.2)]'}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{(p.display_name || '?')[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F0E6FF] text-sm font-medium truncate">{p.display_name || p.full_name}</p>
                  <p className="text-[#F0E6FF]/40 text-xs truncate">{p.email || p.user_id.slice(-8)}</p>
                </div>
                {p.city && <span className="text-[#F0E6FF]/30 text-xs">{p.city}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
        </div>
      )}

      {!loading && selected && matches.length === 0 && !error && (
        <div className="text-center py-10 text-[#F0E6FF]/40 text-sm">
          No matches found for this member yet.
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[#F0E6FF]/60 text-sm">
              Top {matches.length} matches for <span className="text-[#F0E6FF] font-medium">{selected.display_name}</span>
            </p>
            <button onClick={() => analyze(selected)} className="flex items-center gap-1 text-[#F0E6FF]/40 hover:text-[#F5A800] text-xs">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          {matches.map((m, i) => {
            const meta = ARCHETYPE_META[m.dating_archetype] || ARCHETYPE_META.purple;
            return (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center">
                      <span className="text-white font-bold">{(m.display_name || '?')[0]}</span>
                    </div>
                    <div>
                      <p className="text-[#F0E6FF] font-medium">{m.display_name || '—'}</p>
                      <p className="text-[#F0E6FF]/40 text-xs">{m.city || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif font-bold text-[#F5A800]">{m.compatibility_score}%</div>
                    {m.cached && <span className="text-[#F0E6FF]/30 text-[10px] flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> cached</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.2)] p-3">
                    <p className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">What could work well</p>
                    <ul className="space-y-1.5">
                      {(m.strengths || []).map((s, j) => (
                        <li key={j} className="text-[#F0E6FF]/70 text-xs leading-relaxed flex gap-1.5">
                          <span className="text-green-400/60 shrink-0">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-[rgba(245,168,0,0.06)] border border-[rgba(245,168,0,0.2)] p-3">
                    <p className="text-[#F5A800] text-xs font-semibold uppercase tracking-wider mb-2">What could be worth navigating carefully</p>
                    <ul className="space-y-1.5">
                      {(m.friction_points || []).map((f, j) => (
                        <li key={j} className="text-[#F0E6FF]/70 text-xs leading-relaxed flex gap-1.5">
                          <span className="text-[#F5A800]/60 shrink-0">•</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}