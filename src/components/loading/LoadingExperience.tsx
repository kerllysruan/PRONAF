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
    subtitle: 'Conectando as informações do campo para gerar inteligência e oportunidades.',
    bgKey: 'organicProduce',
  },
  {
    title: 'O CRÉDITO IMPULSIONA O FUTURO',
    subtitle: 'Facilitando a análise e o acesso ao financiamento',
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
  const isInitialRender = useRef(true);

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
          // At 100%: Show Brand Reveal and hold for 3.5 seconds for comfortable reading
          setShowBrandReveal(true);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => onComplete?.(), 600);
          }, 3500);
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

  // ── STAGE TRANSITIONS ──
  useEffect(() => {
    const currentKey = STAGES[activeStageIndex].bgKey;

    // ── STAGE 0 (ENTRANCE): 100% STATIC — Zero transition, zero animation ──
    if (isInitialRender.current) {
      isInitialRender.current = false;
      const firstLayer = containerRef.current?.querySelector(`.bg-layer-${currentKey}`) as HTMLElement;
      if (firstLayer) {
        firstLayer.style.opacity = '0.95';
        firstLayer.style.transform = 'scale(1)';
        firstLayer.style.filter = 'blur(0px) brightness(1.08) saturate(1.3) contrast(1.12)';
      }
      return; // Stop here! No entrance animation on stage 0.
    }

    // ── STAGES 1 TO 3: Gentle Crossfade Transitions ──
    const ctx = gsap.context(() => {
      // Fade out non-active images
      Object.keys(MEDIA_CONFIG.images).forEach((key) => {
        if (key !== currentKey) {
          gsap.to(`.bg-layer-${key}`, {
            opacity: 0,
            duration: 1.8,
            ease: 'power1.inOut',
          });
        }
      });

      // Fade in active image
      const activeLayer = containerRef.current?.querySelector(`.bg-layer-${currentKey}`) as HTMLElement;
      if (activeLayer) {
        gsap.fromTo(
          activeLayer,
          {
            opacity: 0,
            scale: 1.03,
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

      // Soft text fade-in only for subsequent stages
      if (!showBrandReveal) {
        gsap.fromTo(
          '.stage-title-text',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power2.out' }
        );
        gsap.fromTo(
          '.golden-line-glow',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.6, delay: 0.4, ease: 'power2.out' }
        );
        gsap.fromTo(
          '.stage-subtitle-text',
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.5, ease: 'power2.out' }
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
      {/* ── BACKGROUND IMAGE LAYERS ── */}
      {Object.entries(MEDIA_CONFIG.images).map(([key, url], idx) => (
        <div
          key={key}
          className={`bg-layer-${key} absolute inset-0 bg-cover bg-center pointer-events-none`}
          style={{
            backgroundImage: `url(${url})`,
            // Stage 0 starts 100% visible instantly with zero animation delay
            opacity: idx === 0 ? 0.95 : 0,
            filter: 'brightness(1.08) saturate(1.3) contrast(1.12)',
            willChange: 'opacity, transform',
            transform: 'translateZ(0)',
          }}
        />
      ))}

      {/* Ambient Overlay & Vignette for Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-slate-950/50 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-60 z-[1]" />

      {/* Subtle Dust Particles */}
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

      {/* ── CENTER: TYPOGRAPHY ── */}
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

      {/* ── BOTTOM: Progress Bar Present from Frame 1 ── */}
      <div className="absolute bottom-8 inset-x-0 z-30 px-6">
        <LoadingIndicator progress={progress} stageLabel={currentStage.title} />
      </div>
    </div>
  );
};
