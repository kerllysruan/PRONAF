import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MEDIA_CONFIG, preloadCriticalAssets } from '@/config/imageConfig';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // 6 seconds total (smooth, fast & pleasant)
  onComplete?: () => void;
}

const STAGES = [
  {
    title: 'O CAMPO DESPERTA',
    subtitle: 'Soluções para o desenvolvimento e produção rural brasileira',
    bgKey: 'sunriseDawn',
  },
  {
    title: 'AGRICULTURA FAMILIAR',
    subtitle: 'Apoio financeiro e inteligência para quem produz no campo',
    bgKey: 'aerialCrops',
  },
  {
    title: 'TECNOLOGIA E CONEXÃO',
    subtitle: 'Informações organizadas em oportunidades de crédito PRONAF',
    bgKey: 'familyFarmer',
  },
  {
    title: 'ANÁLISE DE OPORTUNIDADES',
    subtitle: 'Estruturação ágil e inteligente de propostas agrícolas',
    bgKey: 'cornHarvest',
  },
];

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 6,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [showBrandReveal, setShowBrandReveal] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const updateProgress = useCallback((val: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(val)));
    setProgress(clamped);

    // Update active stage index based on progress percentage
    if (clamped < 25) {
      setActiveStageIndex(0);
    } else if (clamped < 50) {
      setActiveStageIndex(1);
    } else if (clamped < 75) {
      setActiveStageIndex(2);
    } else {
      setActiveStageIndex(3);
    }
  }, []);

  useEffect(() => {
    // Preload background images into browser memory on mount
    preloadCriticalAssets();

    const ctx = gsap.context(() => {
      const progObj = { value: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          setShowBrandReveal(true);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onComplete?.();
            }, 700);
          }, 1200);
        },
      });

      // Smooth percentage progress counter from 0 to 100%
      tl.to(progObj, {
        value: 100,
        duration: duration,
        ease: 'none',
        onUpdate: () => updateProgress(progObj.value),
      });

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, updateProgress]);

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* ── BACKGROUND LAYER: Smooth Image Crossfades ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url], idx) => {
        const isCurrentBg = currentStage.bgKey === key;
        return (
          <div
            key={key}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 transform scale-105 ${
              isCurrentBg ? 'opacity-40' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${url})` }}
          />
        );
      })}

      {/* Dark Gradient Overlay for Maximum Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-slate-950/90 pointer-events-none" />

      {/* Top Header Logo (Fixed & Clean, No Overlap) */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-20 px-4">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-900/60 border border-amber-400/30 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-widest text-amber-200 uppercase">
            SUPER GESTÃO — PRONAF
          </span>
        </div>
      </div>

      {/* ── CENTER AREA: Non-Overlapping Phase Content ── */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
        {!showBrandReveal ? (
          <div
            key={activeStageIndex}
            className="flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto animate-fade-in"
          >
            {/* Stage Title */}
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-emerald-200 tracking-wider uppercase font-sans drop-shadow-md">
              {currentStage.title}
            </h2>

            {/* Stage Subtitle */}
            <p className="text-sm sm:text-base font-medium text-emerald-200/90 tracking-wide font-sans leading-relaxed">
              {currentStage.subtitle}
            </p>
          </div>
        ) : (
          <BrandReveal visible={showBrandReveal} />
        )}
      </div>

      {/* ── BOTTOM AREA: Progress Bar Present from Frame 1 Entrance ── */}
      <div className="absolute bottom-8 inset-x-0 z-30 px-6">
        <LoadingIndicator
          progress={progress}
          stageLabel={currentStage.title}
        />
      </div>
    </div>
  );
};
