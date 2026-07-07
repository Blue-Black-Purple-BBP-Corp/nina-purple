import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, Heart, ChevronLeft, Send, Loader2, Users } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { usePlanLimits } from '@/hooks/usePlanLimits';

export default function Community() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [limitError, setLimitError] = useState('');
  const [isOwnRoom, setIsOwnRoom] = useState(false);
  const { data: limitsData, refresh: refreshLimits } = usePlanLimits();
  const bottomRef = useRef(null);

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => {
    if (activeRoom) {
      loadPosts(activeRoom.id);
      // Check if this room is owned by the current user (posts there don't count toward limits)
      if (currentUser && activeRoom.created_by_id === currentUser.id) {
        setIsOwnRoom(true);
      } else {
        setIsOwnRoom(false);
      }
    }
  }, [activeRoom, currentUser]);

  const loadRooms = async () => {
    setRoomsLoading(true);
    const user = await base44.auth.me();
    setCurrentUser(user);
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    setUserProfile(profiles[0] || null);
    const data = await base44.entities.ChatRoom.filter({ is_active: true }, '-pinned', 50);
    setRooms(data);
    setRoomsLoading(false);
  };

  const loadPosts = async (roomId) => {
    setPostsLoading(true);
    const data = await base44.entities.ChatPost.filter({ room_id: roomId }, '-created_date', 30);
    setPosts(data.reverse());
    setPostsLoading(false);
  };

  const handlePost = async () => {
    if (!newPost.trim() || !activeRoom || !currentUser || posting) return;
    setLimitError('');
    // Check plan limits before posting (skip if user owns this room)
    if (!isOwnRoom) {
      try {
        const check = await base44.functions.invoke('checkPlanLimits', { action: 'community_post' });
        if (!check.data?.allowed) {
          setLimitError(check.data?.reason || (lang === 'fr' ? 'Limite de messages atteinte.' : 'Message limit reached.'));
          return;
        }
      } catch (e) {
        setLimitError(lang === 'fr' ? 'Impossible de vérifier les limites.' : 'Unable to verify limits.');
        return;
      }
    }
    setPosting(true);
    const post = await base44.entities.ChatPost.create({
      room_id: activeRoom.id,
      author_id: currentUser.id,
      author_name: userProfile?.display_name || currentUser.full_name || 'Member',
      content: newPost.trim(),
      likes_count: 0,
      comments_count: 0,
    });
    // Update room post count
    await base44.entities.ChatRoom.update(activeRoom.id, {
      posts_count: (activeRoom.posts_count || 0) + 1,
    });
    setPosts(prev => [...prev, post]);
    setNewPost('');
    setPosting(false);
    if (!isOwnRoom) refreshLimits();
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const toggleLike = async (post) => {
    const isLiked = likedPosts.has(post.id);
    const newCount = isLiked ? Math.max(0, (post.likes_count || 0) - 1) : (post.likes_count || 0) + 1;
    await base44.entities.ChatPost.update(post.id, { likes_count: newCount });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: newCount } : p));
    setLikedPosts(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(post.id) : next.add(post.id);
      return next;
    });
  };

  if (activeRoom) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0B0510] pt-16">
        {/* Room header */}
        <div className="px-4 py-4 border-b border-[rgba(240,230,255,0.06)] sticky top-16 z-40"
          style={{ background: 'rgba(11,5,16,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button onClick={() => setActiveRoom(null)} className="text-[#F0E6FF]/50 hover:text-[#F0E6FF] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="font-serif text-xl text-[#F0E6FF]">
                {lang === 'fr' ? (activeRoom.name_fr || activeRoom.name_en) : activeRoom.name_en}
              </h2>
              <p className="text-[#F0E6FF]/40 text-xs">{activeRoom.members_count || 0} {t('community.members')}</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-32">
          {/* New post */}
          <div className="glass-card-gold rounded-2xl p-4">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder={lang === 'fr' ? 'Partagez vos pensées...' : 'Share your thoughts...'}
              className="w-full bg-transparent text-[#F0E6FF] text-sm leading-relaxed outline-none resize-none placeholder-[rgba(240,230,255,0.2)] min-h-[60px]"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button onClick={handlePost} disabled={!newPost.trim() || posting}
                className="px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {t('community.new_post')}
              </button>
            </div>
            {limitError && (
              <p className="text-red-400 text-xs mt-2">{limitError}</p>
            )}
            {isOwnRoom && (
              <p className="text-[#F5A800]/60 text-[10px] mt-2">
                {lang === 'fr' ? 'Vous animez ce salon — vos publications sont illimitées.' : 'You animate this room — your posts are unlimited.'}
              </p>
            )}
            {limitsData && !isOwnRoom && (
              <p className="text-[#F0E6FF]/30 text-[10px] mt-2">
                {lang === 'fr'
                  ? `Messages ce mois : ${limitsData.usage.messages_used} / ${limitsData.limits.messages_per_month === 'unlimited' ? '∞' : limitsData.limits.messages_per_month}`
                  : `Messages this month: ${limitsData.usage.messages_used} / ${limitsData.limits.messages_per_month === 'unlimited' ? '∞' : limitsData.limits.messages_per_month}`}
              </p>
            )}
          </div>

          {postsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#F5A800] animate-spin" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#F0E6FF]/30 text-sm">{lang === 'fr' ? 'Soyez le premier à publier !' : 'Be the first to post!'}</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <motion.div key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-serif">{(post.author_name || 'M')[0]}</span>
                  </div>
                  <div>
                    <p className="text-[#F0E6FF] text-sm font-medium">{post.author_name || lang === 'fr' ? 'Membre' : 'Member'}</p>
                    <p className="text-[#F0E6FF]/30 text-xs">
                      {new Date(post.created_date).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-[#F0E6FF]/80 text-sm leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 pt-1">
                  <button onClick={() => toggleLike(post)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${likedPosts.has(post.id) ? 'text-[#F5A800]' : 'text-[#F0E6FF]/40 hover:text-[#F5A800]'}`}>
                    <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-[#F5A800]' : ''}`} />
                    {post.likes_count || 0}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-[#F0E6FF]/40 hover:text-[#7B2FBE] transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments_count || 0}
                  </button>
                </div>
              </motion.div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('community.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">
          {lang === 'fr' ? 'Rejoignez une conversation' : 'Join a conversation'}
        </p>
      </motion.div>

      {roomsLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#F5A800] animate-spin" /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[rgba(123,47,190,0.1)] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-[#7B2FBE]" />
          </div>
          <p className="text-[#F0E6FF]/40">
            {lang === 'fr' ? 'Aucun salon disponible pour le moment' : 'No rooms available yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room, i) => (
            <motion.button key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setActiveRoom(room)}
              className={`w-full glass-card rounded-2xl p-4 text-left flex items-start gap-3 hover:border-[rgba(123,47,190,0.3)] transition-all duration-300 group ${room.pinned ? 'border-[rgba(245,168,0,0.15)]' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(123,47,190,0.2)] transition-all">
                <Star className="w-5 h-5 text-[#7B2FBE]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[#F0E6FF] font-medium text-sm">
                    {lang === 'fr' ? (room.name_fr || room.name_en) : room.name_en}
                  </h3>
                  {room.pinned && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)]">
                      {lang === 'fr' ? 'Épinglé' : 'Pinned'}
                    </span>
                  )}
                </div>
                <p className="text-[#F0E6FF]/40 text-xs leading-relaxed line-clamp-2">
                  {lang === 'fr' ? (room.description_fr || room.description_en || room.description) : (room.description_en || room.description)}
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-[#F0E6FF]/25 text-[10px]">{room.members_count || 0} {t('community.members')}</span>
                  <span className="text-[#F0E6FF]/25 text-[10px]">{room.posts_count || 0} {t('community.posts')}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}