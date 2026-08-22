import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MEDIA_CONFIG, preloadCriticalAssets } from '@/config/imageConfig';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // 16 seconds total for relaxed, natural reading speed
  onComplete?: () => void;
}

// Interconnected narrative storytelling stages (each connected logically to the next)
const STAGES = [
  {
    title: 'O CAMPO BRASILEIRO DESPERTA',
    subtitle: 'Na terra fértil do Brasil, o trabalho rural transforma dedicação em produção.',
    bgKey: 'sunriseDawn',
  },
  {
    title: 'A AGRICULTURA FAMILIAR PRODUZ',
    subtitle: 'Da lavoura ao alimento, a força do produtor movimenta a economia do país.',
    bgKey: 'aerialCrops',
  },
  {
    title: 'A TECNOLOGIA ORGANIZA OS DADOS',
    subtitle: 'Conectamos as informações do campo para gerar inteligência e oportunidades.',
    bgKey: 'organicProduce',
  },
  {
    title: 'O CRÉDITO IMPULSIONA O FUTURO',
    subtitle: 'Facilitamos a análise e o acesso ao financiamento agrícola do PRONAF.',
    bgKey: 'cornHarvest',
  },
];

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 16,
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

    // Smooth stage transitions aligned with progress percentage (4s per stage)
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
    // Preload background images into browser cache immediately
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
            }, 800);
          }, 1800);
        },
      });

      // Smooth progress counter over 16 seconds (4 seconds per narrative stage)
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
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-800 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* ── HIGH VISIBILITY VIVID BACKGROUND IMAGES ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url]) => {
        const isCurrentBg = currentStage.bgKey === key;
        return (
          <div
            key={key}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 transform filter saturate-[1.25] contrast-[1.1] brightness-[1.05] ${
              isCurrentBg ? 'opacity-85 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{ backgroundImage: `url(${url})` }}
          />
        );
      })}

      {/* Light Ambient Vignette for Image Visibility & Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-slate-950/40 to-slate-950/70 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-60" />

      {/* Top Header Badge (Fixed, Clean, Zero Overlap) */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-20 px-4">
        <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-emerald-950/80 border-2 border-amber-400/50 backdrop-blur-xl shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span
            className="text-xs font-black tracking-widest text-amber-200 uppercase"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            SUPER GESTÃO — PRONAF
          </span>
        </div>
      </div>

      {/* ── CENTER AREA: Interconnected Narrative Headlines ── */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
        {!showBrandReveal ? (
          <div
            key={activeStageIndex}
            className="flex flex-col items-center justify-center text-center space-y-4 max-w-2xl mx-auto animate-fade-in"
          >
            {/* Stage Title */}
            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]"
              style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
            >
              {currentStage.title}
            </h2>

            {/* Stage Subtitle */}
            <div className="px-6 py-3 rounded-xl bg-emerald-950/85 border border-amber-400/40 backdrop-blur-md shadow-xl">
              <p className="text-sm sm:text-lg font-bold text-amber-100 tracking-wide font-sans leading-relaxed">
                {currentStage.subtitle}
              </p>
            </div>
          </div>
        ) : (
          <BrandReveal visible={showBrandReveal} />
        )}
      </div>

      {/* ── BOTTOM AREA: Loading Bar Present from Entrance 0% ── */}
      <div className="absolute bottom-8 inset-x-0 z-30 px-6">
        <LoadingIndicator
          progress={progress}
          stageLabel={currentStage.title}
        />
      </div>
    </div>
  );
};
