import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, ArrowRight, LifeBuoy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';

// Pending-confirmation screen shown when a Stripe checkout has been completed
// but the webhook has not yet confirmed the membership/trial. This prevents the
// redirect loop where AppLayout sends the member back to /onboarding because
// onboarding_status is still awaiting_payment_confirmation.
//
// Polls getMembershipOfferForMember at a safe interval. When the offer_type
// changes from awaiting_payment_confirmation to already_active, the parent is
// notified and the member is routed to /home.
//
// Never grants paid access from the URL query parameter alone — only the
// server-side authoritative state determines when confirmation is complete.
export default function MembershipPendingConfirmation({ onConfirmed, onReturnToMembership, lang }) {
  const isFr = lang === 'fr';
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [lastOfferType, setLastOfferType] = useState(null);
  const pollCount = useRef(0);
  const maxPolls = 20; // 20 polls × 5s = ~100s before timeout
  const intervalRef = useRef(null);

  const checkStatus = async () => {
    setPolling(true);
    try {
      const res = await base44.functions.invoke('getMembershipOfferForMember', {});
      const offer = res.data;
      if (!offer) return;

      setLastOfferType(offer.offer_type);

      // Webhook confirmed — membership is now active
      if (offer.offer_type === 'already_active') {
        clearInterval(intervalRef.current);
        onConfirmed(offer);
        return;
      }

      // Confirmation deadline passed — return to membership step
      if (offer.offer_type !== 'awaiting_payment_confirmation') {
        clearInterval(intervalRef.current);
        onReturnToMembership(offer);
        return;
      }
    } catch (e) {
      console.warn('Pending confirmation check failed:', e.message);
    } finally {
      setPolling(false);
    }
  };

  useEffect(() => {
    checkStatus();
    intervalRef.current = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current >= maxPolls) {
        clearInterval(intervalRef.current);
        setTimedOut(true);
        return;
      }
      checkStatus();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0510] flex flex-col items-center justify-center px-6 py-12 max-w-lg mx-auto">
      <div className="w-full space-y-8 text-center">
        {/* Animated indicator */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-[rgba(245,168,0,0.08)] animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full bg-[rgba(245,168,0,0.12)] flex items-center justify-center">
            {timedOut
              ? <LifeBuoy className="w-10 h-10 text-[#F5A800]" />
              : <Loader2 className="w-10 h-10 text-[#F5A800] animate-spin" />}
          </div>
        </div>

        {/* Title + description */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl text-[#F0E6FF]">
            {timedOut
              ? (isFr ? 'Votre paiement est encore en cours de confirmation' : 'Your payment is still being confirmed')
              : (isFr ? 'Nous confirmons votre adhésion' : 'We are confirming your membership')}
          </h1>
          <p className="text-[#F0E6FF]/50 text-sm leading-relaxed max-w-sm mx-auto">
            {timedOut
              ? (isFr
                ? 'Votre progression a été sauvegardée. Vous pouvez vérifier à nouveau ou contacter notre équipe.'
                : 'Your profile progress has been saved. You can check again or contact our team.')
              : (isFr
                ? 'Cela peut prendre un moment. Votre progression a été sauvegardée.'
                : 'This can take a moment. Your profile progress has been saved.')}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={checkStatus}
            disabled={polling}
            className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {polling
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Vérification…' : 'Checking…'}</>
              : <><RefreshCw className="w-4 h-4" /> {isFr ? 'Vérifier le statut' : 'Check status'}</>}
          </button>

          {timedOut && (
            <a
              href="mailto:support@ninapurple.love"
              className="w-full py-3 glass-card rounded-full text-[#F0E6FF]/60 text-sm font-medium hover:text-[#F5A800] transition-colors flex items-center justify-center gap-2"
            >
              <LifeBuoy className="w-4 h-4" />
              {isFr ? 'Contacter le support' : 'Contact support'}
            </a>
          )}

          {!timedOut && (
            <button
              onClick={() => onReturnToMembership(null)}
              className="w-full py-3 glass-card rounded-full text-[#F0E6FF]/60 text-sm font-medium hover:text-[#F5A800] transition-colors flex items-center justify-center gap-2"
            >
              {isFr ? 'Retour à l\'adhésion' : 'Return to membership'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status text — communicates state with text, not color alone */}
        <p className="text-[#F0E6FF]/30 text-xs">
          {polling
            ? (isFr ? 'Vérification de votre statut…' : 'Checking your status…')
            : timedOut
              ? (isFr ? 'Délai dépassé. Vérifiez à nouveau ou contactez le support.' : 'Timed out. Check again or contact support.')
              : (isFr ? 'En attente de confirmation du serveur…' : 'Waiting for server confirmation…')}
        </p>
      </div>
    </div>
  );
}