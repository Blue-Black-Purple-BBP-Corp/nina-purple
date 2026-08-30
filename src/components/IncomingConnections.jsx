import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Check, Loader2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FoundingMemberBadge from '@/components/FoundingMemberBadge';

const ARCHETYPE_META = {
  blue: { color: '#60A5FA', label_en: 'The Traveler', label_fr: 'Le Voyageur' },
  black: { color: '#9CA3AF', label_en: 'The Seeker', label_fr: 'Le Chercheur' },
  purple: { color: '#A855F7', label_en: 'The Enlightened', label_fr: "L'Éveillé" },
};

// Incoming interest: connections where the current user is the matched person
// (to_user) and the matcher (from_user) has already unlocked (opted in).
// The user accepts to complete the mutual opt-in, which generates the
// Connection Brief. Free of charge — not a chargeable interaction.
export default function IncomingConnections({ lang, onAccepted }) {
  const [incoming, setIncoming] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      // Connections where I am the matched person, matcher has unlocked, still pending.
      const conns = await base44.entities.Connection.filter({ to_user_id: user.id });
      const pending = conns.filter((c) => c.is_unlocked && c.status === 'pending');
      setIncoming(pending);

      const fromIds = [...new Set(pending.map((c) => c.from_user_id))];
      if (fromIds.length > 0) {
        try {
          const res = await base44.functions.invoke('getConnectionProfiles', { user_ids: fromIds });
          setProfiles(res.data?.profiles || {});
        } catch (e) {
          console.warn('getConnectionProfiles failed:', e.message);
        }
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const accept = async (conn) => {
    setAccepting(conn.id);
    setError('');
    try {
      const res = await base44.functions.invoke('acceptConnection', { connection_id: conn.id });
      if (res.data?.success) {
        setIncoming((prev) => prev.filter((c) => c.id !== conn.id));
        if (onAccepted) onAccepted();
      } else {
        setError(res.data?.error || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.'));
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
    setAccepting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  if (incoming.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="w-14 h-14 rounded-full bg-[rgba(123,47,190,0.1)] flex items-center justify-center mx-auto">
          <Heart className="w-6 h-6 text-[#7B2FBE]" />
        </div>
        <p className="text-[#F0E6FF]/50 text-sm font-serif">
          {lang === 'fr' ? 'Aucun intérêt entrant pour le moment' : 'No incoming interest yet'}
        </p>
        <p className="text-[#F0E6FF]/30 text-xs">
          {lang === 'fr' ? 'Quand quelqu’un déverrouille votre profil, il apparaîtra ici.' : 'When someone unlocks your profile, they’ll appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
          {error}
        </div>
      )}
      {incoming.map((conn, i) => {
        const profile = profiles[conn.from_user_id];
        if (!profile) return null;
        const score = conn.compatibility_score || 0;
        const archetypeMeta = ARCHETYPE_META[profile.dating_archetype] || ARCHETYPE_META.purple;
        return (
          <motion.div key={conn.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass-card rounded-3xl overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <div className="w-full h-28 rounded-2xl mb-3 relative overflow-hidden flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2D1B3D, #1F1026)' }}>
                {profile.photos?.[0]
                  ? <img src={profile.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center">
                      <span className="text-white font-serif text-2xl">{profile.display_name?.[0]}</span>
                    </div>
                  )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#F0E6FF]">{profile.display_name}{profile.age ? `, ${profile.age}` : ''}</h3>
                  <p className="text-[#F0E6FF]/50 text-sm">{profile.city} · {profile.gender_pronoun}</p>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl font-bold text-[#F5A800]">{score}%</div>
                  <p className="text-[#F0E6FF]/30 text-[10px]">{lang === 'fr' ? 'Compatibilité' : 'Compatibility'}</p>
                </div>
              </div>
            </div>
            <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs border"
                style={{ color: archetypeMeta.color, borderColor: `${archetypeMeta.color}30`, background: `${archetypeMeta.color}10` }}>
                {lang === 'fr' ? archetypeMeta.label_fr : archetypeMeta.label_en}
              </span>
              {profile.is_founding_member && <FoundingMemberBadge />}
            </div>
            {profile.bio && (
              <div className="px-5 pb-3">
                <p className="text-[#F0E6FF]/60 text-sm leading-relaxed line-clamp-2">{profile.bio}</p>
              </div>
            )}
            <div className="golden-thread mx-5" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-[#F5A800]" />
                <p className="text-[#F0E6FF]/70 text-xs">
                  {lang === 'fr'
                    ? 'Cette personne a investi pour déverrouiller votre profil.'
                    : 'This person invested to unlock your profile.'}
                </p>
              </div>
              <button onClick={() => accept(conn)} disabled={accepting === conn.id}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#F5A800] text-[#0B0510] hover:bg-yellow-400 transition-all disabled:opacity-50">
                {accepting === conn.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" />}
                {lang === 'fr' ? 'Accepter la connexion' : 'Accept connection'}
              </button>
              <p className="text-[#F0E6FF]/30 text-[11px] text-center mt-2">
                {lang === 'fr'
                  ? 'Gratuit — vous recevrez un guide de conversation pour démarrer.'
                  : 'Free — you’ll both receive a conversation guide to get started.'}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}