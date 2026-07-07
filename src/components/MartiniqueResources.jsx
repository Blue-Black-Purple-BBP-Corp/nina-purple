import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BarChart3, Landmark, Building2, Briefcase, FileText, HeartPulse, Newspaper, Compass, Globe, Map } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const RESOURCES = [
  {
    icon: BarChart3,
    category_en: 'Statistics', category_fr: 'Statistiques',
    name: 'INSEE Martinique',
    desc_en: 'Official demographic and economic data (population, GDP, unemployment, poverty).',
    desc_fr: 'Données démographiques et économiques officielles (population, PIB, chômage, pauvreté).',
    url: 'https://www.insee.fr/fr/statistiques/2011101?geo=DEP-972',
  },
  {
    icon: Landmark,
    category_en: 'Governance', category_fr: 'Gouvernance',
    name: 'Collectivité Territoriale de Martinique',
    desc_en: 'Territorial executive — public policies, major projects, and local governance.',
    desc_fr: 'Exécutif territorial — politiques publiques, projets structurants et gouvernance locale.',
    url: 'https://lannuaire.service-public.gouv.fr/martinique/martinique/acd5a636-5679-4419-9aa7-fe9dd02ae32f',
  },
  {
    icon: Building2,
    category_en: 'Government', category_fr: 'État',
    name: 'Services de l\'État en Martinique',
    desc_en: 'Prefectural portal for regulation, economy, employment, and INSEE relay.',
    desc_fr: 'Portail préfectoral pour la réglementation, l\'économie, l\'emploi et le relais INSEE.',
    url: 'https://www.martinique.gouv.fr/Services-de-l-Etat/Consommation-economie-travail-et-emploi/INSEE',
  },
  {
    icon: Briefcase,
    category_en: 'Economy', category_fr: 'Économie',
    name: 'CCI Martinique',
    desc_en: 'Chamber of commerce — entrepreneurial ecosystem, business formalities, sectoral studies.',
    desc_fr: 'Chambre de commerce — écosystème entrepreneurial, formalités d\'entreprise, études sectorielles.',
    url: 'https://lannuaire.service-public.gouv.fr/martinique/martinique/c32a09f3-455b-4d9d-bf43-daca5fd242ee',
  },
  {
    icon: FileText,
    category_en: 'Analysis', category_fr: 'Analyse',
    name: 'Insee Analyses Martinique',
    desc_en: 'In-depth thematic publications (conjuncture, GDP, demographics) with long series.',
    desc_fr: 'Publications thématiques approfondies (conjoncture, PIB, démographie) avec séries longues.',
    url: 'https://www.insee.fr/fr/statistiques/8905346',
  },
  {
    icon: HeartPulse,
    category_en: 'Social & Health', category_fr: 'Social & Santé',
    name: 'POSS Martinique',
    desc_en: 'Social and health data platform aggregating INSEE and other producers.',
    desc_fr: 'Plateforme de données sociales et sanitaires agrégeant l\'INSEE et autres producteurs.',
    url: 'https://www.possmartinique.com/donnees/par-producteur-de-donnees/insee',
  },
  {
    icon: Newspaper,
    category_en: 'Media', category_fr: 'Média',
    name: 'France-Antilles Martinique',
    desc_en: 'Reference daily for local, economic, and political news.',
    desc_fr: 'Quotidien de référence pour l\'actualité locale, économique et politique.',
    url: 'https://www.franceantilles.fr',
  },
  {
    icon: Compass,
    category_en: 'Official Tourism', category_fr: 'Tourisme officiel',
    name: 'Martinique.org',
    desc_en: 'Official tourism portal — culture, landscapes, and infrastructure resources.',
    desc_fr: 'Portail touristique officiel — culture, paysages et infrastructures.',
    url: 'https://www.martinique.org/en/about',
  },
  {
    icon: Globe,
    category_en: 'International Guide', category_fr: 'Guide international',
    name: 'Lonely Planet — Martinique',
    desc_en: 'Reliable cultural and geographical synthesis for an international audience.',
    desc_fr: 'Synthèse culturelle et géographique fiable pour un lectorat international.',
    url: 'https://www.lonelyplanet.com/articles/guide-to-martinique',
  },
  {
    icon: Map,
    category_en: 'Regional', category_fr: 'Régional',
    name: 'OneCaribbean.org',
    desc_en: 'Caribbean Tourism Organization — situating Martinique in the regional context.',
    desc_fr: 'Organisme de tourisme caribéen — positionnement de la Martinique dans le contexte régional.',
    url: 'https://www.onecaribbean.org/destinations/martinique/',
  },
];

export default function MartiniqueResources() {
  const { lang } = useLang();
  const isFr = lang === 'fr';
  const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <motion.div {...fadeUp} className="text-center mb-12">
        <h2 className="font-serif text-3xl md:text-4xl text-[#F0E6FF] mb-4">
          {isFr ? 'Ressources sur la Martinique' : 'Martinique Resources'}
        </h2>
        <p className="text-[#F0E6FF]/50 max-w-2xl mx-auto text-sm leading-relaxed">
          {isFr
            ? "Une sélection de sources fiables et complémentaires pour explorer la Martinique sous plusieurs angles : institutionnel, statistique, économique, touristique et médiatique."
            : "A selection of reliable and complementary sources to explore Martinique from multiple angles: institutional, statistical, economic, touristic, and media."}
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {RESOURCES.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className="glass-card rounded-2xl p-5 hover:border-[rgba(245,168,0,0.3)] transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.18)' }}>
                  <Icon className="w-5 h-5 text-[#F5A800]" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#F0E6FF]/20 group-hover:text-[#F5A800] transition-colors" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#7B2FBE] font-semibold mb-1.5">
                {isFr ? r.category_fr : r.category_en}
              </span>
              <h3 className="font-serif text-base text-[#F0E6FF] mb-1.5 leading-snug">{r.name}</h3>
              <p className="text-[#F0E6FF]/50 text-xs leading-relaxed flex-1">
                {isFr ? r.desc_fr : r.desc_en}
              </p>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}