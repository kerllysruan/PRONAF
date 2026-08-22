import React, { useEffect, useRef } from 'react';

interface RealisticAtmosphereProps {
  intensity?: 'low' | 'medium' | 'high';
  reducedMotion?: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
  color: string;
}

interface FogCloud {
  x: number;
  y: number;
  radius: number;
  vx: number;
  alpha: number;
}

export const DataParticles: React.FC<RealisticAtmosphereProps> = ({
  intensity = 'medium',
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = intensity === 'low' ? 30 : intensity === 'medium' ? 60 : 100;

    // Atmospheric sun dust & light specks
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.15, // Floating upward in morning thermal air currents
      alpha: Math.random() * 0.5 + 0.1,
      maxAlpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.015 + 0.004,
      color: Math.random() > 0.4 ? 'rgba(255, 225, 150, ' : 'rgba(70, 200, 120, ',
    }));

    // Realistic Volumetric Fog / Mist clouds floating over lower field horizon
    const fogCount = 8;
    const fogClouds: FogCloud[] = Array.from({ length: fogCount }, () => ({
      x: Math.random() * width,
      y: height * 0.65 + Math.random() * (height * 0.3),
      radius: Math.random() * 250 + 180,
      vx: Math.random() * 0.3 + 0.1, // Gentle morning wind drift
      alpha: Math.random() * 0.12 + 0.05,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Realistic Volumetric Fog Layer
      fogClouds.forEach((cloud) => {
        cloud.x += cloud.vx;
        if (cloud.x - cloud.radius > width) {
          cloud.x = -cloud.radius;
        }

        const grad = ctx.createRadialGradient(
          cloud.x,
          cloud.y,
          0,
          cloud.x,
          cloud.y,
          cloud.radius
        );
        grad.addColorStop(0, `rgba(220, 240, 210, ${cloud.alpha})`);
        grad.addColorStop(0.5, `rgba(180, 220, 190, ${cloud.alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Sunlight Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        p.alpha += p.pulseSpeed;
        if (p.alpha > p.maxAlpha || p.alpha < 0.08) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Realistic Soft Lens Glow
        if (p.radius > 1.6) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.alpha * 0.2})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full mix-blend-screen opacity-90"
    />
  );
};
