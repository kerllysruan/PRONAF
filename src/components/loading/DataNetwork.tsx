import React from 'react';

interface DataNetworkProps {
  opacity?: number;
  converging?: boolean;
}

export const DataNetwork: React.FC<DataNetworkProps> = ({
  opacity = 1,
  converging = false,
}) => {
  const nodes = [
    { id: 'produtor', x: 200, y: 360, label: 'PRODUTOR' },
    { id: 'propriedade', x: 160, y: 200, label: 'PROPRIEDADE' },
    { id: 'producao', x: 380, y: 450, label: 'PRODUÇÃO' },
    { id: 'informacao', x: 640, y: 430, label: 'DADOS RURAIS' },
    { id: 'analise', x: 800, y: 240, label: 'ANÁLISE INTELIGENTE' },
    { id: 'oportunidade', x: 840, y: 390, label: 'OPORTUNIDADES' },
    { id: 'supergestao', x: 500, y: 290, label: 'SUPER GESTÃO - PRONAF' },
  ];

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-500"
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full preserve-3d"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cyberGreenGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#43bd68" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
          </linearGradient>

          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Laser Network Connections */}
        <g filter="url(#neonGlow)">
          <path
            d="M 160 200 Q 180 280 200 360 Q 290 410 380 450 Q 440 370 500 290 Q 570 360 640 430 Q 720 330 800 240 Q 820 310 840 390"
            fill="none"
            stroke="url(#cyberGreenGold)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <path
            d="M 200 360 L 500 290 L 800 240"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="8 8"
            opacity="0.85"
          />

          <path
            d="M 160 200 Q 330 160 500 290 Q 670 160 800 240"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.75"
            opacity="0.75"
          />
        </g>

        {/* Dynamic Glowing Nodes */}
        <g>
          {nodes.map((node) => {
            const isCenter = node.id === 'supergestao';
            return (
              <g
                key={node.id}
                transform={
                  converging && !isCenter
                    ? `translate(${500 - node.x}, ${290 - node.y}) scale(0)`
                    : 'translate(0,0)'
                }
                style={{
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Pulse Ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCenter ? 16 : 10}
                  fill="none"
                  stroke={isCenter ? '#f59e0b' : '#34d399'}
                  strokeWidth="2"
                  className="animate-ping opacity-50"
                  style={{ animationDuration: '2s' }}
                />

                {/* Core Node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCenter ? 9 : 6}
                  fill={isCenter ? '#fbbf24' : '#60a5fa'}
                  filter="url(#neonGlow)"
                />

                {/* Glassmorphic Node Badge */}
                <g transform={`translate(${node.x}, ${node.y - 20})`}>
                  <rect
                    x="-50"
                    y="-13"
                    width="100"
                    height="20"
                    rx="10"
                    fill="rgba(6, 30, 18, 0.9)"
                    stroke="rgba(245, 158, 11, 0.6)"
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill="#fef3c7"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="sans-serif"
                    letterSpacing="0.8px"
                  >
                    {node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
