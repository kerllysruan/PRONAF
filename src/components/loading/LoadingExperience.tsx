import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useLoadingExperience } from '@/hooks/useLoadingExperience';
import { MEDIA_CONFIG, preloadMediaAssets } from '@/config/imageConfig';
import { DataParticles } from './DataParticles';
import { DataNetwork } from './DataNetwork';
import { LoadingIndicator } from './LoadingIndicator';
import { BrandReveal } from './BrandReveal';

export interface LoadingExperienceProps {
  duration?: number; // Default 5.5s (fast, premium and responsive)
  onComplete?: () => void;
}

export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 5.5,
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
    // Warm up image assets immediately in client cache
    preloadMediaAssets();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete?.();
          }, 600);
        },
      });

      // Precise 5.5s cinematic timeline stages
      const scene1Dur = 0.8; // Sunrise Dawn flare (0 - 0.8s)
      const scene2Dur = 0.9; // Crop Fields Parallax (0.8 - 1.7s)
      const scene3Dur = 1.0; // Producers & Harvest Cards (1.7 - 2.7s)
      const scene4Dur = 1.0; // Cyber-Agro SVG Mesh (2.7 - 3.7s)
      const scene5Dur = 0.8; // Data Convergence (3.7 - 4.5s)
      const scene6Dur = 1.0; // Brand Reveal (4.5 - 5.5s)

      const progressObj = { value: 0 };

      // SCENE 01 — DAWN (0s - 0.8s)
      tl.call(() => setActiveScene(1))
        .to('.video-lens-flare', {
          opacity: 0.85,
          scale: 1.3,
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

      // SCENE 02 — THE FIELD (0.8s - 1.7s)
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

      // SCENE 03 — PRODUCERS & CROPS (1.7s - 2.7s)
      tl.call(() => setActiveScene(3))
        .to('.realistic-producer-grid', {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: scene3Dur,
          ease: 'back.out(1.1)',
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

      // SCENE 04 — CYBER MESH (2.7s - 3.7s)
      tl.call(() => setActiveScene(4))
        .to('.network-layer', {
          opacity: 1,
          duration: scene4Dur,
          ease: 'power2.out',
        })
        .to(
          progressObj,
          {
            value: 80,
            duration: scene4Dur,
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 05 — DATA GATHERING (3.7s - 4.5s)
      tl.call(() => {
          setIsConverging(true);
          setActiveScene(5);
          setShowIndicator(true);
        })
        .to('.realistic-producer-grid', {
          opacity: 0.1,
          scale: 0.92,
          filter: 'blur(5px)',
          duration: scene5Dur,
        })
        .to(
          progressObj,
          {
            value: 100,
            duration: scene5Dur,
            ease: 'power1.inOut',
            onUpdate: () => setProgress(progressObj.value),
          },
          '<'
        );

      // SCENE 06 — BRAND REVEAL (4.5s - 5.5s)
      tl.call(() => {
          setShowIndicator(false);
          setShowBrand(true);
          setActiveScene(6);
        })
        .to('.brand-glow-burst', {
          scale: 3.0,
          opacity: 0.8,
          duration: 0.5,
          ease: 'power2.out',
        })
        .to('.brand-glow-burst', {
          opacity: 0,
          duration: 0.5,
        });

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, setProgress]);

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
          className="cinematic-video-bg absolute inset-0 w-full h-full object-cover opacity-0 transform scale-100 filter blur-sm contrast-105 transition-all duration-700"
        >
          <source src={MEDIA_CONFIG.videos.sunriseField} type="video/mp4" />
        </video>
      )}

      {/* Photorealistic High-Res Fallback Layer */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          videoError ? 'opacity-90 scale-105' : 'opacity-35 mix-blend-overlay'
        }`}
        style={{ backgroundImage: `url(${MEDIA_CONFIG.images.sunriseDawn})` }}
      />

      {/* Cinematic Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/65 to-slate-950/85 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-80" />

      {/* Realistic Anamorphic Lens Flare */}
      <div className="video-lens-flare absolute -top-32 -left-32 w-[600px] h-[600px] bg-radial-flare pointer-events-none opacity-50 mix-blend-screen" />

      {/* Volumetric Fog & Sunlight Particles */}
      <DataParticles intensity={activeScene >= 4 ? 'high' : 'medium'} />

      {/* Scene 03 - Real Photorealistic Producer & Harvest Cards */}
      <div className="realistic-producer-grid absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transform translate-y-8 scale-95 filter blur-xs transition-all duration-500 z-15">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 max-w-5xl w-full">
          {/* Family Farmer Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-amber-400/30 bg-emerald-950/80 backdrop-blur-xl p-2 group">
            <img
              src={MEDIA_CONFIG.images.familyFarmer}
              alt="Agricultor Rural"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest block font-sans">
                PRODUTOR RURAL
              </span>
            </div>
          </div>

          {/* Corn Harvest Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-amber-400/30 bg-emerald-950/80 backdrop-blur-xl p-2 hidden sm:block group">
            <img
              src={MEDIA_CONFIG.images.cornHarvest}
              alt="Colheita de Milho"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest block font-sans">
                LAVOURAS & CUSTEIO
              </span>
            </div>
          </div>

          {/* Fresh Produce Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-amber-400/30 bg-emerald-950/80 backdrop-blur-xl p-2 group">
            <img
              src={MEDIA_CONFIG.images.organicProduce}
              alt="Hortaliças e Produção"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest block font-sans">
                PRODUÇÃO AGRÍCOLA
              </span>
            </div>
          </div>

          {/* Fruit Harvest Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-amber-400/30 bg-emerald-950/80 backdrop-blur-xl p-2 hidden md:block group">
            <img
              src={MEDIA_CONFIG.images.fruitProduce}
              alt="Fruticultura"
              className="w-full h-40 object-cover rounded-xl shadow-md transition-transform duration-500 group-hover:scale-105"
            />
            <div className="mt-2.5 text-center">
              <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-widest block font-sans">
                OPORTUNIDADES
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Intelligent Data Network */}
      <div className="network-layer absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-500">
        <DataNetwork opacity={activeScene >= 4 ? 1 : 0} converging={isConverging} />
      </div>

      {/* Scene 06 Light Expansion Burst */}
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
        <div className="w-full max-w-xs bg-emerald-950/90 backdrop-blur-xl rounded-full h-1.5 p-0.5 border border-amber-400/40 overflow-hidden shadow-xl">
          <div
            className="bg-gradient-to-r from-emerald-400 via-amber-400 to-blue-400 h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
