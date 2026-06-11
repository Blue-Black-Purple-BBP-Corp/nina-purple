import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Zap, Heart, ChevronDown, Eye, EyeOff } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import PricingModal from '@/components/PricingModal';
import { useLang } from '@/lib/LanguageContext';
import { useTranslation, PRICING_TABLE } from '@/lib/i18n';

export default function Landing() {
  const { lang } = useLang();
  const { t } = useTranslation(lang);
  const [pricingOpen, setPricingOpen] = useState(false);

  const fadeUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 },
  };

  return (
    <div className="min-h-screen bg-[#0B0510] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(11,5,16,0.8)', backdropFilter: 'blur(20px)' }}>
        <img
          src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/bcc45d7e3_CopyofNPhorizontalcopia.png"
          alt="Nina Purple"
          className="h-10 object-contain"
        />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageToggle />
          <Link
            to="/onboarding"
            className="px-5 py-2 bg-[#F5A800] text-[#0B0510] rounded-full text-sm font-bold tracking-wide hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_20px_rgba(245,168,0,0.3)]"
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
            src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/c077be419_CopyofLogoNPIsoWoman.png"
            alt=""
            className="w-full object-contain"
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Icon */}
          <motion.div {...fadeUp} className="mb-8 flex justify-center">
            <img
              src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/36ab8cc0a_NinaPurpleIcon.png"
              alt="Nina Purple"
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_40px_rgba(123,47,190,0.5)]"
            />
          </motion.div>

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
            className="text-[#F0E6FF]/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('landing.subtitle')}
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
            <button
              onClick={() => setPricingOpen(true)}
              className="px-10 py-4 border border-[rgba(245,168,0,0.3)] text-[#F5A800] rounded-full text-base font-medium tracking-wide hover:bg-[rgba(245,168,0,0.08)] transition-all duration-300"
            >
              {lang === 'fr' ? 'Voir les Prix' : 'View Pricing'}
            </button>
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
            {lang === 'fr' ? '« Un nouveau chapitre commence maintenant ! »' : '"A new chapter begins right now!"'}
          </h2>
          <p className="text-[#F0E6FF]/70 text-lg leading-relaxed">
            {lang === 'fr'
              ? 'Prenez une grande respiration et ayez confiance que cet espace vous offre quelque chose de bien différent de ce que vous avez jamais vécu.'
              : 'Take a deep breath and have faith that being in this space offers you something far different than you have ever experienced.'}
          </p>
          <p className="text-[#F0E6FF]/60 text-base leading-relaxed">
            {lang === 'fr'
              ? "D'autres se trouvent ici dans un voyage relationnel et, tout comme vous, cherchent des connexions profondes — peut-être pour la première fois."
              : 'Others find themselves here on a relationship journey and, just like you, are looking towards meaningful connections, maybe for the first time.'}
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
              ? 'Cessez de tourbillonner dans les rêves éveillés. Commencez à rencontrer de belles personnes.'
              : 'Stop swirling in daydreams. Start meeting lovely people.'}
          </p>

          <div className="golden-thread w-32 mx-auto" />

          <p className="text-[#F0E6FF]/50 text-sm italic">
            {lang === 'fr'
              ? '« Nous accueillons votre honnêteté, votre compassion et votre volonté de tout recommencer ! »'
              : '"We welcome your honesty, compassion, and willingness to start new!"'}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { plan: t('plans.solar'), price: t('plans.free'), desc: t('plans.solar_desc'), color: '#F0E6FF', border: 'rgba(240,230,255,0.1)' },
            { plan: t('plans.lunar'), price: '$10', desc: t('plans.lunar_desc'), color: '#7B2FBE', border: 'rgba(123,47,190,0.3)' },
            { plan: t('plans.stellar'), price: '$15', desc: t('plans.stellar_desc'), color: '#A855F7', border: 'rgba(168,85,247,0.3)' },
            { plan: t('plans.galactic'), price: '$20', desc: t('plans.galactic_desc'), color: '#F5A800', border: 'rgba(245,168,0,0.3)' },
          ].map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-5 flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0"
              style={{ borderColor: p.border }}
            >
              <div className="font-serif text-base sm:text-lg sm:mb-1 min-w-[80px] sm:min-w-0" style={{ color: p.color }}>{p.plan}</div>
              <div className="text-2xl sm:text-3xl font-bold text-[#F0E6FF] sm:mb-1 flex-1 sm:flex-none">
                {p.price}<span className="text-xs sm:text-sm font-normal text-[#F0E6FF]/40">{i > 0 ? t('plans.per_month') : ''}</span>
              </div>
              <div className="text-xs sm:text-sm text-[#F0E6FF]/50 text-right sm:text-center flex-1 sm:flex-none">{p.desc}</div>
            </motion.div>
          ))}
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
            src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/36ab8cc0a_NinaPurpleIcon.png"
            alt="Nina"
            className="w-20 h-20 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(245,168,0,0.4)] object-contain"
          />
          <h2 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-6">
            {lang === 'fr' ? 'Prêt(e) à commencer ?' : 'Ready to begin?'}
          </h2>
          <p className="text-[#F0E6FF]/60 text-lg mb-8">
            {lang === 'fr'
              ? 'Rejoignez une communauté qui valorise votre temps et votre cœur.'
              : 'Join a community that values your time and your heart.'}
          </p>
          <Link
            to="/onboarding"
            className="inline-block px-12 py-5 bg-[#F5A800] text-[#0B0510] rounded-full text-base font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_40px_rgba(245,168,0,0.3)]"
          >
            {t('landing.cta_join')}
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(240,230,255,0.06)] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/bcc45d7e3_CopyofNPhorizontalcopia.png"
            alt="Nina Purple"
            className="h-8 object-contain opacity-60"
          />
          <div className="text-[#F0E6FF]/30 text-sm text-center">
            © 2026 Nina Purple · Blue Black Purple (BBP) Corp. · contact@NinaPurple.love
            <span className="mx-2">·</span>
            <Link to="/privacy" className="underline hover:text-[#F5A800] transition-colors">
              {lang === 'fr' ? 'Confidentialité' : 'Privacy Policy'}
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
            <img src="https://media.base44.com/images/public/user_6a21c0f76d807658e5c95962/36ab8cc0a_NinaPurpleIcon.png"
              alt="" className="w-5 h-5 object-contain opacity-60" />
            {lang === 'fr' ? 'Accueil' : 'Home'}
          </a>
          <a href="#mission"
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[#F5A800] transition-colors text-xs font-medium tracking-wide">
            <Star className="w-5 h-5 text-[#F5A800]" />
            {lang === 'fr' ? 'Intention' : 'Intention'}
          </a>
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