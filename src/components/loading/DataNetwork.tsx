import React from 'react';

interface DataNetworkProps {
  opacity?: number;
  converging?: boolean;
}

export const DataNetwork: React.FC<DataNetworkProps> = ({
  opacity = 1,
  converging = false,
}) => {
  // Key node points in 1000x600 viewBox coordinate space
  const nodes = [
    { id: 'produtor', x: 220, y: 380, label: 'Produtor' },
    { id: 'propriedade', x: 180, y: 220, label: 'Propriedade' },
    { id: 'producao', x: 380, y: 440, label: 'Produção' },
    { id: 'informacao', x: 620, y: 420, label: 'Informações' },
    { id: 'analise', x: 780, y: 260, label: 'Análise Inteligente' },
    { id: 'oportunidade', x: 820, y: 380, label: 'Oportunidades' },
    { id: 'credito', x: 500, y: 300, label: 'Crédito Rural' }, // Center node
  ];

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-700"
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full preserve-3d"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#43bd68" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connecting Lines with animated dashes */}
        <g className="data-network-lines" filter="url(#glow)">
          {/* Main interconnected web */}
          <path
            d="M 180 220 Q 200 300 220 380 Q 300 410 380 440 Q 440 370 500 300 Q 560 360 620 420 Q 700 340 780 260 Q 800 320 820 380"
            fill="none"
            stroke="url(#networkGradient)"
            strokeWidth="2"
            className="network-path-main"
          />

          <path
            d="M 220 380 L 500 300 L 780 260"
            fill="none"
            stroke="#d4af37"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="network-path-dashed"
            opacity="0.7"
          />

          <path
            d="M 180 220 Q 340 180 500 300 Q 660 180 780 260"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="1.5"
            opacity="0.6"
          />

          <path
            d="M 380 440 Q 500 370 620 420"
            fill="none"
            stroke="#43bd68"
            strokeWidth="1.5"
            opacity="0.7"
          />
        </g>

        {/* Dynamic Pulsing Data Nodes */}
        <g className="data-network-nodes">
          {nodes.map((node) => {
            const isCenter = node.id === 'credito';
            return (
              <g
                key={node.id}
                className={`network-node-group node-${node.id}`}
                transform={
                  converging && !isCenter
                    ? `translate(${500 - node.x}, ${300 - node.y}) scale(0)`
                    : 'translate(0,0)'
                }
                style={{
                  transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {/* Outer pulsing ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCenter ? 14 : 9}
                  fill="none"
                  stroke={isCenter ? '#d4af37' : '#43bd68'}
                  strokeWidth="1.5"
                  className="animate-ping opacity-40"
                  style={{ animationDuration: '3s' }}
                />

                {/* Main node dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCenter ? 8 : 5}
                  fill={isCenter ? '#d4af37' : '#60a5fa'}
                  filter="url(#glow)"
                />

                {/* Node Label Badge */}
                <g transform={`translate(${node.x}, ${node.y - 18})`}>
                  <rect
                    x="-40"
                    y="-12"
                    width="80"
                    height="18"
                    rx="9"
                    fill="rgba(7, 31, 18, 0.85)"
                    stroke="rgba(212, 175, 55, 0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="#f3e5ab"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="sans-serif"
                    letterSpacing="0.5px"
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
