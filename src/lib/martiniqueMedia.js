// Martinique experience media — videos and photos uploaded by the team.
// Centralized here so pages can import without scattering URLs across JSX.

export const MARTINIQUE_VIDEOS = [
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/b6cff83d7_IMG_1947.MP4', label: 'Coastal calm', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/991da9cdf_IMG_1624.MP4', label: 'Tropical greenery', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/cd878af59_IMG_18851.MP4', label: 'Seaside reflections', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/d5002c27c_IMG_18901.MP4', label: 'Ocean breeze', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/7f5278527_IMG_1892.MP4', label: 'Island light', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/2c23ed9ba_IMG_1894.MOV', label: 'Quiet moments', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/3b15a4672_IMG_1895.MP4', label: 'Nature immersion', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/d6066d507_IMG_1918.MP4', label: 'Caribbean shores', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/01b375262_IMG_1919.MP4', label: 'Stillness', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/6d8f5f448_IMG_1926.MP4', label: 'Warmth', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/121f921df_IMG_1934.MP4', label: 'Horizon', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/f7d33ab6a_IMG_1935.MP4', label: 'Presence', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/8192499df_IMG_1938.MP4', label: 'Reconnection', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/4a372a1be_IMG_1940.MP4', label: 'Breath', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/e8bec88e7_IMG_1941.MP4', label: 'Soft tides', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/6dadc040a_IMG_1943.MP4', label: 'Open sky', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/ee36a7cbe_IMG_1945.MP4', label: 'Gentle waves', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/283c3efb3_IMG_1950.MP4', label: 'Inner calm', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/4f6c2b932_IMG_1951.MP4', label: 'Sunlit path', type: 'video' },
  { url: 'https://media.base44.com/videos/public/6a2ae026055f2f4f53a701b4/f1587d18e_IMG_1952.MP4', label: 'New perspective', type: 'video' },
];

export const MARTINIQUE_PHOTOS = [
  { url: 'https://media.base44.com/images/public/6a2ae026055f2f4f53a701b4/c5577b303_041D089F-DFC2-4577-8EE2-6DBB9AEB33F6.jpg', label: 'Harbor view', type: 'image' },
  { url: 'https://media.base44.com/images/public/6a2ae026055f2f4f53a701b4/be0960ad8_C80E464D-E521-4157-A4B0-56403051663E.jpg', label: 'Into the sun', type: 'image' },
  { url: 'https://media.base44.com/images/public/6a2ae026055f2f4f53a701b4/13c024f1b_IMG_1887Copy.jpg', label: 'Diamond Rock', type: 'image' },
  { url: 'https://media.base44.com/images/public/6a2ae026055f2f4f53a701b4/4938f1b38_IMG_1889Copy.jpg', label: 'Coastal heights', type: 'image' },
];

// Hero background video
export const MARTINIQUE_HERO_VIDEO = MARTINIQUE_VIDEOS[3].url;

// Curated gallery — mixed photos + videos with varied viewpoints (no repetition)
export const MARTINIQUE_GALLERY = [
  MARTINIQUE_PHOTOS[0],   // Harbor view (eye-level seascape)
  MARTINIQUE_VIDEOS[1],   // Tropical greenery (interior)
  MARTINIQUE_PHOTOS[1],   // Into the sun (low-angle deck)
  MARTINIQUE_VIDEOS[7],   // Caribbean shores (beach level)
  MARTINIQUE_PHOTOS[2],   // Diamond Rock (high-elevation cliff)
  MARTINIQUE_VIDEOS[6],   // Nature immersion (close-up)
  MARTINIQUE_PHOTOS[3],   // Coastal heights (high-angle, cactus foreground)
  MARTINIQUE_VIDEOS[18],  // Sunlit path (different perspective)
];