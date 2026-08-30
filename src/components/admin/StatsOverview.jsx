import React from 'react';
import { Users, ShieldCheck, BadgeCheck, AlertTriangle, UserX, Clock } from 'lucide-react';

// Aggregate stat tiles for the dashboard landing.
export default function StatsOverview({ stats }) {
  if (!stats) return null;

  const tiles = [
    { label: 'Total Members', value: stats.total_members, icon: Users, color: '#7B2FBE' },
    { label: 'Verified', value: stats.verified_members, icon: BadgeCheck, color: '#22C55E' },
    { label: 'Pending Verifications', value: stats.pending_verifications, icon: ShieldCheck, color: '#F5A800' },
    { label: 'Pending Moderation', value: stats.pending_moderation, icon: AlertTriangle, color: '#EF4444' },
    { label: 'Suspended', value: stats.suspended_accounts, icon: UserX, color: '#DC2626' },
    { label: 'Limited Review', value: stats.limited_review_accounts, icon: Clock, color: '#F59E0B' },
    { label: 'New This Period', value: stats.new_this_period, icon: Users, color: '#A855F7' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {tiles.map((t, i) => {
        const Icon = t.icon;
        return (
          <div key={i} className="glass-card rounded-2xl p-4 flex flex-col gap-2">
            <Icon className="w-4 h-4" style={{ color: t.color }} />
            <div className="text-2xl font-bold" style={{ color: t.color }}>{t.value}</div>
            <div className="text-[#F0E6FF]/40 text-[11px] leading-tight">{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}