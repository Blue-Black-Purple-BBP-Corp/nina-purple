import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Clock, Gift, Shield, Sparkles, Heart, Users, RefreshCw, MessageSquare, CheckCircle2, DollarSign, Calendar, Star } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';

const EARN_ACTIONS = [
  { icon: CheckCircle2, color: '#F5A800', en: 'Profile Completion', fr: 'Complétion du profil', desc_en: 'Finish your compatibility profile and photos.', desc_fr: 'Terminez votre profil de compatibilité et vos photos.' },
  { icon: Shield, color: '#7B2FBE', en: 'Community Orientation', fr: 'Orientation communautaire', desc_en: 'Acknowledge the community orientation.', desc_fr: 'Acceptez l\'orientation communautaire.' },
  { icon: Heart, color: '#F5A800', en: 'Mutual "We\'ve met"', fr: '« On s\'est rencontrés »', desc_en: 'Both members confirm an in-person meetup.', desc_fr: 'Les deux membres confirment une rencontre en personne.' },
  { icon: Users, color: '#7B2FBE', en: 'Qualified Referral', fr: 'Parrainage qualifié', desc_en: 'Invite someone who becomes a paying member.', desc_fr: 'Invitez quelqu\'un qui devient membre payant.' },
  { icon: Calendar, color: '#F5A800', en: 'Event Attendance', fr: 'Présence à un événement', desc_en: 'Attend a Nina Purple community event.', desc_fr: 'Participez à un événement communautaire Nina Purple.' },
  { icon: Sparkles, color: '#7B2FBE', en: 'Experience Attendance', fr: 'Présence à une Expérience', desc_en: 'Attend a Nina Purple Experience retreat.', desc_fr: 'Participez à une retraite Expérience Nina Purple.' },
  { icon: RefreshCw, color: '#F5A800', en: 'Profile Refresh', fr: 'Mise à jour du profil', desc_en: 'Keep your profile current over time.', desc_fr: 'Maintenez votre profil à jour au fil du temps.' },
  { icon: MessageSquare, color: '#7B2FBE', en: 'Community Contribution', fr: 'Contribution communautaire', desc_en: 'Contribute meaningfully to community rooms.', desc_fr: 'Contribuez de manière significative aux salons.' },
  { icon: Star, color: '#F5A800', en: 'Social Proof', fr: 'Preuve sociale', desc_en: 'Verified positive recognition from peers.', desc_fr: 'Reconnaissance positive vérifiée des pairs.' },
];

const REDEEM_OPTIONS = [
  { icon: Heart, color: '#F5A800', en: 'Connection Discounts', fr: 'Remises sur connexion', desc_en: 'Offset the cost of unlocking and messaging compatible profiles.', desc_fr: 'Réduisez le coût de déverrouillage et de messagerie.' },
  { icon: Calendar, color: '#7B2FBE', en: 'Event Ticket Discounts', fr: 'Remises sur billets d\'événement', desc_en: 'Apply BBP toward community event tickets.', desc_fr: 'Appliquez les BBP aux billets d\'événements.' },
  { icon: Sparkles, color: '#F5A800', en: 'Experience Booking Discounts', fr: 'Remises sur Expériences', desc_en: 'Reduce the cost of Nina Purple Experience retreats.', desc_fr: 'Réduisez le coût des retraites Expérience Nina Purple.' },
  { icon: Star, color: '#7B2FBE', en: 'Waitlist Priority', fr: 'Priorité sur liste d\'attente', desc_en: 'Gain priority access to limited-capacity experiences.', desc_fr: 'Accès prioritaire aux Expériences à capacité limitée.' },
  { icon: Gift, color: '#F5A800', en: 'Subscription Perks', fr: 'Avantages d\'abonnement', desc_en: 'Apply BBP toward membership and add-on costs.', desc_fr: 'Appliquez les BBP aux coûts d\'adhésion et d\'extensions.' },
];

