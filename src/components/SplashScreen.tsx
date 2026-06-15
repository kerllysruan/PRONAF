import { useState, useEffect } from "react";

export function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const [phase, setPhase] = useState<"animate" | "fadeout" | "done">("animate");

  useEffect(() => {
    // Start fade-out after 3 seconds
    const fadeTimer = setTimeout(() => setPhase("fadeout"), 3000);
    // Remove component after fade-out completes
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onFinished();
    }, 3500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  if (phase === "done") return null;

  return (
    <div
      className="splash-screen"
      style={{
        opacity: phase === "fadeout" ? 0 : 1,
        transition: "opacity 0.5s ease-out",
      }}
    >
      {/* Animated background gradient */}
      <div className="splash-bg" />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="splash-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${3 + Math.random() * 5}px`,
            height: `${3 + Math.random() * 5}px`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Main SVG Scene */}
      <div className="splash-scene">
        <svg
          viewBox="0 0 800 500"
          className="splash-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sun */}
          <g className="splash-sun">
            <circle cx="400" cy="120" r="50" fill="#FFB830" opacity="0.9" />
            <circle cx="400" cy="120" r="65" fill="#FFB830" opacity="0.15" className="splash-sun-glow" />
            <circle cx="400" cy="120" r="85" fill="#FFB830" opacity="0.08" className="splash-sun-glow-outer" />
            {/* Sun rays */}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={i}
                x1="400"
                y1="120"
                x2={400 + Math.cos((i * 30 * Math.PI) / 180) * 100}
                y2={120 + Math.sin((i * 30 * Math.PI) / 180) * 100}
                stroke="#FFB830"
                strokeWidth="1.5"
                opacity="0.3"
                className="splash-ray"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </g>

          {/* Background hills */}
          <path
            d="M0,350 Q150,250 300,320 Q450,200 600,300 Q700,250 800,280 L800,500 L0,500 Z"
            fill="#2D7A3A"
            opacity="0.3"
            className="splash-hill-back"
          />

          {/* Foreground hills */}
          <path
            d="M0,380 Q200,300 350,360 Q500,280 650,340 Q750,310 800,330 L800,500 L0,500 Z"
            fill="#3A9E4F"
            opacity="0.5"
            className="splash-hill-front"
          />

          {/* Ground */}
          <path
            d="M0,400 Q200,370 400,390 Q600,370 800,400 L800,500 L0,500 Z"
            fill="#2E7D32"
            opacity="0.7"
          />

          {/* Wheat stalks group - left */}
          {[160, 200, 240, 280, 320].map((x, i) => (
            <g key={`left-${i}`} className="splash-wheat" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
              <line x1={x} y1="390" x2={x + (i % 2 ? 5 : -5)} y2={280 - i * 5} stroke="#8BC34A" strokeWidth="2.5" strokeLinecap="round" />
              {/* Wheat grain */}
              <ellipse cx={x + (i % 2 ? 5 : -5)} cy={275 - i * 5} rx="4" ry="10" fill="#FFD54F" opacity="0.9" />
              <ellipse cx={x + (i % 2 ? 10 : -10)} cy={285 - i * 5} rx="3.5" ry="8" fill="#FFD54F" opacity="0.8" />
              <ellipse cx={x + (i % 2 ? 0 : 0)} cy={285 - i * 5} rx="3.5" ry="8" fill="#FFD54F" opacity="0.8" />
              {/* Small leaves */}
              <path d={`M${x},${350 - i * 3} Q${x + 15},${340 - i * 3} ${x + 20},${350 - i * 3}`} fill="none" stroke="#66BB6A" strokeWidth="1.5" />
              <path d={`M${x},${330 - i * 3} Q${x - 15},${320 - i * 3} ${x - 20},${330 - i * 3}`} fill="none" stroke="#66BB6A" strokeWidth="1.5" />
            </g>
          ))}

          {/* Wheat stalks group - right */}
          {[480, 520, 560, 600, 640].map((x, i) => (
            <g key={`right-${i}`} className="splash-wheat" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
              <line x1={x} y1="390" x2={x + (i % 2 ? -5 : 5)} y2={280 - i * 5} stroke="#8BC34A" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx={x + (i % 2 ? -5 : 5)} cy={275 - i * 5} rx="4" ry="10" fill="#FFD54F" opacity="0.9" />
              <ellipse cx={x + (i % 2 ? -10 : 10)} cy={285 - i * 5} rx="3.5" ry="8" fill="#FFD54F" opacity="0.8" />
              <ellipse cx={x + (i % 2 ? 0 : 0)} cy={285 - i * 5} rx="3.5" ry="8" fill="#FFD54F" opacity="0.8" />
              <path d={`M${x},${350 - i * 3} Q${x - 15},${340 - i * 3} ${x - 20},${350 - i * 3}`} fill="none" stroke="#66BB6A" strokeWidth="1.5" />
              <path d={`M${x},${330 - i * 3} Q${x + 15},${320 - i * 3} ${x + 20},${330 - i * 3}`} fill="none" stroke="#66BB6A" strokeWidth="1.5" />
            </g>
          ))}

          {/* Small house (family farming) */}
          <g className="splash-house" style={{ animationDelay: "0.8s" }}>
            {/* House body */}
            <rect x="365" y="340" width="70" height="55" rx="3" fill="#795548" opacity="0.85" />
            {/* Roof */}
            <polygon points="355,343 400,305 445,343" fill="#5D4037" opacity="0.9" />
            {/* Door */}
            <rect x="390" y="365" width="20" height="30" rx="2" fill="#3E2723" opacity="0.8" />
            {/* Window */}
            <rect x="372" y="352" width="14" height="12" rx="1" fill="#FFECB3" opacity="0.7" />
            <line x1="379" y1="352" x2="379" y2="364" stroke="#795548" strokeWidth="1" opacity="0.5" />
            <line x1="372" y1="358" x2="386" y2="358" stroke="#795548" strokeWidth="1" opacity="0.5" />
            {/* Chimney smoke */}
            <path d="M425,330 Q430,315 422,300 Q428,285 420,270" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" className="splash-smoke" />
          </g>

          {/* Birds */}
          {[
            { x: 200, y: 150, delay: "1s" },
            { x: 250, y: 130, delay: "1.3s" },
            { x: 580, y: 140, delay: "1.1s" },
            { x: 620, y: 160, delay: "1.5s" },
          ].map((bird, i) => (
            <path
              key={`bird-${i}`}
              d={`M${bird.x - 8},${bird.y} Q${bird.x - 4},${bird.y - 6} ${bird.x},${bird.y} Q${bird.x + 4},${bird.y - 6} ${bird.x + 8},${bird.y}`}
              fill="none"
              stroke="#37474F"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="splash-bird"
              style={{ animationDelay: bird.delay }}
            />
          ))}
        </svg>
      </div>

      {/* Text content */}
      <div className="splash-text">
        <div className="splash-logo-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22 16 8" />
            <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
            <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
            <path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
            <path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
          </svg>
        </div>
        <h1 className="splash-title">PRONAF</h1>
        <p className="splash-subtitle">Agricultura Familiar</p>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}
