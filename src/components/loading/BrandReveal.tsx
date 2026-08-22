import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center z-30 px-6 animate-fade-in">
      {/* Premium Metallic & Glowing Brand Emblem */}
      <div className="relative mb-8 transform hover:scale-105 transition-transform duration-300">
        {/* Multilayered ambient glowing halos */}
        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />

        {/* Outer Golden Ring Shield */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900 border border-amber-400/60 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(212,175,55,0.25)] flex items-center justify-center">
          {/* Inner Golden Ring Shield */}
          <div className="w-full h-full rounded-full border border-amber-400/20 flex items-center justify-center bg-emerald-950/40 backdrop-blur-md">
            <svg
              className="w-12 h-12 text-amber-300 drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <path d="M7 18.5l4-15" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <path d="M13 18.5l4-15" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Title: SUPER GESTÃO */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-100 mb-4 font-sans drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle Glassmorphic Badge: AGRICULTURA FAMILIAR - PRONAF */}
      <div className="relative px-6 py-2 rounded-lg bg-emerald-950/80 border border-amber-400/30 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Subtle gold sheen light leak */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        
        <p className="text-xs sm:text-sm font-bold text-amber-200 tracking-[0.32em] uppercase font-sans">
          {MEDIA_CONFIG.brand.subtitle}
        </p>
      </div>

      {/* Tagline */}
      <p className="mt-4 text-xs font-medium text-emerald-300/80 tracking-[0.2em] max-w-sm uppercase font-sans">
        {MEDIA_CONFIG.brand.tagline}
      </p>

      {/* Elegant Golden Divider Line */}
      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mt-8" />
    </div>
  );
};
