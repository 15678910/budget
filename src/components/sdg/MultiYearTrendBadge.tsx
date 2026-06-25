import { TrendArrow } from './TrendArrow';
import type { MultiYearGoalTrend } from '@/lib/sdg/multiyear-build';

// 실측 다년(KOSIS) 추세 배지 — 화살표 + 미니 스파크라인(실측 연도점, 보간 아님) + 라벨.
// ⚠️ 정직성: 점은 실측 연도값만 찍는다(라인은 점 연결일 뿐 보간 데이터 아님).
//   2점 개략(B)과 구분되는 "실측 N년 회귀(KOSIS)" 신호. 인과 아님.

const SW = 96; // 스파크라인 폭
const SH = 28; // 스파크라인 높이
const PAD = 3;

function Sparkline({
  points,
  higherBetter,
  unit,
}: {
  points: { year: number; value: number }[];
  higherBetter: boolean;
  unit: string;
}) {
  if (points.length < 2) return null;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = (yr: number) =>
    maxX === minX ? SW / 2 : PAD + ((yr - minX) / (maxX - minX)) * (SW - 2 * PAD);
  const sy = (v: number) =>
    maxY === minY ? SH / 2 : SH - PAD - ((v - minY) / (maxY - minY)) * (SH - 2 * PAD);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.year).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ');
  const color = higherBetter ? '#34d399' : '#fbbf24';
  const last = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      width={SW}
      height={SH}
      className="shrink-0"
      role="img"
      aria-label={`실측 시계열 ${minX}~${maxX}`}
    >
      <title>{`실측 ${minX}~${maxX} · 최신 ${last.value}${unit}`}</title>
      <path d={path} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={p.year} cx={sx(p.year)} cy={sy(p.value)} r={1.6} fill={color} />
      ))}
    </svg>
  );
}

/**
 * 실측 다년 추세 배지. 데이터 없으면 null.
 * @param mt     regionMultiYearTrend 결과(전국 또는 광역).
 * @param unit   단위(스파크라인 title).
 * @param higherBetter 방향(색·해석).
 * @param scopeLabel   '전국' 등 대상 라벨.
 */
export function MultiYearTrendBadge({
  mt,
  unit,
  higherBetter,
  scopeLabel,
}: {
  mt: MultiYearGoalTrend;
  unit: string;
  higherBetter: boolean;
  scopeLabel: string;
}) {
  if (!mt.trend || !mt.arrow) return null;
  const { trend } = mt;
  const cagrPct = trend.cagr != null ? (trend.cagr * 100).toFixed(1) : null;
  const greenNote =
    mt.green != null ? `목표 ${mt.green}${unit} 대비 회귀 페이스` : '추세 기울기 부호';
  return (
    <div className="flex items-center gap-2.5 flex-wrap rounded-md border border-sky-800/50 bg-sky-950/20 px-3 py-2">
      <span className="text-[11px] font-semibold text-sky-300">{scopeLabel} 실측 추세</span>
      <Sparkline points={mt.points} higherBetter={higherBetter} unit={unit} />
      <TrendArrow arrow={mt.arrow} size="md" />
      <span className="text-[11px] text-gray-400 font-mono">
        slope {trend.slope >= 0 ? '+' : ''}
        {trend.slope.toFixed(2)}/yr
        {cagrPct != null && (
          <>
            {' · '}CAGR {Number(cagrPct) >= 0 ? '+' : ''}
            {cagrPct}%
          </>
        )}
        {' · '}R² {trend.r2.toFixed(2)}
      </span>
      <span className="text-[10px] text-sky-400/80 font-medium">
        실측 {trend.n}년 회귀(KOSIS) · {trend.firstYear}~{trend.lastYear}
      </span>
      <span className="text-[10px] text-gray-500">{greenNote} · 보간 아님 · 인과 아님</span>
    </div>
  );
}
