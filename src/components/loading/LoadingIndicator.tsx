import React from 'react';

interface LoadingIndicatorProps {
  progress: number;
  stageLabel: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress,
  stageLabel,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center space-y-3 px-4">
      {/* Label and Percentage Counter */}
      <div className="w-full flex items-center justify-between text-xs sm:text-base font-black uppercase tracking-widest font-sans">
        <span
          className="truncate max-w-[360px] text-[#fde68a]"
          style={{
            filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.98))',
          }}
        >
          {stageLabel}
        </span>
        <span
          className="text-amber-300 font-black text-lg sm:text-xl"
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            filter: 'drop-shadow(0px 4px 16px rgba(251, 191, 36, 0.6)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.95))',
          }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress Track (Sunburst Gradient & High-Contrast Dark Track) */}
      <div className="w-full h-3.5 bg-[#040e08]/90 rounded-full border-2 border-amber-400/60 p-0.5 overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.85)]">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 via-yellow-300 to-emerald-300 rounded-full transition-all duration-200 ease-out shadow-[0_0_20px_rgba(251,191,36,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
