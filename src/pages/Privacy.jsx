import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { ChevronLeft } from 'lucide-react';

const LAST_UPDATED = 'June 11, 2026';
const LAST_UPDATED_FR = '11 juin 2026';

export default function Privacy() {
  const { lang } = useLang();

  if (lang === 'fr') return <PrivacyFR />;
  return <PrivacyEN />;
}

function PrivacyEN() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#F5A800] hover:opacity-80 mb-8">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-serif text-4xl mb-2">Privacy Policy</h1>
        <p className="text-sm opacity-50 mb-10">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Who We Are">
          <p>Nina Purple is a Wyoming Statutory Close Corporation (Incorporation ID: 2025-001581162), with a mailing address at 30 N Gould St Ste R, Sheridan, WY 82801, USA.</p>
          <p className="mt-2">Contact: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>

        <Section title="2. Scope & Applicable Laws">
          <p>This Privacy Policy applies to all users of Nina Purple globally. It is designed to comply with:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Wyoming Statutory Close Corporation Act</strong> (W.S. § 17-17-101 et seq.) and <strong>Wyoming Consumer Protection Act</strong> (W.S. § 40-12-101 et seq.)</li>
            <li><strong>COPPA</strong> (Children's Online Privacy Protection Act, USA — our platform is strictly 18+)</li>
            <li><strong>CAN-SPAM Act</strong> (USA) — governing commercial email communications</li>
            <li><strong>GDPR</strong> (EU General Data Protection Regulation 2016/679) — to the extent applicable for EU-based users</li>
          </ul>
        </Section>

        <Section title="3. Information We Collect">
          <p>We collect the following categories of personal information:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Identity & Profile:</strong> display name, date of birth, gender pronouns, sexual orientation, relationship status, city/country, photos, bio, dating archetype</li>
            <li><strong>Matching Data:</strong> answers to our 21 compatibility questions (values, lifestyle, relationship goals)</li>
            <li><strong>Communications:</strong> messages exchanged between users on the platform</li>
            <li><strong>Transactional Data:</strong> subscription tier, credit balance, purchase history (processed via Stripe — we do not store full card details)</li>
            <li><strong>Technical Data:</strong> IP address, device type, browser, access logs, language preference</li>
            <li><strong>Sensitive Data:</strong> sexual orientation and relationship information. This data is collected solely for matching purposes and is never sold or shared with third parties for advertising.</li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing (GDPR & PIPEDA)">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Consent:</strong> You provide explicit consent during onboarding for profile data and matching answers</li>
            <li><strong>Contract performance:</strong> Data necessary to deliver our services (messaging, matching, payments)</li>
            <li><strong>Legitimate interests:</strong> Platform security, fraud prevention, service improvement</li>
            <li><strong>Legal obligation:</strong> Compliance with applicable laws</li>
          </ul>
          <p className="mt-2">You may withdraw consent at any time by deleting your account. This will not affect the lawfulness of processing based on consent before withdrawal.</p>
        </Section>

        <Section title="5. How We Use Your Information">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>To create and manage your account</li>
            <li>To calculate compatibility scores and facilitate connections</li>
            <li>To process payments and manage credits via Stripe</li>
            <li>To send transactional emails and service notifications</li>
            <li>To enforce our community guidelines and prevent misuse</li>
            <li>To improve platform features and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="mt-2">We <strong>never</strong> sell your personal data to third parties. We do not use your data for behavioral advertising.</p>
        </Section>

        <Section title="6. Sensitive Personal Information">
          <p>Nina Purple collects sensitive data including sexual orientation and relationship preferences. Under GDPR Article 9 and Quebec Law 25, such data requires explicit consent. By completing onboarding, you provide explicit, informed consent for this data to be used exclusively for compatibility matching. You may request deletion at any time.</p>
        </Section>

        <Section title="7. Data Sharing & Third Parties">
          <p>We share data only as necessary with:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Stripe:</strong> Payment processing (Stripe's Privacy Policy applies to cardholder data)</li>
            <li><strong>Cloud infrastructure:</strong> Hosting and data storage (data stored in secure cloud environments)</li>
            <li><strong>Google Places API:</strong> City autocomplete (only query strings are sent; no personal data)</li>
            <li><strong>Legal authorities:</strong> When required by law, court order, or to protect rights and safety</li>
          </ul>
          <p className="mt-2">All third-party processors are bound by data processing agreements consistent with GDPR Article 28 and PIPEDA requirements.</p>
        </Section>

        <Section title="8. Data Retention">
          <p>We retain your personal data for as long as your account is active. Upon account deletion:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Profile and matching data: deleted within 30 days</li>
            <li>Messages: deleted within 30 days</li>
            <li>Transaction records: retained for 7 years to comply with financial and tax regulations (Wyoming and Canada)</li>
            <li>Anonymized analytics: may be retained indefinitely</li>
          </ul>
        </Section>

        <Section title="9. Your Rights">
          <p>Depending on your jurisdiction, you have the following rights:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your data</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Objection / Restriction:</strong> Object to or restrict certain processing</li>
            <li><strong>Withdraw Consent:</strong> At any time, without affecting prior lawful processing</li>
            <li><strong>Lodge a Complaint:</strong> With your applicable supervisory authority (e.g., Commission d'accès à l'information du Québec, EU Data Protection Authority)</li>
          </ul>
          <p className="mt-2">To exercise any right, email: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a>. We will respond within 30 days (PIPEDA) / 1 month (GDPR).</p>
        </Section>

        <Section title="10. Children's Privacy (COPPA)">
          <p>Nina Purple is strictly for users 18 years of age and older. We do not knowingly collect personal information from minors. Age verification is required during onboarding. If we become aware that a minor has created an account, we will immediately delete all associated data.</p>
        </Section>

        <Section title="11. Cookies & Tracking">
          <p>We use essential cookies and local storage for authentication, language preferences, and theme settings. We do not use third-party advertising or tracking cookies. You may clear cookies via your browser settings at any time without affecting core functionality.</p>
        </Section>

        <Section title="12. International Data Transfers">
          <p>Nina Purple operates internationally. Your data may be processed in Canada, the United States, and European Economic Area countries. For transfers from the EEA, we rely on Standard Contractual Clauses (SCCs) as per GDPR Chapter V. For Canadian users, data transfers comply with PIPEDA's accountability principle.</p>
        </Section>

        <Section title="13. Security">
          <p>We implement industry-standard security measures including TLS encryption for data in transit, encrypted storage, access controls, and regular security assessments. No system is 100% secure; in the event of a data breach, we will notify affected users and relevant authorities as required by applicable law (72 hours under GDPR, and per Quebec Law 25 requirements).</p>
        </Section>

        <Section title="14. Changes to This Policy">
          <p>We may update this Privacy Policy periodically. Material changes will be communicated via email or an in-app notice at least 30 days prior to taking effect. Continued use of the platform after that date constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="15. Contact & Data Controller">
          <p><strong>Nina Purple</strong><br />
          30 N Gould St Ste R, Sheridan, WY 82801, USA<br />
          Email: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>
      </div>
    </div>
  );
}

