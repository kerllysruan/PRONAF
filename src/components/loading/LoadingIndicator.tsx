import React, { useEffect, useState, useRef } from 'react';

interface LoadingIndicatorProps {
  progress: number;
  stageLabel: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress,
  stageLabel,
}) => {
  const [displayNumber, setDisplayNumber] = useState<number>(0);
  const lastNumRef = useRef<number>(0);

  // Throttled / dampened numeral updates (updates every 2% step for calm reading)
  useEffect(() => {
    const targetNum = Math.min(100, Math.max(0, Math.round(progress)));
    if (targetNum === 100) {
      setDisplayNumber(100);
      lastNumRef.current = 100;
    } else if (Math.abs(targetNum - lastNumRef.current) >= 2) {
      setDisplayNumber(targetNum);
      lastNumRef.current = targetNum;
    }
  }, [progress]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center space-y-3 px-4">
      {/* Label and Percentage Counter (Numeral updates at a calm, controlled speed) */}
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
          className="text-amber-300 font-black text-lg sm:text-xl transition-all duration-300 ease-out"
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            filter: 'drop-shadow(0px 4px 16px rgba(251, 191, 36, 0.6)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.95))',
          }}
        >
          {displayNumber}%
        </span>
      </div>

      {/* Progress Track (Progress bar line width remains continuous & unchanged) */}
      <div className="w-full h-3.5 bg-[#040e08]/90 rounded-full border-2 border-amber-400/60 p-0.5 overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.85)]">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 via-yellow-300 to-emerald-300 rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(251,191,36,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
