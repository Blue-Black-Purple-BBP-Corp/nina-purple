import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, Zap, Users, Shield, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } };

const VALUES_EN = [
  { icon: Heart,  color: '#F5A800', title: 'Intention',          desc: 'Every interaction on Nina Purple is meaningful. No swiping, only connections built on who you truly are.' },
  { icon: Star,   color: '#A855F7', title: 'Compatibility',      desc: '21 deep questions power our algorithm. The higher your compatibility, the less it costs to connect.' },
  { icon: Shield, color: '#7B2FBE', title: 'Safety',             desc: 'A safe, honest, and moderated space where every member commits to the community guidelines.' },
  { icon: Users,  color: '#60A5FA', title: 'Community',          desc: 'Chat rooms, online and in-person events, and a global community of intentional people.' },
  { icon: Zap,    color: '#F5A800', title: 'Micro-Transactions', desc: 'Invest in your connections. The higher the compatibility, the lower the cost, because real connections deserve to be encouraged.' },
  { icon: Globe,  color: '#A855F7', title: 'Global & Bilingual', desc: 'Nina Purple is available in English and French, built for an international community.' },
];

const VALUES_FR = [
  { icon: Heart,  color: '#F5A800', title: 'Intention',             desc: "Chaque interaction sur Nina Purple est significative. Pas de glissement d'écran, uniquement des connexions fondées sur qui vous êtes vraiment." },
  { icon: Star,   color: '#A855F7', title: 'Compatibilité',         desc: '21 questions profondes alimentent notre algorithme. Plus vous êtes compatibles, moins la connexion vous coûte.' },
  { icon: Shield, color: '#7B2FBE', title: 'Sécurité',              desc: "Un espace sûr, honnête et modéré où chaque membre s'engage à respecter les règles de la communauté." },
  { icon: Users,  color: '#60A5FA', title: 'Communauté',            desc: 'Des salons, des événements en ligne et en présentiel, et une communauté mondiale de personnes intentionnelles.' },
  { icon: Zap,    color: '#F5A800', title: 'Micro-transactions',    desc: "Investissez dans vos connexions. Plus la compatibilité est élevée, plus le coût est bas, parce que les vraies connexions méritent d'être encouragées." },
  { icon: Globe,  color: '#A855F7', title: 'Mondial & Bilingue',    desc: 'Nina Purple est disponible en anglais et en français, conçu pour une communauté internationale.' },
];

