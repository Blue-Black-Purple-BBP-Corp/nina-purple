import React, { useState, useEffect } from 'react';
import { Loader2, Award, Clock, Calendar, Video, Phone, Check, X, ChevronDown, ChevronUp, Mail, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Admin panel for reviewing and processing ambassador applications.
// Actions: move to in_review, schedule interview, approve, decline.
// Each action triggers an email to the applicant via the backend function.
const STATUS_META = {
  submitted:           { color: '#A78BFA', label_en: 'Submitted',          label_fr: 'Soumise' },
  in_review:           { color: '#F5A800', label_en: 'In Review',          label_fr: 'En révision' },
  interview_scheduled: { color: '#3B82F6', label_en: 'Interview Scheduled', label_fr: 'Entrevue planifiée' },
  approved:            { color: '#22C55E', label_en: 'Approved',           label_fr: 'Approuvé' },
  declined:            { color: '#EF4444', label_en: 'Declined',           label_fr: 'Refusée' },
};

export default function AmbassadorManager() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [actionMode, setActionMode] = useState(null); // null | 'schedule' | 'approve' | 'decline'
  const [processing, setProcessing] = useState(null);
  const [actionForm, setActionForm] = useState({
    interview_type: 'video',
    interview_date: '',
    interview_link: '',
    interview_phone: '',
    interview_notes: '',
    decision_feedback: '',
  });

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const apps = await base44.entities.AmbassadorApplication.list('-submitted_date', 100);
      setApplications(apps);
    } catch (err) {
      console.error('Ambassador load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appId, action, extra = {}) => {
    setProcessing(appId);
    try {
      await base44.functions.invoke('updateAmbassadorApplication', {
        application_id: appId,
        action,
        ...extra,
      });
      await loadApplications();
      setActionMode(null);
      setActionForm({ interview_type: 'video', interview_date: '', interview_link: '', interview_phone: '', interview_notes: '', decision_feedback: '' });
    } catch (err) {
      console.error('Ambassador action error:', err.message);
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = applications.filter(app => filter === 'all' || app.status === filter);

  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === 'submitted').length,
    in_review: applications.filter(a => a.status === 'in_review').length,
    interview: applications.filter(a => a.status === 'interview_scheduled').length,
    approved: applications.filter(a => a.status === 'approved').length,
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#7B2FBE' },
          { label: 'New', value: stats.submitted, color: '#A78BFA' },
          { label: 'Reviewing', value: stats.in_review, color: '#F5A800' },
          { label: 'Interview', value: stats.interview, color: '#3B82F6' },
          { label: 'Approved', value: stats.approved, color: '#22C55E' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[#F0E6FF]/40 text-[10px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === 'all' ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/50'}`}>
          All
        </button>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? '' : 'glass-card text-[#F0E6FF]/50'}`}
            style={filter === key ? { background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` } : {}}>
            {meta.label_en}
          </button>
        ))}
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#F0E6FF]/30">
            <Award className="w-8 h-8 mx-auto mb-2" />
            No applications
          </div>
        ) : (
          filtered.map(app => {
            const meta = STATUS_META[app.status] || STATUS_META.submitted;
            const isExpanded = expanded === app.id;
            const isActionMode = actionMode && expanded === app.id;
            return (
              <div key={app.id} className="glass-card rounded-2xl overflow-hidden">
                {/* Header row */}
                <button onClick={() => { setExpanded(isExpanded ? null : app.id); setActionMode(null); }}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-[rgba(240,230,255,0.02)] transition-all">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{(app.display_name || '?')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#F0E6FF] font-medium text-sm">{app.display_name || '—'}</div>
                    <div className="flex items-center gap-3 text-[#F0E6FF]/30 text-xs flex-wrap">
                      {app.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>}
                      {app.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.city}</span>}
                      <span>{new Date(app.submitted_date || app.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full shrink-0" style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                    {meta.label_en}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#F0E6FF]/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#F0E6FF]/30 shrink-0" />}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[rgba(240,230,255,0.06)] pt-3">
                    {/* Motivation */}
                    <div>
                      <p className="text-[#F0E6FF]/40 text-[10px] uppercase tracking-wider mb-1">Motivation</p>
                      <p className="text-[#F0E6FF]/70 text-sm leading-relaxed">{app.motivation}</p>
                    </div>

                    {/* Application details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {app.weekly_availability && (
                        <div>
                          <span className="text-[#F0E6FF]/40">Availability: </span>
                          <span className="text-[#F0E6FF]/70">{app.weekly_availability}</span>
                        </div>
                      )}
                      {app.social_presence && (
                        <div>
                          <span className="text-[#F0E6FF]/40">Social: </span>
                          <span className="text-[#F0E6FF]/70">{app.social_presence}</span>
                        </div>
                      )}
                      {app.references && (
                        <div className="col-span-2">
                          <span className="text-[#F0E6FF]/40">References: </span>
                          <span className="text-[#F0E6FF]/70">{app.references}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#F0E6FF]/40">Preferred interview: </span>
                        <span className="text-[#F0E6FF]/70">{app.preferred_interview}</span>
                      </div>
                    </div>

                    {/* Interview details if scheduled */}
                    {app.status === 'interview_scheduled' && app.interview_date && (
                      <div className="rounded-xl p-3 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)]">
                        <div className="flex items-center gap-2 text-xs text-[#3B82F6] font-medium mb-1">
                          {app.interview_type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                          Interview scheduled
                        </div>
                        <div className="text-[#F0E6FF]/60 text-xs">
                          {new Date(app.interview_date).toLocaleString('en-CA', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Toronto' })} (ET)
                        </div>
                        {app.interview_link && <div className="text-[#3B82F6] text-xs mt-1 truncate">{app.interview_link}</div>}
                        {app.interview_phone && <div className="text-[#F0E6FF]/60 text-xs mt-1">{app.interview_phone}</div>}
                        {app.interview_notes && <div className="text-[#F0E6FF]/40 text-xs mt-1">{app.interview_notes}</div>}
                      </div>
                    )}

                    {/* Decision feedback if approved/declined */}
                    {(app.status === 'approved' || app.status === 'declined') && app.decision_feedback && (
                      <div className={`rounded-xl p-3 ${app.status === 'approved' ? 'bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.2)]' : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)]'} border`}>
                        <p className="text-[#F0E6FF]/40 text-[10px] uppercase tracking-wider mb-1">Feedback sent to applicant</p>
                        <p className="text-[#F0E6FF]/70 text-xs">{app.decision_feedback}</p>
                      </div>
                    )}

                    {/* Admin actions */}
                    {app.status !== 'approved' && app.status !== 'declined' && !isActionMode && (
                      <div className="flex gap-2 flex-wrap pt-1">
                        {app.status === 'submitted' && (
                          <button onClick={() => handleAction(app.id, 'in_review')} disabled={processing === app.id}
                            className="px-4 py-2 rounded-full text-xs font-medium bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.3)] hover:bg-[rgba(245,168,0,0.2)] transition-all disabled:opacity-50">
                            {processing === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start Review'}
                          </button>
                        )}
                        <button onClick={() => { setActionMode('schedule'); setActionForm(f => ({ ...f, interview_type: app.preferred_interview || 'video' })); }}
                          className="px-4 py-2 rounded-full text-xs font-medium bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border border-[rgba(59,130,246,0.3)] hover:bg-[rgba(59,130,246,0.2)] transition-all">
                          <Calendar className="w-3 h-3 inline mr-1" />Schedule Interview
                        </button>
                        <button onClick={() => setActionMode('approve')}
                          className="px-4 py-2 rounded-full text-xs font-medium bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] hover:bg-[rgba(34,197,94,0.2)] transition-all">
                          <Check className="w-3 h-3 inline mr-1" />Approve
                        </button>
                        <button onClick={() => setActionMode('decline')}
                          className="px-4 py-2 rounded-full text-xs font-medium bg-[rgba(239,68,68,0.1)] text-red-400 border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.2)] transition-all">
                          <X className="w-3 h-3 inline mr-1" />Decline
                        </button>
                      </div>
                    )}

                    {/* Schedule interview form */}
                    {isActionMode === 'schedule' && (
                      <div className="rounded-xl p-3 bg-[rgba(59,130,246,0.06)] border border-[rgba(59,130,246,0.2)] space-y-2">
                        <p className="text-[#3B82F6] text-xs font-medium">Schedule Interview</p>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={actionForm.interview_type} onChange={e => setActionForm(f => ({ ...f, interview_type: e.target.value }))}
                            className="glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-[#1F1026]">
                            <option value="video">Video</option>
                            <option value="phone">Phone</option>
                          </select>
                          <input type="datetime-local" value={actionForm.interview_date} onChange={e => setActionForm(f => ({ ...f, interview_date: e.target.value }))}
                            className="glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-transparent" />
                        </div>
                        {actionForm.interview_type === 'video' ? (
                          <input type="text" value={actionForm.interview_link} onChange={e => setActionForm(f => ({ ...f, interview_link: e.target.value }))}
                            placeholder="Video meeting link (Google Meet, Zoom...)"
                            className="w-full glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-transparent placeholder-[rgba(240,230,255,0.2)]" />
                        ) : (
                          <input type="text" value={actionForm.interview_phone} onChange={e => setActionForm(f => ({ ...f, interview_phone: e.target.value }))}
                            placeholder="Phone number to call"
                            className="w-full glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-transparent placeholder-[rgba(240,230,255,0.2)]" />
                        )}
                        <textarea value={actionForm.interview_notes} onChange={e => setActionForm(f => ({ ...f, interview_notes: e.target.value }))}
                          placeholder="Notes for the applicant (optional)"
                          rows={2}
                          className="w-full glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-transparent resize-none placeholder-[rgba(240,230,255,0.2)]" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(app.id, 'schedule_interview', actionForm)} disabled={processing === app.id || !actionForm.interview_date}
                            className="flex-1 py-2 bg-[#3B82F6] text-white rounded-full text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                            {processing === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Calendar className="w-3 h-3" />Confirm & Notify</>}
                          </button>
                          <button onClick={() => setActionMode(null)}
                            className="px-4 py-2 glass-card rounded-full text-xs text-[#F0E6FF]/50 hover:text-[#F0E6FF]/70">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Approve form */}
                    {isActionMode === 'approve' && (
                      <div className="rounded-xl p-3 bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.2)] space-y-2">
                        <p className="text-green-400 text-xs font-medium">Approve Ambassador</p>
                        <textarea value={actionForm.decision_feedback} onChange={e => setActionForm(f => ({ ...f, decision_feedback: e.target.value }))}
                          placeholder="Welcome message / feedback for the applicant (optional)"
                          rows={2}
                          className="w-full glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-transparent resize-none placeholder-[rgba(240,230,255,0.2)]" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(app.id, 'approve', { decision_feedback: actionForm.decision_feedback })} disabled={processing === app.id}
                            className="flex-1 py-2 bg-green-500 text-white rounded-full text-xs font-bold hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                            {processing === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" />Approve & Activate Badge</>}
                          </button>
                          <button onClick={() => setActionMode(null)}
                            className="px-4 py-2 glass-card rounded-full text-xs text-[#F0E6FF]/50 hover:text-[#F0E6FF]/70">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Decline form */}
                    {isActionMode === 'decline' && (
                      <div className="rounded-xl p-3 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] space-y-2">
                        <p className="text-red-400 text-xs font-medium">Decline Application</p>
                        <textarea value={actionForm.decision_feedback} onChange={e => setActionForm(f => ({ ...f, decision_feedback: e.target.value }))}
                          placeholder="Feedback for the applicant (optional but recommended)"
                          rows={2}
                          className="w-full glass-card rounded-lg px-3 py-2 text-[#F0E6FF] text-xs outline-none bg-transparent resize-none placeholder-[rgba(240,230,255,0.2)]" />
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(app.id, 'decline', { decision_feedback: actionForm.decision_feedback })} disabled={processing === app.id}
                            className="flex-1 py-2 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                            {processing === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3" />Decline & Notify</>}
                          </button>
                          <button onClick={() => setActionMode(null)}
                            className="px-4 py-2 glass-card rounded-full text-xs text-[#F0E6FF]/50 hover:text-[#F0E6FF]/70">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}