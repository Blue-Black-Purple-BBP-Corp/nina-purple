import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Fetches the current user's plan limits and usage from the backend.
export function usePlanLimits() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('checkPlanLimits', {});
      setData(res.data);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Check a specific action; returns { allowed, reason }
  const checkAction = useCallback(async (action) => {
    try {
      const res = await base44.functions.invoke('checkPlanLimits', { action });
      return { allowed: res.data?.allowed, reason: res.data?.reason, data: res.data };
    } catch (e) {
      return { allowed: false, reason: 'Unable to verify plan limits.' };
    }
  }, []);

  return { data, loading, refresh, checkAction };
}