export default function BBPRewards() {
  const { lang } = useLang();
  const isFr = lang === 'fr';

  return (
    <div className="min-h-screen bg-[#0B0510]">
      {/* Top toggles */}
      <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Back link */}
      <div className="fixed top-4 left-4 z-[100]">
        <Link to="/" className="flex items-center gap-1.5 text-[#F0E6FF]/40 hover:text-[#F0E6FF] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          {isFr ? 'Accueil' : 'Home'}
        </Link>
      </div>

      {/* Hero */}
      <section className="px-6 pt-24 pb-12 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="w-16 h-16 rounded-2xl glass-card-gold flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8 text-[#F5A800]" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-[#F0E6FF] mb-4">
            {isFr ? 'Programme BBP Rewards' : 'BBP Rewards Program'}
          </h1>
          <p className="text-[#F0E6FF]/60 text-lg leading-relaxed max-w-xl mx-auto">
            {isFr
              ? 'Better Being Points récompensent les actions qui rendent Nina Purple plus sain, plus sûr et plus connecté. Chaque point vaut 1 $ USD applicable aux avantages Nina Purple éligibles.'
              : 'Better Being Points reward the actions that make Nina Purple healthier, safer, and more connected. Each point is worth $1 USD toward eligible Nina Purple benefits.'}
          </p>
        </motion.div>
      </section>

      {/* Value proposition */}
      <section className="px-6 py-8 max-w-3xl mx-auto">
        <div className="glass-card-gold rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(245,168,0,0.12)] flex items-center justify-center shrink-0">
            <DollarSign className="w-8 h-8 text-[#F5A800]" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-serif text-2xl text-[#F0E6FF] mb-2">
              {isFr ? '1 BBP = 1 $ USD' : '1 BBP = $1 USD'}
            </h2>
            <p className="text-[#F0E6FF]/60 text-sm leading-relaxed">
              {isFr
                ? 'Les points BBP ne sont pas de l\'argent. Ils ne peuvent pas être transférés ni échangés contre des espèces. Ils sont émis côté serveur uniquement, avec un registre append-only pour garantir l\'intégrité.'
                : 'BBP points are not cash. They cannot be transferred or redeemed for cash. They are issued server-side only, with an append-only ledger to guarantee integrity.'}
            </p>
          </div>
        </div>
      </section>

      {/* How you earn */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-[#F0E6FF] mb-3">
            {isFr ? 'Comment vous gagnez' : 'How you earn'}
          </h2>
          <p className="text-[#F0E6FF]/50 text-sm max-w-lg mx-auto">
            {isFr
              ? 'Chaque action ci-dessous déclenche une attribution gérée par des règles, avec des plafonds et un budget pour assurer l\'équité.'
              : 'Each action below triggers a rule-governed award, with caps and budgets to ensure fairness.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EARN_ACTIONS.map((action, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-5 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${action.color}18`, border: `1px solid ${action.color}30` }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <div>
                <h3 className="font-serif text-base text-[#F0E6FF] mb-1">
                  {isFr ? action.fr : action.en}
                </h3>
                <p className="text-[#F0E6FF]/50 text-xs leading-relaxed">
                  {isFr ? action.desc_fr : action.desc_en}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works — timeline */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-[#F0E6FF] mb-3">
            {isFr ? 'Comment ça fonctionne' : 'How it works'}
          </h2>
        </motion.div>

        <div className="space-y-4">
          {[
            { icon: Clock, color: '#7B2FBE', title_en: 'Pending', title_fr: 'En attente', desc_en: 'Some awards enter a pending period (e.g. 72 hours for meetup confirmations, 30 days for referrals) for safety and fraud review.', desc_fr: 'Certaines récompenses entrent dans une période d\'attente (ex. 72h pour les rencontres, 30 jours pour les parrainages) pour révision de sécurité et de fraude.' },
            { icon: CheckCircle2, color: '#F5A800', title_en: 'Available', title_fr: 'Disponible', desc_en: 'Once the review period passes, points become available in your wallet and can be redeemed immediately.', desc_fr: 'Une fois la période de révision passée, les points deviennent disponibles dans votre portefeuille et peuvent être échangés immédiatement.' },
            { icon: Clock, color: '#7B2FBE', title_en: 'Expires after 12 months', title_fr: 'Expire après 12 mois', desc_en: 'Available points expire 12 months after their availability date. Pending points do not expire while pending.', desc_fr: 'Les points disponibles expirent 12 mois après leur date de disponibilité. Les points en attente n\'expirent pas tant qu\'ils sont en attente.' },
          ].map((step, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}>
                <step.icon className="w-5 h-5" style={{ color: step.color }} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#F0E6FF] mb-1">
                  {isFr ? step.title_fr : step.title_en}
                </h3>
                <p className="text-[#F0E6FF]/55 text-sm leading-relaxed">
                  {isFr ? step.desc_fr : step.desc_en}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What you can redeem */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-[#F0E6FF] mb-3">
            {isFr ? 'Ce que vous pouvez échanger' : 'What you can redeem'}
          </h2>
          <p className="text-[#F0E6FF]/50 text-sm max-w-lg mx-auto">
            {isFr
              ? 'Le catalogue d\'échange est géré par le staff et peut évoluer. Les conditions exactes de chaque avantage sont affichées au moment de l\'échange.'
              : 'The redemption catalog is staff-managed and may evolve. Exact terms for each benefit are shown at redemption time.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REDEEM_OPTIONS.map((opt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-5 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${opt.color}18`, border: `1px solid ${opt.color}30` }}>
                <opt.icon className="w-5 h-5" style={{ color: opt.color }} />
              </div>
              <div>
                <h3 className="font-serif text-base text-[#F0E6FF] mb-1">
                  {isFr ? opt.fr : opt.en}
                </h3>
                <p className="text-[#F0E6FF]/50 text-xs leading-relaxed">
                  {isFr ? opt.desc_fr : opt.desc_en}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Value guarantee */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <div className="glass-card-orchid rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#7B2FBE]" />
            <h2 className="font-serif text-2xl text-[#F0E6FF]">
              {isFr ? 'Garantie de valeur' : 'Value guarantee'}
            </h2>
          </div>
          <p className="text-[#F0E6FF]/60 text-sm leading-relaxed mb-4">
            {isFr
              ? 'Les correspondances sont offertes selon la disponibilité des candidats. Lorsqu\'aucune correspondance ne vous est proposée au cours d\'un mois, une part croissante de la valeur de votre abonnement est convertie en points BBP.'
              : 'Matches are offered subject to candidate availability. When no match is offered to you in a given month, an increasing share of your membership value is converted into BBP points.'}
          </p>
          <p className="text-[#F0E6FF]/60 text-sm leading-relaxed">
            {isFr
              ? 'Les points BBP peuvent être utilisés pour les interactions sur la plateforme ou pour les Expériences Nina Purple.'
              : 'BBP points can be used for platform interactions or toward Nina Purple Experiences.'}
          </p>
        </div>
      </section>

      {/* Rules */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-[#F5A800]" />
            <h2 className="font-serif text-xl text-[#F0E6FF]">
              {isFr ? 'Règles des points BBP' : 'BBP Points Rules'}
            </h2>
          </div>
          <div className="space-y-2 text-sm text-[#F0E6FF]/60 leading-relaxed">
            <p>• {isFr ? '1 BBP = 1 $ USD de valeur d\'avantage membre.' : '1 BBP = $1 USD in member benefit value.'}</p>
            <p>• {isFr ? 'Les points ne sont pas de l\'argent et ne peuvent pas être transférés.' : 'Points are not cash and cannot be transferred.'}</p>
            <p>• {isFr ? 'Émis côté serveur uniquement avec un registre append-only.' : 'Issued server-side only with an append-only ledger.'}</p>
            <p>• {isFr ? 'Les points disponibles expirent 12 mois après leur date de disponibilité.' : 'Available points expire 12 months after their availability date.'}</p>
            <p>• {isFr ? 'Les plafonds par membre et les budgets mensuels s\'appliquent.' : 'Per-member caps and monthly budgets apply.'}</p>
            <p>• {isFr ? 'Les récompenses peuvent être suspendues ou inversées en cas de révision de sécurité.' : 'Awards may be held or reversed during safety review.'}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <Link to="/onboarding"
          className="inline-block px-10 py-4 bg-[#F5A800] text-[#0B0510] rounded-full font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_40px_rgba(245,168,0,0.3)]">
          {isFr ? 'Rejoindre Nina Purple' : 'Join Nina Purple'}
        </Link>
        <p className="text-[#F0E6FF]/30 text-xs mt-6">
          {isFr ? '© 2026 Nina Purple' : '© 2026 Nina Purple'}
        </p>
      </section>
    </div>
  );
}