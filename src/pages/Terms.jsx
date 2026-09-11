import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { ChevronLeft } from 'lucide-react';

const LAST_UPDATED = 'July 7, 2026';
const LAST_UPDATED_FR = '7 juillet 2026';

export default function Terms() {
  const { lang } = useLang();
  if (lang === 'fr') return <TermsFR />;
  return <TermsEN />;
}

function TermsEN() {
  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#F5A800] hover:opacity-80 mb-8">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-serif text-4xl mb-2 text-foreground">Terms of Service</h1>
        <p className="text-sm text-foreground/50 mb-10">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account or using Nina Purple ("the Platform"), you agree to these Terms of Service. If you do not agree, you may not use the Platform.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 18 years of age to use Nina Purple. By registering, you confirm that you are 18 or older and that all information you provide is accurate.</p>
        </Section>

        <Section title="3. Accounts & Verification">
          <p>You are responsible for maintaining the confidentiality of your account credentials. Nina Purple reserves the right to verify the identity of any user, including by phone, and to suspend or terminate accounts that cannot be verified or that violate these Terms.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Harass, threaten, or harm any other user</li>
            <li>Impersonate another person or misrepresent your identity</li>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to disrupt or compromise Platform security</li>
            <li>Scrape, copy, or redistribute user data</li>
          </ul>
        </Section>

        <Section title="5. Subscriptions, Credits & Payments">
          <p>Nina Purple offers subscription tiers (Lunar, Stellar, Galactic) and a credit-based micro-transaction model. Payments are processed by Stripe. Subscription fees are billed on a recurring basis until cancelled. One-time credit purchases are non-refundable except where required by law. You may cancel a subscription at any time; access continues until the end of the current billing period.</p>
        </Section>

        <Section title="6. Events & No-Show Policy">
          <p>Some events require advance booking. Cancellations made less than 48 hours before the event may incur a no-show fee of $10 USD. By booking an event you agree to this policy.</p>
        </Section>

        <Section title="7. User Content">
          <p>You retain ownership of content you post. You grant Nina Purple a license to display your content within the Platform for the purpose of operating the service. You are responsible for ensuring your content does not violate any law or third-party right.</p>
        </Section>

        <Section title="8. Disclaimers">
          <p>Nina Purple is provided "as is" without warranties of any kind. We do not guarantee specific matching outcomes. Compatibility scores are informational and do not constitute a guarantee of relationship success.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>To the maximum extent permitted by law, Nina Purple shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform.</p>
        </Section>

        <Section title="10. Termination">
          <p>You may delete your account at any time from your profile settings. Nina Purple may suspend or terminate accounts that violate these Terms. Upon termination, your data is handled per our Privacy Policy.</p>
        </Section>

        <Section title="11. Governing Law">
          <p>These Terms are governed by the laws of the State of Wyoming, USA, without regard to conflict-of-law principles. Disputes will be resolved in the courts of Wyoming.</p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>We may update these Terms periodically. Material changes will be communicated at least 30 days before taking effect. Continued use after that date constitutes acceptance.</p>
        </Section>

        <Section title="13. Contact">
          <p><strong>Nina Purple</strong><br />
          30 N Gould St Ste R, Sheridan, WY 82801, USA<br />
          Email: <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>

        <Section title="14. Credits & Data Sources">
          <p>City location data is provided by the <a href="https://simplemaps.com/data/world-cities" className="text-[#F5A800] underline">SimpleMaps World Cities Database</a> (Basic version), licensed under <a href="https://creativecommons.org/licenses/by/4.0/" className="text-[#F5A800] underline">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p>
        </Section>
      </div>
    </div>
  );
}

