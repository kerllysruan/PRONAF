import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useLoadingExperience } from '@/hooks/useLoadingExperience';
import { MEDIA_CONFIG } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { DataNetwork } from './DataNetwork';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // Total duration in seconds (default 16s)
  onComplete?: () => void;
}

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 16,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { progress, setProgress, currentMilestone } = useLoadingExperience(onComplete);

  const [activeScene, setActiveScene] = useState<number>(1);
  const [isConverging, setIsConverging] = useState<boolean>(false);
  const [showIndicator, setShowIndicator] = useState<boolean>(false);
  const [showBrand, setShowBrand] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete?.();
          }, 1000);
        },
      });

      // Explicit Sequential Stage Durations (Total = ~16 seconds)
      const scene1Dur = 2.5; // Amanhecer no Campo (0 - 2.5s)
      const scene2Dur = 2.5; // O Campo & Drone View (2.5 - 5.0s)
      const scene3Dur = 2.8; // Produtor e Produção (5.0 - 7.8s)
      const scene4Dur = 2.5; // Conexão Tecnológica (7.8 - 10.3s)
      const scene5Dur = 2.0; // Convergência de Dados (10.3 - 12.3s)
      const scene6Dur = 2.2; // Medidor 100% (12.3 - 14.5s)
      const scene7Dur = 2.0; // Revelação da Marca (14.5 - 16.5s)

      const progressObj = { value: 0 };

      // SCENE 01 — AMANHECER (0s - 2.5s)
      tl.call(() => setActiveScene(1))
        .to('.video-lens-flare', {
          opacity: 0.85,
          scale: 1.25,
          duration: scene1Dur,
          ease: 'power2.inOut',
        })
        .to(
          progressObj,
          {
            value: 20,
            duration: scene1Dur,
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 02 — O CAMPO (2.5s - 5.0s)
      tl.call(() => setActiveScene(2))
        .to('.cinematic-video-bg', {
          scale: 1.15,
          opacity: 1,
          filter: 'blur(0px) contrast(1.08) brightness(1.05)',
          duration: scene2Dur,
          ease: 'power2.out',
        })
        .to(
          progressObj,
          {
            value: 40,
            duration: scene2Dur,
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 03 — PRODUTOR E PRODUÇÃO (5.0s - 7.8s)
      tl.call(() => setActiveScene(3))
        .to('.realistic-producer-grid', {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: scene3Dur,
          ease: 'power3.out',
        })
        .to(
          progressObj,
          {
            value: 60,
            duration: scene3Dur,
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 04 — A CONEXÃO TECNOLÓGICA (7.8s - 10.3s)
      tl.call(() => setActiveScene(4))
        .to('.network-layer', {
          opacity: 1,
          duration: scene4Dur,
          ease: 'power2.out',
        })
        .to(
          progressObj,
          {
            value: 78,
            duration: scene4Dur,
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 05 — OS DADOS SE ORGANIZAM (10.3s - 12.3s)
      tl.call(() => {
          setIsConverging(true);
          setActiveScene(5);
        })
        .to('.realistic-producer-grid', {
          opacity: 0.12,
          scale: 0.92,
          filter: 'blur(4px)',
          duration: scene5Dur,
        })
        .to(
          progressObj,
          {
            value: 90,
            duration: scene5Dur,
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 06 — LOADING METER (12.3s - 14.5s)
      tl.call(() => {
          setShowIndicator(true);
          setActiveScene(6);
        })
        .to(progressObj, {
          value: 100,
          duration: scene6Dur,
          ease: 'power1.inOut',
          onUpdate: () => setProgress(progressObj.value),
        });

      // SCENE 07 — REVELAÇÃO DA MARCA SUPER GESTÃO (14.5s - 16.5s)
      tl.call(() => {
          setShowIndicator(false);
          setShowBrand(true);
          setActiveScene(7);
        })
        .to('.brand-glow-burst', {
          scale: 3.0,
          opacity: 0.8,
          duration: 1.0,
          ease: 'power2.out',
        })
        .to('.brand-glow-burst', {
          opacity: 0,
          duration: 1.0,
        });

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, setProgress]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden bg-slate-950 font-sans select-none transition-opacity duration-1000 ${
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

      {/* Photorealistic High-Res Fallback Layer */}
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
      <DataParticles intensity={activeScene >= 4 ? 'high' : 'medium'} />

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
