import React from 'react';

interface LoadingIndicatorProps {
  progress: number;
  milestone: string;
  visible?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress,
  milestone,
  visible = true,
}) => {
  const radius = 68;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all duration-500 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Premium Circular Ring */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 via-amber-500/30 to-blue-500/20 blur-2xl animate-pulse" />

        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] drop-shadow-2xl">
          <circle
            stroke="rgba(255, 255, 255, 0.12)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="url(#premiumGrad)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.15s ease-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />

          <defs>
            <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-400 tracking-tight font-sans drop-shadow-md">
            {progress}%
          </span>
        </div>
      </div>

      {/* Narrative Subtitle */}
      <div className="mt-5 text-center px-4">
        <p className="text-[11px] tracking-[0.3em] font-extrabold text-amber-400 uppercase mb-1.5 font-sans drop-shadow-sm">
          CARREGANDO EXPERIÊNCIA
        </p>
        <p className="text-sm font-semibold text-emerald-100 tracking-wide font-sans max-w-sm transition-all duration-200">
          {milestone}
        </p>
      </div>
    </div>
  );
};
