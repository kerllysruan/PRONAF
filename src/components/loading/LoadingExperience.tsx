import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MEDIA_CONFIG, preloadCriticalAssets } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // 14s optimal timeline (3.5s per stage)
  onComplete?: () => void;
}

// Interconnected narrative storytelling stages
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
  duration = 14,
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

    // Switch stage every 25% (3.5 seconds per stage)
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

      // Master GSAP Timeline
      const tl = gsap.timeline({
        onComplete: () => {
          setShowBrandReveal(true);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onComplete?.();
            }, 600);
          }, 1000);
        },
      });

      // 1. Smooth Progress Counter over 14 seconds
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

      // 3. Cyber Tech Scanline Sweep
      tl.to('.tech-scanline', {
        top: '100%',
        duration: duration,
        ease: 'power1.inOut',
        repeat: -1,
      }, 0);

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, updateProgress]);

  // GSAP GPU-Accelerated Camera Push & Focus-Rack Image Transitions
  useEffect(() => {
    const currentKey = STAGES[activeStageIndex].bgKey;
    const ctx = gsap.context(() => {
      // Transition active image in with camera push & focus rack
      gsap.fromTo(
        `.bg-layer-${currentKey}`,
        { opacity: 0, scale: 1.12, filter: 'blur(8px) saturate(1.1)' },
        { opacity: 0.95, scale: 1.02, filter: 'blur(0px) saturate(1.35)', duration: 1.6, ease: 'sine.inOut' }
      );

      // Fade out non-active images
      Object.keys(MEDIA_CONFIG.images).forEach((key) => {
        if (key !== currentKey) {
          gsap.to(`.bg-layer-${key}`, {
            opacity: 0,
            scale: 1.08,
            filter: 'blur(6px)',
            duration: 1.2,
            ease: 'sine.inOut',
          });
        }
      });

      // Staggered text entrance
      if (!showBrandReveal) {
        gsap.fromTo(
          '.stage-title-text',
          { y: 30, opacity: 0, filter: 'blur(10px)', scale: 0.97 },
          { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.2, ease: 'sine.out' }
        );
        gsap.fromTo(
          '.stage-subtitle-text',
          { y: 18, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, delay: 0.2, ease: 'sine.out' }
        );
        gsap.fromTo(
          '.golden-line-glow',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 1.3, delay: 0.35, ease: 'sine.out' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [activeStageIndex, showBrandReveal]);

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-600 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* ── GPU-ACCELERATED GSAP CAMERA PUSH & FOCUS-RACK BACKGROUND LAYERS ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url]) => {
        return (
          <div
            key={key}
            className={`bg-layer-${key} absolute inset-0 bg-cover bg-center opacity-0 filter contrast-[1.12] brightness-[1.08] pointer-events-none`}
            style={{
              backgroundImage: `url(${url})`,
              willChange: 'opacity, transform, filter',
              transform: 'translateZ(0)',
            }}
          />
        );
      })}

      {/* Light Ambient Overlay & Focal Area Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-slate-950/50 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-70" />

      {/* ── MOTION FX 1: Solar Lens Flare Sweep ── */}
      <div className="lens-flare-sweep absolute -top-40 -left-40 w-[650px] h-[650px] bg-radial-flare pointer-events-none opacity-40 mix-blend-screen" />

      {/* ── MOTION FX 2: SVG Cyber Scanline Sweep ── */}
      <div className="tech-scanline absolute left-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none opacity-60 shadow-[0_0_15px_rgba(251,191,36,0.9)]" />

      {/* Volumetric Particles Simulation */}
      <DataParticles intensity="high" />

      {/* ── TOP FIXED HEADER BADGE ── */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-20 px-4">
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-950/75 backdrop-blur-md border border-amber-400/40 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
          <span
            className="text-xs font-black tracking-[0.25em] text-amber-300 uppercase"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.95))',
            }}
          >
            SUPER GESTÃO — PRONAF
          </span>
        </div>
      </div>

      {/* ── CENTER AREA: PROFESSIONAL SHADOW ENGINE & SUNBURST GOLD TYPOGRAPHY ── */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
        {!showBrandReveal ? (
          <div className="flex flex-col items-center justify-center text-center space-y-5 max-w-4xl mx-auto">
            {/* Stage Title (Outfit Ultra-Black Typography + Dual-Layer Shadow Engine) */}
            <h2
              className="stage-title-text text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fcd34d] via-[#fbbf24] to-[#f59e0b]"
              style={{
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                filter: 'drop-shadow(0px 8px 30px rgba(0, 0, 0, 0.98)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.95))',
              }}
            >
              {currentStage.title}
            </h2>

            {/* Glowing Golden Light Line Expansion */}
            <div className="golden-line-glow w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.9)]" />

            {/* Stage Subtitle (Platinum White with Outline Shadow) */}
            <p
              className="stage-subtitle-text text-base sm:text-2xl md:text-3xl font-bold text-[#f8fafc] tracking-wide font-sans leading-relaxed max-w-3xl"
              style={{
                filter: 'drop-shadow(0px 4px 16px rgba(0, 0, 0, 0.98)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.9))',
              }}
            >
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
