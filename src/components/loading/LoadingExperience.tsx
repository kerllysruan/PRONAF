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

/* ──────────────────────────────────────────────────────────
   MILESTONES — labels that change as the progress advances
   ────────────────────────────────────────────────────────── */
function milestoneFor(p: number): string {
  if (p < 18) return 'Amanhecer no campo brasileiro…';
  if (p < 38) return 'Agricultura familiar em ação…';
  if (p < 58) return 'Produção e colheita rural…';
  if (p < 78) return 'Conectando dados e informações…';
  if (p < 94) return 'Analisando oportunidades PRONAF…';
  return 'Tudo pronto!';
}

/* ──────────────────────────────────────────────────────────
   COMPONENT
   Duration default = 7 s  (pleasant, not too short, not long)
   ────────────────────────────────────────────────────────── */
export const LoadingExperience: React.FC<LoadingExperienceProps> = ({
  duration = 7,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [milestone, setMilestone] = useState('Amanhecer no campo brasileiro…');
  const [scene, setScene] = useState(1);
  const [showCards, setShowCards] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const updateProgress = useCallback((v: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(v)));
    setProgress(clamped);
    setMilestone(milestoneFor(clamped));
  }, []);

  /* ── GSAP master timeline ── */
  useEffect(() => {
    preloadCriticalAssets();

    const ctx = gsap.context(() => {
      const prog = { v: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete() {
          setFadingOut(true);
          setTimeout(() => onComplete?.(), 700);
        },
      });

      /* Scene 01 — Dawn glow (0 → 1.2 s) */
      tl.call(() => setScene(1))
        .fromTo('.dawn-gradient', { opacity: 0 }, { opacity: 1, duration: 1.2 })
        .fromTo('.dawn-flare', { scale: 0.5, opacity: 0 }, { scale: 1.1, opacity: 0.7, duration: 1.2 }, '<')
        .to(prog, { v: 18, duration: 1.2, onUpdate: () => updateProgress(prog.v) }, '<');

      /* Scene 02 — Field reveal with parallax (1.2 → 2.4 s) */
      tl.call(() => setScene(2))
        .to('.field-photo', { opacity: 1, scale: 1.06, duration: 1.2, ease: 'sine.inOut' })
        .to(prog, { v: 38, duration: 1.2, onUpdate: () => updateProgress(prog.v) }, '<');

      /* Scene 03 — Producer & harvest cards (2.4 → 3.8 s) */
      tl.call(() => { setScene(3); setShowCards(true); })
        .fromTo('.card-grid', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.0, ease: 'back.out(1.2)' })
        .to(prog, { v: 58, duration: 1.4, onUpdate: () => updateProgress(prog.v) }, '<');

      /* Scene 04 — Data network lines (3.8 → 5.2 s) */
      tl.call(() => { setScene(4); setShowNetwork(true); })
        .to('.card-grid', { opacity: 0.15, scale: 0.92, filter: 'blur(4px)', duration: 0.8 })
        .to(prog, { v: 80, duration: 1.4, onUpdate: () => updateProgress(prog.v) }, '<');

      /* Scene 05 — Progress ring + convergence (5.2 → 6.2 s) */
      tl.call(() => { setScene(5); setShowIndicator(true); setShowNetwork(false); })
        .to(prog, { v: 100, duration: 1.0, ease: 'power1.inOut', onUpdate: () => updateProgress(prog.v) });

      /* Scene 06 — Brand reveal (6.2 → 7.0 s) */
      tl.call(() => { setShowIndicator(false); setShowBrand(true); setScene(6); })
        .fromTo('.glow-burst', { scale: 0.4, opacity: 0 }, { scale: 2.5, opacity: 0.7, duration: 0.4, ease: 'power2.out' })
        .to('.glow-burst', { opacity: 0, duration: 0.4 });

    }, containerRef);

    return () => ctx.revert();
  }, [duration, onComplete, updateProgress]);

  /* ── RENDER ── */
  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[99999] overflow-hidden select-none font-sans transition-opacity duration-700 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: '#040e08' }}
    >
      {/* ── Layer 0: Base dark background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030b06] via-[#071f12] to-[#0a2a16]" />

      {/* ── Layer 1: Dawn golden gradient ── */}
      <div className="dawn-gradient absolute inset-0 opacity-0"
        style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(212,175,55,0.25) 0%, rgba(30,99,53,0.15) 40%, transparent 70%)' }}
      />

      {/* ── Layer 2: Realistic field photograph ── */}
      <div
        className="field-photo absolute inset-0 bg-cover bg-center opacity-0 scale-100 transition-transform duration-[2s]"
        style={{ backgroundImage: `url(${MEDIA_CONFIG.images.sunriseDawn})` }}
      />
      {/* Dark cinematic overlay on photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#040e08] via-[#040e08]/70 to-[#040e08]/85" />

      {/* ── Layer 3: Vignette ── */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(4,14,8,0.9) 100%)' }} />

      {/* ── Layer 4: Dawn lens flare ── */}
      <div className="dawn-flare absolute w-[500px] h-[500px] -bottom-40 left-1/2 -translate-x-1/2 rounded-full opacity-0 mix-blend-screen pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,210,100,0.5) 0%, rgba(180,140,50,0.2) 40%, transparent 70%)' }}
      />

      {/* ── Layer 5: Atmospheric particles ── */}
      <DataParticles intensity={scene >= 4 ? 'high' : 'medium'} />

      {/* ── Layer 6: Producer & Harvest cards ── */}
      {showCards && (
        <div className="card-grid absolute inset-0 flex items-center justify-center z-20 pointer-events-none px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl w-full">
            {[
              { src: MEDIA_CONFIG.images.familyFarmer,   label: 'PRODUTOR RURAL',     alt: 'Agricultor' },
              { src: MEDIA_CONFIG.images.cornHarvest,     label: 'LAVOURAS & CUSTEIO', alt: 'Milho',     hide: 'hidden sm:block' },
              { src: MEDIA_CONFIG.images.organicProduce,  label: 'PRODUÇÃO AGRÍCOLA',  alt: 'Hortaliças' },
              { src: MEDIA_CONFIG.images.fruitProduce,    label: 'OPORTUNIDADES',      alt: 'Frutas',    hide: 'hidden md:block' },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl overflow-hidden border border-amber-400/25 bg-[#071f12]/80 backdrop-blur-lg shadow-[0_8px_30px_rgba(0,0,0,0.55)] p-1.5 ${card.hide ?? ''}`}>
                <img src={card.src} alt={card.alt} className="w-full h-32 sm:h-36 object-cover rounded-lg" loading="eager" />
                <p className="text-center text-[10px] font-bold text-amber-200/90 tracking-[0.18em] uppercase mt-2 mb-1">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Layer 7: SVG data network lines ── */}
      {showNetwork && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center animate-fade-in">
          <svg viewBox="0 0 800 400" className="w-full max-w-3xl h-auto opacity-80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.7" />
              </linearGradient>
              <filter id="gl"><feGaussianBlur stdDeviation="3" /><feComposite in="SourceGraphic" /></filter>
            </defs>
            <g filter="url(#gl)">
              <path d="M100 320 Q200 200 300 280 Q400 160 500 240 Q600 120 700 200" fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M150 200 L400 180 L650 220" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
              <path d="M100 320 Q250 100 400 180 Q550 100 700 200" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.5" />
            </g>
            {/* Nodes */}
            {[
              { cx: 100, cy: 320, label: 'Produtor' },
              { cx: 300, cy: 280, label: 'Propriedade' },
              { cx: 400, cy: 180, label: 'Produção' },
              { cx: 500, cy: 240, label: 'Dados' },
              { cx: 700, cy: 200, label: 'Análise' },
            ].map(n => (
              <g key={n.label}>
                <circle cx={n.cx} cy={n.cy} r="5" fill="#fbbf24" filter="url(#gl)" />
                <text x={n.cx} y={n.cy - 14} textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="700" fontFamily="sans-serif">{n.label}</text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* ── Layer 8: Golden glow burst (brand reveal) ── */}
      <div className="glow-burst absolute inset-0 m-auto w-80 h-80 rounded-full pointer-events-none opacity-0 z-30"
        style={{ background: 'radial-gradient(circle, rgba(255,220,130,0.7) 0%, rgba(67,189,104,0.3) 40%, transparent 70%)' }}
      />

      {/* ── Layer 9: Centered indicator / brand ── */}
      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
        <LoadingIndicator progress={progress} milestone={milestone} visible={showIndicator} />
        <BrandReveal visible={showBrand} />
      </div>

      {/* ── Letterbox bars ── */}
      <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#040e08] to-transparent z-30 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#040e08] to-transparent z-30 pointer-events-none" />

      {/* ── Bottom progress bar ── */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center z-40 px-8 pointer-events-none">
        <div className="w-full max-w-xs h-1 rounded-full overflow-hidden bg-[#0a2a16] border border-amber-900/30">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-sky-400 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};
