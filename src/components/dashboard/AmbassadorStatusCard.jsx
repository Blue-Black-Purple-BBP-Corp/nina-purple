import React, { useState, useEffect } from 'react';
import { Heart, Award, Check, Clock, Video, Phone, Calendar, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AmbassadorApplicationModal from '@/components/dashboard/AmbassadorApplicationModal';

// Self-contained ambassador status tracker. Fetches the user's latest
// application and renders the appropriate state:
// - No application → "Apply" button (opens the application modal)
// - Application in progress → stage tracker with interview details
// - Approved → "Active" badge
// - Declined → feedback + re-apply countdown
export default function AmbassadorStatusCard({ profile, lang, onRefresh }) {
  const isFr = lang === 'fr';
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const isAmbassador = !!profile?.is_ambassador;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const apps = await base44.entities.AmbassadorApplication.filter(
          { user_id: user.id }, '-submitted_date', 1
        );
        if (active) setApplication(apps[0] || null);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [profile?.is_ambassador, profile?.updated_date]);

  const handleModalDone = () => {
    setModalOpen(false);
    onRefresh?.();
    // Re-fetch application
    (async () => {
      try {
        const user = await base44.auth.me();
        const apps = await base44.entities.AmbassadorApplication.filter(
          { user_id: user.id }, '-submitted_date', 1
        );
        setApplication(apps[0] || null);
      } catch {}
    })();
  };

  // ── Already an ambassador ──
  if (isAmbassador) {
    return (
      <div className="w-full flex items-center gap-2.5 rounded-lg p-2 bg-[rgba(245,168,0,0.06)]">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(245,168,0,0.15)]">
          <Award className="w-3.5 h-3.5 text-[#F5A800]" />
        </div>
        <div className="flex-1">
          <span className="text-[#F0E6FF]/70 text-xs block">
            {isFr ? 'Ambassadeur Nina Purple' : 'Nina Purple Ambassador'}
          </span>
          <span className="text-[#F5A800]/60 text-[10px]">❤️ {isFr ? 'Ambassadeur pour l' + "'humanité" : 'Ambassador for humanity'}</span>
        </div>
        <span className="text-[9px] font-bold uppercase text-[#F5A800]">{isFr ? 'Actif' : 'Active'}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex items-center gap-2.5 rounded-lg p-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(245,168,0,0.08)]">
          <Loader2 className="w-3.5 h-3.5 text-[#F5A800] animate-spin" />
        </div>
        <span className="text-[#F0E6FF]/40 text-xs">{isFr ? 'Chargement...' : 'Loading...'}</span>
      </div>
    );
  }

  // ── No application yet → show apply button ──
  if (!application) {
    return (
      <>
        <button onClick={() => setModalOpen(true)}
          className="w-full flex items-center gap-2.5 text-left rounded-lg p-2 hover:bg-[rgba(240,230,255,0.04)] transition-all group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(245,168,0,0.08)]">
            <Heart className="w-3.5 h-3.5 text-[#F5A800]" />
          </div>
          <div className="flex-1">
            <span className="text-[#F0E6FF]/70 text-xs block">
              {isFr ? 'Devenir ambassadeur Nina Purple' : 'Become a Nina Purple Ambassador'}
            </span>
            <span className="text-[#F5A800]/60 text-[10px]">❤️ {isFr ? 'Ambassadeur pour l' + "'humanité" : 'Ambassador for humanity'}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
        </button>
        <AmbassadorApplicationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} lang={lang} onDone={handleModalDone} />
      </>
    );
  }

  // ── Application in progress or declined ──
  const stages = [
    { key: 'submitted', label: isFr ? 'Candidature envoyée' : 'Application submitted', icon: Check },
    { key: 'in_review', label: isFr ? 'En révision' : 'Under review', icon: Clock },
    { key: 'interview_scheduled', label: isFr ? 'Entrevue planifiée' : 'Interview scheduled', icon: Calendar },
    { key: 'approved', label: isFr ? 'Approuvé' : 'Approved', icon: Award },
  ];

  const stageOrder = ['submitted', 'in_review', 'interview_scheduled', 'approved'];
  const currentIdx = stageOrder.indexOf(application.status);
  const isDeclined = application.status === 'declined';

  // Calculate re-apply eligibility for declined
  let canReapply = false;
  let daysUntilReapply = 0;
  if (isDeclined && application.decision_date) {
    const declinedDate = new Date(application.decision_date);
    const daysSince = Math.floor((Date.now() - declinedDate.getTime()) / (1000 * 60 * 60 * 24));
    daysUntilReapply = Math.max(0, 30 - daysSince);
    canReapply = daysUntilReapply === 0;
  }

  return (
    <>
      <div className="w-full rounded-lg p-3 bg-[rgba(11,5,16,0.4)] border border-[rgba(123,47,190,0.15)] space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(123,47,190,0.12)]">
            <Heart className="w-3.5 h-3.5 text-[#7B2FBE]" />
          </div>
          <span className="text-[#F0E6FF]/70 text-xs font-medium">
            {isFr ? 'Candidature ambassadeur' : 'Ambassador application'}
          </span>
        </div>

        {isDeclined ? (
          <>
            <div className="flex items-center gap-2 text-xs">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-red-400/80">
                {isFr ? 'Candidature non retenue' : 'Application not selected'}
              </span>
            </div>
            {application.decision_feedback && (
              <p className="text-[#F0E6FF]/50 text-[11px] leading-relaxed pl-6">
                {application.decision_feedback}
              </p>
            )}
            {canReapply ? (
              <button onClick={() => setModalOpen(true)}
                className="w-full py-2 text-xs text-[#F5A800] hover:underline">
                {isFr ? 'Postuler à nouveau →' : 'Apply again →'}
              </button>
            ) : (
              <p className="text-[#F0E6FF]/30 text-[10px] pl-6">
                {isFr
                  ? `Vous pourrez postuler à nouveau dans ${daysUntilReapply} jour${daysUntilReapply > 1 ? 's' : ''}.`
                  : `You can re-apply in ${daysUntilReapply} day${daysUntilReapply > 1 ? 's' : ''}.`}
              </p>
            )}
          </>
        ) : (
          <>
            {/* Stage tracker */}
            <div className="space-y-1.5">
              {stages.map((stage, i) => {
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={stage.key} className="flex items-center gap-2 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isDone ? 'bg-[rgba(123,47,190,0.2)]' :
                      isCurrent ? 'bg-[rgba(245,168,0,0.15)] ring-2 ring-[#F5A800]/30' :
                      'bg-[rgba(240,230,255,0.05)]'
                    }`}>
                      {isDone
                        ? <Check className="w-3 h-3 text-[#7B2FBE]" />
                        : <stage.icon className={`w-3 h-3 ${isCurrent ? 'text-[#F5A800]' : 'text-[#F0E6FF]/20'}`} />
                      }
                    </div>
                    <span className={isDone || isCurrent ? 'text-[#F0E6FF]/70' : 'text-[#F0E6FF]/30'}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Interview details */}
            {application.status === 'interview_scheduled' && application.interview_date && (
              <div className="rounded-xl p-3 bg-[rgba(245,168,0,0.06)] border border-[rgba(245,168,0,0.15)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[#F5A800] font-medium">
                  {application.interview_type === 'video'
                    ? <Video className="w-3.5 h-3.5" />
                    : <Phone className="w-3.5 h-3.5" />}
                  {isFr ? 'Votre entrevue' : 'Your interview'}
                </div>
                <div className="text-[#F0E6FF]/60 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#F0E6FF]/30" />
                    {new Date(application.interview_date).toLocaleString(isFr ? 'fr-CA' : 'en-CA', {
                      dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Toronto',
                    })} (ET)
                  </div>
                  {application.interview_type === 'video' && application.interview_link && (
                    <a href={application.interview_link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#F5A800] hover:underline">
                      <Video className="w-3 h-3" />
                      {isFr ? 'Rejoindre la réunion →' : 'Join meeting →'}
                    </a>
                  )}
                  {application.interview_type === 'phone' && application.interview_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#F0E6FF]/30" />
                      {application.interview_phone}
                    </div>
                  )}
                </div>
                {application.interview_notes && (
                  <p className="text-[#F0E6FF]/40 text-[10px] leading-relaxed pt-1">
                    {application.interview_notes}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AmbassadorApplicationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} lang={lang} onDone={handleModalDone} />
    </>
  );
}