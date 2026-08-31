import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Coins, Shield, Camera, ChevronRight as ChevronRightIcon, Crown, Edit3, Award, Users, Loader2, LogOut, LogIn, User as UserIcon, Trash2, AlertTriangle, Eye, Sparkles, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import PricingModal from '@/components/PricingModal';
import CreditsModal from '@/components/CreditsModal';
import NinaAvatar from '@/components/NinaAvatar';
import ManagePhotosModal from '@/components/profile/ManagePhotosModal';
import PrivacySettingsModal from '@/components/profile/PrivacySettingsModal';
import ReferralModal from '@/components/profile/ReferralModal';
import UpgradeModal from '@/components/profile/UpgradeModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import WalletSummaryCard from '@/components/profile/WalletSummaryCard';
import FoundingMemberBadge from '@/components/FoundingMemberBadge';
import ExperienceModeSwitch from '@/components/profile/ExperienceModeSwitch';
import { usePhotoAccess, primaryPhotoUrl } from '@/hooks/usePhotoAccess';
import CommunityStandingCard from '@/components/bbp/CommunityStandingCard';
import UsageIndicator from '@/components/dashboard/UsageIndicator';
// TEMP: import AmbassadorBadge from '@/components/dashboard/AmbassadorBadge';
import { base44 } from '@/api/base44Client';
import { getArchetypeLabel } from '@/lib/archetypes';

const TIER_META = {
  solar:   { color: '#A78BFA', label_en: 'Solar',    label_fr: 'Solaire',    icon: '☀️' },
  lunar:   { color: '#7B2FBE', label_en: 'Lunar',    label_fr: 'Lunaire',    icon: '🌙' },
  stellar: { color: '#A855F7', label_en: 'Stellar',  label_fr: 'Stellaire',  icon: '⭐' },
  galactic:{ color: '#F5A800', label_en: 'Galactic', label_fr: 'Galactique', icon: '🌌' },
  nina_membership: { color: '#F5A800', label_en: 'Membership', label_fr: 'Adhésion', icon: '💜' },
};

