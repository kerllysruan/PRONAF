import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center z-30 px-6 animate-fade-in">
      {/* Emblem Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/40 rounded-full blur-2xl animate-pulse" />

        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-slate-950/90 border border-amber-400/50 p-5 shadow-2xl flex items-center justify-center">
          <svg
            className="w-12 h-12 text-amber-300 drop-shadow-md"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            <path d="M7 18.5l4-15" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <path d="M13 18.5l4-15" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Brand Title: SUPER GESTÃO */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-emerald-200 tracking-wider uppercase mb-3 font-sans drop-shadow-lg">
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Tagline: AGRICULTURA FAMILIAR - PRONAF */}
      <div className="inline-block px-5 py-2 rounded-full bg-emerald-950/80 border border-amber-400/40 backdrop-blur-md shadow-xl">
        <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-[0.25em] uppercase font-sans">
          {MEDIA_CONFIG.brand.subtitle}
        </p>
      </div>

      {/* Subtle Golden Glow Line */}
      <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent mt-6" />
    </div>
  );
};
