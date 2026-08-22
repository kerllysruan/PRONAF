import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-5 px-6 animate-fade-in max-w-4xl mx-auto">
      {/* Radiant Glowing Agricultural Sprout/Wheat Emblem (NO DOLLAR SIGN) */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full blur-3xl opacity-60 animate-pulse" />
        <svg
          className="relative w-20 h-20 sm:w-24 sm:h-24 text-amber-300 drop-shadow-[0_6px_25px_rgba(251,191,36,0.7)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stem & Leaves / Sprout Icon */}
          <path d="M12 22V8" />
          <path d="M12 8C12 5 9 3 6 3C6 7 9 9 12 9" />
          <path d="M12 12C12 9 15 7 18 7C18 11 15 13 12 13" />
          <path d="M12 16C12 13 9 11 6 11C6 15 9 17 12 17" />
          <path d="M12 20C12 17 15 15 18 15C18 19 15 21 12 21" />
        </svg>
      </div>

      {/* Main Brand Title: SUPER GESTÃO */}
      <h1
        className="text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fcd34d] via-[#fbbf24] to-[#f59e0b]"
        style={{
          fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
          filter: 'drop-shadow(0px 8px 30px rgba(0, 0, 0, 0.98)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.95))',
        }}
      >
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle: AGRICULTURA FAMILIAR — PRONAF */}
      <p
        className="text-base sm:text-2xl font-black text-amber-300 tracking-[0.28em] uppercase font-sans"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          filter: 'drop-shadow(0px 4px 16px rgba(0, 0, 0, 0.98))',
        }}
      >
        {MEDIA_CONFIG.brand.subtitle}
      </p>

      {/* Tagline */}
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
