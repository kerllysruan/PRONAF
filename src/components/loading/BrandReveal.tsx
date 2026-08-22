import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 px-6 animate-fade-in max-w-3xl mx-auto">
      {/* Golden Emblem Icon (Pure SVG, no dark box background) */}
      <div className="relative mb-2">
        <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-3xl animate-pulse" />
        <svg
          className="relative w-16 h-16 sm:w-20 sm:h-20 text-amber-300 drop-shadow-[0_4px_20px_rgba(251,191,36,0.6)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      {/* Main Title: SUPER GESTÃO (Gold Metallic Gradient with Shadow) */}
      <h1
        className="text-5xl sm:text-7xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200 drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)]"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
      >
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle: AGRICULTURA FAMILIAR — PRONAF (Pure Gold Text, no box) */}
      <p
        className="text-sm sm:text-xl font-extrabold text-amber-300 tracking-[0.25em] uppercase font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
      >
        {MEDIA_CONFIG.brand.subtitle}
      </p>

      {/* Tagline: Pure warm off-white text */}
      <p className="text-xs sm:text-base font-semibold text-slate-100 tracking-wider max-w-lg font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
        {MEDIA_CONFIG.brand.tagline}
      </p>
    </div>
  );
};
