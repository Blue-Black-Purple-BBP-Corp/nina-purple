import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Lock, ArrowLeft, Heart, MapPin, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';
import FoundingMemberBadge from '@/components/FoundingMemberBadge';
import { getArchetypeLabel, getArchetypeColor } from '@/lib/archetypes';

// Renders the member's own profile exactly as an ordinary non-entitled member
// would see it: locked photos, no bio, no wallet/subscription/edit controls,
// no internal tags. Uses the server-side getProfilePreview projection.
// Photos are shown in the locked state — the owner's real images are NOT
// delivered in preview. Creates no payment, entitlement, or analytics side effect.
export default function ProfilePreview() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('getProfilePreview', {});
        if (res.data?.data) setPreview(res.data.data);
        else if (res.data) setPreview(res.data);
      } catch (e) {
        console.warn('getProfilePreview failed:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#F5A800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <p className="text-foreground/50 text-sm">{isFr ? 'Aperçu indisponible.' : 'Preview unavailable.'}</p>
        <Link to="/profile" className="mt-4 inline-block text-[#F5A800] text-sm hover:opacity-80">
          {isFr ? '← Retour au profil' : '← Back to profile'}
        </Link>
      </div>
    );
  }

  const archetypeColor = getArchetypeColor(preview.dating_archetype);
  const archetypeLabel = getArchetypeLabel(preview.dating_archetype, lang);
  const initials = (preview.display_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Banner */}
      <div className="glass-card-orchid rounded-2xl p-3 flex items-center gap-2.5">
        <Eye className="w-4 h-4 text-[#7B2FBE] shrink-0" />
        <p className="text-foreground/70 text-xs leading-relaxed">
          {isFr
            ? "Voici comment votre profil apparaît aux autres membres Nina Purple."
            : 'This is how your profile appears to other Nina Purple members.'}
        </p>
      </div>

      {/* Profile card — viewer-facing */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl overflow-hidden">

        {/* Locked photo area */}
        <div className="w-full h-56 relative overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2D1B3D, #1F1026)' }}>
          <div className="absolute inset-0 backdrop-blur-xl" />
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center mx-auto mb-3 opacity-80">
              <span className="text-white font-serif text-2xl">{initials}</span>
            </div>
            <Lock className="w-5 h-5 text-foreground/30 mx-auto mb-1" />
            <p className="text-foreground/40 text-xs">
              {preview.photo_count > 0
                ? (isFr ? `Photos privées (${preview.photo_count})` : `Private photos (${preview.photo_count})`)
                : (isFr ? 'Aucune photo' : 'No photos')}
            </p>
          </div>
        </div>

        {/* Identity */}
        <div className="p-5 space-y-3">
          <div>
            <h2 className="font-serif text-2xl text-foreground">
              {preview.display_name || (isFr ? 'Membre' : 'Member')}{preview.age ? `, ${preview.age}` : ''}
            </h2>
            {preview.city && (
              <p className="text-foreground/50 text-sm mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {preview.city}{preview.country ? `, ${preview.country}` : ''}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs border"
              style={{ color: archetypeColor, borderColor: `${archetypeColor}30`, background: `${archetypeColor}10` }}>
              {archetypeLabel}
            </span>
            {preview.gender_pronoun && (
              <span className="px-2.5 py-1 rounded-full text-xs border border-foreground/10 text-foreground/50">
                {preview.gender_pronoun}
              </span>
            )}
            {preview.paired_status === 'paired' && (
              <span className="px-2.5 py-1 rounded-full text-xs border flex items-center gap-1"
                style={{ color: '#7B2FBE', borderColor: 'rgba(123,47,190,0.3)', background: 'rgba(123,47,190,0.1)' }}>
                <Heart className="w-3 h-3" /> {isFr ? 'En couple' : 'Coupled'}
              </span>
            )}
            {preview.is_founding_member && <FoundingMemberBadge />}
          </div>

          {/* Bio — locked for non-entitled viewers */}
          <div className="pt-2 border-t border-foreground/5">
            <div className="flex items-center gap-2 text-foreground/30">
              <Lock className="w-3.5 h-3.5" />
              <p className="text-xs">{isFr ? 'Bio verrouillée — déverrouillez la connexion pour voir.' : 'Bio locked — unlock the connection to view.'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Exit */}
      <Link to="/profile"
        className="w-full py-3.5 glass-card rounded-full text-foreground/70 hover:text-[#F5A800] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        {isFr ? 'Quitter l’aperçu' : 'Exit preview'}
      </Link>
    </div>
  );
}