import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-5 px-6 animate-fade-in max-w-4xl mx-auto">
      {/* Radiant Glowing Sunburst Emblem */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full blur-3xl opacity-60 animate-pulse" />
        <svg
          className="relative w-20 h-20 sm:w-24 sm:h-24 text-amber-300 drop-shadow-[0_4px_25px_rgba(251,191,36,0.6)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      {/* Main Title: SUPER GESTÃO (Ultra-Legible Sunburst Gold Typography) */}
      <h1
        className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fcd34d] via-[#fbbf24] to-[#f59e0b]"
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          filter: 'drop-shadow(0px 8px 30px rgba(0, 0, 0, 0.98)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.95))',
        }}
      >
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle: AGRICULTURA FAMILIAR — PRONAF (Pure Glowing Gold Text) */}
      <p
        className="text-base sm:text-2xl font-black text-amber-300 tracking-[0.28em] uppercase font-sans"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          filter: 'drop-shadow(0px 4px 16px rgba(0, 0, 0, 0.98))',
        }}
      >
        {MEDIA_CONFIG.brand.subtitle}
      </p>

      {/* Tagline: Crisp Platinum White Text with Contrast Shadow */}
      <p
        className="text-sm sm:text-lg font-bold text-[#f8fafc] tracking-widest max-w-xl font-sans"
        style={{
          filter: 'drop-shadow(0px 4px 16px rgba(0, 0, 0, 0.98))',
        }}
      >
        {MEDIA_CONFIG.brand.tagline}
      </p>
    </div>
  );
};
