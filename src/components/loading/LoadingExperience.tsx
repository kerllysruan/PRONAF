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
 * DESIGN PHILOSOPHY — "Stillness, then Motion"
 * ─────────────────────────────────────────────
 * Stage 0: STATIC hero. Image + text appear clean and still.
 *          No animations, no particles, no effects. Pure elegance.
 *          The user reads the first message in total calm.
 *
 * Stages 1–3: Gentle crossfade transitions between images.
 *             Subtle Ken Burns drift gives life to the photography.
 *             Text fades in softly — no spring, no blur, no 3D.
 *
 * Brand Reveal: Clean fade to brand identity, then handover.
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

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 14,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [showBrandReveal, setShowBrandReveal] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const isFirstStage = useRef(true);

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

      // Smooth progress counter
      tl.to(progObj, {
        value: 100,
        duration,
        ease: 'none',
        onUpdate: () => updateProgress(progObj.value),
      }, 0);

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, updateProgress]);

  // ── IMAGE & TEXT TRANSITIONS ──
  useEffect(() => {
    const currentKey = STAGES[activeStageIndex].bgKey;

    const ctx = gsap.context(() => {

      if (isFirstStage.current) {
        // ── STAGE 0: STATIC HERO — No animation, instant display ──
        const firstLayer = containerRef.current?.querySelector(`.bg-layer-${currentKey}`) as HTMLElement;
        if (firstLayer) {
          gsap.set(firstLayer, {
            opacity: 0.95,
            scale: 1,
            filter: 'blur(0px) brightness(1.08) saturate(1.3) contrast(1.12)',
          });
        }

        // Text appears instantly — no motion, pure stillness
        gsap.set('.stage-title-text', { opacity: 1, y: 0 });
        gsap.set('.stage-subtitle-text', { opacity: 1, y: 0 });
        gsap.set('.golden-line-glow', { opacity: 1, scaleX: 1 });

        isFirstStage.current = false;
        return;
      }

      // ── STAGES 1–3: Gentle Crossfade Transitions ──

      // Fade out all non-active images smoothly
      Object.keys(MEDIA_CONFIG.images).forEach((key) => {
        if (key !== currentKey) {
          gsap.to(`.bg-layer-${key}`, {
            opacity: 0,
            duration: 1.8,
            ease: 'power1.inOut',
          });
        }
      });

      // Fade in active image with gentle Ken Burns drift
      const activeLayer = containerRef.current?.querySelector(`.bg-layer-${currentKey}`) as HTMLElement;
      if (activeLayer) {
        gsap.fromTo(activeLayer,
          {
            opacity: 0,
            scale: 1.04,
            filter: 'blur(0px) brightness(1.08) saturate(1.3) contrast(1.12)',
          },
          {
            opacity: 0.95,
            scale: 1.0,
            duration: 1.8,
            ease: 'power1.inOut',
          }
        );
      }

      // ── TEXT: Soft fade-in only (no blur, no spring, no 3D) ──
      if (!showBrandReveal) {
        gsap.fromTo('.stage-title-text',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power2.out' }
        );
        gsap.fromTo('.golden-line-glow',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.6, delay: 0.5, ease: 'power2.out' }
        );
        gsap.fromTo('.stage-subtitle-text',
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.6, ease: 'power2.out' }
        );
      }

    }, containerRef);

    return () => ctx.revert();
  }, [activeStageIndex, showBrandReveal]);

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* ── BACKGROUND IMAGE LAYERS ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url]) => (
        <div
          key={key}
          className={`bg-layer-${key} absolute inset-0 bg-cover bg-center opacity-0 pointer-events-none`}
          style={{
            backgroundImage: `url(${url})`,
            willChange: 'opacity, transform',
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Ambient Vignette for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-slate-950/50 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-60 z-[1]" />

      {/* Subtle Particles (low intensity — not distracting) */}
      <DataParticles intensity={activeStageIndex === 0 ? 'low' : 'medium'} />

      {/* ── TOP HEADER BADGE ── */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-20 px-4">
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-amber-400/35 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
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

      {/* ── CENTER: CLEAN TYPOGRAPHY ── */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6">
        {!showBrandReveal ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-4xl mx-auto">
            {/* Title */}
            <h2
              className="stage-title-text gold-shimmer-text text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-r from-[#fffbeb] via-[#fcd34d] via-[#fbbf24] to-[#f59e0b]"
              style={{
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                filter: 'drop-shadow(0px 8px 30px rgba(0,0,0,0.98)) drop-shadow(0px 2px 4px rgba(0,0,0,0.95))',
              }}
            >
              {currentStage.title}
            </h2>

            {/* Golden Line */}
            <div className="golden-line-glow w-52 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

            {/* Subtitle */}
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

      {/* ── BOTTOM: Progress Bar ── */}
      <div className="absolute bottom-8 inset-x-0 z-30 px-6">
        <LoadingIndicator progress={progress} stageLabel={currentStage.title} />
      </div>
    </div>
  );
};
