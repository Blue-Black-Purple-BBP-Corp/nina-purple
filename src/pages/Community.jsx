import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, Heart, Share2, ChevronLeft, Send, Plus } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/i18n';

const MOCK_ROOMS = [
  { id: '1', name_en: 'Community Welcome', name_fr: 'Bienvenue dans la Communauté', desc_en: 'Jump in and say hi! A welcome space for new members.', desc_fr: 'Rejoignez-nous et dites bonjour ! Un espace pour les nouveaux membres.', posts: 47, members: 312, pinned: true },
  { id: '2', name_en: 'Conscious Movies', name_fr: 'Films Conscients', desc_en: 'An open discussion about the most conscious, mind-altering movies.', desc_fr: 'Discussion sur les films les plus conscients et transformateurs.', posts: 28, members: 184, pinned: false },
  { id: '3', name_en: 'Music That Elevates', name_fr: 'Musique Élévatrice', desc_en: 'Bored with your playlists? Diverse discussions about frequency and music.', desc_fr: 'Marre de vos playlists ? Discussions sur la fréquence et la musique.', posts: 65, members: 241, pinned: false },
  { id: '4', name_en: 'LGBTQ+ Paris Nightlife', name_fr: 'Vie Nocturne LGBTQ+ Paris', desc_en: 'The best spots, events, and community in Paris.', desc_fr: 'Les meilleurs endroits, événements et communauté à Paris.', posts: 19, members: 88, pinned: false },
  { id: '5', name_en: 'Conscious Dating 101', name_fr: 'Rencontres Conscientes 101', desc_en: 'Tips, stories and guidance on dating with intention.', desc_fr: 'Conseils, histoires et orientation sur les rencontres intentionnelles.', posts: 93, members: 407, pinned: true },
  { id: '6', name_en: 'Self-Growth & Development', name_fr: 'Croissance Personnelle', desc_en: 'Sharing resources and journeys of personal transformation.', desc_fr: 'Partager des ressources et des parcours de transformation personnelle.', posts: 54, members: 290, pinned: false },
];

const MOCK_POSTS = {
  '1': [
    { id: '1', author: 'Lupita M.', time: '3h ago', content: "I'm looking for a love that looks like this! 💜 But for real, I am looking for a feeling that I've never felt.", likes: 12, comments: 4 },
    { id: '2', author: 'Marcus G.', time: '5h ago', content: "Just joined and wow — this community feels SO different. No pressure, no superficiality. Just genuine people.", likes: 28, comments: 7 },
    { id: '3', author: 'Shandra W.', time: '1d ago', content: "Been on here for 2 weeks. Already had the most meaningful conversations of my dating life. Thank you Nina Purple! ✨", likes: 45, comments: 13 },
  ],
  '3': [
    { id: '1', author: 'Jarvis W.', time: '1h ago', content: "Discovered this artist called Sango — the frequencies in his production literally shift your state. Anyone else feel music as medicine?", likes: 8, comments: 3 },
    { id: '2', author: 'Anai B.', time: '6h ago', content: "432Hz vs 440Hz tuning — anyone here been experimenting? I switched 6 months ago and I swear my sleep quality improved.", likes: 19, comments: 11 },
  ],
  default: [
    { id: '1', author: 'Cameron W.', time: '2h ago', content: "What a beautiful community this is. Grateful to be here with all of you.", likes: 15, comments: 5 },
  ]
};

export default function Community() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [activeRoom, setActiveRoom] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());

  const activeRoomData = MOCK_ROOMS.find(r => r.id === activeRoom);
  const posts = activeRoom ? (MOCK_POSTS[activeRoom] || MOCK_POSTS.default) : [];

  const toggleLike = (postId) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
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
            <div>
              <h2 className="font-serif text-xl text-[#F0E6FF]">
                {lang === 'fr' ? activeRoomData?.name_fr : activeRoomData?.name_en}
              </h2>
              <p className="text-[#F0E6FF]/40 text-xs">{activeRoomData?.members} {t('community.members')}</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-32">
          {/* New post input */}
          <div className="glass-card-gold rounded-2xl p-4">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder={lang === 'fr' ? 'Partagez vos pensées...' : 'Share your thoughts...'}
              className="w-full bg-transparent text-[#F0E6FF] text-sm leading-relaxed outline-none resize-none placeholder-[rgba(240,230,255,0.2)] min-h-[60px]"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button className="px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-yellow-400 transition-all">
                <Send className="w-3 h-3" />
                {t('community.new_post')}
              </button>
            </div>
          </div>

          {posts.map((post, i) => (
            <motion.div key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FBE] to-[#A855F7] flex items-center justify-center">
                  <span className="text-white text-xs font-serif">{post.author[0]}</span>
                </div>
                <div>
                  <p className="text-[#F0E6FF] text-sm font-medium">{post.author}</p>
                  <p className="text-[#F0E6FF]/30 text-xs">{post.time}</p>
                </div>
              </div>
              <p className="text-[#F0E6FF]/80 text-sm leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-4 pt-1">
                <button onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${likedPosts.has(post.id) ? 'text-[#F5A800]' : 'text-[#F0E6FF]/40 hover:text-[#F5A800]'}`}>
                  <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-[#F5A800]' : ''}`} />
                  {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-[#F0E6FF]/40 hover:text-[#7B2FBE] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-[#F0E6FF]/40 hover:text-[#F0E6FF] transition-colors ml-auto">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">{t('community.title')}</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{t('community.subtitle')}</p>
      </motion.div>

      <div className="space-y-3">
        {MOCK_ROOMS.map((room, i) => (
          <motion.button key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => setActiveRoom(room.id)}
            className={`w-full glass-card rounded-2xl p-4 text-left flex items-start gap-3 hover:border-[rgba(123,47,190,0.3)] transition-all duration-300 group ${room.pinned ? 'border-[rgba(245,168,0,0.15)]' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-[rgba(123,47,190,0.1)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(123,47,190,0.2)] transition-all">
              <Star className="w-5 h-5 text-[#7B2FBE]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[#F0E6FF] font-medium text-sm">{lang === 'fr' ? room.name_fr : room.name_en}</h3>
                {room.pinned && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-[rgba(245,168,0,0.1)] text-[#F5A800] border border-[rgba(245,168,0,0.2)]">
                    {lang === 'fr' ? 'Épinglé' : 'Pinned'}
                  </span>
                )}
              </div>
              <p className="text-[#F0E6FF]/40 text-xs leading-relaxed line-clamp-2">
                {lang === 'fr' ? room.desc_fr : room.desc_en}
              </p>
              <div className="flex gap-3 mt-2">
                <span className="text-[#F0E6FF]/25 text-[10px]">{room.members} {t('community.members')}</span>
                <span className="text-[#F0E6FF]/25 text-[10px]">{room.posts} {t('community.posts')}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}