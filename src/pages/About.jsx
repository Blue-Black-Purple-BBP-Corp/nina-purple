import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';

export default function About() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-[#0B0510] px-6 py-20 max-w-3xl mx-auto">
      <Link to="/" className="text-[#F5A800] text-sm hover:opacity-80 transition-opacity mb-8 inline-block">
        ← {lang === 'fr' ? 'Retour' : 'Back'}
      </Link>

      {lang === 'fr' ? (
        <>
          <h1 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-8">À Propos de Nina Purple</h1>

          <div className="space-y-6 text-[#F0E6FF]/75 text-lg leading-relaxed">
            <p>
              Nina Purple est une plateforme de rencontres conscientes conçue pour celles et ceux qui en ont fini avec les applis superficielles. Nous avons éliminé le balayage, les photos filtrées et les interactions vides — pour les remplacer par quelque chose de profondément différent : des connexions fondées sur qui vous êtes vraiment.
            </p>
            <p>
              Notre algorithme de compatibilité repose sur 21 questions profondes portant sur vos valeurs, vos objectifs relationnels, votre vision de l'intimité et votre façon d'aimer. Plus votre compatibilité avec quelqu'un est élevée, moins il vous en coûte pour entrer en contact — parce que nous croyons que les vraies connexions méritent d'être encouragées.
            </p>
            <p>
              Nina Purple s'adresse à des adultes intentionnels — célibataires, séparé·es ou en transition — qui cherchent des relations authentiques et durables. Que vous soyez à la recherche d'un partenaire de vie, d'une amitié profonde ou simplement d'une communauté bienveillante, vous êtes à votre place ici.
            </p>
            <p>
              La plateforme est construite par <strong className="text-[#F0E6FF]">Blue Black Purple (BBP) Corp.</strong>, une entreprise fondée sur la conviction que l'amour mérite un espace sûr, honnête et intentionnel. Notre équipe est guidée par les valeurs de conscience, de respect et d'authenticité — les mêmes valeurs que nous demandons à chaque membre d'apporter.
            </p>
            <p>
              Rejoignez une communauté mondiale de personnes prêtes à se montrer telles qu'elles sont, à poser de vraies questions et à construire des liens qui durent. Bienvenue chez Nina Purple — où chaque interaction compte.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-8">About Nina Purple</h1>

          <div className="space-y-6 text-[#F0E6FF]/75 text-lg leading-relaxed">
            <p>
              Nina Purple is a conscious dating platform built for people who are done with shallow apps. We have removed the swiping, the filtered photos, and the hollow interactions — replacing them with something fundamentally different: connections built on who you truly are.
            </p>
            <p>
              Our compatibility algorithm is powered by 21 deep questions about your values, relationship goals, vision of intimacy, and how you love. The higher your compatibility with someone, the less it costs to connect — because we believe real connections deserve to be encouraged, not gated behind endless browsing.
            </p>
            <p>
              Nina Purple is designed for intentional adults — singles, separated, or in transition — who are seeking authentic, meaningful relationships. Whether you are looking for a life partner, a deep friendship, or simply a supportive community, you belong here.
            </p>
            <p>
              The platform is built by <strong className="text-[#F0E6FF]">Blue Black Purple (BBP) Corp.</strong>, a company founded on the belief that love deserves a safe, honest, and intentional space. Our team is guided by the values of consciousness, respect, and authenticity — the same values we ask every member to bring with them.
            </p>
            <p>
              Join a global community of people ready to show up as they truly are, ask real questions, and build connections that last. Welcome to Nina Purple — where every interaction matters.
            </p>
          </div>
        </>
      )}

      <div className="mt-12 pt-8 border-t border-[rgba(240,230,255,0.08)] flex gap-6">
        <Link to="/contact" className="text-[#F5A800] hover:opacity-80 transition-opacity text-sm">
          {lang === 'fr' ? 'Nous Contacter →' : 'Contact Us →'}
        </Link>
        <Link to="/privacy" className="text-[#F0E6FF]/40 hover:text-[#F0E6FF]/70 transition-colors text-sm">
          {lang === 'fr' ? 'Confidentialité' : 'Privacy Policy'}
        </Link>
      </div>
    </div>
  );
}