'use client';

import type { MetroDebtHistoryEntry, DistrictFiscalData, DistrictDebtHistoryEntry } from './types';

// ============================================================
// Metro Debt Ratio Trend (mini SVG chart per metro)
// ============================================================

export function MetroDebtRatioMiniChart({ name, history, onClick }: { name: string; history: MetroDebtHistoryEntry[]; onClick: () => void }) {
  if (history.length === 0) return null;

  const W = 200;
  const H = 80;
  const PAD = { top: 5, right: 5, bottom: 15, left: 5 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios)) - 1;
  const maxY = Math.ceil(Math.max(...ratios)) + 1;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;

  const shortName = name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');

  return (
    <div
      className="border border-gray-800 p-3 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-base font-bold text-gray-300 truncate">{shortName}</span>
        <span className={`text-base font-mono font-bold tabular-nums ${change > 2 ? 'text-red-400' : change > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {latest.ratio.toFixed(1)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '60px' }}>
        <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2" strokeLinejoin="round" />
        {history.map((h, i) => (
          <circle
            key={h.year}
            cx={xScale(i)}
            cy={yScale(h.ratio)}
            r="3"
            fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'}
          />
        ))}
        <text x={xScale(0)} y={H - 2} textAnchor="start" fill="#6b7280" fontSize="9" fontFamily="monospace">{first.year}</text>
        <text x={xScale(history.length - 1)} y={H - 2} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">{latest.year}</text>
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">채무/예산</span>
        <span className={change > 0 ? 'text-red-400' : 'text-emerald-400'}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%p ({first.year}→{latest.year})
        </span>
      </div>
    </div>
  );
}

// ============================================================
// District Debt Ratio Mini Chart
// ============================================================

export function DistrictDebtRatioMiniChart({
  district,
  history,
  onClick,
}: {
  district: DistrictFiscalData;
  history: DistrictDebtHistoryEntry[];
  onClick: () => void;
}) {
  if (history.length === 0) return null;

  const W = 200;
  const H = 80;
  const PAD = { top: 5, right: 5, bottom: 15, left: 5 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios)) - 1;
  const maxY = Math.ceil(Math.max(...ratios)) + 1;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;

  return (
    <div
      className="border border-gray-800 p-2.5 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-300 truncate">{district.name}</span>
        <span className={`text-sm font-mono font-bold tabular-nums ${change > 2 ? 'text-red-400' : change > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {latest.ratio.toFixed(1)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '50px' }}>
        <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2" strokeLinejoin="round" />
        {history.map((h, i) => (
          <circle
            key={h.year}
            cx={xScale(i)}
            cy={yScale(h.ratio)}
            r="2.5"
            fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'}
          />
        ))}
        <text x={xScale(0)} y={H - 2} textAnchor="start" fill="#6b7280" fontSize="9" fontFamily="monospace">{first.year}</text>
        <text x={xScale(history.length - 1)} y={H - 2} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">{latest.year}</text>
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 italic">추정</span>
        <span className={change > 0 ? 'text-red-400' : 'text-emerald-400'}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%p
        </span>
      </div>
    </div>
  );
}
