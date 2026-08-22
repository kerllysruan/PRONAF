import React from 'react';

interface LoadingIndicatorProps {
  progress: number; // 0 to 100
  milestone: string;
  visible?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress,
  milestone,
  visible = true,
}) => {
  const radius = 64;
  const strokeWidth = 5;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all duration-700 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Circular Progress Ring */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Glowing Background Radial */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />

        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg] drop-shadow-lg">
          {/* Background circle track */}
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Active progress stroke */}
          <circle
            stroke="url(#indicatorGrad)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.3s ease-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />

          <defs>
            <linearGradient id="indicatorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#43bd68" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-amber-200 tracking-tight font-sans">
            {progress}%
          </span>
        </div>
      </div>

      {/* Narrative Milestone & Subtitle */}
      <div className="mt-5 text-center px-4">
        <p className="text-xs tracking-[0.25em] font-semibold text-emerald-400 uppercase mb-1 font-sans">
          PREPARANDO SUA EXPERIÊNCIA
        </p>
        <p className="text-sm font-medium text-amber-100/90 tracking-wide font-sans max-w-xs transition-all duration-300">
          {milestone}
        </p>
      </div>
    </div>
  );
};
