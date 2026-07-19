import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const FAQS_EN = [
  { q: 'What is Nina Purple?', a: 'Nina Purple is a human connector — a platform designed to facilitate and improve genuine human-to-human connection. It is on a mission to make healthy relationships a lived experience, not just an aspiration. Rather than measuring attraction in seconds, Nina Purple helps you find and build the relationships that actually sustain you — whether romantic, friendship, or community.' },
  { q: 'Is Nina Purple a dating app?', a: 'Not in the traditional sense. Nina Purple is not a swipe-based dating app — there is no swiping and no filtered photos. It is a conscious platform for intentional adults who want deeper, healthier human connections. Matching is one part of it, but the mission is broader: helping people experience real, healthy relationships in their lives.' },
  { q: 'What is conscious dating?', a: 'Conscious dating is an approach to connection rooted in self-awareness, intention, and depth. Instead of judging someone in seconds based on a photo, you explore compatibility through your core values, your vision for the future, and the way you give and receive love. It asks: what actually sustains a relationship? Conscious dating means bringing honesty, presence, and curiosity to every connection — whether it grows into romance, friendship, or simply a meaningful human exchange.' },
  { q: 'How does matching work?', a: 'You answer 21 introspective questions about values, conflict, spirituality, family, communication, and emotional intimacy. Your answers are compared with other members to produce a compatibility score. Higher compatibility means a lower cost to unlock and connect — because real connections deserve to be encouraged, not penalized.' },
  { q: 'Does Nina Purple encourage in-person encounters?', a: 'Yes — strongly. Digital connection is a starting point, not a destination. Nina Purple actively encourages in-person encounters through community events, meet-and-greets, consciousness talks, and the Nina Purple Experience — curated in-person retreats in destinations like Martinique designed to foster self-awareness, emotional growth, and lasting transformation. Real human connection happens face to face.' },
  { q: 'What are the Nina Purple Experiences?', a: 'The Nina Purple Experiences are curated in-person retreats designed for both singles and couples. Each experience combines professional therapeutic guidance, meaningful conversations, nature immersion, and shared community — to help create healthier relationships that extend far beyond your time away. Whether celebrating a new chapter or rebuilding after challenges, the Experiences are where the platform comes to life.' },
  { q: 'What are micro-transactions?', a: 'Instead of a single subscription covering everything, you invest in each connection. Unlocking a profile and sending messages costs a small amount that scales inversely with compatibility — the better the match, the lower the cost. This encourages you to invest in the connections most likely to matter.' },
  { q: 'Is there a free plan?', a: 'Yes. The Solar plan is free and includes a limited number of profile unlocks and messages per month. Paid plans (Lunar, Stellar, Galactic) unlock more monthly capacity and additional features.' },
  { q: 'Is Nina Purple bilingual?', a: 'Yes. The platform is fully available in English and French, built for an international community.' },
  { q: 'Can couples use Nina Purple?', a: 'Yes. Couples can create a shared profile and participate in the Nina Purple Experiences together — curated retreats designed for relationship growth. Couple profiles are separate from the individual matching pool.' },
];

const FAQS_FR = [
  { q: "Qu'est-ce que Nina Purple ?", a: "Nina Purple est un connecteur humain — une plateforme conçue pour faciliter et améliorer les véritables connexions entre humains. Sa mission est de faire des relations saines une expérience vécue, et non un simple idéal. Au lieu de mesurer l'attirance en quelques secondes, Nina Purple vous aide à trouver et à construire les relations qui vous nourrissent vraiment — amoureuses, amicales ou communautaires." },
  { q: 'Nina Purple est-il une application de rencontres ?', a: "Pas au sens traditionnel. Nina Purple n'est pas une application de rencontres par glissement — il n'y a ni swipe ni photos filtrées. C'est une plateforme consciente pour les adultes intentionnels qui souhaitent des connexions humaines plus profondes et plus saines. Le matching en est une partie, mais la mission est plus vaste : aider les gens à vivre de vraies relations saines." },
  { q: 'Qu\'est-ce que les rencontres conscientes ?', a: "Les rencontres conscientes sont une approche de la connexion fondée sur la conscience de soi, l'intention et la profondeur. Au lieu de juger quelqu'un en quelques secondes sur une photo, vous explorez la compatibilité à travers vos valeurs fondamentales, votre vision de l'avenir et la façon dont vous donnez et recevez l'amour. Cela demande : qu'est-ce qui fait réellement durer une relation ? Les rencontres conscientes, c'est apporter honnêteté, présence et curiosité à chaque connexion — qu'elle devienne amoureuse, amicale, ou simplement un échange humain significatif." },
  { q: 'Comment fonctionne le matching ?', a: "Vous répondez à 21 questions introspectives sur les valeurs, les conflits, la spiritualité, la famille, la communication et l'intimité émotionnelle. Vos réponses sont comparées à celles des autres membres pour produire un score de compatibilité. Une compatibilité plus élevée signifie un coût plus bas pour déverrouiller et se connecter — parce que les vraies connexions méritent d'être encouragées, pas pénalisées." },
  { q: 'Nina Purple encourage-t-il les rencontres en personne ?', a: "Oui — fortement. La connexion numérique est un point de départ, pas une destination. Nina Purple encourage activement les rencontres en personne à travers des événements communautaires, des rencontres, des conférences sur la conscience, et l'Expérience Nina Purple — des retraites en personne curées dans des destinations comme la Martinique, conçues pour favoriser la conscience de soi, la croissance émotionnelle et une transformation durable. La vraie connexion humaine se vit face à face." },
  { q: 'Que sont les Expériences Nina Purple ?', a: "Les Expériences Nina Purple sont des retraites en personne curées, conçues pour les célibataires comme pour les couples. Chaque expérience combine un accompagnement thérapeutique professionnel, des conversations significatives, l'immersion dans la nature et une communauté partageant les mêmes valeurs — pour aider à créer des relations plus saines qui s'étendent bien au-delà du séjour. Que vous célébriez un nouveau chapitre ou reconstruisiez après des défis, les Expériences sont l'endroit où la plateforme prend vie." },
  { q: 'Que sont les micro-transactions ?', a: "Au lieu d'un seul abonnement couvrant tout, vous investissez dans chaque connexion. Déverrouiller un profil et envoyer des messages coûte un petit montant qui varie inversement à la compatibilité — plus la correspondance est bonne, plus le coût est bas. Cela vous encourage à investir dans les connexions les plus susceptibles de compter." },
  { q: 'Y a-t-il un plan gratuit ?', a: "Oui. Le plan Solaire est gratuit et inclut un nombre limité de déverrouillages de profils et de messages par mois. Les plans payants (Lunaire, Stellaire, Galactique) offrent plus de capacité mensuelle et des fonctionnalités supplémentaires." },
  { q: 'Nina Purple est-il bilingue ?', a: 'Oui. La plateforme est entièrement disponible en anglais et en français, conçue pour une communauté internationale.' },
  { q: 'Les couples peuvent-ils utiliser Nina Purple ?', a: "Oui. Les couples peuvent créer un profil partagé et participer aux Expériences Nina Purple ensemble — des retraites curées conçues pour la croissance relationnelle. Les profils de couple sont séparés du pool de matching individuel." },
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