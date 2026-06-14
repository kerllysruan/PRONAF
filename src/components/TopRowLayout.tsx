import * as React from "react";

interface TopRowLayoutProps {
  /** Left side: typically KPI cards container */
  left: React.ReactNode;
  /** Center side: main chart (e.g., BarChart) */
  center: React.ReactNode;
  /** Right side: secondary chart (e.g., PieChart) */
  right: React.ReactNode;
}

/**
 * A premium flex container that arranges three sections horizontally.
 * - Left (25%): stacked KPI cards.
 * - Center (45%): primary chart.
 * - Right (30%): secondary doughnut/pie chart.
 * All sections inherit a subtle glass‑morphism background.
 */
export default function TopRowLayout({ left, center, right }: TopRowLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
      <div className="flex-1 md:w-1/4 space-y-4" style={{ flexBasis: "25%" }}>
        {left}
      </div>
      <div className="flex-1 md:w-2/5" style={{ flexBasis: "45%" }}>
        {center}
      </div>
      <div className="flex-1 md:w-3/10" style={{ flexBasis: "30%" }}>
        {right}
      </div>
    </div>
  );
}