export default function About() {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const values = fr ? VALUES_FR : VALUES_EN;

  return (
    <div className="min-h-screen px-6 py-20 max-w-3xl mx-auto">
      <Link to="/" className="text-[#F5A800] text-sm hover:opacity-80 transition-opacity mb-10 inline-block">
        ← {fr ? 'Retour' : 'Back'}
      </Link>

      {/* Hero */}
      <motion.div {...fadeUp} className="mb-14 text-center">
        <img
          src="/images/nina-icon.png"
          alt="Nina Purple"
          className="w-20 h-20 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(123,47,190,0.5)] object-contain"
        />
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-5">
          {fr ? 'À Propos de Nina Purple' : 'About Nina Purple'}
        </h1>
        <p className="text-foreground/70 text-xl leading-relaxed max-w-2xl mx-auto">
          {fr
            ? "Une plateforme de rencontres conscientes qui place la profondeur avant l'apparence, et l'intention avant l'impulsion."
            : 'A conscious dating platform that places depth before appearance, and intention before impulse.'}
        </p>
      </motion.div>

      {/* Mission */}
      <motion.div {...fadeUp} className="glass-card-gold rounded-3xl p-8 mb-10 space-y-5">
        <h2 className="font-serif text-2xl text-[#F5A800]">{fr ? 'Notre Mission' : 'Our Mission'}</h2>
        <p className="text-foreground/85 leading-relaxed">
          {fr
            ? "Nina Purple est né d'une conviction tranquille : les personnes qui prennent l'amour au sérieux méritent mieux qu'un algorithme qui mesure l'attirance en quelques secondes."
            : "Nina Purple was built on a quiet conviction: that the people most serious about love deserve more than an algorithm that measures attraction in seconds."}
        </p>
        <p className="text-foreground/80 leading-relaxed">
          {fr
            ? "Nous avons supprimé la mise en scène, les photos soigneusement choisies, le glissement d'écran sans fin, les petites conversations qui ne mènent nulle part, pour construire quelque chose de différent. Un espace où la compatibilité se mesure à ce qui nourrit vraiment une relation : vos valeurs, votre vision de l'avenir, et la façon dont vous donnez et recevez l'amour."
            : "We stripped away the performance, the curated photos, the endless swiping, the small talk that goes nowhere, and built something different. A space where compatibility is measured by what actually sustains a relationship: your values, your vision for the future, and the way you give and receive love."}
        </p>
        <p className="text-foreground/80 leading-relaxed">
          {fr
            ? "Au cœur de la plateforme se trouvent 21 questions conçues non pas pour vous cataloguer, mais pour vous révéler. Parce que la vraie connexion ne commence pas par une photo. Elle commence par être véritablement vu·e."
            : "At the heart of the platform are 21 questions designed not to profile you, but to reveal you. Because the right connection doesn't begin with a picture. It begins with being truly seen."}
        </p>
        <p className="text-foreground/80 leading-relaxed">
          {fr
            ? "Nina Purple est pour les adultes intentionnels, ceux qui ont assez vécu pour savoir ce qu'ils veulent, et qui sont prêts à le poursuivre avec honnêteté et profondeur. Que vous soyez célibataire, en transition, ou en train de vous reconstruire après une perte, vous avez votre place ici."
            : "Nina Purple is for intentional adults, those who have lived enough to know what they want, and who are ready to pursue it with honesty and depth. Whether you are single, navigating a transition, or rebuilding after loss, you belong here."}
        </p>
        <p className="text-foreground font-serif italic text-lg">
          {fr
            ? "Il ne s'agit pas de rendre les rencontres plus faciles. Il s'agit de rendre l'amour à la hauteur."
            : "This is not about making dating easier. It is about making love worth it."}
        </p>
      </motion.div>

      {/* Values grid */}
      <motion.div {...fadeUp}>
        <h2 className="font-serif text-2xl text-foreground mb-6">{fr ? 'Ce qui nous définit' : 'What Defines Us'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {values.map((v, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5 space-y-2"
              style={{ borderColor: `${v.color}30` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${v.color}15`, border: `1px solid ${v.color}30` }}>
                  <v.icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3 className="font-serif text-base" style={{ color: v.color }}>{v.title}</h3>
              </div>
              <p className="text-foreground/70 text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* The magic number */}
      <motion.div {...fadeUp} className="glass-card rounded-3xl p-8 mb-10 text-center" style={{ borderColor: 'rgba(245,168,0,0.15)' }}>
        <div className="font-serif text-6xl font-bold text-[#F5A800] mb-2">21</div>
        <h3 className="font-serif text-xl text-foreground mb-3">{fr ? 'Le Nombre Magique' : 'The Magic Number'}</h3>
        <p className="text-foreground/70 text-sm leading-relaxed max-w-lg mx-auto">
          {fr
            ? "Vous vous connectez avec les autres selon vos intentions relationnelles en répondant à 21 questions profondes sur la façon dont vous aimez être aimé·e. Ce ne sont pas des détails de surface, ce sont vos valeurs fondamentales."
            : "You connect with others based on your relationship intentions by answering 21 deep questions about how you like to be loved. These aren't surface-level details, they are your core values."}
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp} className="text-center mb-12">
        <Link to="/onboarding"
          className="inline-block px-10 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.25)]">
          {fr ? 'Commencer mon voyage' : 'Begin My Journey'}
        </Link>
      </motion.div>

      <div className="pt-8 border-t border-foreground/10 flex gap-6">
        <Link to="/contact" className="text-[#F5A800] hover:opacity-80 transition-opacity text-sm">
          {fr ? 'Nous Contacter →' : 'Contact Us →'}
        </Link>
        <Link to="/privacy" className="text-foreground/50 hover:text-foreground/80 transition-colors text-sm">
          {fr ? 'Confidentialité' : 'Privacy Policy'}
        </Link>
      </div>
    </div>
  );
}