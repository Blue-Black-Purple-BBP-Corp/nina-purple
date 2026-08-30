import React, { useState, useEffect } from 'react';
import { Loader2, Crown, AlertTriangle, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProgramSettingsPanel() {
  const [cutoff, setCutoff] = useState(222);
  const [settingId, setSettingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [preview, setPreview] = useState(null); // dry-run result
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [granting, setGranting] = useState(false);
  const [grantResult, setGrantResult] = useState(null);

  useEffect(() => { loadSetting(); }, []);

  const loadSetting = async () => {
    try {
      const settings = await base44.entities.AppSetting.filter({ key: 'founding_member_cutoff' });
      if (settings[0]) {
        setCutoff(parseInt(settings[0].value, 10) || 222);
        setSettingId(settings[0].id);
      }
    } catch (e) {
      console.error('Failed to load setting:', e.message);
    }
  };

  const saveCutoff = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      if (settingId) {
        await base44.entities.AppSetting.update(settingId, { value: String(cutoff) });
      } else {
        const created = await base44.entities.AppSetting.create({ key: 'founding_member_cutoff', value: String(cutoff) });
        setSettingId(created.id);
      }
      setSavedMsg('Cutoff saved.');
      setPreview(null); // force re-preview after change
    } catch (e) {
      setSavedMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    setLoadingPreview(true);
    setGrantResult(null);
    try {
      const res = await base44.functions.invoke('grantFoundingMembers', { dry_run: true });
      setPreview(res.data);
    } catch (e) {
      setPreview({ error: e.message });
    } finally {
      setLoadingPreview(false);
    }
  };

  const applyGrant = async () => {
    setGranting(true);
    try {
      const res = await base44.functions.invoke('grantFoundingMembers', { dry_run: false });
      setGrantResult(res.data);
      setPreview(null);
    } catch (e) {
      setGrantResult({ error: e.message });
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Cutoff editor */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-[#A855F7]" />
          <h3 className="font-serif text-lg text-[#F0E6FF]">Founding Member Cutoff</h3>
        </div>
        <p className="text-[#F0E6FF]/50 text-xs leading-relaxed mb-4">
          Users with a signup sequence number less than or equal to this cutoff are eligible for the Founding Member grant (badge + 3 free months). Grants are permanent — lowering the cutoff never revokes an existing grant.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={cutoff}
            onChange={e => setCutoff(parseInt(e.target.value, 10) || 0)}
            className="w-32 glass-card rounded-xl px-4 py-2.5 text-[#F0E6FF] text-sm outline-none bg-transparent"
          />
          <button
            onClick={saveCutoff}
            disabled={saving}
            className="px-5 py-2.5 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold hover:bg-yellow-400 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </div>
        {savedMsg && <p className="text-[#F0E6FF]/40 text-xs mt-2">{savedMsg}</p>}
      </div>

      {/* Grant tool */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-[#F5A800]" />
          <h3 className="font-serif text-lg text-[#F0E6FF]">Grant Founding Members</h3>
        </div>
        <p className="text-[#F0E6FF]/50 text-xs leading-relaxed mb-4">
          Preview the exact users who will be granted before applying. Re-running after raising the cutoff picks up newly-eligible users.
        </p>

        <button
          onClick={runPreview}
          disabled={loadingPreview}
          className="px-5 py-2.5 glass-card-gold rounded-full text-sm font-bold text-[#F5A800] hover:opacity-80 transition-all disabled:opacity-50"
        >
          {loadingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Preview eligible users'}
        </button>

        {preview && !preview.error && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(245,168,0,0.08)] border border-[rgba(245,168,0,0.25)]">
              <AlertTriangle className="w-4 h-4 text-[#F5A800] shrink-0" />
              <p className="text-[#F0E6FF]/80 text-sm">
                <span className="font-bold text-[#F5A800]">{preview.newly_eligible_count}</span> user{preview.newly_eligible_count !== 1 ? 's' : ''} will be granted (cutoff {preview.cutoff}).
              </p>
            </div>

            {preview.users?.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {preview.users.map(u => (
                  <div key={u.profile_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[rgba(240,230,255,0.04)] text-xs">
                    <span className="text-[#F0E6FF]/70">{u.display_name || u.user_id}</span>
                    <span className="text-[#F0E6FF]/40">#{u.signup_sequence_number}</span>
                  </div>
                ))}
              </div>
            )}

            {preview.newly_eligible_count > 0 && (
              <button
                onClick={applyGrant}
                disabled={granting}
                className="w-full py-3 bg-[#7B2FBE] text-white rounded-full text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crown className="w-4 h-4" /> Confirm grant to {preview.newly_eligible_count} user{preview.newly_eligible_count !== 1 ? 's' : ''}</>}
              </button>
            )}
          </div>
        )}

        {preview?.error && (
          <p className="text-red-400 text-xs mt-3">Error: {preview.error}</p>
        )}

        {grantResult && !grantResult.error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-green-400 text-sm font-medium">
              Granted Founding Member status to {grantResult.granted_count} user{grantResult.granted_count !== 1 ? 's' : ''}.
            </p>
          </div>
        )}
        {grantResult?.error && (
          <p className="text-red-400 text-xs mt-3">Error: {grantResult.error}</p>
        )}
      </div>
    </div>
  );
}