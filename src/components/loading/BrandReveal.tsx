import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-4 px-6 animate-fade-in max-w-xl mx-auto">
      {/* Brand Emblem */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 border border-amber-400/40 p-4 shadow-xl flex items-center justify-center">
        <svg
          className="w-10 h-10 text-amber-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      {/* Main Title: SUPER GESTÃO */}
      <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-100 tracking-wider uppercase font-sans drop-shadow-md">
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle Badge: AGRICULTURA FAMILIAR — PRONAF */}
      <div className="px-5 py-2 rounded-full bg-emerald-950/90 border border-amber-400/30 backdrop-blur-md shadow-lg">
        <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-[0.25em] uppercase font-sans">
          {MEDIA_CONFIG.brand.subtitle}
        </p>
      </div>

      {/* Tagline */}
      <p className="text-xs sm:text-sm font-medium text-emerald-200/90 tracking-wide max-w-md font-sans">
        {MEDIA_CONFIG.brand.tagline}
      </p>
    </div>
  );
};
