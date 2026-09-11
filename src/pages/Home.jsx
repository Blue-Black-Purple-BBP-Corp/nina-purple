import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle, Star, Coins, Users, Loader2, Heart, User, Sparkles, ChevronRight as ChevronRightIcon, Edit3, Eye } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import PricingModal from '@/components/PricingModal';
import PartnerLinkNotifications from '@/components/PartnerLinkNotifications';
import CoupleComparison from '@/components/CoupleComparison';
import DailyInsightCard from '@/components/DailyInsightCard';
import ProfileProgressPanel from '@/components/dashboard/ProfileProgressPanel';
import EditProfileModal from '@/components/profile/EditProfileModal';
import ManagePhotosModal from '@/components/profile/ManagePhotosModal';
import WalletSummaryCard from '@/components/profile/WalletSummaryCard';
import NextStepCard from '@/components/dashboard/NextStepCard';
import FoundingMemberBadge from '@/components/FoundingMemberBadge';
import { base44 } from '@/api/base44Client';
import { usePhotoAccess, primaryPhotoUrl } from '@/hooks/usePhotoAccess';
import { ARCHETYPE_COLORS } from '@/lib/archetypes';

function CompatibilityOrb({ score }) {
  const color = score >= 90 ? '#F5A800' : score >= 75 ? '#A855F7' : score >= 60 ? '#7B2FBE' : '#6B7280';
  return (
    <div className="relative inline-flex items-center justify-center w-12 h-12">
      <div className="absolute inset-0 rounded-full" style={{ background: `${color}15`, boxShadow: `0 0 12px ${color}30` }} />
      <span className="font-serif font-bold text-sm relative z-10" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [matchProfiles, setMatchProfiles] = useState({});
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [matchingAnswers, setMatchingAnswers] = useState(null);

  // Photos for connections come via authorized delivery (getPhotoAccess).
  const connToIds = connections.map(c => c.to_user_id);
  const { photoData } = usePhotoAccess(connToIds, JSON.stringify(connToIds));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setAuthUser(user);

    const [profiles, conns, chatRooms, answers] = await Promise.all([
      base44.entities.UserProfile.filter({ user_id: user.id }),
      base44.entities.Connection.filter({ from_user_id: user.id }),
      base44.entities.ChatRoom.filter({ is_active: true }, '-posts_count', 3),
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
    setConnections(conns);
    setRooms(chatRooms);
    setMatchingAnswers(answers[0] || null);

    // Compatibility Profile must be completed before matches are shown.
    // Couples are excluded from matching, so this redirect is skipped for
    // couple profiles — they can use the Home dashboard (events, community,
    // couple journey) without completing the ECR-S/Big Five quiz.
    if (profile && !profile.attachment_style && profile.profile_type !== 'couple') {
      navigate('/compatibility-profile');
      return;
    }

    // Load display names for connections via server-mediated projection (never direct UserProfile access)
    if (conns.length > 0) {
      const toIds = [...new Set(conns.map(c => c.to_user_id))];
      try {
        const res = await base44.functions.invoke('getConnectionProfiles', { user_ids: toIds });
        setMatchProfiles(res.data?.profiles || {});
      } catch (e) {
        console.warn('getConnectionProfiles failed:', e.message);
      }
    }

    setLoading(false);
  };

  const isCouple = userProfile?.profile_type === 'couple';
  const isPaired = userProfile?.paired_status === 'paired';

  const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay } });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" />
      </div>
    );
  }

  const displayName = userProfile?.full_name || userProfile?.display_name || authUser?.full_name || (lang === 'fr' ? 'Bienvenue' : 'Welcome');
  const credits = userProfile?.credit_balance ?? 0;
  const completeness = userProfile?.profile_completeness ?? 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Urgent next-step prompt — shows only when an urgent state exists */}
      <NextStepCard userProfile={userProfile} />

      {/* Partner link notifications — shown for all users */}
      <PartnerLinkNotifications onResolved={() => loadData()} />

      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-serif text-2xl text-[#F0E6FF]">
            {lang === 'fr' ? `Bonjour, ${displayName.split(' ')[0]}` : `Hello, ${displayName.split(' ')[0]}`}
          </h1>
          <p className="text-[#F0E6FF]/40 text-xs mt-0.5">{t('home.subtitle')}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Link to="/membership" className="text-xs font-semibold px-2 py-0.5 rounded-full glass-card text-[#F0E6FF]/70 hover:border-[rgba(245,168,0,0.3)] transition-all">
              {lang === 'fr' ? 'Adhésion' : 'Membership'}
            </Link>
            {userProfile?.is_founding_member && <FoundingMemberBadge variant="icon" />}
            {isCouple && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(123,47,190,0.15)', color: '#7B2FBE', border: '1px solid rgba(123,47,190,0.3)' }}>
                <Heart className="w-3 h-3" />
                {isPaired
                  ? (lang === 'fr' ? 'En couple' : 'Coupled')
                  : (lang === 'fr' ? 'En attente' : 'Pending')}
              </span>
            )}
            {userProfile?.city && <span className="text-[#F0E6FF]/30 text-xs">{userProfile.city}</span>}
          </div>
        </div>
        <Link to="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 glass-card-gold rounded-full text-[#F5A800] text-xs font-medium hover:opacity-80 transition-opacity">
          <Coins className="w-3.5 h-3.5" />
          <span>{credits} BBP</span>
        </Link>
      </motion.div>

      {/* Edit profile + Preview — primary member actions */}
      <motion.div {...fadeUp(0.02)}>
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)}
            className="flex-1 py-3 bg-[#F5A800] text-[#0B0510] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(245,168,0,0.15)] focus:outline-none focus:ring-2 focus:ring-[#F5A800]/40">
            <Edit3 className="w-4 h-4" />
            {lang === 'fr' ? 'Modifier le profil' : 'Edit profile'}
          </button>
          <Link to="/profile/preview"
            className="flex-1 py-3 glass-card rounded-xl text-[#F0E6FF]/70 text-sm font-medium flex items-center justify-center gap-2 hover:border-[rgba(245,168,0,0.3)] hover:text-[#F5A800] transition-all focus:outline-none focus:ring-2 focus:ring-[#F5A800]/30">
            <Eye className="w-4 h-4" />
            {lang === 'fr' ? 'Aperçu' : 'Preview'}
          </Link>
        </div>
      </motion.div>

      {/* Daily Insight — personalized to the Compatibility Profile */}
      <DailyInsightCard profile={userProfile} lang={lang} />

      {/* Compatibility profile quick access */}
      <motion.div {...fadeUp(0.05)}>
        <Link to="/compatibility-profile" className="block glass-card-orchid rounded-2xl p-4 flex items-center gap-3 hover:border-[rgba(123,47,190,0.4)] transition-all group">
          <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#7B2FBE]" />
          </div>
          <div className="flex-1">
            <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? 'Profil de compatibilité' : 'Compatibility profile'}</p>
            <p className="text-[#F0E6FF]/50 text-xs">{lang === 'fr' ? 'Revisitez les réponses qui façonnent vos correspondances' : 'Revisit the answers that shape your matches'}</p>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-[#F0E6FF]/30 group-hover:text-[#7B2FBE] transition-colors" />
        </Link>
      </motion.div>

      {/* Wallet & Credits summary — membership status + BBP Credits */}
      <motion.div {...fadeUp(0.08)}>
        <WalletSummaryCard onRecharge={() => navigate('/wallet')} />
      </motion.div>

      {/* Couple journey banner */}
      {isCouple && (
        <motion.div {...fadeUp(0.05)} className="glass-card-orchid rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-[#7B2FBE]" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-sm text-[#F0E6FF] mb-1">
                {isPaired
                  ? (lang === 'fr' ? 'Parcours de couple' : 'Couple Journey')
                  : (lang === 'fr' ? 'En attente de votre partenaire' : 'Waiting for your partner')}
              </h3>
              <p className="text-[#F0E6FF]/50 text-xs leading-relaxed mb-2">
                {isPaired
                  ? (lang === 'fr'
                    ? "Votre profil de couple est actif. Comparez vos réponses et explorez l'expérience Nina Purple ensemble."
                    : "Your couple profile is active. Compare your answers and explore the Nina Purple Experience together.")
                  : (lang === 'fr'
                    ? "Une fois que votre partenaire aura accepté la liaison, vous pourrez comparer vos réponses côte à côte."
                    : "Once your partner accepts the link, you can compare your answers side-by-side.")}
              </p>
              {isPaired && userProfile?.partner_user_id && (
                <button onClick={() => setShowComparison(true)}
                  className="text-[#7B2FBE] text-xs font-medium hover:underline flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {lang === 'fr' ? 'Voir notre comparaison →' : 'View our comparison →'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats row — different for couples vs individuals */}
      {!isCouple && (
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: t('home.my_connections'), count: connections.length, color: '#F5A800', to: '/connections' },
            { icon: Calendar, label: t('home.upcoming_events'), count: 0, color: '#7B2FBE', to: '/events' },
            { icon: MessageCircle, label: t('home.new_messages'), count: 0, color: '#A855F7', to: '/messages' },
          ].map((stat, i) => (
            <Link key={i} to={stat.to}>
              <div className="glass-card rounded-2xl p-3 text-center hover:border-[rgba(245,168,0,0.15)] transition-all" style={{ borderColor: `${stat.color}20` }}>
                <div className="relative inline-block">
                  <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
                  {stat.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5A800] text-[#0B0510] text-[9px] font-bold flex items-center justify-center">
                      {stat.count}
                    </span>
                  )}
                </div>
                <p className="text-[#F0E6FF]/50 text-[9px] leading-tight">{stat.label}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* Couple stats — events + community only */}
      {isCouple && (
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-3">
          <Link to="/events">
            <div className="glass-card rounded-2xl p-3 text-center hover:border-[rgba(123,47,190,0.3)] transition-all" style={{ borderColor: 'rgba(123,47,190,0.2)' }}>
              <Calendar className="w-5 h-5 mx-auto mb-1 text-[#7B2FBE]" />
              <p className="text-[#F0E6FF]/50 text-[9px] leading-tight">{t('home.upcoming_events')}</p>
            </div>
          </Link>
          <Link to="/community">
            <div className="glass-card rounded-2xl p-3 text-center hover:border-[rgba(168,85,247,0.3)] transition-all" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
              <MessageCircle className="w-5 h-5 mx-auto mb-1 text-[#A855F7]" />
              <p className="text-[#F0E6FF]/50 text-[9px] leading-tight">{t('home.chat_rooms')}</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Profile progress panel — completeness, changes since last review,
          key fields to complete, and optional activities (community + ambassador) */}
      <ProfileProgressPanel
        profile={userProfile}
        lang={lang}
        onRefresh={loadData}
        onOpenEdit={() => setEditOpen(true)}
        onOpenPhotos={() => setPhotosOpen(true)}
      />

      {/* My Connections — only for individuals */}
      {!isCouple && (
        <motion.div {...fadeUp(0.2)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-[#F0E6FF]">{t('home.my_connections')}</h2>
            <Link to="/connections" className="text-[#F5A800] text-xs hover:opacity-80 transition-opacity">
              {lang === 'fr' ? 'Voir tout →' : 'View all →'}
            </Link>
          </div>
          {connections.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-[#F0E6FF]/40 text-sm mb-3">
                {lang === 'fr' ? 'Vos connexions apparaîtront ici.' : 'Your connections will appear here.'}
              </p>
              <Link to="/connections"
                className="inline-block px-6 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold hover:bg-yellow-400 transition-all">
                {lang === 'fr' ? 'Découvrir des profils' : 'Discover profiles'}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.slice(0, 3).map((conn, i) => {
                const mp = matchProfiles[conn.to_user_id];
                return (
                  <motion.div key={conn.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.08 }}
                    className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0 overflow-hidden">
                      {primaryPhotoUrl(photoData, conn.to_user_id)
                        ? <img src={primaryPhotoUrl(photoData, conn.to_user_id)} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-sm font-serif">{(mp?.display_name || '?')[0]}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-[#F0E6FF] font-medium text-sm">{mp?.display_name || '—'}</p>
                      <p className="text-[#F0E6FF]/40 text-xs">{mp?.city || ''}</p>
                    </div>
                    {conn.compatibility_score && <CompatibilityOrb score={conn.compatibility_score} />}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Community Rooms */}
      <motion.div {...fadeUp(0.35)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-[#F0E6FF]">{t('home.chat_rooms')}</h2>
          <Link to="/community" className="text-[#F5A800] text-xs hover:opacity-80 transition-opacity">
            {lang === 'fr' ? 'Voir tout →' : 'View all →'}
          </Link>
        </div>
        {rooms.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-[#F0E6FF]/40 text-sm">
              {lang === 'fr' ? 'Aucune salle pour l\'instant.' : 'No rooms yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room, i) => (
              <Link key={room.id} to="/community">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-[rgba(123,47,190,0.3)] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center">
                      <Star className="w-4 h-4 text-[#7B2FBE]" />
                    </div>
                    <div>
                      <p className="text-[#F0E6FF] text-sm font-medium">{lang === 'fr' ? (room.name_fr || room.name_en) : room.name_en}</p>
                      <p className="text-[#F0E6FF]/40 text-xs">{room.posts_count || 0} {t('community.posts')}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />

      {/* Inline edit modals — opened from the profile progress panel so field
          completion happens without leaving the dashboard (tight feedback loop) */}
      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userProfile={userProfile}
        matchingAnswers={matchingAnswers}
        onUpdate={(updated) => { setUserProfile(updated); loadData(); }}
        onAnswersUpdate={setMatchingAnswers}
        lang={lang}
      />
      <ManagePhotosModal
        isOpen={photosOpen}
        onClose={() => setPhotosOpen(false)}
        userProfile={userProfile}
        onUpdate={(updated) => { setUserProfile(updated); loadData(); }}
        lang={lang}
      />

      {/* Couple Comparison Modal */}
      {showComparison && userProfile?.partner_user_id && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center px-0 md:px-6"
          style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowComparison(false); }}>
          <div className="w-full max-w-lg bg-[#1F1026] rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#F0E6FF]">{lang === 'fr' ? 'Notre comparaison' : 'Our Comparison'}</h2>
              <button onClick={() => setShowComparison(false)} className="text-[#F0E6FF]/40 hover:text-[#F0E6FF] text-xl">✕</button>
            </div>
            <CoupleComparison myProfile={userProfile} partnerUserId={userProfile.partner_user_id} isFr={lang === 'fr'} />
          </div>
        </div>
      )}
    </div>
  );
}