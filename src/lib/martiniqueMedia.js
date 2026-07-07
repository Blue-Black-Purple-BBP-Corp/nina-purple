// Nina Purple Experiences — Destinations media
// All assets are served from local /images/Martinique/ paths.
// Labels are bilingual (EN/FR) and rendered based on the user's language.

const BASE = '/images/Martinique/';

// ── Martinique (featured destination, 2026) ─────────────────────────────────
export const MARTINIQUE = {
  id: 'martinique',
  year: 2026,
  name_en: 'Martinique',
  name_fr: 'Martinique',
  region_en: 'Caribbean',
  region_fr: 'Caraïbes',
  tagline_en: 'Space to breathe, reflect, and reconnect.',
  tagline_fr: "L'espace pour respirer, réfléchir et se reconnecter.",
  description_en:
    'Martinique offers something increasingly rare — space. Its mountains, rainforests, beaches, and slower rhythm create an ideal environment for meaningful personal and relational growth. Sometimes a new landscape creates a new perspective.',
  description_fr:
    "La Martinique offre quelque chose de plus en plus rare : l'espace. Ses montagnes, ses forêts tropicales, ses plages et son rythme plus lent créent un environnement idéal pour une croissance personnelle et relationnelle profonde. Parfois, un nouveau paysage crée une nouvelle perspective.",
  hero_video: `${BASE}IMG_1950__BestMoonViewFromShoelcherColline.MP4`,
  gallery: [
    { type: 'image', url: `${BASE}IMG_1887%20Copy_BESTDiamand.JPG`, label_en: 'Diamond Rock', label_fr: 'Rocher du Diamant', featured: true },
    { type: 'image', url: `${BASE}041D089F-DFC2-4577-8EE2-6DBB9AEB33F6_FDFHarbour.jpg`, label_en: 'Harbour View', label_fr: 'Vue du port' },
    { type: 'video', url: `${BASE}IMG_1641_BestRainbowAndCliff.MP4`, label_en: 'Rainbow and Cliff', label_fr: 'Arc-en-ciel et falaise' },
    { type: 'image', url: `${BASE}C80E464D-E521-4157-A4B0-56403051663E_ChasingTheSunViewFromTheBoat.jpg`, label_en: 'Chasing the Sun', label_fr: 'Poursuite du soleil' },
    { type: 'video', url: `${BASE}IMG_1807__ViewFromShoelcherCollineInfinityPool.MP4`, label_en: 'Infinity Pool View', label_fr: 'Vue piscine à débordement' },
    { type: 'image', url: `${BASE}IMG_1889%20Copy_ViewFromTheTop.JPG`, label_en: 'View from the Top', label_fr: 'Vue depuis le sommet' },
    { type: 'video', url: `${BASE}IMG_1882_HikingViews.MP4`, label_en: 'Hiking Views', label_fr: 'Vues de randonnée' },
    { type: 'video', url: `${BASE}IMG_1890(1)_BestHikingViewsRocksAndCactusFrame.MP4`, label_en: 'Rocks and Cactus', label_fr: 'Rochers et cactus' },
    { type: 'video', url: `${BASE}IMG_1895(1)_BestHikingForest.MP4`, label_en: 'Forest Trail', label_fr: 'Sentier forestier' },
    { type: 'video', url: `${BASE}IMG_1941_Best_ViewFromShoelcherCollineWithTwoRainbows.MP4`, label_en: 'Double Rainbow', label_fr: 'Double arc-en-ciel' },
    { type: 'video', url: `${BASE}IMG_1663_ChasingTheSunViewFromTheBoat.MP4`, label_en: 'Chasing the Sun', label_fr: 'Poursuite du soleil' },
  ],
};

// ── All destinations (future-ready) ──────────────────────────────────────────
export const DESTINATIONS = [MARTINIQUE];

// Hero background video (featured destination)
export const MARTINIQUE_HERO_VIDEO = MARTINIQUE.hero_video;

// Curated gallery — mixed photos + videos with varied viewpoints
export const MARTINIQUE_GALLERY = MARTINIQUE.gallery;