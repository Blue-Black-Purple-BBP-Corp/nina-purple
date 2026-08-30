import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle, Unlock, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Shows the user's remaining free unlocks and free messages for the current
// billing cycle, plus their renewal date. Only renders for active members.
export default function UsageIndicator({ lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await base44.functions.invoke('getUsageCounters', {});
        if (res.data) setData(res.data);
      } catch (e) {
        console.error('UsageIndicator error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-[#F5A800] animate-spin" />
      </div>
    );
  }
  if (!data || !data.membership_active) return null;

  const unlocksUsed = data.free_profile_unlocks_used || 0;
  const unlocksTotal = data.free_profile_unlocks || 0;
  const messagesUsed = data.free_messages_used || 0;
  const messagesTotal = data.free_messages || 0;
  const renewalDate = data.subscription_renewal_date
    ? new Date(data.subscription_renewal_date).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US')
    : '—';

  const isExempt = data.subscription_status === 'billing_exempt';

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-[#F5A800]" />
        <span className="text-[#F0E6FF] text-sm font-medium">
          {lang === 'fr' ? 'Utilisation de ce cycle' : 'This cycle usage'}
        </span>
        {isExempt && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)]">
            {lang === 'fr' ? 'Exempté de facturation' : 'Billing exempt'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0">
            <Unlock className="w-4 h-4 text-[#7B2FBE]" />
          </div>
          <div>
            <div className="text-[#F0E6FF] text-sm font-bold">
              {unlocksUsed} / {unlocksTotal === Infinity ? '∞' : unlocksTotal}
            </div>
            <div className="text-[#F0E6FF]/40 text-xs">
              {lang === 'fr' ? 'déverrouillages gratuits' : 'free unlocks'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-[#7B2FBE]" />
          </div>
          <div>
            <div className="text-[#F0E6FF] text-sm font-bold">
              {messagesUsed} / {messagesTotal === Infinity ? '∞' : messagesTotal}
            </div>
            <div className="text-[#F0E6FF]/40 text-xs">
              {lang === 'fr' ? 'messages gratuits' : 'free messages'}
            </div>
          </div>
        </div>
      </div>
      {data.subscription_renewal_date && (
        <div className="flex items-center gap-2 text-[#F0E6FF]/40 text-xs pt-1 border-t border-[rgba(240,230,255,0.05)]">
          <Calendar className="w-3 h-3" />
          {lang === 'fr' ? 'Renouvellement le ' : 'Renews on '}{renewalDate}
        </div>
      )}
    </div>
  );
}