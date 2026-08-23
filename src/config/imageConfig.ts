// High-Resolution Background Images Catalog for Super Gestão / PRONAF

export const MEDIA_CONFIG = {
  images: {
    agriLivestock:  '/agri_livestock_bg.jpg',
    sunriseDawn:    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85',
    aerialCrops:    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2000&q=85',
    familyFarmer:   'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&w=1200&q=85',
    cornHarvest:    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=85',
    organicProduce: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85',
  },

  brand: {
    title: 'SUPER GESTÃO',
    subtitle: 'AGRICULTURA FAMILIAR — PRONAF',
    tagline: 'Conectando o campo às oportunidades',
  },
};

/** Preload all background images so transitions are instant without lag */
export function preloadCriticalAssets(): void {
  if (typeof window === 'undefined') return;
  Object.values(MEDIA_CONFIG.images).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
