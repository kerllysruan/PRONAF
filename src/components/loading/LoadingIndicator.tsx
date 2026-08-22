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
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center space-y-2.5 px-4">
      {/* Label and Percentage Counter (Pure high-contrast text with drop shadow) */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm font-extrabold uppercase tracking-widest font-sans">
        <span className="truncate max-w-[320px] text-amber-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          {stageLabel}
        </span>
        <span
          className="text-amber-300 font-black text-base sm:text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress Track (Visible from entrance 0%, clean gradient line) */}
      <div className="w-full h-2.5 bg-slate-950/70 rounded-full border border-amber-400/40 p-0.5 overflow-hidden drop-shadow-md">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-200 rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(251,191,36,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
