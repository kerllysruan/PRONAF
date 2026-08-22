import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-5 px-6 animate-fade-in max-w-2xl mx-auto">
      {/* Radiant Glowing Emblem Shield */}
      <div className="relative">
        <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-3xl animate-pulse" />

        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 border-2 border-amber-400/70 p-5 shadow-[0_0_50px_rgba(251,191,36,0.4)] flex items-center justify-center">
          <svg
            className="w-12 h-12 text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </div>

      {/* Main Title: SUPER GESTÃO (Premium Plus Jakarta Sans Typography) */}
      <h1
        className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200 drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)]"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
      >
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle Badge: AGRICULTURA FAMILIAR — PRONAF */}
      <div className="px-6 py-2.5 rounded-full bg-emerald-950/90 border-2 border-amber-400/60 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.35)]">
        <p
          className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-[0.3em] uppercase"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {MEDIA_CONFIG.brand.subtitle}
        </p>
      </div>

      {/* Tagline */}
      <p className="text-xs sm:text-sm font-bold text-emerald-200 tracking-widest max-w-md uppercase font-sans drop-shadow-md">
        {MEDIA_CONFIG.brand.tagline}
      </p>
    </div>
  );
};
