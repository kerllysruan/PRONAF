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
  const R = 58;
  const STROKE = 4;
  const NR = R - STROKE * 2;
  const C = NR * 2 * Math.PI;
  const offset = C - (progress / 100) * C;

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center transition-all duration-400 animate-fade-in">
      {/* Ring */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute inset-2 rounded-full bg-emerald-500/10 blur-xl" />

        <svg height={R * 2} width={R * 2} className="rotate-[-90deg]">
          <circle stroke="rgba(255,255,255,0.07)" fill="transparent" strokeWidth={STROKE} r={NR} cx={R} cy={R} />
          <circle
            stroke="url(#ringGrad)"
            fill="transparent"
            strokeWidth={STROKE}
            strokeDasharray={`${C} ${C}`}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.15s ease-out' }}
            strokeLinecap="round"
            r={NR} cx={R} cy={R}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-amber-200 drop-shadow-sm">{progress}%</span>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-5 text-center px-4 space-y-1.5">
        <span className="inline-block px-3 py-0.5 rounded-full bg-[#071f12]/80 border border-emerald-700/30 text-[9px] tracking-[0.3em] font-extrabold text-emerald-400 uppercase">
          CARREGANDO
        </span>
        <p className="text-sm font-medium text-amber-100/80 tracking-wide max-w-[240px]">{milestone}</p>
      </div>
    </div>
  );
};
