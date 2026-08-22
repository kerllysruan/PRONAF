import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLoadingExperience } from '@/hooks/useLoadingExperience';
import { MEDIA_CONFIG } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { DataNetwork } from './DataNetwork';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number;
  onComplete?: () => void;
}

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 9,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isReducedMotion = useReducedMotion();
  const { progress, setProgress, currentMilestone } = useLoadingExperience(onComplete);

  const [activeScene, setActiveScene] = useState<number>(1);
  const [isConverging, setIsConverging] = useState<boolean>(false);
  const [showIndicator, setShowIndicator] = useState<boolean>(false);
  const [showBrand, setShowBrand] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  useEffect(() => {
    if (isReducedMotion) {
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
          }, 900);
        },
      });

      const scene1Duration = duration * 0.15; // Dawn video flare (0 - 1.35s)
      const scene2Duration = duration * 0.18; // Field camera pan (1.35 - 2.97s)
      const scene3Duration = duration * 0.16; // Human & Harvest Cards (2.97 - 4.41s)
      const scene4Duration = duration * 0.17; // SVG Data Network (4.41 - 5.94s)
      const scene5Duration = duration * 0.12; // Data Gathering (5.94 - 7.02s)
      const scene6Duration = duration * 0.12; // Meter 100% (7.02 - 8.1s)
      const scene7Duration = duration * 0.10; // Brand Reveal (8.1 - 9.0s)

      const progressObj = { value: 0 };

      // SCENE 01 — AMANHECER CINEMATOGRÁFICO
      tl.to('.video-lens-flare', {
        opacity: 0.85,
        scale: 1.2,
        duration: scene1Duration,
        ease: 'power2.inOut',
        onStart: () => setActiveScene(1),
      })
      .to(progressObj, {
        value: 20,
        duration: scene1Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, 0);

      // SCENE 02 — O CAMPO (Drone Camera Zoom & Pan)
      tl.to('.cinematic-video-bg', {
        scale: 1.15,
        opacity: 1,
        filter: 'blur(0px) contrast(1.08) brightness(1.05)',
        duration: scene2Duration,
        ease: 'power2.out',
        onStart: () => setActiveScene(2),
      })
      .to(progressObj, {
        value: 40,
        duration: scene2Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, `-=${scene2Duration * 0.3}`);

      // SCENE 03 — PRODUTOR E PRODUÇÃO (Realistic Photorealistic Overlays)
      tl.to('.realistic-producer-grid', {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: scene3Duration,
        ease: 'power3.out',
        onStart: () => setActiveScene(3),
      })
      .to(progressObj, {
        value: 60,
        duration: scene3Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, `-=${scene3Duration * 0.2}`);

      // SCENE 04 — A CONEXÃO TECNOLÓGICA
      tl.to('.network-layer', {
        opacity: 1,
        duration: scene4Duration,
        ease: 'power2.out',
        onStart: () => setActiveScene(4),
      })
      .to(progressObj, {
        value: 78,
        duration: scene4Duration,
        onUpdate: () => setProgress(progressObj.value),
      }, `-=${scene4Duration * 0.3}`);

      // SCENE 05 — OS DADOS SE ORGANIZAM
      tl.to('.realistic-producer-grid', {
        opacity: 0.12,
        scale: 0.92,
        filter: 'blur(4px)',
        duration: scene5Duration * 0.7,
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

      // SCENE 07 — REVELAÇÃO DA MARCA (Realistic Light Burst & Brand Reveal)
      tl.call(() => {
        setShowIndicator(false);
        setShowBrand(true);
        setActiveScene(7);
      })
      .to('.brand-glow-burst', {
        scale: 2.8,
        opacity: 0.75,
        duration: 0.7,
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
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Real HTML5 Video Background Layer */}
      {!videoError && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className="cinematic-video-bg absolute inset-0 w-full h-full object-cover opacity-0 transform scale-100 filter blur-sm contrast-105 transition-all duration-1000"
        >
          <source src={MEDIA_CONFIG.videos.sunriseField} type="video/mp4" />
        </video>
      )}

      {/* Photorealistic High-Res Fallback / Layer */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          videoError ? 'opacity-90 scale-105' : 'opacity-30 mix-blend-overlay'
        }`}
        style={{ backgroundImage: `url(${MEDIA_CONFIG.images.sunriseDawn})` }}
      />

      {/* Cinematic Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-slate-950/80 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-80" />

      {/* Realistic Anamorphic Lens Flare */}
      <div className="video-lens-flare absolute -top-32 -left-32 w-[600px] h-[600px] bg-radial-flare pointer-events-none opacity-40 mix-blend-screen" />

      {/* Volumetric Fog & Sunlight Particles */}
      <DataParticles intensity={activeScene >= 4 ? 'high' : 'medium'} reducedMotion={isReducedMotion} />

      {/* Scene 03 - Real Photorealistic Producer & Harvest Cards */}
      <div className="realistic-producer-grid absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transform translate-y-8 scale-95 filter blur-xs transition-all duration-700 z-15">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 max-w-5xl w-full">
          {/* Family Farmer Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-300/40 bg-emerald-950/75 backdrop-blur-md p-2 group">
            <img
              src={MEDIA_CONFIG.images.familyFarmer}
              alt="Agricultor Rural"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest block font-sans">
                Produtor Rural
              </span>
            </div>
          </div>

          {/* Corn Harvest Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-300/40 bg-emerald-950/75 backdrop-blur-md p-2 hidden sm:block group">
            <img
              src={MEDIA_CONFIG.images.cornHarvest}
              alt="Colheita de Milho"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest block font-sans">
                Lavouras & Custeio
              </span>
            </div>
          </div>

          {/* Fresh Produce Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-300/40 bg-emerald-950/75 backdrop-blur-md p-2 group">
            <img
              src={MEDIA_CONFIG.images.organicProduce}
              alt="Hortaliças e Produção"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest block font-sans">
                Produção Agrícola
              </span>
            </div>
          </div>

          {/* Fruit Harvest Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-amber-300/40 bg-emerald-950/75 backdrop-blur-md p-2 hidden md:block group">
            <img
              src={MEDIA_CONFIG.images.fruitProduce}
              alt="Fruticultura"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-widest block font-sans">
                Oportunidades
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Intelligent Data Network */}
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

      {/* Cinematic Letterbox Bars (Top & Bottom Video Framing) */}
      <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-30" />
      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-30" />

      {/* Bottom Progress Bar & Stage Indicator */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center justify-center z-40 px-6">
        <div className="w-full max-w-xs bg-emerald-950/80 backdrop-blur-md rounded-full h-1.5 p-0.5 border border-amber-400/30 overflow-hidden shadow-lg">
          <div
            className="bg-gradient-to-r from-emerald-400 via-amber-400 to-blue-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