function PrivacyFR() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#F5A800] hover:opacity-80 mb-8">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-serif text-4xl mb-2">Politique de confidentialité</h1>
        <p className="text-sm opacity-50 mb-10">Dernière mise à jour : {LAST_UPDATED_FR}</p>

        <Section title="1. Qui sommes-nous ?">
          <p>Nina Purple est une société fermée de droit du Wyoming (Wyoming Statutory Close Corporation, ID d'incorporation : 2025-001581162), avec adresse postale au 30 N Gould St Ste R, Sheridan, WY 82801, États-Unis.</p>
          <p className="mt-2">Contact : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>

        <Section title="2. Champ d'application et lois applicables">
          <p>Cette politique s'applique à tous les utilisateurs de Nina Purple dans le monde et est conforme aux lois suivantes :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Wyoming Statutory Close Corporation Act</strong> (W.S. § 17-17-101 et suiv.) et <strong>Loi sur la protection des consommateurs du Wyoming</strong> (W.S. § 40-12-101 et suiv.)</li>
            <li><strong>COPPA</strong> (États-Unis) — notre plateforme est strictement réservée aux 18 ans et plus</li>
            <li><strong>CAN-SPAM Act</strong> (États-Unis) — communications par courriel</li>
            <li><strong>RGPD</strong> (UE 2016/679) — dans la mesure applicable aux utilisateurs de l'UE</li>
          </ul>
        </Section>

        <Section title="3. Informations collectées">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Identité et profil :</strong> nom d'affichage, date de naissance, pronoms, orientation sexuelle, statut relationnel, ville/pays, photos, biographie, archétype</li>
            <li><strong>Données de compatibilité :</strong> réponses aux 21 questions de compatibilité</li>
            <li><strong>Communications :</strong> messages échangés sur la plateforme</li>
            <li><strong>Données transactionnelles :</strong> abonnement, solde de crédits, historique d'achats (traitement via Stripe — nous ne stockons pas les données de carte complètes)</li>
            <li><strong>Données techniques :</strong> adresse IP, type d'appareil, navigateur, journaux d'accès, préférence de langue</li>
            <li><strong>Données sensibles :</strong> orientation sexuelle et préférences relationnelles — collectées uniquement à des fins de compatibilité, jamais vendues ni partagées à des fins publicitaires</li>
          </ul>
        </Section>

        <Section title="4. Base légale du traitement (RGPD & LPRPDE)">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Consentement explicite :</strong> fourni lors de l'inscription pour les données de profil et les réponses de compatibilité</li>
            <li><strong>Exécution d'un contrat :</strong> données nécessaires à la prestation des services</li>
            <li><strong>Intérêts légitimes :</strong> sécurité de la plateforme, prévention de la fraude</li>
            <li><strong>Obligation légale :</strong> conformité aux lois applicables</li>
          </ul>
          <p className="mt-2">Vous pouvez retirer votre consentement à tout moment en supprimant votre compte.</p>
        </Section>

        <Section title="5. Utilisation de vos informations">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Créer et gérer votre compte</li>
            <li>Calculer les scores de compatibilité et faciliter les connexions</li>
            <li>Traiter les paiements via Stripe</li>
            <li>Envoyer des notifications de service</li>
            <li>Appliquer nos lignes directrices communautaires</li>
            <li>Améliorer la plateforme</li>
            <li>Respecter les obligations légales</li>
          </ul>
          <p className="mt-2">Nous ne vendons <strong>jamais</strong> vos données personnelles à des tiers. Nous n'utilisons pas vos données à des fins de publicité comportementale.</p>
        </Section>

        <Section title="6. Données sensibles">
          <p>Conformément à l'article 9 du RGPD et à la Loi 25 du Québec, les données sensibles (orientation sexuelle, préférences relationnelles) nécessitent un consentement explicite. En complétant l'inscription, vous consentez expressément à ce que ces données soient utilisées exclusivement pour la compatibilité. Vous pouvez demander leur suppression à tout moment.</p>
        </Section>

        <Section title="7. Partage et tiers">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Stripe :</strong> traitement des paiements</li>
            <li><strong>Infrastructure cloud :</strong> hébergement et stockage sécurisé</li>
            <li><strong>Google Places API :</strong> autocomplétion de ville (aucune donnée personnelle transmise)</li>
            <li><strong>Autorités légales :</strong> uniquement si requis par la loi</li>
          </ul>
          <p className="mt-2">Tous les sous-traitants sont liés par des accords de traitement conformes à l'article 28 du RGPD et à la LPRPDE.</p>
        </Section>

        <Section title="8. Conservation des données">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Profil et données de compatibilité : supprimés dans les 30 jours suivant la fermeture du compte</li>
            <li>Messages : supprimés dans les 30 jours</li>
            <li>Dossiers de transaction : conservés 7 ans (obligations fiscales et financières)</li>
            <li>Analyses anonymisées : peuvent être conservées indéfiniment</li>
          </ul>
        </Section>

        <Section title="9. Vos droits">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Rectification :</strong> corriger des données inexactes</li>
            <li><strong>Effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Opposition / Limitation :</strong> s'opposer à certains traitements</li>
            <li><strong>Retrait du consentement :</strong> à tout moment</li>
            <li><strong>Plainte :</strong> auprès de la Commission d'accès à l'information du Québec ou d'une autorité de protection des données</li>
          </ul>
          <p className="mt-2">Pour exercer ces droits : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a>. Réponse sous 30 jours.</p>
        </Section>

        <Section title="10. Protection des mineurs (COPPA)">
          <p>Nina Purple est strictement réservé aux personnes de 18 ans et plus. Une vérification de l'âge est requise lors de l'inscription. Si nous apprenons qu'un mineur a créé un compte, nous supprimerons immédiatement toutes ses données.</p>
        </Section>

        <Section title="11. Transferts internationaux">
          <p>Vos données peuvent être traitées aux États-Unis et dans l'Espace économique européen. Pour les transferts depuis l'EEE, nous nous appuyons sur les clauses contractuelles types du RGPD.</p>
        </Section>

        <Section title="12. Sécurité">
          <p>Nous utilisons le chiffrement TLS, le stockage chiffré et des contrôles d'accès stricts. En cas d'incident de sécurité, nous notifierons les utilisateurs concernés dans les meilleurs délais.</p>
        </Section>

        <Section title="13. Modifications de cette politique">
          <p>Nous pouvons mettre à jour cette politique. Tout changement important sera communiqué par courriel ou notification dans l'application au moins 30 jours avant son entrée en vigueur.</p>
        </Section>

        <Section title="14. Contact et responsable du traitement">
          <p><strong>Nina Purple</strong><br />
          30 N Gould St Ste R, Sheridan, WY 82801, États-Unis<br />
          Courriel : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl text-[#F5A800] mb-3">{title}</h2>
      <div className="text-sm leading-relaxed opacity-80 space-y-1">{children}</div>
    </div>
  );
}