// Central Media & Brand Configuration — Super Gestão / PRONAF
// All image URLs centralized here for easy swap

export const MEDIA_CONFIG = {
  images: {
    // Scene 01 & 02 — Sunrise & Field
    sunriseDawn:    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
    aerialCrops:    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1920&q=80',
    // Scene 03 — Producers & Harvest
    familyFarmer:   'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&w=800&q=80',
    cornHarvest:    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
    organicProduce: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    fruitProduce:   'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=800&q=80',
  },

  brand: {
    title: 'SUPER GESTÃO',
    subtitle: 'AGRICULTURA FAMILIAR — PRONAF',
    tagline: 'Inteligência e tecnologia conectando o campo às oportunidades',
  },
};

/** Preload critical hero image so Scene 01 is instant */
export function preloadCriticalAssets(): void {
  if (typeof window === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = MEDIA_CONFIG.images.sunriseDawn;
  document.head.appendChild(link);
}
