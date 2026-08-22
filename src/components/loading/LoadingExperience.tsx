import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLoadingExperience } from '@/hooks/useLoadingExperience';
import { IMAGE_CONFIG } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { DataNetwork } from './DataNetwork';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // total duration in seconds (default 9s)
  onComplete?: () => void;
}

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 9,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isReducedMotion = useReducedMotion();
  const { progress, setProgress, currentMilestone } = useLoadingExperience(onComplete);

  const [activeScene, setActiveScene] = useState<number>(1);
  const [isConverging, setIsConverging] = useState<boolean>(false);
  const [showIndicator, setShowIndicator] = useState<boolean>(false);
  const [showBrand, setShowBrand] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (isReducedMotion) {
      // Instant skip for reduced motion preference
      setProgress(100);
      setShowBrand(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete?.();
          }, 800);
        },
      });

      // Master Timeline Duration Allocation (Total ~ 9s)
      const scene1Duration = duration * 0.15; // Amanhecer (0 - 1.35s)
      const scene2Duration = duration * 0.18; // O Campo (1.35 - 2.97s)
      const scene3Duration = duration * 0.15; // Produtor e Produção (2.97 - 4.32s)
      const scene4Duration = duration * 0.17; // Conexões SVG (4.32 - 5.85s)
      const scene5Duration = duration * 0.12; // Convergência dos dados (5.85 - 6.93s)
      const scene6Duration = duration * 0.13; // Meter 100% (6.93 - 8.1s)
      const scene7Duration = duration * 0.10; // Revelação e transição (8.1 - 9.0s)

      // Timeline Progress proxy object for synchronized percentage counter
      const progressObj = { value: 0 };

      // SCENE 01 — AMANHECER (Dawn Glow)
      tl.to('.scene-dawn-overlay', {
        opacity: 0.2,
        duration: scene1Duration,
        ease: 'power2.inOut',
        onStart: () => {
          setActiveScene(1);
        },
      })
      .to(progressObj, {
        value: 20,
        duration: scene1Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, 0);

      // SCENE 02 — O CAMPO (Parallax Field Zoom & Pan)
      tl.to('.scene-field-bg', {
        scale: 1.12,
        opacity: 1,
        duration: scene2Duration,
        ease: 'sine.inOut',
        onStart: () => {
          setActiveScene(2);
        },
      })
      .to(progressObj, {
        value: 40,
        duration: scene2Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, `-=${scene2Duration * 0.3}`);

      // SCENE 03 — PRODUTOR E PRODUÇÃO (Human & Harvest Cards Reveal)
      tl.to('.producer-cards-group', {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: scene3Duration,
        ease: 'power3.out',
        onStart: () => {
          setActiveScene(3);
        },
      })
      .to(progressObj, {
        value: 60,
        duration: scene3Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, `-=${scene3Duration * 0.2}`);

      // SCENE 04 — A CONEXÃO (SVG Network emergence)
      tl.to('.network-layer', {
        opacity: 1,
        duration: scene4Duration,
        ease: 'power2.out',
        onStart: () => {
          setActiveScene(4);
        },
      })
      .to(progressObj, {
        value: 78,
        duration: scene4Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, `-=${scene4Duration * 0.3}`);

      // SCENE 05 — OS DADOS SE ORGANIZAM (Convergence towards center)
      tl.to('.producer-cards-group', {
        opacity: 0.15,
        scale: 0.9,
        duration: scene5Duration * 0.6,
      })
      .call(() => {
        setIsConverging(true);
        setActiveScene(5);
      })
      .to(progressObj, {
        value: 90,
        duration: scene5Duration,
        onUpdate: () => setProgress(progressObj.value),
      });

      // SCENE 06 — LOADING METER (0% -> 100%)
      tl.call(() => {
        setShowIndicator(true);
        setActiveScene(6);
      })
      .to(progressObj, {
        value: 100,
        duration: scene6Duration,
        ease: 'power1.inOut',
        onUpdate: () => setProgress(progressObj.value),
      });

      // SCENE 07 — REVELAÇÃO DA MARCA (Brand Reveal)
      tl.call(() => {
        setShowIndicator(false);
        setShowBrand(true);
        setActiveScene(7);
      })
      .to('.brand-glow-burst', {
        scale: 2.5,
        opacity: 0.6,
        duration: 0.6,
        ease: 'power2.out',
      })
      .to('.brand-glow-burst', {
        opacity: 0,
        duration: 0.8,
      })
      .to({}, { duration: scene7Duration });

    }, containerRef);

    return () => ctx.revert();
  }, [duration, isReducedMotion, onComplete, setProgress]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-emerald-950 font-sans select-none transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background Dawn Atmosphere & Dawn Field */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950 to-green-950" />

      {/* Field Landscape Image Layer */}
      <div
        className="scene-field-bg absolute inset-0 bg-cover bg-center opacity-0 transform scale-100 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${IMAGE_CONFIG.narrative.dawnField})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-slate-950/80" />
      </div>

      {/* Scene 01 Dawn Light Flare Overlay */}
      <div className="scene-dawn-overlay absolute inset-0 bg-radial-dawn pointer-events-none opacity-80" />

      {/* Atmospheric Dust & Light Particles */}
      <DataParticles intensity={activeScene >= 4 ? 'high' : 'medium'} reducedMotion={isReducedMotion} />

      {/* Scene 03 - Human & Harvest Visual Cards Overlay */}
      <div className="producer-cards-group absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transform translate-y-6 scale-95 transition-all duration-700 z-15">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 max-w-5xl w-full">
          {/* Family Farmer Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-emerald-900/60 backdrop-blur-md p-2">
            <img
              src={IMAGE_CONFIG.narrative.familyFarmer}
              alt="Agricultura Familiar"
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest">
                Agricultura Familiar
              </span>
            </div>
          </div>

          {/* Corn Crop Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-emerald-900/60 backdrop-blur-md p-2 hidden sm:block">
            <img
              src={IMAGE_CONFIG.narrative.cornCrop}
              alt="Lavouras e Milho"
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest">
                Lavouras & Custeio
              </span>
            </div>
          </div>

          {/* Fresh Vegetables Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-emerald-900/60 backdrop-blur-md p-2">
            <img
              src={IMAGE_CONFIG.narrative.freshVegetables}
              alt="Hortaliças e Produção"
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest">
                Produção Agrícola
              </span>
            </div>
          </div>

          {/* Fruit Harvest Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-400/30 bg-emerald-900/60 backdrop-blur-md p-2 hidden md:block">
            <img
              src={IMAGE_CONFIG.narrative.fruitHarvest}
              alt="Frutas e Oportunidades"
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="mt-2 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest">
                Fruticultura
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scene 04 & 05 SVG Network Layer */}
      <div className="network-layer absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-700">
        <DataNetwork opacity={activeScene >= 4 ? 1 : 0} converging={isConverging} />
      </div>

      {/* Scene 07 Light Expansion Burst */}
      <div className="brand-glow-burst absolute inset-0 m-auto w-96 h-96 rounded-full bg-radial-glow pointer-events-none opacity-0 scale-50 z-25" />

      {/* Centered Loading Meter & Brand Reveal Container */}
      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
        <LoadingIndicator
          progress={progress}
          milestone={currentMilestone}
          visible={showIndicator}
        />

        <BrandReveal visible={showBrand} />
      </div>

      {/* Bottom Progress Bar & Stage Indicator */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center z-40 px-6">
        <div className="w-full max-w-xs bg-emerald-900/60 backdrop-blur-md rounded-full h-1.5 p-0.5 border border-emerald-500/20 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 via-amber-400 to-blue-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
