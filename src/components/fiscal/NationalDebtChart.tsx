'use client';

import type { NationalDebtHistoryEntry } from './types';

export function NationalDebtChart({ data }: { data: NationalDebtHistoryEntry[] }) {
  const W = 800;
  const H = 320;
  const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const minY = Math.floor(Math.min(...data.map((d) => d.ratio)) / 5) * 5;
  const maxY = Math.ceil(Math.max(...data.map((d) => d.ratio)) / 5) * 5 + 5;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.ratio).toFixed(1)}`)
    .join(' ');

  const areaPath = linePath + ` L ${xScale(data.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;

  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 5) yTicks.push(v);

  return (
    <div className="border border-gray-800 p-3 md:p-5">
      <div className="text-base md:text-base font-bold text-gray-300 mb-3">
        GDP 대비 국가채무비율 (D1 기준, 2013~2025)
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ maxHeight: '360px' }}>
          {/* Grid lines */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={yScale(v)}
                x2={W - PAD.right}
                y2={yScale(v)}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray={v === minY ? 'none' : '4,4'}
              />
              <text
                x={PAD.left - 8}
                y={yScale(v) + 4}
                textAnchor="end"
                fill="#6b7280"
                fontSize="12"
                fontFamily="monospace"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#debtGradient)" opacity="0.3" />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Data points and labels */}
          {data.map((d, i) => (
            <g key={d.year}>
              <circle
                cx={xScale(i)}
                cy={yScale(d.ratio)}
                r="5"
                fill="#ef4444"
                stroke="#1f2937"
                strokeWidth="2"
              />
              <text
                x={xScale(i)}
                y={yScale(d.ratio) - 12}
                textAnchor="middle"
                fill="#f87171"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {d.ratio.toFixed(1)}%
              </text>
              <text
                x={xScale(i)}
                y={H - PAD.bottom + 20}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="11"
                fontFamily="monospace"
              >
                {d.year}
              </text>
              <text
                x={xScale(i)}
                y={H - PAD.bottom + 35}
                textAnchor="middle"
                fill="#4b5563"
                fontSize="9"
                fontFamily="monospace"
              >
                {d.debt.toFixed(0)}조
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-600">
        <span>● 국가채무비율 (GDP 대비 %)</span>
        <span>|</span>
        <span>출처: e-나라지표, 기획재정부</span>
      </div>
    </div>
  );
}
