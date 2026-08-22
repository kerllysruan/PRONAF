import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center z-30 px-6 animate-fade-in scale-100 transition-all duration-500">
      {/* 3D Emblem Shield */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-3xl animate-pulse" />

        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-900/90 via-emerald-950/95 to-slate-950/90 border-2 border-amber-400/70 p-5 shadow-[0_0_50px_rgba(251,191,36,0.35)] flex items-center justify-center">
          <svg
            className="w-14 h-14 text-amber-300 drop-shadow-xl"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            <path d="M7 18.5l4-15" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
            <path d="M13 18.5l4-15" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
          </svg>
        </div>
      </div>

      {/* Brand Title: SUPER GESTÃO */}
      <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-emerald-200 tracking-wider uppercase mb-3 font-sans drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle Badge: AGRICULTURA FAMILIAR - PRONAF */}
      <div className="inline-block px-6 py-2.5 rounded-full bg-emerald-950/90 border-2 border-amber-400/50 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
        <p className="text-xs sm:text-base font-extrabold text-amber-300 tracking-[0.3em] uppercase font-sans">
          {MEDIA_CONFIG.brand.subtitle}
        </p>
      </div>

      {/* Tagline */}
      <p className="mt-4 text-xs sm:text-sm font-semibold text-emerald-200/90 tracking-widest max-w-md uppercase font-sans">
        {MEDIA_CONFIG.brand.tagline}
      </p>

      {/* Golden Divider */}
      <div className="w-40 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent mt-6" />
    </div>
  );
};
