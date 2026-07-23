import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Zap, Heart, ChevronDown, Eye, EyeOff, LogIn, User } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import PricingModal from '@/components/PricingModal';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation, PRICING_TABLE } from '@/lib/i18n';
import { ALL_PLANS, INDIVIDUAL_PLANS, COUPLE_PLANS, THERAPY_ADDON } from '@/lib/plans';
import { ninaIcon, ninaHorizontal, ninaCharacter } from '@/lib/images';
import FAQ from '@/components/FAQ';

export default function Landing() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [planType, setPlanType] = useState('individual');

  const fadeUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 },
  };

  return (
    <div className="min-h-screen bg-[#0B0510] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(11,5,16,0.85)', backdropFilter: 'blur(20px)' }}
        data-theme-nav="true">
        <img
          src={ninaHorizontal}
          alt="Nina Purple"
          className="h-8 md:h-10 object-contain"
        />
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <LanguageToggle />
          <Link
            to="/experiences"
            className="hidden md:inline-block px-4 py-2 text-[#F0E6FF]/60 text-sm font-medium rounded-full hover:text-[#F5A800] hover:bg-[rgba(245,168,0,0.08)] transition-all duration-300"
          >
            {lang === 'fr' ? 'Expériences' : 'Experiences'}
          </Link>
          <Link
            to="/login"
            className="hidden md:inline-block px-4 py-2 text-[#F0E6FF]/60 text-sm font-medium rounded-full hover:text-[#F5A800] hover:bg-[rgba(245,168,0,0.08)] transition-all duration-300"
          >
            {lang === 'fr' ? 'Connexion' : 'Log in'}
          </Link>
          <Link
            to="/onboarding"
            className="hidden md:inline-block px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold tracking-wide hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_20px_rgba(245,168,0,0.3)]"
          >
            {lang === 'fr' ? 'Rejoindre' : 'Join'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Radial glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(123,47,190,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,168,0,0.08) 0%, transparent 70%)' }} />
        </div>

        {/* Nina character watermark */}
        <div className="absolute right-0 bottom-0 w-72 opacity-10 pointer-events-none hidden md:block">
          <img
            src={ninaCharacter}
            alt=""
            className="w-full object-contain"
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Icon */}
          <motion.div {...fadeUp} className="mb-8 flex justify-center">
            <img
              src={ninaIcon}
              alt="Nina Purple"
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_40px_rgba(123,47,190,0.5)]"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[#F5A800] text-sm font-semibold uppercase tracking-[0.25em] mb-5"
          >
            {lang === 'fr' ? 'Communauté de rencontres conscientes · Sans swipe · La compatibilité avant tout' : 'Conscious Dating Community · No Swiping · Compatibility First'}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-5xl md:text-7xl text-[#F0E6FF] leading-tight mb-4"
          >
            {t('landing.tagline')}
            <br />
            <span className="text-[#7B2FBE]">{t('landing.tagline2')}</span>
            <br />
            <span className="text-[#F5A800]">{t('landing.tagline3')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-[#F0E6FF]/70 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            {t('landing.subtitle')}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-[#F0E6FF]/60 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {lang === 'fr'
              ? "Que vous cherchiez l'amour pour vous-même ou que vous souhaitiez approfondir votre relation de couple, Nina Purple vous accompagne."
              : "Whether you are seeking love for yourself or wanting to deepen your relationship as a couple, Nina Purple supports you."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/onboarding"
              className="px-10 py-4 bg-[#F5A800] text-[#0B0510] rounded-full text-base font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_30px_rgba(245,168,0,0.3)] hover:shadow-[0_0_50px_rgba(245,168,0,0.5)]"
            >
              {t('landing.cta_join')}
            </Link>
            <Link
              to="/experiences"
              className="px-10 py-4 border border-[rgba(245,168,0,0.3)] text-[#F5A800] rounded-full text-base font-medium tracking-wide hover:bg-[rgba(245,168,0,0.08)] transition-all duration-300"
            >
              {lang === 'fr' ? 'Explorer les expériences' : 'Explore Experiences'}
            </Link>
          </motion.div>

          {/* Fork: exploring alone vs together */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex items-center justify-center gap-6 mt-8 text-sm"
          >
            <Link to="/onboarding" className="flex items-center gap-2 text-[#F0E6FF]/50 hover:text-[#F5A800] transition-colors">
              <User className="w-4 h-4" />
              {lang === 'fr' ? 'Explorer seul·e' : 'Exploring alone'}
            </Link>
            <span className="text-[#F0E6FF]/20">·</span>
            <Link to="/onboarding" className="flex items-center gap-2 text-[#F0E6FF]/50 hover:text-[#7B2FBE] transition-colors">
              <Heart className="w-4 h-4" />
              {lang === 'fr' ? 'Explorer en couple' : 'Exploring together'}
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-[#F0E6FF]/30" />
        </motion.div>
      </section>

      {/* Golden thread divider */}
      <div className="golden-thread w-full" />

      {/* New Chapter Section */}
      <section className="px-6 py-24 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-[#F5A800] leading-tight">
            {lang === 'fr' ? '« La vraie connexion commence par être véritablement vu·e. »' : '"The right connection begins with being truly seen."'}
          </h2>
          <p className="text-[#F0E6FF]/70 text-lg leading-relaxed">
            {lang === 'fr'
              ? "Il faut du courage pour chercher une vraie connexion. Vous êtes ici parce que vous savez que quelque chose de plus profond est possible, et vous avez raison."
              : 'It takes courage to seek real connection. You are here because you know something deeper is possible, and you are right.'}
          </p>
          <p className="text-[#F0E6FF]/60 text-base leading-relaxed">
            {lang === 'fr'
              ? "D'autres partagent ce même voyage. Non pas à la recherche d'une distraction, mais d'une présence authentique, peut-être pour la première fois de leur vie."
              : 'Others share this same journey. Not searching for distraction, but for genuine presence, perhaps for the first time in their lives.'}
          </p>

          {/* Magic Number highlight */}
          <div className="glass-card-gold rounded-3xl p-8 md:p-10 my-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-6xl md:text-7xl font-serif font-bold text-[#F5A800]">21</span>
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="font-serif text-2xl text-[#F0E6FF] mb-3">
              {lang === 'fr' ? 'Le Nombre Magique' : 'The Magic Number'}
            </h3>
            <p className="text-[#F0E6FF]/70 text-base leading-relaxed">
              {lang === 'fr'
                ? <>Vous vous correspondez avec les autres selon vos intentions, objectifs et aspirations relationnels en répondant à <strong className="text-[#F0E6FF]">21 questions profondes</strong> sur la façon dont vous aimez être aimé(e).</>
                : <>You match with others based on your relationship intent, goals, and aspirations by answering <strong className="text-[#F0E6FF]">21 deep questions</strong> about how you like to be loved.</>}
            </p>
          </div>

          <p className="text-[#F0E6FF]/80 text-xl font-serif italic">
            {lang === 'fr'
              ? "Ce n'est pas une question de rendre les rencontres plus faciles. C'est une question de rendre l'amour à la hauteur."
              : 'This is not about making dating easier. It is about making love worth it.'}
          </p>

          <div className="golden-thread w-32 mx-auto" />

          <p className="text-[#F0E6FF]/50 text-sm italic">
            {lang === 'fr'
              ? '« Nous accueillons votre honnêteté, votre profondeur et votre courage d\'aimer. »'
              : '"We welcome your honesty, your depth, and your courage to love."'}
          </p>
        </motion.div>
      </section>

      {/* Golden thread divider */}
      <div className="golden-thread w-full" />

      {/* Features */}
      <section id="mission" className="px-6 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-4">{t('landing.mission_title')}</h2>
          <p className="text-[#F0E6FF]/60 text-lg max-w-2xl mx-auto">{t('landing.mission_body')}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: EyeOff, title: t('landing.no_swipe'), desc: t('landing.no_swipe_desc'), color: '#7B2FBE' },
            { icon: Star, title: t('landing.conscious'), desc: t('landing.conscious_desc'), color: '#F5A800' },
            { icon: Zap, title: t('landing.investment'), desc: t('landing.investment_desc'), color: '#7B2FBE' },
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="glass-card rounded-3xl p-8 text-center group hover:border-[rgba(245,168,0,0.2)] transition-all duration-600"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: `rgba(${feat.color === '#F5A800' ? '245,168,0' : '123,47,190'},0.1)`, border: `1px solid ${feat.color}30` }}
              >
                <feat.icon className="w-8 h-8" style={{ color: feat.color }} />
              </div>
              <h3 className="font-serif text-2xl text-[#F0E6FF] mb-3">{feat.title}</h3>
              <p className="text-[#F0E6FF]/60 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="golden-thread w-full mb-16" />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-4">{t('pricing.title')}</h2>
          <p className="text-[#F0E6FF]/60 text-lg max-w-xl mx-auto">{t('pricing.subtitle')}</p>
        </motion.div>

        {/* Singles / Couples toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button onClick={() => setPlanType('individual')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${planType === 'individual' ? 'bg-[#F5A800] text-[#0B0510]' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]'}`}>
            {lang === 'fr' ? 'Célibataires' : 'Singles'}
          </button>
          <button onClick={() => setPlanType('couple')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${planType === 'couple' ? 'bg-[#7B2FBE] text-white' : 'glass-card text-[#F0E6FF]/60 hover:text-[#F0E6FF]'}`}>
            {lang === 'fr' ? 'Couples' : 'Couples'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {(planType === 'couple' ? COUPLE_PLANS : INDIVIDUAL_PLANS).map((plan, i) => {
            const isGalactic = plan.key === 'galactic';
            const isSolar = plan.key === 'solar';
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden ${isGalactic ? 'glass-card-gold' : 'glass-card'}`}
              >
                {/* Galactic badge */}
                {isGalactic && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-b-full text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: plan.color, color: '#0B0510' }}>
                    {lang === 'fr' ? 'Populaire' : 'Popular'}
                  </div>
                )}

                {/* Icon + Name */}
                <div className="text-center">
                  <div className="text-2xl mb-1.5">{plan.icon}</div>
                  <h3 className="font-serif text-xl font-bold" style={{ color: plan.color }}>
                    {lang === 'fr' ? plan.label_fr : plan.label_en}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {lang === 'fr' ? plan.desc_fr : plan.desc_en}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center">
                  {isSolar ? (
                    <span className="text-3xl font-serif font-bold" style={{ color: plan.color }}>
                      {lang === 'fr' ? 'Gratuit' : 'Free'}
                    </span>
                  ) : (
                    <div>
                      <span className="text-2xl font-serif font-bold text-foreground">
                        {lang === 'fr' ? plan.price_fr : plan.price_en}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border/60" />

                {/* Perks */}
                <ul className="space-y-2 flex-1">
                  {(lang === 'fr' ? plan.perks_fr : plan.perks_en).map((perk, j) => {
                    const isExpLink = /Nina Purple Experiences|Expériences Nina Purple/i.test(perk);
                    return (
                    <li key={j} className="flex items-start gap-2.5 text-xs text-foreground/65 leading-relaxed">
                      <span className="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                        style={{ background: `${plan.color}18`, color: plan.color }}>✓</span>
                      {isExpLink ? (
                        <Link to="/experiences" className="text-[#F5A800] underline underline-offset-2 hover:opacity-80 transition-opacity font-medium">{perk}</Link>
                      ) : perk}
                    </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <Link to="/onboarding"
                  className="block text-center text-sm font-bold py-3 rounded-full transition-all duration-300"
                  style={isSolar
                    ? { background: 'transparent', color: plan.color, border: `1.5px solid ${plan.color}40` }
                    : isGalactic
                      ? { background: plan.color, color: '#0B0510', boxShadow: `0 4px 20px ${plan.color}30` }
                      : { background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}30` }
                  }>
                  {lang === 'fr' ? 'Commencer' : 'Get Started'}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Therapy Add-On */}
        <div className="glass-card-gold rounded-2xl p-5 max-w-2xl mx-auto mb-8 flex items-center gap-4">
          <div className="text-3xl">{THERAPY_ADDON.icon}</div>
          <div className="flex-1 text-left">
            <h4 className="font-serif text-base text-[#F0E6FF]">
              {lang === 'fr' ? THERAPY_ADDON.label_fr : THERAPY_ADDON.label_en}
            </h4>
            <p className="text-[#F0E6FF]/50 text-xs mt-0.5">
              {lang === 'fr' ? THERAPY_ADDON.desc_fr : THERAPY_ADDON.desc_en}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#F5A800] font-bold text-lg">{lang === 'fr' ? THERAPY_ADDON.price_fr : THERAPY_ADDON.price_en}</div>
            <p className="text-[#F0E6FF]/30 text-[10px]">{lang === 'fr' ? 'Disponible pour tous' : 'Available to all'}</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setPricingOpen(true)}
            className="text-[#F5A800] underline underline-offset-4 text-sm hover:opacity-80 transition-opacity"
          >
            {lang === 'fr' ? 'Voir la tarification complète des interactions →' : 'View full interaction pricing →'}
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(123,47,190,0.12) 0%, transparent 70%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <img
            src={ninaIcon}
            alt="Nina"
            className="w-20 h-20 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(245,168,0,0.4)] object-contain"
          />
          <h2 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-6">
            {lang === 'fr' ? 'Votre place est ici.' : 'You belong here.'}
          </h2>
          <p className="text-[#F0E6FF]/60 text-lg mb-8">
            {lang === 'fr'
              ? 'Que vous soyez célibataire, en couple, en transition, ou en train de vous reconstruire, cet espace a été construit pour vous.'
              : 'Whether single, in a relationship, navigating a transition, or rebuilding after loss, this space was built for you.'}
          </p>
          <Link
            to="/onboarding"
            className="inline-block px-12 py-5 bg-[#F5A800] text-[#0B0510] rounded-full text-base font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_40px_rgba(245,168,0,0.3)]"
          >
            {t('landing.cta_join')}
          </Link>
        </motion.div>
      </section>

      <FAQ />

      {/* Footer */}
      <footer className="border-t border-[rgba(240,230,255,0.06)] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src={ninaHorizontal}
            alt="Nina Purple"
            className="h-8 object-contain opacity-60"
          />
          <div className="text-[#F0E6FF]/30 text-sm text-center">
            © Nina Purple · contact@NinaPurple.love
            <span className="mx-2">·</span>
            <Link to="/experiences" className="underline hover:text-[#F5A800] transition-colors">
              {lang === 'fr' ? 'Expériences' : 'Experiences'}
            </Link>
            <span className="mx-2">·</span>
            <Link to="/about" className="underline hover:text-[#F5A800] transition-colors">
              {lang === 'fr' ? 'À Propos' : 'About'}
            </Link>
            <span className="mx-2">·</span>
            <Link to="/contact" className="underline hover:text-[#F5A800] transition-colors">
              {lang === 'fr' ? 'Contact' : 'Contact'}
            </Link>
            <span className="mx-2">·</span>
            <Link to="/privacy" className="underline hover:text-[#F5A800] transition-colors">
              {lang === 'fr' ? 'Confidentialité' : 'Privacy Policy'}
            </Link>
            <span className="mx-2">·</span>
            <Link to="/terms" className="underline hover:text-[#F5A800] transition-colors">
              {lang === 'fr' ? 'Conditions' : 'Terms'}
            </Link>
          </div>
          <LanguageToggle />
        </div>
      </footer>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[rgba(240,230,255,0.08)]"
        style={{ background: 'rgba(11,5,16,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-stretch">
          <a href="#home"
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[#F0E6FF]/50 hover:text-[#F0E6FF] transition-colors text-xs font-medium tracking-wide">
            <img src={ninaIcon}
              alt="" className="w-5 h-5 object-contain opacity-60" />
            {lang === 'fr' ? 'Accueil' : 'Home'}
          </a>
          <a href="#mission"
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[#F5A800] transition-colors text-xs font-medium tracking-wide">
            <Star className="w-5 h-5 text-[#F5A800]" />
            {lang === 'fr' ? 'Intention' : 'Intention'}
          </a>
          <Link to="/login"
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[#F0E6FF]/50 hover:text-[#F5A800] transition-colors text-xs font-medium tracking-wide">
            <LogIn className="w-5 h-5" />
            {lang === 'fr' ? 'Connexion' : 'Log in'}
          </Link>
          <Link to="/onboarding"
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 bg-[#F5A800] text-[#0B0510] text-xs font-bold tracking-wide">
            <Heart className="w-5 h-5" />
            {lang === 'fr' ? 'Commencer' : 'Begin'}
          </Link>
        </div>
      </nav>

      {/* Spacer so footer isn't hidden behind mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}