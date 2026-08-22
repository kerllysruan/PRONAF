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
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-3 px-4">
      {/* Percentage & Stage Label (Single line, no overlap) */}
      <div className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-amber-200 font-sans">
        <span className="truncate max-w-[260px] text-emerald-300">{stageLabel}</span>
        <span className="text-amber-300 text-sm font-extrabold">{progress}%</span>
      </div>

      {/* Progress Bar Track (Visible from entrance 0%) */}
      <div className="w-full h-2.5 bg-emerald-950/90 rounded-full border border-amber-400/30 p-0.5 overflow-hidden shadow-lg">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-200 rounded-full transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
