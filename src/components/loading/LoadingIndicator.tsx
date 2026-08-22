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
  const radius = 64;
  const strokeWidth = 4;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all duration-500 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Circular Progress Ring */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Soft emerald/amber halo blur */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/10 to-amber-500/10 blur-xl" />

        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          {/* Background circle track */}
          <circle
            stroke="rgba(255, 255, 255, 0.08)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke="url(#premiumRingGrad)"
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
            <linearGradient id="premiumRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-amber-200 drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Milestone label */}
      <div className="mt-6 text-center px-4">
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 backdrop-blur-md mb-2">
          <p className="text-[10px] tracking-[0.25em] font-extrabold text-emerald-400 uppercase font-sans">
            CARREGANDO SISTEMA
          </p>
        </div>
        <p className="text-sm font-semibold text-amber-100/90 tracking-wide font-sans max-w-xs truncate-2-lines">
          {milestone}
        </p>
      </div>
    </div>
  );
};
