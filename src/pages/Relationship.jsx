import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import CardStack from '@/components/cards/CardStack';
import { COUPLES_CAPITALIZATION, COUPLES_GRATITUDE, COUPLES_SHARED_FUTURE } from '@/lib/connectionCardContent';
import { useLang } from '@/lib/LanguageContext';

export default function Relationship() {
  const { lang } = useLang();
  const isFr = lang === 'fr';

  const decks = [
    { id: 'capitalization', label_en: 'Share Joy', label_fr: 'Partager la joie', color: '#A855F7', cards: COUPLES_CAPITALIZATION },
    { id: 'gratitude', label_en: 'Gratitude', label_fr: 'Gratitude', color: '#F5A800', cards: COUPLES_GRATITUDE },
    { id: 'shared_future', label_en: 'Our Future', label_fr: 'Notre avenir', color: '#7B2FBE', cards: COUPLES_SHARED_FUTURE },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(123,47,190,0.15)] flex items-center justify-center mx-auto mb-3">
          <Heart className="w-6 h-6 text-[#7B2FBE]" />
        </div>
        <h1 className="font-serif text-3xl text-[#F0E6FF] mb-1">Conversations</h1>
        <p className="text-[#F0E6FF]/40 text-sm">{isFr ? 'Des prompts à explorer à deux, sans pression.' : 'Prompts to explore together, no pressure.'}</p>
      </motion.div>
      <div className="h-[70vh]">
        <CardStack decks={decks} lang={lang} />
      </div>
    </div>
  );
}