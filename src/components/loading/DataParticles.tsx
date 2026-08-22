import React, { useEffect, useRef } from 'react';

interface DataParticlesProps {
  intensity?: 'low' | 'medium' | 'high';
}

interface Particle {
  x: number; y: number; r: number; vx: number; vy: number;
  alpha: number; maxA: number; speed: number; color: string;
}

export const DataParticles: React.FC<DataParticlesProps> = ({ intensity = 'medium' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const count = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 70;
    const colors = ['rgba(255,220,130,', 'rgba(52,211,153,', 'rgba(96,165,250,'];

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.35 - 0.1,
      alpha: Math.random() * 0.4 + 0.08,
      maxA: Math.random() * 0.6 + 0.15,
      speed: Math.random() * 0.012 + 0.003,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.speed;
        if (p.alpha > p.maxA || p.alpha < 0.05) p.speed = -p.speed;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        if (p.r > 1.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.18})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, [intensity]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 mix-blend-screen opacity-85" />;
};
