import React from 'react';
import { Loader2, Sparkles, Check, Calendar, ShieldCheck } from 'lucide-react';

// Founding Member offer shown at the onboarding membership step.
//   status='eligible' → the 3-month-free trial offer + "Start my 3 free months".
//   status='active'   → trial already active; show end date + Continue (no new checkout).
// Visually distinct from the standard plan (gold card, founding badge) but
// does not rely on color alone (badge text + checkmark list).
export default function FoundingMemberOffer({ status, trialEndsAt, lang, onStart, onContinue, loading }) {
  const isFr = lang === 'fr';

  const fmtDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(isFr ? 'fr-CA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return iso; }
  };

  if (status === 'active') {
    return (
      <div className="w-full space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.3)] text-[#F5A800] text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> {isFr ? 'Membre Fondateur' : 'Founding Member'}
          </div>
          <h2 className="font-serif text-3xl text-foreground">{isFr ? 'Votre essai est actif' : 'Your trial is active'}</h2>
          <p className="text-foreground/50 text-sm leading-relaxed">
            {isFr
              ? `Vos 3 mois gratuits sont actifs et se terminent le ${fmtDate(trialEndsAt)}. Ensuite, votre adhésion se renouvelle à 20 $/mois.`
              : `Your 3 free months are active and end on ${fmtDate(trialEndsAt)}. After that, your membership renews at $20/month.`}
          </p>
        </div>
        <div className="glass-card-gold rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#F5A800] shrink-0" />
          <p className="text-foreground/60 text-xs leading-relaxed">
            {isFr ? 'Aucune action requise. Vous pouvez annuler à tout moment depuis votre profil.' : 'No action required. You can cancel anytime from your profile.'}
          </p>
        </div>
        <button onClick={onContinue}
          className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.25)]">
          {isFr ? 'Continuer' : 'Continue'}
        </button>
      </div>
    );
  }

  // eligible (default)
  return (
    <div className="w-full space-y-5">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(245,168,0,0.12)] border border-[rgba(245,168,0,0.3)] text-[#F5A800] text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" /> {isFr ? 'Membre Fondateur' : 'Founding Member'}
        </div>
        <h2 className="font-serif text-3xl text-foreground">{isFr ? 'Nina Purple Membre Fondateur' : 'Nina Purple Founding Member'}</h2>
      </div>

      <div className="glass-card-gold rounded-2xl p-6 space-y-4">
        <p className="text-foreground/70 text-sm leading-relaxed text-center">
          {isFr
            ? 'Vos 3 premiers mois sont inclus comme avantage Membre Fondateur. Après votre essai, votre adhésion se renouvelle à 20 $/mois, sauf si vous annulez avant le renouvellement.'
            : 'Your first 3 months are included as a Founding Member benefit. After your trial, your membership renews at $20/month unless you cancel before renewal.'}
        </p>
        <div className="text-center space-y-1">
          <div className="text-4xl font-serif font-bold text-[#F5A800]">{isFr ? '3 mois gratuits' : '3 months free'}</div>
          <div className="text-foreground/50 text-sm">{isFr ? 'Ensuite 20 $/mois · annulez à tout moment' : 'Then $20/month · cancel anytime'}</div>
        </div>
        <ul className="space-y-2">
          {(isFr ? [
            'Accès complet à Nina Purple pendant 3 mois',
            "Aucun frais pendant la période d'essai",
            "Renouvellement automatique à 20 $/mois après l'essai",
            'Annulez à tout moment avant le renouvellement',
          ] : [
            'Full Nina Purple access for 3 months',
            'No charge during the trial period',
            'Auto-renews at $20/month after the trial',
            'Cancel anytime before renewal',
          ]).map((perk, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/70 leading-relaxed">
              <span className="mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(245,168,0,0.15)] text-[#F5A800]">
                <Check className="w-3 h-3" />
              </span>
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onStart} disabled={loading}
        className="w-full py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_30px_rgba(245,168,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {isFr ? 'Démarrage…' : 'Starting…'}</>
          : <>{isFr ? 'Démarrer mes 3 mois gratuits' : 'Start my 3 free months'}</>}
      </button>
      <p className="text-foreground/30 text-xs text-center flex items-center justify-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {isFr ? "Une méthode de paiement est requise pour activer l'essai." : 'A payment method is required to activate the trial.'}
      </p>
    </div>
  );
}