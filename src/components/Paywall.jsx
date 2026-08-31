import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, Crown, Check, ArrowRight, CreditCard } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

// Member-safe paywall. Shown when a member lacks an active membership/trial
// entitlement and tries to reach a paid route. Explains what is unavailable,
// what the plan unlocks, the price, the Founding Member trial if eligible,
// and the exact next action. Never a generic error or blank page.
export default function Paywall({ entitlement, lang }) {
  const { lang: ctxLang } = useLang();
  const isFr = (lang || ctxLang) === 'fr';
  const status = entitlement?.membership_status || 'payment_required';
  const foundingEligible = entitlement?.founding_member_benefit_status === 'eligible';

  const heading = (() => {
    switch (status) {
      case 'payment_past_due': return isFr ? 'Paiement requis' : 'Payment required';
      case 'cancelled_expired': return isFr ? 'Votre adhésion a expiré' : 'Your membership has expired';
      case 'suspended': return isFr ? 'Compte suspendu' : 'Account suspended';
      case 'restricted': return isFr ? 'Accès restreint' : 'Access restricted';
      case 'admin_member_mode': return isFr ? 'Mode Membre' : 'Member Mode';
      default: return isFr ? 'Une adhésion est requise' : 'A membership is required';
    }
  })();

  const subtext = (() => {
    switch (status) {
      case 'payment_past_due':
        return isFr
          ? 'Votre dernier paiement a échoué. Mettez à jour votre méthode de paiement pour reprendre l’accès.'
          : 'Your last payment failed. Update your payment method to restore access.';
      case 'cancelled_expired':
        return isFr
          ? 'Votre adhésion Nina Purple a pris fin. Réactivez-la pour retrouver l’accès aux connexions et aux messages.'
          : 'Your Nina Purple membership has ended. Resume to access connections and messages again.';
      case 'suspended':
      case 'restricted':
        return isFr
          ? 'Votre accès est actuellement restreint. Contactez le support pour plus d’informations.'
          : 'Your access is currently restricted. Contact support for more information.';
      case 'admin_member_mode':
        return isFr
          ? 'En tant que personnel en mode Membre, vous devez détenir une adhésion active pour accéder aux fonctions payantes.'
          : 'As staff in Member mode, you must hold an active membership to access paid features.';
      default:
        return isFr
          ? 'L’adhésion Nina Purple est requise pour découvrir des profils, déverrouiller des connexions et envoyer des messages.'
          : 'Nina Purple membership is required to discover profiles, unlock connections, and send messages.';
    }
  })();

  const perks = isFr ? [
    'Découvrir des profils compatibles',
    'Déverrouiller des connexions avec vos Crédits d’Interaction',
    'Envoyer un message initial pour démarrer une conversation',
    'Révéler des photos (avantage Galactic ou crédits)',
    'Accéder à la Communauté et aux Événements',
  ] : [
    'Discover compatible profiles',
    'Unlock connections with your Interaction Credits',
    'Send an initial message to start a conversation',
    'Reveal photos (Galactic perk or credits)',
    'Access Community and Events',
  ];

  const showCheckout = !['suspended', 'restricted'].includes(status);

  return (
    <div className="px-4 py-10 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-[rgba(245,168,0,0.1)] border border-[rgba(245,168,0,0.25)] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#F5A800]" />
        </div>
        <h1 className="font-serif text-2xl text-foreground">{heading}</h1>
        <p className="text-foreground/50 text-sm leading-relaxed max-w-sm mx-auto">{subtext}</p>
      </div>

      {showCheckout && (
        <div className="glass-card-gold rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#F5A800]" />
            <h2 className="font-serif text-lg text-foreground">
              {isFr ? 'Adhésion Nina Purple' : 'Nina Purple Membership'}
            </h2>
          </div>
          <div className="text-center space-y-1">
            <div className="text-4xl font-serif font-bold text-[#F5A800]">$20<span className="text-base text-foreground/40 font-body font-normal">{isFr ? '/mois' : '/month'}</span></div>
            {foundingEligible && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.3)] text-[#F5A800] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> {isFr ? '3 mois gratuits — Membre Fondateur' : '3 months free — Founding Member'}
              </div>
            )}
          </div>
          <ul className="space-y-2">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/70 leading-relaxed">
                <span className="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(245,168,0,0.15)] text-[#F5A800]">
                  <Check className="w-3 h-3" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
          <Link to="/membership"
            className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.25)] flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            {status === 'payment_past_due'
              ? (isFr ? 'Mettre à jour le paiement' : 'Update payment')
              : foundingEligible
                ? (isFr ? 'Démarrer mes 3 mois gratuits' : 'Start my 3 free months')
                : (isFr ? 'Démarrer l’adhésion' : 'Start membership')}
          </Link>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 text-center">
        <Link to="/wallet" className="text-[#F5A800] text-sm hover:opacity-80 transition-opacity flex items-center gap-1.5">
          {isFr ? 'Voir mon portefeuille et mes crédits' : 'View my wallet and credits'} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link to="/profile" className="text-foreground/40 text-xs hover:text-foreground/60 transition-colors">
          {isFr ? 'Retour au profil' : 'Back to profile'}
        </Link>
      </div>
    </div>
  );
}