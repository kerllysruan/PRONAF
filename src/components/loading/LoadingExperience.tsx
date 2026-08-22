import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MEDIA_CONFIG, preloadCriticalAssets } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // 24s total (6s per stage for relaxed reading)
  onComplete?: () => void;
}

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
  duration = 24,
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

    // Switch active stage every 25% (6s per stage)
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
    preloadCriticalAssets();

    const ctx = gsap.context(() => {
      const progObj = { value: 0 };

      // Master GSAP Timeline with Motion Design FX
      const tl = gsap.timeline({
        onComplete: () => {
          setShowBrandReveal(true);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onComplete?.();
            }, 800);
          }, 2500);
        },
      });

      // 1. Progress bar counter animation
      tl.to(progObj, {
        value: 100,
        duration: duration,
        ease: 'none',
        onUpdate: () => updateProgress(progObj.value),
      }, 0);

      // 2. Solar Lens Flare Motion Sweep
      tl.to('.lens-flare-sweep', {
        x: '120vw',
        y: '40vh',
        scale: 1.6,
        opacity: 0.8,
        duration: duration,
        ease: 'sine.inOut',
      }, 0);

      // 3. Cyber Tech Scanline Sweep across topography
      tl.to('.tech-scanline', {
        top: '100%',
        duration: duration,
        ease: 'power1.inOut',
        repeat: -1,
      }, 0);

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, updateProgress]);

  // Stage text animation reset trigger on stage change
  useEffect(() => {
    if (showBrandReveal) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.stage-title-text',
        { y: 40, opacity: 0, filter: 'blur(12px)', scale: 0.95 },
        { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.2, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.stage-subtitle-text',
        { y: 25, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, delay: 0.3, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.golden-line-glow',
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 1.4, delay: 0.5, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeStageIndex, showBrandReveal]);

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-800 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* ── CINEMATIC BACKGROUND LAYERS WITH DYNAMIC CAMERA MOTION & FOCUS RACK ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url]) => {
        const isCurrentBg = currentStage.bgKey === key;
        return (
          <div
            key={key}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 transform filter saturate-[1.35] contrast-[1.15] brightness-[1.2] ${
              isCurrentBg
                ? 'opacity-100 scale-105 rotate-0 blur-none'
                : 'opacity-0 scale-110 rotate-1 blur-sm pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${url})`,
              transitionProperty: 'opacity, transform, filter',
            }}
          />
        );
      })}

      {/* Light Ambient Overlay for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/50 pointer-events-none" />

      {/* ── MOTION FX 1: Solar Lens Flare Dynamic Motion Sweep ── */}
      <div className="lens-flare-sweep absolute -top-40 -left-40 w-[650px] h-[650px] bg-radial-flare pointer-events-none opacity-40 mix-blend-screen" />

      {/* ── MOTION FX 2: SVG Cyber Scanline Traversing Topography ── */}
      <div className="tech-scanline absolute left-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none opacity-60 shadow-[0_0_15px_rgba(251,191,36,0.9)]" />

      {/* Volumetric Particles Simulation */}
      <DataParticles intensity="high" />

      {/* ── TOP FIXED HEADER BADGE ── */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-20 px-4">
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-amber-400/40">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
          <span
            className="text-xs font-black tracking-[0.25em] text-amber-300 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            SUPER GESTÃO — PRONAF
          </span>
        </div>
      </div>

      {/* ── CENTER AREA: CINEMATIC STAGGERED TYPOGRAPHY & LIGHT LINE EXPANSION ── */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
        {!showBrandReveal ? (
          <div className="flex flex-col items-center justify-center text-center space-y-5 max-w-4xl mx-auto">
            {/* Stage Title (Outfit Ultra-Black Typography + Motion Blur Entrance) */}
            <h2
              className="stage-title-text text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 via-yellow-200 to-emerald-200 drop-shadow-[0_10px_35px_rgba(0,0,0,0.98)]"
              style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
            >
              {currentStage.title}
            </h2>

            {/* Glowing Golden Light Line Expansion */}
            <div className="golden-line-glow w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

            {/* Stage Subtitle */}
            <p className="stage-subtitle-text text-base sm:text-2xl md:text-3xl font-bold text-slate-50 tracking-wide font-sans leading-relaxed max-w-3xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.98)]">
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
