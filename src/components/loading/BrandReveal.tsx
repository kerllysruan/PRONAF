import React from 'react';

interface BrandRevealProps {
  visible: boolean;
}

export const BrandReveal: React.FC<BrandRevealProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center text-center z-30 px-6 animate-fade-in">
      {/* Emblem Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />

        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-900/90 to-emerald-950/90 border border-amber-400/40 p-4 shadow-2xl flex items-center justify-center">
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
            <path d="M7 18.5l4-15" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <path d="M13 18.5l4-15" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* Brand Title */}
      <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-emerald-200 tracking-wider uppercase mb-3 font-sans drop-shadow-md">
        CRÉDITO RURAL
      </h1>

      {/* Tagline */}
      <p className="text-base sm:text-lg text-emerald-200/90 font-medium tracking-widest uppercase max-w-md font-sans">
        Conectando o campo às oportunidades
      </p>

      {/* Subtle Divider */}
      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mt-5" />
    </div>
  );
};
