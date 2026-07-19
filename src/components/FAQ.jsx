import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const FAQS_EN = [
  { q: 'Is Nina Purple a dating app?', a: 'Yes — Nina Purple is a conscious dating app built for intentional adults seeking serious, values-based relationships. Unlike swipe-based apps, matching is powered by 21 deep questions about how you like to be loved.' },
  { q: 'How is Nina Purple different from other dating apps?', a: 'There is no swiping and no filtered photos. You are matched on compatibility — your core values, relationship goals, and emotional patterns — not on appearance. The higher your compatibility with someone, the less it costs to connect.' },
  { q: 'Is Nina Purple for serious relationships?', a: 'Yes. Nina Purple is designed for people who take love seriously — whether you are single and seeking a lasting partnership, navigating a life transition, or rebuilding after loss.' },
  { q: 'How does matching work?', a: 'You answer 21 introspective questions about values, conflict, spirituality, family, communication, and emotional intimacy. Your answers are compared with other members to produce a compatibility score. Higher compatibility means a lower cost to unlock and message.' },
  { q: 'Is there a free plan?', a: 'Yes. The Solar plan is free and includes a limited number of profile unlocks and messages per month. Paid plans (Lunar, Stellar, Galactic) unlock more monthly capacity and additional features.' },
  { q: 'What are micro-transactions?', a: 'Instead of a single subscription covering everything, you invest in each connection. Unlocking a profile and sending messages costs a small amount that scales inversely with compatibility — the better the match, the lower the cost.' },
  { q: 'Is Nina Purple bilingual?', a: 'Yes. The platform is fully available in English and French, built for an international community.' },
  { q: 'Can couples use Nina Purple?', a: 'Yes. Couples can create a shared profile for the Nina Purple Experience — curated retreats designed for relationship growth. Couple profiles are separate from the individual dating pool.' },
];

const FAQS_FR = [
  { q: 'Nina Purple est-il une application de rencontres ?', a: 'Oui — Nina Purple est une application de rencontres conscientes conçue pour les adultes intentionnels qui cherchent des relations sérieuses fondées sur les valeurs. Contrairement aux applications par glissement, le matching repose sur 21 questions profondes sur la façon dont vous aimez être aimé(e).' },
  { q: 'En quoi Nina Purple est-il différent des autres applications de rencontres ?', a: "Il n'y a pas de glissement d'écran ni de photos filtrées. Vous êtes apparié(e) selon la compatibilité — vos valeurs fondamentales, vos objectifs relationnels et vos schémas émotionnels — et non selon l'apparence. Plus votre compatibilité est élevée, moins la connexion coûte." },
  { q: 'Nina Purple est-il fait pour les relations sérieuses ?', a: "Oui. Nina Purple est conçu pour les personnes qui prennent l'amour au sérieux — que vous soyez célibataire à la recherche d'un partenariat durable, en transition de vie, ou en train de vous reconstruire après une perte." },
  { q: 'Comment fonctionne le matching ?', a: "Vous répondez à 21 questions introspectives sur les valeurs, les conflits, la spiritualité, la famille, la communication et l'intimité émotionnelle. Vos réponses sont comparées à celles des autres membres pour produire un score de compatibilité. Une compatibilité plus élevée signifie un coût plus bas pour déverrouiller et écrire." },
  { q: 'Y a-t-il un plan gratuit ?', a: "Oui. Le plan Solaire est gratuit et inclut un nombre limité de déverrouillages de profils et de messages par mois. Les plans payants (Lunaire, Stellaire, Galactique) offrent plus de capacité mensuelle et des fonctionnalités supplémentaires." },
  { q: 'Que sont les micro-transactions ?', a: "Au lieu d'un seul abonnement couvrant tout, vous investissez dans chaque connexion. Déverrouiller un profil et envoyer des messages coûte un petit montant qui varie inversement à la compatibilité — plus la correspondance est bonne, plus le coût est bas." },
  { q: 'Nina Purple est-il bilingue ?', a: 'Oui. La plateforme est entièrement disponible en anglais et en français, conçue pour une communauté internationale.' },
  { q: 'Les couples peuvent-ils utiliser Nina Purple ?', a: "Oui. Les couples peuvent créer un profil partagé pour l'Expérience Nina Purple — des retraites curées conçues pour la croissance relationnelle. Les profils de couple sont séparés du pool de rencontres individuel." },
];

export default function FAQ() {
  const { lang } = useLang();
  const faqs = lang === 'fr' ? FAQS_FR : FAQS_EN;
  const [open, setOpen] = useState(null);

  return (
    <section className="px-6 py-20 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <h2 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-4">
          {lang === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
        </h2>
        <p className="text-[#F0E6FF]/50 text-sm">
          {lang === 'fr' ? 'Tout ce que vous devez savoir sur Nina Purple' : 'Everything you need to know about Nina Purple'}
        </p>
      </motion.div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="font-serif text-base text-[#F0E6FF] pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-[#F5A800] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-[#F0E6FF]/60 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}