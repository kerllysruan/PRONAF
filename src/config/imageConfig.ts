// Ultra High-Definition Media & Visual Assets for Super Gestão Platform

export const MEDIA_CONFIG = {
  // Photorealistic High-Res Brazilian Countryside & Farmers
  images: {
    sunriseDawn: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=90', // Golden sunrise over green valley
    aerialCrops: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2000&q=90', // Aerial green farm rows
    familyFarmer: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?auto=format&fit=crop&w=1200&q=90', // Smiling Brazilian family farmer
    cornHarvest: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1200&q=90', // Golden corn harvest
    organicProduce: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=90', // Fresh harvested vegetables
    fruitProduce: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=1200&q=90', // Fresh fruits in farmer hands
  },

  brand: {
    title: 'SUPER GESTÃO',
    subtitle: 'AGRICULTURA FAMILIAR - PRONAF',
    tagline: 'Inteligência e tecnologia conectando o campo às oportunidades',
  }
};

// Preload critical images into browser cache for instant zero-lag rendering
export function preloadMediaAssets() {
  if (typeof window === 'undefined') return;
  Object.values(MEDIA_CONFIG.images).forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
