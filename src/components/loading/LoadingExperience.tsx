import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MEDIA_CONFIG, preloadCriticalAssets } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number;
  onComplete?: () => void;
}

/*
 * CINEMATIC TRANSITION SYSTEM
 * ───────────────────────────
 * Each stage uses a unique clip-path wipe reveal:
 *   Stage 0 → 1: Diagonal wipe (top-left to bottom-right)
 *   Stage 1 → 2: Circular iris expand (center outward)
 *   Stage 2 → 3: Horizontal curtain (left to right)
 *
 * All images run a continuous Ken Burns slow drift for depth of field.
 * Text enters with per-word staggered reveal + golden underline sweep.
 */

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

// Clip-path wipe patterns for each transition
const CLIP_REVEALS: Record<number, { from: string; to: string }> = {
  0: {
    from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
    to:   'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  },
  1: {
    from: 'circle(0% at 50% 50%)',
    to:   'circle(75% at 50% 50%)',
  },
  2: {
    from: 'inset(0 100% 0 0)',
    to:   'inset(0 0% 0 0)',
  },
  3: {
    from: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
    to:   'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  },
};

// Ken Burns drift directions per stage (creates continuous camera motion)
const KEN_BURNS: Record<number, { fromScale: number; toScale: number; fromX: string; toX: string; fromY: string; toY: string }> = {
  0: { fromScale: 1.0,  toScale: 1.08, fromX: '0%',  toX: '-2%', fromY: '0%',  toY: '-1%' },
  1: { fromScale: 1.05, toScale: 1.0,  fromX: '-2%', toX: '1%',  fromY: '-1%', toY: '0%' },
  2: { fromScale: 1.0,  toScale: 1.06, fromX: '1%',  toX: '-1%', fromY: '0%',  toY: '-2%' },
  3: { fromScale: 1.04, toScale: 1.0,  fromX: '-1%', toX: '0%',  fromY: '-2%', toY: '0%' },
};

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 14,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [showBrandReveal, setShowBrandReveal] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const prevStageRef = useRef<number>(0);

  const updateProgress = useCallback((val: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(val)));
    setProgress(clamped);

    if (clamped < 25) setActiveStageIndex(0);
    else if (clamped < 50) setActiveStageIndex(1);
    else if (clamped < 75) setActiveStageIndex(2);
    else setActiveStageIndex(3);
  }, []);

  // ── MASTER TIMELINE ──
  useEffect(() => {
    preloadCriticalAssets();

    const ctx = gsap.context(() => {
      const progObj = { value: 0 };

      const tl = gsap.timeline({
        onComplete: () => {
          setShowBrandReveal(true);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onComplete?.(), 500);
          }, 1000);
        },
      });

      // Progress counter
      tl.to(progObj, {
        value: 100, duration, ease: 'none',
        onUpdate: () => updateProgress(progObj.value),
      }, 0);

      // Solar lens flare sweep
      tl.to('.lens-flare-sweep', {
        x: '120vw', y: '40vh', scale: 1.6, opacity: 0.8,
        duration, ease: 'sine.inOut',
      }, 0);

      // Scanline sweep
      tl.to('.tech-scanline', {
        top: '100%', duration, ease: 'power1.inOut', repeat: -1,
      }, 0);

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, updateProgress]);

  // ── CLIP-PATH WIPE REVEAL + KEN BURNS + KINETIC TEXT ──
  useEffect(() => {
    const prevStage = prevStageRef.current;
    const currentKey = STAGES[activeStageIndex].bgKey;
    const clip = CLIP_REVEALS[activeStageIndex];
    const kb = KEN_BURNS[activeStageIndex];

    const ctx = gsap.context(() => {
      // ── IMAGE TRANSITION: Clip-Path Wipe Reveal ──
      // Outgoing image: fade + blur
      if (prevStage !== activeStageIndex) {
        const prevKey = STAGES[prevStage].bgKey;
        gsap.to(`.bg-layer-${prevKey}`, {
          opacity: 0.3,
          filter: 'blur(6px) brightness(0.7)',
          duration: 0.8,
          ease: 'power2.inOut',
        });
      }

      // Incoming image: clip-path wipe reveal + Ken Burns drift
      const layerEl = containerRef.current?.querySelector(`.bg-layer-${currentKey}`) as HTMLElement;
      if (layerEl) {
        gsap.set(layerEl, {
          opacity: 1,
          filter: 'blur(0px) brightness(1.08) saturate(1.35) contrast(1.12)',
          clipPath: clip.from,
        });

        // Cinematic clip-path wipe
        gsap.to(layerEl, {
          clipPath: clip.to,
          duration: 1.4,
          ease: 'power2.inOut',
        });

        // Ken Burns continuous camera drift
        gsap.fromTo(layerEl, {
          scale: kb.fromScale,
          x: kb.fromX,
          y: kb.fromY,
        }, {
          scale: kb.toScale,
          x: kb.toX,
          y: kb.toY,
          duration: 3.5,
          ease: 'none',
        });
      }

      // ── TEXT TRANSITIONS: Per-Word Staggered Kinetic Reveal ──
      if (!showBrandReveal) {
        // Title: Slide up from blur with slight spring
        gsap.fromTo(
          '.stage-title-text',
          { y: 40, opacity: 0, filter: 'blur(12px)', scale: 0.94, rotateX: 15 },
          { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1, rotateX: 0, duration: 1.0, ease: 'back.out(1.4)' }
        );

        // Golden line: expand from center
        gsap.fromTo(
          '.golden-line-glow',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.8, delay: 0.3, ease: 'power3.out' }
        );

        // Subtitle: Soft ascent with dissolve
        gsap.fromTo(
          '.stage-subtitle-text',
          { y: 22, opacity: 0, filter: 'blur(8px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, delay: 0.4, ease: 'power2.out' }
        );
      }

    }, containerRef);

    prevStageRef.current = activeStageIndex;
    return () => ctx.revert();
  }, [activeStageIndex, showBrandReveal]);

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ perspective: '1200px' }}
    >
      {/* ── CINEMATIC BACKGROUND LAYERS (GPU-Accelerated with will-change) ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url]) => (
        <div
          key={key}
          className={`bg-layer-${key} absolute inset-0 bg-cover bg-center opacity-0 pointer-events-none`}
          style={{
            backgroundImage: `url(${url})`,
            willChange: 'opacity, transform, filter, clip-path',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ))}

      {/* Light Ambient Overlay & Focal Area Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-slate-950/50 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-65 z-[1]" />

      {/* ── MOTION FX: Solar Lens Flare Sweep ── */}
      <div className="lens-flare-sweep absolute -top-40 -left-40 w-[650px] h-[650px] bg-radial-flare pointer-events-none opacity-40 mix-blend-screen z-[2]" />

      {/* ── MOTION FX: Cyber Scanline ── */}
      <div className="tech-scanline absolute left-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent pointer-events-none opacity-50 shadow-[0_0_12px_rgba(251,191,36,0.7)] z-[2]" />

      {/* Volumetric Particles */}
      <DataParticles intensity="high" />

      {/* ── TOP HEADER BADGE ── */}
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

      {/* ── CENTER: KINETIC SHIMMER TYPOGRAPHY ── */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
        {!showBrandReveal ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-4xl mx-auto">
            {/* Stage Title: Liquid Gold Shimmer + Spring Entrance */}
            <h2
              className="stage-title-text gold-shimmer-text text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fcd34d] via-[#fbbf24] to-[#f59e0b]"
              style={{
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                filter: 'drop-shadow(0px 8px 30px rgba(0,0,0,0.98)) drop-shadow(0px 2px 4px rgba(0,0,0,0.95))',
                transformStyle: 'preserve-3d',
              }}
            >
              {currentStage.title}
            </h2>

            {/* Golden Light Line Expansion */}
            <div className="golden-line-glow w-52 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.9)]" />

            {/* Subtitle: Platinum White with Dual Outline Shadow */}
            <p
              className="stage-subtitle-text text-base sm:text-2xl md:text-3xl font-bold text-[#f8fafc] tracking-wide font-sans leading-relaxed max-w-3xl"
              style={{
                filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.98)) drop-shadow(0px 2px 4px rgba(0,0,0,0.9))',
              }}
            >
              {currentStage.subtitle}
            </p>
          </div>
        ) : (
          <BrandReveal visible={showBrandReveal} />
        )}
      </div>

      {/* ── BOTTOM: Progress Bar from Frame 1 ── */}
      <div className="absolute bottom-8 inset-x-0 z-30 px-6">
        <LoadingIndicator progress={progress} stageLabel={currentStage.title} />
      </div>
    </div>
  );
};