function TermsFR() {
  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#F5A800] hover:opacity-80 mb-8">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-serif text-4xl mb-2 text-foreground">Conditions d'utilisation</h1>
        <p className="text-sm text-foreground/50 mb-10">Dernière mise à jour : {LAST_UPDATED_FR}</p>

        <Section title="1. Acceptation des conditions">
          <p>En créant un compte ou en utilisant Nina Purple (« la Plateforme »), vous acceptez les présentes conditions. Si vous n'acceptez pas, vous ne pouvez pas utiliser la Plateforme.</p>
        </Section>

        <Section title="2. Éligibilité">
          <p>Vous devez avoir au moins 18 ans pour utiliser Nina Purple. En vous inscrivant, vous confirmez avoir 18 ans ou plus et que toutes les informations fournies sont exactes.</p>
        </Section>

        <Section title="3. Comptes et vérification">
          <p>Vous êtes responsable de la confidentialité de vos identifiants. Nina Purple se réserve le droit de vérifier l'identité de tout utilisateur, y compris par téléphone, et de suspendre ou clôturer les comptes non vérifiables ou en violation des présentes conditions.</p>
        </Section>

        <Section title="4. Utilisation acceptable">
          <p>Vous acceptez de ne pas :</p>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Harceler, menacer ou nuire à un autre utilisateur</li>
            <li>Usurper l'identité d'autrui ou fausser la vôtre</li>
            <li>Utiliser la Plateforme à des fins illégales</li>
            <li>Tenter de compromettre la sécurité de la Plateforme</li>
            <li>Extraire, copier ou redistribuer les données des utilisateurs</li>
          </ul>
        </Section>

        <Section title="5. Abonnements, crédits et paiements">
          <p>Nina Purple propose des abonnements (Lunaire, Stellaire, Galactique) et un modèle de micro-transactions par crédits. Les paiements sont traités par Stripe. Les abonnements sont facturés de manière récurrente jusqu'à annulation. Les achats de crédits uniques ne sont pas remboursables sauf obligation légale. Vous pouvez annuler un abonnement à tout moment ; l'accès se poursuit jusqu'à la fin de la période en cours.</p>
        </Section>

        <Section title="6. Événements et politique d'absence">
          <p>Certains événements nécessitent une réservation. Les annulations effectuées moins de 48 heures avant l'événement peuvent entraîner des frais d'absence de 10 $ USD. En réservant un événement, vous acceptez cette politique.</p>
        </Section>

        <Section title="7. Contenu des utilisateurs">
          <p>Vous conservez la propriété de vos contenus. Vous accordez à Nina Purple une licence pour afficher vos contenus dans la Plateforme afin d'assurer le service. Vous êtes responsable de la conformité de vos contenus avec la loi et les droits des tiers.</p>
        </Section>

        <Section title="8. Avertissements">
          <p>Nina Purple est fournie « telle quelle » sans garantie d'aucune sorte. Nous ne garantissons pas de résultats de correspondance. Les scores de compatibilité sont informatifs et ne constituent pas une garantie de réussite relationnelle.</p>
        </Section>

        <Section title="9. Limitation de responsabilité">
          <p>Dans la mesure permise par la loi, Nina Purple ne saurait être tenue responsable de dommages indirects, accessoires ou consécutifs résultant de votre utilisation de la Plateforme.</p>
        </Section>

        <Section title="10. Résiliation">
          <p>Vous pouvez supprimer votre compte à tout moment depuis vos paramètres de profil. Nina Purple peut suspendre ou clôturer les comptes en violation des présentes conditions. En cas de résiliation, vos données sont traitées conformément à notre politique de confidentialité.</p>
        </Section>

        <Section title="11. Droit applicable">
          <p>Les présentes conditions sont régies par les lois de l'État du Wyoming, États-Unis. Les litiges seront tranchés par les tribunaux du Wyoming.</p>
        </Section>

        <Section title="12. Modifications des conditions">
          <p>Nous pouvons mettre à jour ces conditions. Les changements importants seront communiqués au moins 30 jours avant leur entrée en vigueur. L'utilisation continue après cette date vaut acceptation.</p>
        </Section>

        <Section title="13. Contact">
          <p><strong>Nina Purple</strong><br />
          30 N Gould St Ste R, Sheridan, WY 82801, États-Unis<br />
          Courriel : <a href="mailto:contact@NinaPurple.love" className="text-[#F5A800] underline">contact@NinaPurple.love</a></p>
        </Section>

        <Section title="14. Crédits et sources de données">
          <p>Les données de localisation des villes sont fournies par la <a href="https://simplemaps.com/data/world-cities" className="text-[#F5A800] underline">base de données mondiale des villes SimpleMaps</a> (version Basic), sous licence <a href="https://creativecommons.org/licenses/by/4.0/" className="text-[#F5A800] underline">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p>
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