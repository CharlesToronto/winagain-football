import React from "react";

interface LineChartMockProps {
  data?: number[];
  height?: number;
}

export default function LineChartMock({ data = [2, 3, 1, 4, 2.5, 3.8], height = 120 }: LineChartMockProps) {
  const maxValue = Math.max(...data) + 1;
  const points = data
    .map((value, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }} className="w-full">
      <defs>
        <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <polygon
        points={`${points} 100,100 0,100`}
        fill="url(#lineGradient)"
        opacity="0.3"
      />
    </svg>
  );
}
