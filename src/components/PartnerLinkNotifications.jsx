import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, X, Loader2, Users, Mail, Info } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';

export default function PartnerLinkNotifications({ onResolved }) {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await base44.functions.invoke('linkPartner', { action: 'get_status' });
      if (res.data?.success) {
        setRequests(res.data.incoming_requests || []);
        if (onResolved && res.data.incoming_requests?.length === 0) {
          // No pending requests
        }
      }
    } catch (e) {
      console.error('Failed to load partner link requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (linkId) => {
    setProcessing(linkId);
    try {
      await base44.functions.invoke('linkPartner', { action: 'accept', link_id: linkId });
      setRequests(prev => prev.filter(r => r.id !== linkId));
      if (onResolved) onResolved();
    } catch (e) {
      console.error('Accept failed:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (linkId) => {
    setProcessing(linkId);
    try {
      await base44.functions.invoke('linkPartner', { action: 'decline', link_id: linkId });
      setRequests(prev => prev.filter(r => r.id !== linkId));
    } catch (e) {
      console.error('Decline failed:', e);
    } finally {
      setProcessing(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <AnimatePresence>
      {requests.map(req => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass-card-orchid rounded-2xl p-5 mb-4"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#7B2FBE]" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-base text-[#F0E6FF] mb-1">
                {isFr ? 'Demande de liaison de couple' : 'Couple Link-Up Request'}
              </h3>
              <p className="text-[#F0E6FF]/60 text-sm">
                {isFr
                  ? `${req.from_display_name || req.from_email} souhaite créer un profil de couple avec vous. En acceptant, vous serez tous les deux retirés du pool de matching individuel.`
                  : `${req.from_display_name || req.from_email} wants to create a couple profile with you. By accepting, you will both be removed from the individual matching pool.`}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleAccept(req.id)}
              disabled={processing === req.id}
              className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all disabled:opacity-60"
            >
              {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {isFr ? 'Accepter' : 'Accept'}</>}
            </button>
            <button
              onClick={() => handleDecline(req.id)}
              disabled={processing === req.id}
              className="flex-1 py-3 glass-card rounded-full text-foreground/60 font-medium text-sm flex items-center justify-center gap-2 hover:opacity-80 transition-all disabled:opacity-60"
            >
              <X className="w-4 h-4" /> {isFr ? 'Refuser' : 'Decline'}
            </button>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}