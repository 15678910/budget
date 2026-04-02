'use client';

import { useEffect } from 'react';
import type { MetroDebtHistoryEntry } from './types';

export function MetroDebtRatioModal({
  name,
  history,
  onClose,
}: {
  name: string;
  history: MetroDebtHistoryEntry[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (history.length === 0) return null;

  const W = 600;
  const H = 280;
  const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios) / 2) * 2;
  const maxY = Math.ceil(Math.max(...ratios) / 2) * 2 + 2;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const areaPath = linePath + ` L ${xScale(history.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;

  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 2) yTicks.push(v);

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-gray-700 rounded-lg max-w-2xl w-full p-5 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-200">{name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none px-2"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        <div className="text-base text-gray-400">예산 대비 채무비율 추이 ({first.year}~{latest.year})</div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '300px' }}>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#374151" strokeWidth="1" strokeDasharray={v === minY ? 'none' : '4,4'} />
                <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill="#6b7280" fontSize="12" fontFamily="monospace">{v}%</text>
              </g>
            ))}
            <path d={areaPath} fill="url(#metroGrad)" opacity="0.3" />
            <defs>
              <linearGradient id="metroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={change > 2 ? '#ef4444' : '#fbbf24'} stopOpacity="0.6" />
                <stop offset="100%" stopColor={change > 2 ? '#ef4444' : '#fbbf24'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {history.map((h, i) => (
              <g key={h.year}>
                <circle cx={xScale(i)} cy={yScale(h.ratio)} r="5" fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} stroke="#1f2937" strokeWidth="2" />
                <text x={xScale(i)} y={yScale(h.ratio) - 12} textAnchor="middle" fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} fontSize="11" fontWeight="bold" fontFamily="monospace">{h.ratio.toFixed(1)}%</text>
                <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">{h.year}</text>
                <text x={xScale(i)} y={H - PAD.bottom + 33} textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="monospace">{(h.debt / 10000).toFixed(1)}조</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-gray-800 pt-3">
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 채무비율</div>
            <div className={`text-lg font-mono font-bold ${latest.ratio > 15 ? 'text-red-400' : latest.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{latest.ratio.toFixed(1)}%</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">변동폭 ({first.year}→{latest.year})</div>
            <div className={`text-lg font-mono font-bold ${change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%p</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 채무</div>
            <div className="text-lg font-mono font-bold text-gray-300">{(latest.debt / 10000).toFixed(1)}조원</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 예산</div>
            <div className="text-lg font-mono font-bold text-cyan-400">{(latest.budget / 10000).toFixed(1)}조원</div>
          </div>
        </div>

        {/* Year-by-year table */}
        <div className="border-t border-gray-800 pt-3">
          <div className="text-sm text-gray-500 mb-2">연도별 상세</div>
          <div className="grid grid-cols-4 gap-1 text-sm text-gray-500 mb-1 px-1">
            <span>연도</span>
            <span className="text-right">채무(억원)</span>
            <span className="text-right">예산(억원)</span>
            <span className="text-right">비율</span>
          </div>
          {history.map((h) => (
            <div key={h.year} className="grid grid-cols-4 gap-1 text-sm px-1 py-0.5 border-t border-gray-800/50">
              <span className="text-gray-400 font-mono">{h.year}</span>
              <span className="text-right text-gray-400 font-mono tabular-nums">{h.debt.toLocaleString('ko-KR')}</span>
              <span className="text-right text-gray-400 font-mono tabular-nums">{h.budget.toLocaleString('ko-KR')}</span>
              <span className={`text-right font-mono font-bold tabular-nums ${h.ratio > 15 ? 'text-red-400' : h.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{h.ratio.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