export default function Profile() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const navigate = useNavigate();
  const [pricingOpen, setPricingOpen]   = useState(false);
  const [creditsOpen, setCreditsOpen]   = useState(false);
  const [upgradeOpen, setUpgradeOpen]   = useState(false);
  const [photosOpen, setPhotosOpen]     = useState(false);
  const [privacyOpen, setPrivacyOpen]   = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [authUser, setAuthUser]         = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [matchingAnswers, setMatchingAnswers] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Owner views their own photos via authorized delivery (owner_access).
  const ownerId = userProfile?.user_id;
  const { photoData: myPhotoData } = usePhotoAccess(ownerId ? [ownerId] : [], ownerId || '');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    const authenticated = await base44.auth.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      const user = await base44.auth.me();
      setAuthUser(user);
      const [profiles, answers] = await Promise.all([
        base44.entities.UserProfile.filter({ user_id: user.id }),
        base44.entities.MatchingAnswers.filter({ user_id: user.id }),
      ]);
      const profile = profiles[0] || null;
      if (profile) {
        try {
          const myPhotos = await base44.entities.Photo.filter({ owner_native_user_id: user.id });
          profile.photo_count = myPhotos.filter(p => p.status === 'active').length;
        } catch (e) { /* non-fatal */ }
      }
      setUserProfile(profile);
      setMatchingAnswers(answers[0] || null);
    }
    setLoading(false);
  };

  const handleLogout = () => base44.auth.logout('/');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke('deleteAccount', { feedback: deleteReason });
      base44.auth.logout('/');
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  // ── Not logged in ──
  if (!isAuthenticated) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto flex flex-col items-center gap-6 text-center">
        <NinaAvatar size="lg" glow />
        <div>
          <h2 className="font-serif text-2xl text-[#F0E6FF] mb-2">
            {lang === 'fr' ? 'Bon retour' : 'Welcome back'}
          </h2>
          <p className="text-[#F0E6FF]/50 text-sm">
            {lang === 'fr' ? 'Connectez-vous pour accéder à votre profil' : 'Sign in to access your profile'}
          </p>
        </div>
        <button
          onClick={() => base44.auth.redirectToLogin('/profile')}
          className="flex items-center gap-2 px-8 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.3)]">
          <LogIn className="w-5 h-5" />
          {lang === 'fr' ? 'Se connecter' : 'Sign In'}
        </button>
        <a href="/onboarding" className="text-[#F0E6FF]/30 text-sm hover:text-[#F5A800] transition-colors">
          {lang === 'fr' ? 'Pas encore membre ? Commencer' : "Not a member yet? Get started"}
        </a>
      </div>
    );
  }

  const fullName = userProfile?.full_name || '';
  const displayAlias = userProfile?.display_name || '';
  const displayName = fullName || displayAlias || authUser?.full_name || '—';
  const city        = userProfile?.city || '';
  const tier        = userProfile?.subscription_tier || 'solar';
  const credits     = userProfile?.credit_balance ?? 0;
  const rewards     = userProfile?.bbp_rewards ?? 0;
  const completeness= userProfile?.profile_completeness ?? 0;

  const calcMissingItems = () => {
    const items = [];
    if (!userProfile?.full_name) items.push(lang === 'fr' ? 'Ajouter votre nom' : 'Add your name');
    if (!userProfile?.display_name) items.push(lang === 'fr' ? 'Ajouter un nom d\'affichage' : 'Add a display name');
    if (!userProfile?.city) items.push(lang === 'fr' ? 'Ajouter votre ville' : 'Add your city');
    if (!userProfile?.birthdate) items.push(lang === 'fr' ? 'Ajouter votre date de naissance' : 'Add your birthdate');
    if (!userProfile?.sexual_orientation) items.push(lang === 'fr' ? 'Ajouter votre orientation' : 'Add your orientation');
    if (!userProfile?.gender_pronoun) items.push(lang === 'fr' ? 'Ajouter votre pronom' : 'Add your pronoun');
    if (!userProfile?.relationship_status) items.push(lang === 'fr' ? 'Ajouter votre statut' : 'Add your status');
    if (!userProfile?.dating_archetype) items.push(lang === 'fr' ? 'Choisir un archétype' : 'Choose an archetype');
    const photoCount = userProfile?.photo_count ?? (userProfile?.photos || []).length;
    if (photoCount < 3) items.push(lang === 'fr' ? `Ajouter ${3 - photoCount} photo(s) (minimum 3)` : `Add ${3 - photoCount} more photo(s) (minimum 3)`);
    const answered = Object.keys(matchingAnswers || {}).filter(k => matchingAnswers[k] && k.startsWith('q')).length;
    if (answered < 21) items.push(lang === 'fr' ? `Répondre aux 21 questions (${answered}/21)` : `Answer all 21 questions (${answered}/21)`);
    return items.length > 0 ? items : [lang === 'fr' ? 'Profil complet !' : 'Profile complete!'];
  };
  const tierMeta    = TIER_META[tier] || TIER_META.solar;
  const firstPhoto  = primaryPhotoUrl(myPhotoData, ownerId) || null;
  const photoCount  = userProfile?.photo_count ?? (userProfile?.photos || []).length;
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* ═══ 1. PROFILE IDENTITY HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
        <div className="glass-card rounded-3xl p-5 space-y-4">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center overflow-hidden"
                style={{ boxShadow: '0 0 30px rgba(123,47,190,0.3)' }}>
                {firstPhoto
                  ? <img src={firstPhoto} alt="" className="w-full h-full object-cover" />
                  : <span className="text-white font-serif text-2xl">{initials}</span>
                }
              </div>
              <button onClick={() => setPhotosOpen(true)}
                className="absolute bottom-0 right-0 w-6 h-6 bg-[#F5A800] rounded-full flex items-center justify-center hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-[#F5A800]/40"
                aria-label={lang === 'fr' ? 'Gérer les photos' : 'Manage photos'}>
                <Edit3 className="w-3 h-3 text-[#0B0510]" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl text-[#F0E6FF] truncate">{displayName}</h2>
              {displayAlias && displayAlias !== displayName && (
                <p className="text-[#F0E6FF]/40 text-sm italic">@{displayAlias}</p>
              )}
              {city && <p className="text-[#F0E6FF]/40 text-sm">{city}</p>}
              {/* Approved tags */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {userProfile?.is_founding_member && <FoundingMemberBadge variant="icon" />}
                {userProfile?.is_ambassador && (
                  <span className="text-[#F5A800] text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,168,0,0.1)', border: '1px solid rgba(245,168,0,0.2)' }}>★ Ambassador</span>
                )}
              </div>
            </div>
          </div>

          {/* Profile completion indicator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Complétion du profil' : 'Profile completion'}</span>
              <span className="text-[#F5A800] font-bold text-sm">{completeness}%</span>
            </div>
            <div className="w-full bg-[rgba(240,230,255,0.05)] rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-[#7B2FBE] to-[#F5A800]" style={{ width: `${completeness}%` }} />
            </div>
          </div>

          {/* Primary + secondary actions */}
          <div className="flex gap-2">
            <button onClick={() => setEditProfileOpen(true)}
              className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(245,168,0,0.15)] focus:outline-none focus:ring-2 focus:ring-[#F5A800]/40">
              <Edit3 className="w-4 h-4" />
              {lang === 'fr' ? 'Modifier le profil' : 'Edit profile'}
            </button>
            <Link to="/profile/preview"
              className="flex-1 py-3 glass-card rounded-xl text-[#F0E6FF]/70 text-sm font-medium flex items-center justify-center gap-2 hover:border-[rgba(245,168,0,0.3)] hover:text-[#F5A800] transition-all focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30">
              <Eye className="w-4 h-4" />
              {lang === 'fr' ? 'Aperçu du profil' : 'Preview my profile'}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. ABOUT YOUR PROFILE ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm text-[#F0E6FF]">{lang === 'fr' ? 'À propos de votre profil' : 'About your profile'}</h3>
            <button onClick={() => setEditProfileOpen(true)}
              className="text-[#F5A800] text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30 rounded px-1">
              <Edit3 className="w-3 h-3" />
              {lang === 'fr' ? 'Modifier' : 'Edit'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <InfoChip label={lang === 'fr' ? 'Nom' : 'Name'} value={fullName || '—'} />
            <InfoChip label={lang === 'fr' ? 'Ville' : 'City'} value={city || '—'} />
            <InfoChip label={lang === 'fr' ? 'Archétype' : 'Archetype'} value={userProfile?.dating_archetype ? getArchetypeLabel(userProfile.dating_archetype, lang) : '—'} />
            <InfoChip label={lang === 'fr' ? 'Questions' : 'Questions'} value={`${Object.keys(matchingAnswers || {}).filter(k => matchingAnswers[k] && k.startsWith('q')).length}/21`} />
          </div>
          {completeness < 100 && (
            <div className="space-y-1 pt-1 border-t border-[rgba(240,230,255,0.06)]">
              {calcMissingItems().slice(0, 3).map((item, i) => (
                <p key={i} className="text-[#F0E6FF]/40 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#F5A800]" />
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ 3. COMPATIBILITY PROFILE ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Link to="/compatibility-profile"
          className="block glass-card-orchid rounded-2xl p-4 hover:border-[rgba(123,47,190,0.4)] transition-all group focus:outline-none focus:ring-2 focus:ring-[#7B2FBE]/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#7B2FBE]" />
            </div>
            <div className="flex-1">
              <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? 'Profil de compatibilité' : 'Compatibility profile'}</p>
              <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Revoir ou mettre à jour vos réponses' : 'Review or update the answers that shape your compatibility experience'}</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#7B2FBE] transition-colors" />
          </div>
          <div className="flex items-center gap-3 pl-12">
            <span className="text-[#F0E6FF]/40 text-xs">
              {userProfile?.compatibility_updated_at
                ? (lang === 'fr' ? `Mis à jour le ${new Date(userProfile.compatibility_updated_at).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US')}` : `Updated ${new Date(userProfile.compatibility_updated_at).toLocaleDateString('en-US')}`)
                : (lang === 'fr' ? 'Non encore complété' : 'Not yet completed')}
            </span>
          </div>
        </Link>
      </motion.div>

      {/* ═══ 4. MY PHOTOS ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-[#7B2FBE]" />
            </div>
            <div className="flex-1">
              <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? 'Mes photos' : 'My photos'}</p>
              <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Vos photos sont privées par défaut. Vous contrôlez vos photos.' : 'Your photos are private by default. You control your profile photos.'}</p>
            </div>
            <span className="text-[#F0E6FF]/40 text-xs shrink-0">{photoCount} {lang === 'fr' ? 'photo(s)' : 'photo(s)'}</span>
          </div>
          <button onClick={() => setPhotosOpen(true)}
            className="w-full py-2.5 glass-card rounded-xl text-[#F5A800] text-sm font-medium hover:border-[rgba(245,168,0,0.3)] transition-all focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30">
            {lang === 'fr' ? 'Gérer les photos' : 'Manage photos'}
          </button>
        </div>
      </motion.div>

      {/* ═══ 5. WALLET & CREDITS ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <WalletSummaryCard onRecharge={() => setCreditsOpen(true)} />
      </motion.div>

      {/* ═══ 6. MEMBERSHIP & ACCESS ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <Link to="/membership"
          className="block glass-card rounded-2xl p-4 hover:border-[rgba(245,168,0,0.2)] transition-all group focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,168,0,0.1)] flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-[#F5A800]" />
            </div>
            <div className="flex-1">
              <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? 'Adhésion et accès' : 'Membership & access'}</p>
              <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Voir ce que votre adhésion inclut et votre accès actuel' : 'See what your membership includes and your current access'}</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
          </div>
        </Link>
      </motion.div>

      {/* ═══ 7. PRIVACY SETTINGS ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <button onClick={() => setPrivacyOpen(true)}
          className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-[rgba(245,168,0,0.15)] transition-all group text-left focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30">
          <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[#7B2FBE]" />
          </div>
          <div className="flex-1">
            <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? 'Paramètres de confidentialité' : 'Privacy settings'}</p>
            <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Gérer l\'affichage de votre profil et vos préférences' : 'Manage how your profile is shown and your communication preferences'}</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
        </button>
      </motion.div>

      {/* ═══ 8. REFER A FRIEND ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <button onClick={() => setReferralOpen(true)}
          className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:border-[rgba(245,168,0,0.15)] transition-all group text-left focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30">
          <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#7B2FBE]" />
          </div>
          <div className="flex-1">
            <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? 'Parrainer un ami' : 'Refer a friend'}</p>
            <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Invitez un ami. Les récompenses s\'appliquent lorsque les conditions d\'éligibilité sont remplies.' : 'Invite a friend. Rewards apply when eligibility requirements are met.'}</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
        </button>
      </motion.div>

      {/* ═══ 9. ACCOUNT / SUPPORT / LEGAL ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-3 pt-2">
        {/* Experience mode switch — Single / Couple */}
        {userProfile && (
          <ExperienceModeSwitch userProfile={userProfile} onUpdate={loadProfile} />
        )}

        {/* Usage indicator */}
        <UsageIndicator lang={lang} />

        {/* Nina quote */}
        <div className="glass-card-gold rounded-2xl p-4 flex items-start gap-3">
          <NinaAvatar size="sm" glow />
          <p className="text-[#F0E6FF]/70 text-sm leading-relaxed italic">
            {lang === 'fr'
              ? '"Chaque question à laquelle vous répondez est un investissement dans une connexion plus profonde."'
              : '"Every question you answer is an investment in a deeper connection."'}
          </p>
        </div>

        {/* Pricing + Sign out */}
        <div className="flex flex-col items-center gap-3 pb-4 pt-2">
          <button onClick={() => setPricingOpen(true)}
            className="text-[#F5A800] text-sm underline underline-offset-4 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30 rounded">
            {lang === 'fr' ? 'Voir la tarification des interactions' : 'View interaction pricing'}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-[#F0E6FF]/30 text-sm hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/30 rounded">
            <LogOut className="w-4 h-4" />
            {lang === 'fr' ? 'Se déconnecter' : 'Sign out'}
          </button>

          {/* Delete Account */}
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-400/70 text-xs hover:text-red-500 transition-colors mt-2 focus:outline-none focus:ring-2 focus:ring-red-400/30 rounded">
              <Trash2 className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
            </button>
          ) : (
            <div className="mt-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3 w-full">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs leading-relaxed">
                  {lang === 'fr'
                    ? 'Cette action est irréversible. Toutes vos données, messages, connexions et réponses seront définitivement supprimés.'
                    : 'This action is irreversible. All your data, messages, connections, and answers will be permanently deleted.'}
                </p>
              </div>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder={lang === 'fr' ? 'Dites-nous pourquoi vous partez (optionnel)…' : "Tell us why you're leaving (optional)…"}
                rows={2}
                className="w-full glass-card rounded-xl px-4 py-2.5 text-[#F0E6FF] text-xs outline-none bg-transparent resize-none placeholder-[rgba(240,230,255,0.2)]"
              />
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {lang === 'fr' ? 'Supprimer définitivement' : 'Delete permanently'}
                </button>
                <button onClick={() => setDeleteConfirm(false)} disabled={deleting}
                  className="flex-1 py-2.5 glass-card rounded-full text-sm font-medium text-[#F0E6FF]/60 hover:text-[#F0E6FF] transition-colors">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
      <CreditsModal isOpen={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} lang={lang} currentTier={tier} />
      {userProfile && (
        <>
          <ManagePhotosModal
            isOpen={photosOpen} onClose={() => setPhotosOpen(false)}
            userProfile={userProfile} lang={lang}
            onUpdate={p => setUserProfile(p)} />
          <PrivacySettingsModal
            isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)}
            userProfile={userProfile} lang={lang}
            onUpdate={p => setUserProfile(p)} />
          <ReferralModal
            isOpen={referralOpen} onClose={() => setReferralOpen(false)}
            userProfile={userProfile} lang={lang} />
          <EditProfileModal
            isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)}
            userProfile={userProfile} matchingAnswers={matchingAnswers}
            lang={lang} onUpdate={p => setUserProfile(p)}
            onAnswersUpdate={a => setMatchingAnswers(a)} />
        </>
      )}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[#F0E6FF]/30 text-[10px] uppercase tracking-wide">{label}</span>
      <span className="text-[#F0E6FF]/70 text-xs truncate">{value}</span>
    </div>
  );
}