'use client';

import { useMemo } from 'react';
import type { BudgetEfficiencyResult, EfficiencyPoint, Quadrant } from '@/lib/sdg/effectiveness';

interface Props {
  data: BudgetEfficiencyResult;
  selected: string;
  onSelect: (region: string) => void;
}

// 사분면 한글 라벨(spec D2). x=예산, y=달성도.
const QUADRANT_LABEL: Record<Quadrant, string> = {
  efficient: '효율형 (저예산·고성과)',
  invest: '적극투자형 (고예산·고성과)',
  review: '점검필요 (고예산·저성과)',
  limited: '여력부족 (저예산·저성과)',
};

const QUADRANT_COLOR: Record<Quadrant, string> = {
  efficient: '#16a34a', // emerald-600
  invest: '#0ea5e9', // sky-500
  review: '#f97316', // orange-500
  limited: '#94a3b8', // slate-400
};

// SVG 좌표계 (viewBox 단위). 데이터값과 무관한 고정 레이아웃.
const W = 640;
const H = 440;
const PAD = { top: 28, right: 24, bottom: 48, left: 56 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export default function EfficiencyScatter({ data, selected, onSelect }: Props) {
  const { points, medianX, medianY } = data;

  // x축 도메인: 1인당 예산 [0, max*1.08]. y축: 달성도 0~100 고정.
  const xMax = useMemo(() => {
    const m = points.reduce((mx, p) => Math.max(mx, p.perCapitaBudget), 0);
    return m > 0 ? m * 1.08 : 1;
  }, [points]);

  const sx = (v: number) => PAD.left + (v / xMax) * PLOT_W;
  const sy = (v: number) => PAD.top + (1 - v / 100) * PLOT_H; // 0 아래, 100 위

  const medXpx = sx(medianX);
  const medYpx = sy(medianY);

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto rounded-lg border border-slate-700 bg-slate-900/40"
        role="img"
        aria-label="예산 대비 종합 달성도 효율 사분면 산점도"
      >
        {/* 사분면 배경 라벨 (중앙값 분할). 좌상=효율형, 우상=적극투자형, 우하=점검필요, 좌하=여력부족 */}
        <text x={(PAD.left + medXpx) / 2} y={PAD.top + 14} textAnchor="middle"
          className="fill-emerald-400/70" fontSize={12}>효율형</text>
        <text x={(medXpx + W - PAD.right) / 2} y={PAD.top + 14} textAnchor="middle"
          className="fill-sky-400/70" fontSize={12}>적극투자형</text>
        <text x={(PAD.left + medXpx) / 2} y={H - PAD.bottom - 8} textAnchor="middle"
          className="fill-slate-400/70" fontSize={12}>여력부족</text>
        <text x={(medXpx + W - PAD.right) / 2} y={H - PAD.bottom - 8} textAnchor="middle"
          className="fill-orange-400/70" fontSize={12}>점검필요</text>

        {/* 축 프레임 */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} className="stroke-slate-600" strokeWidth={1} />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} className="stroke-slate-600" strokeWidth={1} />

        {/* 중앙값 분할선 (점선) */}
        <line x1={medXpx} y1={PAD.top} x2={medXpx} y2={H - PAD.bottom}
          className="stroke-slate-500" strokeWidth={1} strokeDasharray="5 4" />
        <line x1={PAD.left} y1={medYpx} x2={W - PAD.right} y2={medYpx}
          className="stroke-slate-500" strokeWidth={1} strokeDasharray="5 4" />

        {/* y축 눈금 0/50/100 */}
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <text x={PAD.left - 8} y={sy(t) + 4} textAnchor="end" className="fill-slate-400" fontSize={11}>{t}</text>
          </g>
        ))}

        {/* 축 제목 */}
        <text x={PAD.left + PLOT_W / 2} y={H - 10} textAnchor="middle" className="fill-slate-300" fontSize={12}>
          1인당 예산 (만원/인) →
        </text>
        <text x={16} y={PAD.top + PLOT_H / 2} textAnchor="middle" className="fill-slate-300" fontSize={12}
          transform={`rotate(-90 16 ${PAD.top + PLOT_H / 2})`}>
          ↑ 종합 달성도 (0~100)
        </text>

        {/* 점 */}
        {points.map((p) => (
          <ScatterDot key={p.region} p={p} cx={sx(p.perCapitaBudget)} cy={sy(p.achievement)}
            selected={p.region === selected} onSelect={onSelect} />
        ))}
      </svg>

      <figcaption className="mt-2 text-xs text-slate-500">
        점선 = 16광역 중앙값(1인당 예산 {medianX.toFixed(1)}만원 · 달성도 {medianY.toFixed(0)}).
        위치는 <strong>상관 맥락</strong>이며 예산이 성과를 <strong>인과</strong>한다는 의미가 아닙니다(여건 차이).
      </figcaption>
    </figure>
  );
}

function ScatterDot({
  p, cx, cy, selected, onSelect,
}: {
  p: EfficiencyPoint;
  cx: number;
  cy: number;
  selected: boolean;
  onSelect: (region: string) => void;
}) {
  const color = QUADRANT_COLOR[p.quadrant];
  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(p.region)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(p.region); }}
    >
      <title>
        {`${p.region}: 1인당 ${p.perCapitaBudget.toFixed(1)}만원 · 달성도 ${p.achievement} · ${QUADRANT_LABEL[p.quadrant]}`}
      </title>
      <circle cx={cx} cy={cy} r={selected ? 9 : 5.5}
        fill={color}
        stroke={selected ? '#f8fafc' : 'transparent'}
        strokeWidth={selected ? 2.5 : 0}
        fillOpacity={selected ? 1 : 0.82}
        className="transition-all duration-[120ms]"
      />
      <text x={cx + (selected ? 12 : 8)} y={cy + 4}
        className={selected ? 'fill-slate-100 font-semibold' : 'fill-slate-300'}
        fontSize={selected ? 13 : 11}>
        {p.region}
      </text>
    </g>
  );
}
