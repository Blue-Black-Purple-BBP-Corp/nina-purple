import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { ChevronLeft } from 'lucide-react';

const LAST_UPDATED = 'August 30, 2026';
const LAST_UPDATED_FR = '30 août 2026';

export default function Privacy() {
  const { lang } = useLang();

  if (lang === 'fr') return <PrivacyFR />;
  return <PrivacyEN />;
}

function PrivacyEN() {
  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#F5A800] hover:opacity-80 mb-8">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-serif text-4xl mb-2 text-foreground">Privacy Policy</h1>
        <p className="text-sm text-foreground/50 mb-10">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Who We Are">
          <p>Nina Purple is a Wyoming Statutory Close Corporation (Incorporation ID: 2025-001581162), with a mailing address at 30 N Gould St Ste R, Sheridan, WY 82801, USA.</p>
          <p className="mt-2">Contact: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>

        <Section title="2. Scope & Applicable Laws">
          <p>This Privacy Policy applies to all users of Nina Purple globally. It is designed to comply with:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Wyoming Statutory Close Corporation Act</strong> (W.S. § 17-17-101 et seq.) and <strong>Wyoming Consumer Protection Act</strong> (W.S. § 40-12-101 et seq.)</li>
            <li><strong>COPPA</strong> (Children's Online Privacy Protection Act, USA — our platform is strictly 18+)</li>
            <li><strong>CAN-SPAM Act</strong> (USA), governing commercial email communications</li>
            <li><strong>GDPR</strong> (EU General Data Protection Regulation 2016/679), for users located in the European Economic Area or United Kingdom</li>
            <li><strong>PIPEDA</strong> (Personal Information Protection and Electronic Documents Act, Canada), for users located in Canada outside Quebec</li>
            <li><strong>Quebec Law 25</strong> (Act Respecting the Protection of Personal Information in the Private Sector), for users located in Quebec</li>
            <li>Applicable <strong>US state privacy laws</strong>, including comprehensive state privacy statutes and state-specific biometric privacy laws such as the <strong>Illinois Biometric Information Privacy Act (BIPA)</strong>, the <strong>Texas Capture or Use of Biometric Identifier Act (CUBI)</strong>, and <strong>Washington's biometric privacy law</strong>, for users located in those states</li>
          </ul>
        </Section>

        <Section title="3. Information We Collect">
          <p>We collect the following categories of personal information:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Identity & Profile:</strong> display name, date of birth, gender pronouns, sexual orientation, relationship status, city/country, photos, bio, dating archetype</li>
            <li><strong>Matching Data:</strong> answers to our 21 compatibility questions (values, lifestyle, relationship goals)</li>
            <li><strong>Biometric Data:</strong> facial geometry data derived from a government-issued ID photo and a live selfie/video, collected solely to verify your identity during onboarding, processed through a third-party identity-verification vendor</li>
            <li><strong>Verification Data:</strong> your identity-verification status (e.g., Call-Verified, Fully Verified), the outcome of any peer-verification call or in-person meetup attestation submitted about you, and limited profile information shared with a verifying member solely for the purpose of conducting that verification</li>
            <li><strong>Communications:</strong> messages exchanged between users on the platform</li>
            <li><strong>Transactional Data:</strong> subscription tier, credit balance, purchase history (processed via Stripe; we do not store full card details)</li>
            <li><strong>Technical Data:</strong> IP address, device type, browser, access logs, language preference</li>
            <li><strong>Sensitive Data:</strong> sexual orientation, relationship information, and biometric data. This data is collected solely for matching and identity-verification purposes and is never sold or shared with third parties for advertising.</li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing (GDPR, PIPEDA & Quebec Law 25)">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Consent:</strong> You provide explicit consent during onboarding for profile data, matching answers, and biometric data collection</li>
            <li><strong>Contract performance:</strong> Data necessary to deliver our services (messaging, matching, payments, identity verification)</li>
            <li><strong>Legitimate interests:</strong> Platform security, fraud prevention, service improvement</li>
            <li><strong>Legal obligation:</strong> Compliance with applicable laws</li>
          </ul>
          <p className="mt-2">You may withdraw consent at any time by deleting your account. This will not affect the lawfulness of processing based on consent before withdrawal.</p>
        </Section>

        <Section title="5. How We Use Your Information">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>To create and manage your account</li>
            <li>To calculate compatibility scores and facilitate connections</li>
            <li>To verify your identity and maintain the integrity of the verification program described in Section 7a</li>
            <li>To process payments and manage credits via Stripe</li>
            <li>To send transactional emails and service notifications</li>
            <li>To enforce our community guidelines and prevent misuse</li>
            <li>To improve platform features and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="mt-2">We <strong>never</strong> sell your personal data to third parties. We do not use your data for behavioral advertising.</p>
        </Section>

        <Section title="6. Sensitive Personal Information">
          <p>Nina Purple collects sensitive data including sexual orientation, relationship preferences, and biometric data. Under GDPR Article 9 and Quebec Law 25, such data requires explicit consent. By completing onboarding, you provide explicit, informed consent for this data to be used exclusively for compatibility matching and identity verification. You may request deletion at any time, subject to Section 8's retention terms for biometric data specifically.</p>
        </Section>

        <Section title="6a. Biometric Data Disclosure">
          <p>As part of identity verification, Nina Purple collects and processes facial geometry data through an automated, third-party identity-verification vendor.</p>
          <p className="mt-2">For users located in <strong>Illinois</strong>, this collection is subject to the Illinois Biometric Information Privacy Act (BIPA). In compliance with BIPA, Nina Purple:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>obtains your written consent before collecting any biometric identifier or biometric information;</li>
            <li>maintains a publicly available written policy establishing a retention schedule and guidelines for permanently destroying biometric data;</li>
            <li>does not sell, lease, trade, or otherwise profit from your biometric data; and</li>
            <li>applies the same reasonable standard of care to biometric data as it applies to other confidential and sensitive information.</li>
          </ul>
          <p className="mt-2">For users located in <strong>Texas</strong> and <strong>Washington</strong>, similar consent, use-limitation, and security protections apply under those states' respective biometric privacy laws.</p>
          <p className="mt-2">Biometric data is retained only for as long as necessary to complete identity verification and is permanently deleted in accordance with our retention schedule (see Section 8), and in no case later than three years after your last interaction with Nina Purple, whichever occurs first.</p>
        </Section>

        <Section title="7. Data Sharing & Third Parties">
          <p>We do not sell your personal data. We share it only when strictly necessary to operate the platform, with trusted payment processors, hosting providers, mapping services, and the identity-verification vendor described in Section 6a. We may also disclose data when required by law or to protect the safety of our users.</p>
          <p className="mt-2">All third-party service providers are contractually bound to protect your data and may only use it for the purposes we specify.</p>
        </Section>

        <Section title="7a. Identity Verification Program">
          <p>Nina Purple operates a multi-step identity verification program consisting of:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-3">
            <li><strong>Automated verification:</strong> an ID document and liveness check performed by a third-party vendor (see Section 6a).</li>
            <li><strong>Peer verification:</strong> a live call between you and another verified Nina Purple member in your area, who confirms basic identity details on our behalf. Before this call occurs, the verifying member must agree to a Confidentiality Agreement prohibiting them from storing, forwarding, or disclosing any information shared during the call beyond a simple pass/fail outcome recorded in our system. Verifying members never receive your government ID, your sensitive matching data (including sexual orientation or relationship preferences), or any information beyond what is strictly necessary to conduct the verification.</li>
            <li><strong>In-person meetup attestation:</strong> if you update your relationship status with another member to "We've met," either of you may be prompted to submit a short attestation confirming that the meeting occurred and that the other person's profile appeared consistent with who they met.</li>
          </ol>
          <p className="mt-3">Submitting an attestation about another member is voluntary. If you decline to submit one, this has no effect on your own account or your own access to the platform.</p>
          <p className="mt-2">However, reaching <strong>"Fully Verified"</strong> status requires that three separate members submit a valid attestation about you. Whether and when you reach that status therefore depends in part on other members' voluntary participation, not solely on your own actions. Baseline access to Nina Purple's core features does not require Fully Verified status. Certain visibility features, trust badges, or event access may be limited to Fully Verified members; where this applies, it will be clearly indicated in the relevant feature.</p>
          <p className="mt-2">Verification status (e.g., "Call-Verified," "Fully Verified") may be visible to other members as a trust indicator. The underlying verification details — call transcripts, attestation notes, and verifier identity — are not shared with the member being verified or with other members, and are accessible only to our Trust &amp; Safety team.</p>
        </Section>

        <Section title="8. Data Retention">
          <p>We retain your personal data for as long as your account is active. Upon account deletion:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Profile and matching data: deleted within 30 days</li>
            <li>Messages: deleted within 30 days</li>
            <li><strong>Biometric data: deleted immediately upon completion of identity verification, or no later than 3 years after your last platform interaction, whichever is earlier</strong></li>
            <li>Verification call records and attestation notes: deleted within 30 days of account deletion, except where retained longer as evidence in an active Trust &amp; Safety investigation</li>
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
            <li><strong>Biometric-specific rights (Illinois, Texas, Washington residents):</strong> Request confirmation of what biometric data we hold about you and request its deletion in accordance with our published retention schedule</li>
            <li><strong>Lodge a Complaint:</strong> With your applicable supervisory authority (e.g., Commission d'accès à l'information du Québec, an EU Data Protection Authority, or the Office of the Privacy Commissioner of Canada)</li>
          </ul>
          <p className="mt-2">To exercise any right, email: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a>. We will respond within 30 days (PIPEDA/Law 25) or 1 month (GDPR).</p>
        </Section>

        <Section title="10. Children's Privacy (COPPA)">
          <p>Nina Purple is strictly for users 18 years of age and older. We do not knowingly collect personal information from minors. Age verification is required during onboarding, including as part of the identity verification program described in Section 7a. If we become aware that a minor has created an account, we will immediately delete all associated data, including any biometric data collected.</p>
        </Section>

        <Section title="11. Cookies & Tracking">
          <p>We use essential cookies and local storage for authentication, language preferences, and theme settings. We do not use third-party advertising or tracking cookies. You may clear cookies via your browser settings at any time without affecting core functionality.</p>
        </Section>

        <Section title="12. Governing Law & International Data Transfers">
          <p>This Privacy Policy, and any dispute arising from its interpretation or enforcement as a matter of contract, is governed by the laws of the State of Wyoming, USA, and applicable federal U.S. law, without regard to conflict-of-law principles. This choice of law governs our contractual relationship with you and the resolution of contract-based disputes; it does not limit or replace the data protection rights described below that apply to you based on where you live.</p>
          <p className="mt-2">By using Nina Purple, you acknowledge that your data may be processed in the United States. Depending on where you are located, you are entitled to the following additional protections:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>If you are located in the European Economic Area or United Kingdom:</strong> the rights and protections described under GDPR apply to our processing of your personal data, including the legal bases described in Section 4 and the rights described in Section 9.</li>
            <li><strong>If you are located in Canada outside Quebec:</strong> PIPEDA governs our handling of your personal information, including your right to access and correct your data and to lodge a complaint with the Office of the Privacy Commissioner of Canada.</li>
            <li><strong>If you are located in Quebec:</strong> Quebec Law 25 governs our handling of your personal information, including the consent standards described in Section 6 and your right to lodge a complaint with the Commission d'accès à l'information du Québec.</li>
            <li><strong>If you are located in Illinois, Texas, or Washington:</strong> the biometric-specific protections described in Section 6a apply to our collection and use of your biometric data.</li>
            <li><strong>If you are located in a US state with a comprehensive consumer privacy law:</strong> the rights afforded to you under that state's law apply in addition to the rights described in Section 9.</li>
          </ul>
        </Section>

        <Section title="13. Security">
          <p>We implement industry-standard security measures including TLS encryption for data in transit, encrypted storage, access controls, and regular security assessments. No system is 100% secure; in the event of a data breach, we will notify affected users and relevant authorities as required by applicable law, including within 72 hours under GDPR, per Quebec Law 25 requirements, and per applicable US state breach-notification laws (including biometric-specific notification requirements where applicable).</p>
        </Section>

        <Section title="14. Changes to This Policy">
          <p>We may update this Privacy Policy periodically. Material changes will be communicated via email or an in-app notice at least 30 days prior to taking effect. Continued use of the platform after that date constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="15. Contact & Data Controller">
          <p><strong>Nina Purple</strong><br />
          30 N Gould St Ste R, Sheridan, WY 82801, USA<br />
          Email: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
          <p className="mt-2">We use essential cookies for authentication, language, and theme. No advertising or third-party tracking.</p>
        </Section>
      </div>
    </div>
  );
}

