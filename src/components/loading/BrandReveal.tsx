import React from 'react';
import { MEDIA_CONFIG } from '@/config/imageConfig';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center z-30 px-6 animate-fade-in">
      {/* Emblem */}
      <div className="relative mb-7">
        <div className="absolute -inset-4 bg-amber-400/15 rounded-full blur-2xl" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#0a2a16] to-[#071f12] border border-amber-400/50 flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.2)]">
          <div className="w-[88px] h-[88px] rounded-full border border-amber-400/15 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-100 mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
        {MEDIA_CONFIG.brand.title}
      </h1>

      {/* Subtitle badge */}
      <div className="px-5 py-2 rounded-lg bg-[#071f12]/90 border border-amber-400/25 backdrop-blur-lg shadow-lg">
        <p className="text-xs sm:text-sm font-bold text-amber-200 tracking-[0.28em] uppercase">
          {MEDIA_CONFIG.brand.subtitle}
        </p>
      </div>

      {/* Tagline */}
      <p className="mt-4 text-[11px] font-medium text-emerald-300/70 tracking-[0.18em] max-w-sm uppercase">
        {MEDIA_CONFIG.brand.tagline}
      </p>

      {/* Divider */}
      <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent mt-7" />
    </div>
  );
};
