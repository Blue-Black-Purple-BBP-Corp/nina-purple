import React, { useState, useEffect } from 'react';
import { Users, ScrollText, Gift, BarChart3, Loader2, Search, Pause, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RULE_LABELS = {
  PROFILE_COMPLETE: 'Profile Complete',
  COMMUNITY_ORIENTATION_COMPLETE: 'Community Orientation',
  ACCOUNT_CONTACT_CONFIRMATION: 'Account Confirmation',
  MEANINGFUL_PROFILE_REFRESH: 'Profile Refresh',
  APPROVED_COMMUNITY_CONTRIBUTION: 'Community Contribution',
  APPROVED_COMMUNITY_HOST_TASK: 'Community Host Task',
  MUTUAL_MEETUP_CONFIRMATION: 'Mutual Meetup',
  COMMUNITY_CONNECTED_MILESTONE: 'Community Connected',
  FIRST_EVENT_ATTENDANCE: 'First Event',
  EVENT_ATTENDANCE: 'Event Attendance',
  EXPERIENCE_ATTENDANCE: 'Experience Attendance',
  EXPERIENCE_TESTIMONIAL_APPROVED: 'Experience Testimonial',
  EVENT_TESTIMONIAL_APPROVED: 'Event Testimonial',
  REFERRAL_COMMUNITY_READY: 'Referral Community Ready',
  QUALIFIED_PAID_REFERRAL: 'Qualified Paid Referral',
};

export default function StaffRewardsConsole() {
  const [tab, setTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        base44.entities.RewardRule.list(),
        base44.entities.RedemptionCatalog.list(),
      ]);
      setRules(r);
      setCatalog(c);
    } catch (e) {
      console.error('StaffRewardsConsole load error:', e.message);
    }
    setLoading(false);
  };

  const toggleRuleStatus = async (rule) => {
    setUpdating(rule.id);
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await base44.entities.RewardRule.update(rule.id, { status: newStatus });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
    } catch (e) {
      console.error('Toggle rule error:', e.message);
    }
    setUpdating(null);
  };

  const toggleCatalogStatus = async (item) => {
    setUpdating(item.id);
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      await base44.entities.RedemptionCatalog.update(item.id, { status: newStatus });
      setCatalog(prev => prev.map(c => c.id === item.id ? { ...c, status: newStatus } : c));
    } catch (e) {
      console.error('Toggle catalog error:', e.message);
    }
    setUpdating(null);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setUpdating('search');
    try {
      // Try by bbp_member_id first, then by native user ID
      let engagement = await base44.entities.MemberEngagementProfile.filter({ bbp_member_id: search.trim() });
      if (!engagement.length) {
        engagement = await base44.entities.MemberEngagementProfile.filter({ native_user_id: search.trim() });
      }
      if (engagement.length) {
        const profile = engagement[0];
        const [wallet, ledger] = await Promise.all([
          base44.entities.BBPWalletBalance.filter({ bbp_member_id: profile.bbp_member_id }),
          base44.entities.BBPPointsLedger.filter({ bbp_member_id: profile.bbp_member_id }),
        ]);
        setSearchResults({ profile, wallet: wallet[0], ledger });
      } else {
        setSearchResults({ notFound: true });
      }
    } catch (e) {
      console.error('Search error:', e.message);
    }
    setUpdating(null);
  };

  const handleReverse = async (ledgerId) => {
    const reason = prompt('Reason for reversal (required):');
    if (!reason) return;
    setUpdating(ledgerId);
    try {
      await base44.functions.invoke('reversePoints', { ledger_entry_id: ledgerId, reason });
      // Refresh search results
      if (searchResults?.profile) {
        const ledger = await base44.entities.BBPPointsLedger.filter({ bbp_member_id: searchResults.profile.bbp_member_id });
        setSearchResults(prev => ({ ...prev, ledger }));
      }
    } catch (e) {
      console.error('Reverse error:', e.message);
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'rules', label: 'Reward Rules', icon: ScrollText },
          { id: 'catalog', label: 'Redemption Catalog', icon: Gift },
          { id: 'members', label: 'Member Lookup', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${tab === t.id ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Reward Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-2">
          <p className="text-[#F0E6FF]/40 text-xs">
            All rules are in draft status. Activate only after Finance review. Monthly budget is in USD (= BBP at 1:1).
          </p>
          {rules.map(rule => (
            <div key={rule.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F0E6FF] font-medium text-sm">{RULE_LABELS[rule.rule_id] || rule.rule_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      rule.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      rule.status === 'draft' ? 'bg-[#F5A800]/10 text-[#F5A800]' :
                      rule.status === 'paused' ? 'bg-red-500/10 text-red-400' :
                      'bg-[#F0E6FF]/10 text-[#F0E6FF]/40'
                    }`}>{rule.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[#F0E6FF]/50">
                    <span>{rule.points_amount} BBP</span>
                    {rule.per_member_cap != null && <span>Cap: {rule.per_member_cap}/member</span>}
                    {rule.monthly_budget_usd > 0 && <span>Budget: ${rule.monthly_budget_usd}/mo (issued: ${rule.monthly_issued_usd || 0})</span>}
                    {rule.pending_hours > 0 && <span>Pending: {rule.pending_hours}h</span>}
                  </div>
                  {rule.qualification_definition && (
                    <p className="text-[#F0E6FF]/40 text-xs mt-1">{rule.qualification_definition}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleRuleStatus(rule)}
                  disabled={updating === rule.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    rule.status === 'active'
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  }`}>
                  {updating === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                    rule.status === 'active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redemption Catalog Tab */}
      {tab === 'catalog' && (
        <div className="space-y-2">
          {catalog.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F0E6FF] font-medium text-sm">{item.name_en || item.benefit_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      item.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      item.status === 'draft' ? 'bg-[#F5A800]/10 text-[#F5A800]' :
                      'bg-red-500/10 text-red-400'
                    }`}>{item.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[#F0E6FF]/50">
                    <span>Min: {item.minimum_bbp} BBP</span>
                    {item.maximum_bbp_per_transaction && <span>Max: {item.maximum_bbp_per_transaction} BBP</span>}
                    {item.maximum_discount_percent && <span>Max discount: {item.maximum_discount_percent}%</span>}
                    <span>Stacking: {item.stacking_allowed ? 'Yes' : 'No'}</span>
                  </div>
                  {item.description_en && <p className="text-[#F0E6FF]/40 text-xs mt-1">{item.description_en}</p>}
                </div>
                <button
                  onClick={() => toggleCatalogStatus(item)}
                  disabled={updating === item.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    item.status === 'active'
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  }`}>
                  {updating === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                    item.status === 'active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Lookup Tab */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0E6FF]/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search by bbp_member_id or user ID..."
                className="w-full glass-card rounded-xl pl-10 pr-4 py-2.5 text-[#F0E6FF] text-sm outline-none"
              />
            </div>
            <button onClick={handleSearch} disabled={updating === 'search'}
              className="px-5 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-xl text-sm font-bold hover:bg-yellow-400 transition-all">
              {updating === 'search' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>

          {searchResults?.notFound && (
            <div className="text-center py-8 text-[#F0E6FF]/30 text-sm">No member found.</div>
          )}

          {searchResults?.profile && (
            <div className="space-y-3">
              <div className="glass-card-gold rounded-2xl p-4">
                <div className="text-[#F0E6FF]/50 text-xs mb-1">bbp_member_id</div>
                <div className="text-[#F5A800] font-mono text-sm">{searchResults.profile.bbp_member_id}</div>
                <div className="text-[#F0E6FF]/50 text-xs mt-2 mb-1">native_user_id</div>
                <div className="text-[#F0E6FF] font-mono text-sm">{searchResults.profile.native_user_id}</div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center">
                    <div className="text-[#F5A800] font-bold text-lg">{searchResults.wallet?.available_points || 0}</div>
                    <div className="text-[#F0E6FF]/40 text-xs">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#7B2FBE] font-bold text-lg">{searchResults.wallet?.pending_points || 0}</div>
                    <div className="text-[#F0E6FF]/40 text-xs">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#F0E6FF] font-bold text-lg">{searchResults.wallet?.lifetime_earned || 0}</div>
                    <div className="text-[#F0E6FF]/40 text-xs">Lifetime</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[#F0E6FF]/60 text-xs uppercase tracking-wide mb-2">Ledger History ({searchResults.ledger?.length || 0})</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {searchResults.ledger?.map(entry => (
                    <div key={entry.id} className="glass-card rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="text-[#F0E6FF]">{entry.source_type}</span>
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                          entry.status === 'available' ? 'bg-[#F5A800]/10 text-[#F5A800]' :
                          entry.status === 'pending' ? 'bg-[#7B2FBE]/10 text-[#7B2FBE]' :
                          entry.status === 'reversed' ? 'bg-red-500/10 text-red-400' :
                          'bg-[#F0E6FF]/10 text-[#F0E6FF]/40'
                        }`}>{entry.status}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={entry.points_delta > 0 ? 'text-[#F5A800]' : 'text-red-400'}>
                          {entry.points_delta > 0 ? '+' : ''}{entry.points_delta}
                        </span>
                        {entry.status !== 'reversed' && entry.entry_type === 'award' && (
                          <button onClick={() => handleReverse(entry.id)} disabled={updating === entry.id}
                            className="text-red-400/60 hover:text-red-400" title="Reverse">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl p-4">
            <h4 className="text-[#F0E6FF] font-medium text-sm mb-3">Program Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-[#F5A800] font-bold text-2xl">{rules.filter(r => r.status === 'active').length}</div>
                <div className="text-[#F0E6FF]/40 text-xs">Active Rules</div>
              </div>
              <div className="text-center">
                <div className="text-[#7B2FBE] font-bold text-2xl">{rules.filter(r => r.status === 'draft').length}</div>
                <div className="text-[#F0E6FF]/40 text-xs">Draft Rules</div>
              </div>
              <div className="text-center">
                <div className="text-[#F0E6FF] font-bold text-2xl">{catalog.filter(c => c.status === 'active').length}</div>
                <div className="text-[#F0E6FF]/40 text-xs">Active Benefits</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-2xl">${rules.reduce((sum, r) => sum + (r.monthly_issued_usd || 0), 0)}</div>
                <div className="text-[#F0E6FF]/40 text-xs">Issued This Month</div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <h4 className="text-[#F0E6FF] font-medium text-sm mb-2">Monthly Budget Status</h4>
            <div className="space-y-2">
              {rules.filter(r => r.monthly_budget_usd > 0).map(rule => {
                const pct = rule.monthly_budget_usd > 0 ? Math.round((rule.monthly_issued_usd || 0) / rule.monthly_budget_usd * 100) : 0;
                return (
                  <div key={rule.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#F0E6FF]/60">{RULE_LABELS[rule.rule_id] || rule.rule_id}</span>
                      <span className={pct >= 100 ? 'text-red-400' : 'text-[#F0E6FF]/50'}>${rule.monthly_issued_usd || 0} / ${rule.monthly_budget_usd} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F0E6FF]/10 overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : 'bg-[#F5A800]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass-card-orchid rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#7B2FBE] shrink-0 mt-0.5" />
            <p className="text-[#F0E6FF]/50 text-xs leading-relaxed">
              Full accounting reconciliation export (opening balance, issued, pending, released, redeemed, expired, reversed, closing balance, face-value exposure) requires connecting to the ledger data. Use the Member Lookup tab to inspect individual ledgers. A scheduled monthly report can be added on request.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}