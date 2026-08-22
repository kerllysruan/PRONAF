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
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center space-y-3 px-4">
      {/* Label and Percentage Counter */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm font-extrabold uppercase tracking-widest font-sans">
        <span className="truncate max-w-[300px] text-emerald-300 drop-shadow-md">
          {stageLabel}
        </span>
        <span
          className="text-amber-300 font-black text-base sm:text-lg drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress Track (Visible from entrance 0%) */}
      <div className="w-full h-3 bg-emerald-950/95 rounded-full border-2 border-amber-400/50 p-0.5 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-200 rounded-full transition-all duration-200 ease-out shadow-[0_0_15px_rgba(251,191,36,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
