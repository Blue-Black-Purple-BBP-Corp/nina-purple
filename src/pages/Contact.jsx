import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Instagram, Heart } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function Contact() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-[#0B0510] px-6 py-20 max-w-2xl mx-auto">
      <Link to="/" className="text-[#F5A800] text-sm hover:opacity-80 transition-opacity mb-8 inline-block">
        ← {lang === 'fr' ? 'Retour' : 'Back'}
      </Link>

      <h1 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-4">
        {lang === 'fr' ? 'Nous Contacter' : 'Contact Us'}
      </h1>
      <p className="text-[#F0E6FF]/60 text-lg mb-12 leading-relaxed">
        {lang === 'fr'
          ? 'Nous sommes là pour vous. Contactez-nous pour toute question, suggestion ou partenariat.'
          : 'We are here for you. Reach out for any questions, suggestions, or partnership inquiries.'}
      </p>

      <div className="space-y-4">
        <a
          href="mailto:contact@NinaPurple.love"
          className="flex items-center gap-4 glass-card-gold rounded-2xl px-6 py-5 hover:bg-[rgba(245,168,0,0.06)] transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.2)] flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-[#F5A800]" />
          </div>
          <div>
            <div className="text-[#F0E6FF]/50 text-xs uppercase tracking-widest mb-0.5">
              {lang === 'fr' ? 'Courriel' : 'Email'}
            </div>
            <div className="text-[#F0E6FF] font-medium group-hover:text-[#F5A800] transition-colors">
              contact@NinaPurple.love
            </div>
          </div>
        </a>

        <a
          href="https://www.instagram.com/ninapurple.love"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 glass-card rounded-2xl px-6 py-5 hover:border-[rgba(168,85,247,0.3)] transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[rgba(123,47,190,0.1)] border border-[rgba(123,47,190,0.2)] flex items-center justify-center shrink-0">
            <Instagram className="w-5 h-5 text-[#7B2FBE]" />
          </div>
          <div>
            <div className="text-[#F0E6FF]/50 text-xs uppercase tracking-widest mb-0.5">Instagram</div>
            <div className="text-[#F0E6FF] font-medium group-hover:text-[#A855F7] transition-colors">
              @ninapurple.love
            </div>
          </div>
        </a>
      </div>

      <div className="mt-12 pt-8 border-t border-[rgba(240,230,255,0.08)]">
        <Link to="/about" className="text-[#F5A800] hover:opacity-80 transition-opacity text-sm">
          {lang === 'fr' ? '← À Propos de Nous' : '← About Us'}
        </Link>
      </div>
    </div>
  );
}