function PrivacyFR() {
  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#F5A800] hover:opacity-80 mb-8">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-serif text-4xl mb-2 text-foreground">Politique de confidentialité</h1>
        <p className="text-sm text-foreground/50 mb-10">Dernière mise à jour : {LAST_UPDATED_FR}</p>

        <Section title="1. Qui sommes-nous ?">
          <p>Nina Purple est une société fermée de droit du Wyoming (Wyoming Statutory Close Corporation, ID d'incorporation : 2025-001581162), avec adresse postale au 30 N Gould St Ste R, Sheridan, WY 82801, États-Unis.</p>
          <p className="mt-2">Contact : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>

        <Section title="2. Champ d'application et lois applicables">
          <p>Cette politique s'applique à tous les utilisateurs de Nina Purple dans le monde. Elle est conçue pour être conforme aux lois suivantes :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Wyoming Statutory Close Corporation Act</strong> (W.S. § 17-17-101 et suiv.) et <strong>Loi sur la protection des consommateurs du Wyoming</strong> (W.S. § 40-12-101 et suiv.)</li>
            <li><strong>COPPA</strong> (Children's Online Privacy Protection Act, États-Unis — notre plateforme est strictement réservée aux 18 ans et plus)</li>
            <li><strong>CAN-SPAM Act</strong> (États-Unis), régissant les communications par courriel commercial</li>
            <li><strong>RGPD</strong> (Règlement général sur la protection des données UE 2016/679), pour les utilisateurs situés dans l'Espace économique européen ou au Royaume-Uni</li>
            <li><strong>PIPEDA</strong> (Loi sur la protection des renseignements personnels et les documents électroniques, Canada), pour les utilisateurs situés au Canada hors Québec</li>
            <li><strong>Loi 25 du Québec</strong> (Loi concernant la protection des renseignements personnels dans le secteur privé), pour les utilisateurs situés au Québec</li>
            <li><strong>Lois sur la confidentialité des États américains</strong> applicables, y compris les lois étatiques globales de protection de la vie privée et les lois spécifiques aux États en matière de données biométriques, telles que l'<strong>Illinois Biometric Information Privacy Act (BIPA)</strong>, le <strong>Texas Capture or Use of Biometric Identifier Act (CUBI)</strong> et la <strong>loi sur la confidentialité biométrique de l'État de Washington</strong>, pour les utilisateurs situés dans ces États</li>
          </ul>
        </Section>

        <Section title="3. Informations que nous collectons">
          <p>Nous collectons les catégories suivantes de renseignements personnels :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Identité et profil :</strong> nom d'affichage, date de naissance, pronoms, orientation sexuelle, statut relationnel, ville/pays, photos, biographie, archétype de rencontre</li>
            <li><strong>Données de compatibilité :</strong> réponses à nos 21 questions de compatibilité (valeurs, mode de vie, objectifs relationnels)</li>
            <li><strong>Données biométriques :</strong> données de géométrie faciale dérivées d'une photo de pièce d'identité gouvernementale et d'un selfie/vidéo en direct, collectées uniquement pour vérifier votre identité lors de l'inscription, traitées par l'intermédiaire d'un fournisseur tiers de vérification d'identité</li>
            <li><strong>Données de vérification :</strong> votre statut de vérification d'identité (p. ex. Vérifié par appel, Entièrement vérifié), le résultat de tout appel de vérification par les pairs ou de toute attestation de rencontre en personne soumise à votre sujet, et des informations de profil limitées partagées avec un membre vérificateur uniquement aux fins de cette vérification</li>
            <li><strong>Communications :</strong> messages échangés entre les utilisateurs sur la plateforme</li>
            <li><strong>Données transactionnelles :</strong> niveau d'abonnement, solde de crédits, historique d'achats (traitement via Stripe ; nous ne stockons pas les données de carte complètes)</li>
            <li><strong>Données techniques :</strong> adresse IP, type d'appareil, navigateur, journaux d'accès, préférence de langue</li>
            <li><strong>Données sensibles :</strong> orientation sexuelle, informations relationnelles et données biométriques. Ces données sont collectées uniquement à des fins de compatibilité et de vérification d'identité, et ne sont jamais vendues ni partagées avec des tiers à des fins publicitaires.</li>
          </ul>
        </Section>

        <Section title="4. Base légale du traitement (RGPD, PIPEDA et Loi 25 du Québec)">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Consentement :</strong> Vous donnez un consentement explicite lors de l'inscription pour les données de profil, les réponses de compatibilité et la collecte de données biométriques</li>
            <li><strong>Exécution d'un contrat :</strong> Données nécessaires à la prestation de nos services (messagerie, compatibilité, paiements, vérification d'identité)</li>
            <li><strong>Intérêts légitimes :</strong> Sécurité de la plateforme, prévention de la fraude, amélioration du service</li>
            <li><strong>Obligation légale :</strong> Conformité aux lois applicables</li>
          </ul>
          <p className="mt-2">Vous pouvez retirer votre consentement à tout moment en supprimant votre compte. Cela n'affectera pas la licéité du traitement fondé sur le consentement antérieur au retrait.</p>
        </Section>

        <Section title="5. Utilisation de vos informations">
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Créer et gérer votre compte</li>
            <li>Calculer les scores de compatibilité et faciliter les connexions</li>
            <li>Vérifier votre identité et maintenir l'intégrité du programme de vérification décrit à la Section 7a</li>
            <li>Traiter les paiements et gérer les crédits via Stripe</li>
            <li>Envoyer des courriels transactionnels et des notifications de service</li>
            <li>Faire respecter nos lignes directrices communautaires et prévenir les abus</li>
            <li>Améliorer les fonctionnalités de la plateforme et l'expérience utilisateur</li>
            <li>Respecter les obligations légales</li>
          </ul>
          <p className="mt-2">Nous ne vendons <strong>jamais</strong> vos données personnelles à des tiers. Nous n'utilisons pas vos données à des fins de publicité comportementale.</p>
        </Section>

        <Section title="6. Données personnelles sensibles">
          <p>Nina Purple collecte des données sensibles, notamment l'orientation sexuelle, les préférences relationnelles et les données biométriques. Conformément à l'article 9 du RGPD et à la Loi 25 du Québec, de telles données nécessitent un consentement explicite. En complétant l'inscription, vous donnez un consentement explicite et éclairé pour que ces données soient utilisées exclusivement à des fins de compatibilité et de vérification d'identité. Vous pouvez demander leur suppression à tout moment, sous réserve des conditions de conservation de la Section 8 pour les données biométriques.</p>
        </Section>

        <Section title="6a. Divulgation des données biométriques">
          <p>Dans le cadre de la vérification d'identité, Nina Purple collecte et traite des données de géométrie faciale par l'intermédiaire d'un fournisseur tiers automatisé de vérification d'identité.</p>
          <p className="mt-2">Pour les utilisateurs situés dans l'<strong>Illinois</strong>, cette collecte est soumise à l'Illinois Biometric Information Privacy Act (BIPA). Conformément à la BIPA, Nina Purple :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>obtient votre consentement écrit avant de collecter tout identifiant ou renseignement biométrique ;</li>
            <li>maintient une politique écrite publiquement disponible établissant un calendrier de conservation et des directives pour la destruction permanente des données biométriques ;</li>
            <li>ne vend, ne loue, n'échange ni ne tire de profit de vos données biométriques ; et</li>
            <li>applique la même norme de diligence raisonnable aux données biométriques qu'aux autres informations confidentielles et sensibles.</li>
          </ul>
          <p className="mt-2">Pour les utilisateurs situés au <strong>Texas</strong> et dans l'État de <strong>Washington</strong>, des protections similaires en matière de consentement, de limitation d'utilisation et de sécurité s'appliquent en vertu des lois respectives de ces États sur la confidentialité biométrique.</p>
          <p className="mt-2">Les données biométriques sont conservées uniquement aussi longtemps que nécessaire pour compléter la vérification d'identité et sont définitivement supprimées conformément à notre calendrier de conservation (voir Section 8), et en aucun cas plus de trois ans après votre dernière interaction avec Nina Purple, la première de ces échéances prévalant.</p>
        </Section>

        <Section title="7. Partage et tiers">
          <p>Nous ne vendons pas vos données personnelles. Nous les partageons uniquement lorsque c'est strictement nécessaire au fonctionnement de la plateforme, avec des prestataires de paiement, d'hébergement, de cartographie et le fournisseur de vérification d'identité décrit à la Section 6a. Nous pouvons également divulguer des données lorsque la loi l'exige ou pour protéger la sécurité de nos utilisateurs.</p>
          <p className="mt-2">Tous nos prestataires tiers sont contractuellement tenus de protéger vos données et ne peuvent les utiliser qu'aux fins que nous définissons.</p>
        </Section>

        <Section title="7a. Programme de vérification d'identité">
          <p>Nina Purple exploite un programme de vérification d'identité en plusieurs étapes comprenant :</p>
          <ol className="list-decimal ml-5 mt-2 space-y-3">
            <li><strong>Vérification automatisée :</strong> une vérification de pièce d'identité et de vivacité effectuée par un fournisseur tiers (voir Section 6a).</li>
            <li><strong>Vérification par les pairs :</strong> un appel en direct entre vous et un autre membre vérifié de Nina Purple dans votre région, qui confirme les détails d'identité de base en notre nom. Avant cet appel, le membre vérificateur doit accepter un accord de confidentialité l'interdisant de stocker, transférer ou divulguer toute information partagée pendant l'appel au-delà d'un simple résultat réussite/échec enregistré dans notre système. Les membres vérificateurs ne reçoivent jamais votre pièce d'identité gouvernementale, vos données sensibles de compatibilité (y compris l'orientation sexuelle ou les préférences relationnelles), ni aucune information au-delà de ce qui est strictement nécessaire pour effectuer la vérification.</li>
            <li><strong>Attestation de rencontre en personne :</strong> si vous mettez à jour votre statut relationnel avec un autre membre à « Nous nous sommes rencontrés », l'un de vous peut être invité à soumettre une courte attestation confirmant que la rencontre a eu lieu et que le profil de l'autre personne correspondait à la personne rencontrée.</li>
          </ol>
          <p className="mt-3">Soumettre une attestation concernant un autre membre est volontaire. Si vous refusez d'en soumettre une, cela n'a aucun effet sur votre propre compte ni sur votre propre accès à la plateforme.</p>
          <p className="mt-2">Cependant, atteindre le statut <strong>« Entièrement vérifié »</strong> nécessite que trois membres distincts soumettent une attestation valide à votre sujet. Le moment où vous atteignez ce statut dépend donc en partie de la participation volontaire d'autres membres, et non uniquement de vos propres actions. L'accès de base aux fonctionnalités principales de Nina Purple ne nécessite pas le statut Entièrement vérifié. Certaines fonctionnalités de visibilité, badges de confiance ou accès aux événements peuvent être réservés aux membres Entièrement vérifiés ; le cas échéant, cela sera clairement indiqué dans la fonctionnalité concernée.</p>
          <p className="mt-2">Le statut de vérification (p. ex. « Vérifié par appel », « Entièrement vérifié ») peut être visible par les autres membres comme indicateur de confiance. Les détails de vérification sous-jacents — transcriptions d'appels, notes d'attestation et identité du vérificateur — ne sont pas partagés avec le membre vérifié ni avec les autres membres, et sont accessibles uniquement à notre équipe Confiance et Sécurité.</p>
        </Section>

        <Section title="8. Conservation des données">
          <p>Nous conservons vos données personnelles aussi longtemps que votre compte est actif. Lors de la suppression du compte :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Profil et données de compatibilité : supprimés dans les 30 jours</li>
            <li>Messages : supprimés dans les 30 jours</li>
            <li><strong>Données biométriques : supprimées immédiatement après la vérification d'identité, ou au plus tard 3 ans après votre dernière interaction sur la plateforme, la première de ces échéances prévalant</strong></li>
            <li>Enregistrements d'appels de vérification et notes d'attestation : supprimés dans les 30 jours suivant la suppression du compte, sauf conservation plus longue à titre de preuve dans une enquête active de l'équipe Confiance et Sécurité</li>
            <li>Dossiers de transaction : conservés 7 ans pour se conformer aux réglementations financières et fiscales (Wyoming et Canada)</li>
            <li>Analyses anonymisées : peuvent être conservées indéfiniment</li>
          </ul>
        </Section>

        <Section title="9. Vos droits">
          <p>Selon votre juridiction, vous disposez des droits suivants :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Accès :</strong> Demander une copie de vos données personnelles</li>
            <li><strong>Rectification :</strong> Corriger des données inexactes</li>
            <li><strong>Effacement (« Droit à l'oubli ») :</strong> Demander la suppression de vos données</li>
            <li><strong>Portabilité :</strong> Recevoir vos données dans un format structuré et lisible par machine</li>
            <li><strong>Opposition / Restriction :</strong> S'opposer à ou restreindre certains traitements</li>
            <li><strong>Retrait du consentement :</strong> À tout moment, sans affecter le traitement licite antérieur</li>
            <li><strong>Droits spécifiques aux données biométriques (résidents de l'Illinois, du Texas, de Washington) :</strong> Demander confirmation des données biométriques que nous détenons à votre sujet et demander leur suppression conformément à notre calendrier de conservation publié</li>
            <li><strong>Déposer une plainte :</strong> Auprès de votre autorité de surveillance compétente (p. ex. Commission d'accès à l'information du Québec, une autorité de protection des données de l'UE, ou le Commissariat à la protection de la vie privée du Canada)</li>
          </ul>
          <p className="mt-2">Pour exercer un droit, écrivez à : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a>. Nous répondrons dans les 30 jours (PIPEDA/Loi 25) ou 1 mois (RGPD).</p>
        </Section>

        <Section title="10. Protection des mineurs (COPPA)">
          <p>Nina Purple est strictement réservé aux personnes de 18 ans et plus. Nous ne collectons pas sciemment de renseignements personnels auprès de mineurs. Une vérification de l'âge est requise lors de l'inscription, y compris dans le cadre du programme de vérification d'identité décrit à la Section 7a. Si nous apprenons qu'un mineur a créé un compte, nous supprimerons immédiatement toutes les données associées, y compris les données biométriques collectées.</p>
        </Section>

        <Section title="11. Témoins et suivi">
          <p>Nous utilisons des témoins essentiels et le stockage local pour l'authentification, les préférences de langue et les paramètres de thème. Nous n'utilisons pas de témoins publicitaires ou de suivi tiers. Vous pouvez effacer les témoins via les paramètres de votre navigateur à tout moment sans affecter les fonctionnalités principales.</p>
        </Section>

        <Section title="12. Droit applicable et transferts internationaux de données">
          <p>La présente Politique de confidentialité, ainsi que tout litige découlant de son interprétation ou de son application en tant que contrat, est régie par les lois de l'État du Wyoming, États-Unis, et le droit fédéral américain applicable, sans égard aux règles de conflit de lois. Ce choix de droit régit notre relation contractuelle avec vous et la résolution des litiges contractuels ; il ne limite ni ne remplace les droits de protection des données décrits ci-dessous qui s'appliquent à vous selon votre lieu de résidence.</p>
          <p className="mt-2">En utilisant Nina Purple, vous reconnaissez que vos données peuvent être traitées aux États-Unis. Selon votre lieu de résidence, vous bénéficiez des protections supplémentaires suivantes :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li><strong>Si vous êtes situé dans l'Espace économique européen ou au Royaume-Uni :</strong> les droits et protections décrits par le RGPD s'appliquent à notre traitement de vos données personnelles, y compris les bases légales décrites à la Section 4 et les droits décrits à la Section 9.</li>
            <li><strong>Si vous êtes situé au Canada hors Québec :</strong> la PIPEDA régit notre traitement de vos renseignements personnels, y compris votre droit d'accès et de correction de vos données et de déposer une plainte auprès du Commissariat à la protection de la vie privée du Canada.</li>
            <li><strong>Si vous êtes situé au Québec :</strong> la Loi 25 du Québec régit notre traitement de vos renseignements personnels, y compris les normes de consentement décrites à la Section 6 et votre droit de déposer une plainte auprès de la Commission d'accès à l'information du Québec.</li>
            <li><strong>Si vous êtes situé dans l'Illinois, au Texas ou à Washington :</strong> les protections spécifiques aux données biométriques décrites à la Section 6a s'appliquent à notre collecte et utilisation de vos données biométriques.</li>
            <li><strong>Si vous êtes situé dans un État américain doté d'une loi globale de protection des consommateurs :</strong> les droits que vous accorde cette loi s'appliquent en plus des droits décrits à la Section 9.</li>
          </ul>
        </Section>

        <Section title="13. Sécurité">
          <p>Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie, notamment le chiffrement TLS pour les données en transit, le stockage chiffré, des contrôles d'accès et des évaluations de sécurité régulières. Aucun système n'est sûr à 100 % ; en cas de violation de données, nous notifierons les utilisateurs concernés et les autorités compétentes comme l'exige la loi applicable, y compris dans les 72 heures selon le RGPD, selon les exigences de la Loi 25 du Québec, et selon les lois américaines de notification de violation applicables (y compris les exigences spécifiques aux données biométriques le cas échéant).</p>
        </Section>

        <Section title="14. Modifications de cette politique">
          <p>Nous pouvons mettre à jour cette Politique de confidentialité périodiquement. Les changements importants seront communiqués par courriel ou par avis dans l'application au moins 30 jours avant leur entrée en vigueur. L'utilisation continue de la plateforme après cette date vaut acceptation de la politique mise à jour.</p>
        </Section>

        <Section title="15. Contact et responsable du traitement">
          <p><strong>Nina Purple</strong><br />
          30 N Gould St Ste R, Sheridan, WY 82801, États-Unis<br />
          Courriel : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
          <p className="mt-2">Nous utilisons des témoins essentiels pour l'authentification, la langue et le thème. Aucune publicité ni suivi tiers.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-xl text-[#F5A800] mb-3">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/80 space-y-1">{children}</div>
    </div>
  );
}