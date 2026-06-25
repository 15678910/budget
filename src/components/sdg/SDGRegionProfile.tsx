import { useMemo, useState } from 'react';
import { SDG_GOALS } from '@/lib/sdg/goals';
import type { Matrix } from '@/lib/sdg/matrix';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { regionGoalAchievement } from '@/lib/sdg/achievement';
import { regionGoalTrend } from '@/lib/sdg/trend-build';
import { trafficColor } from '@/lib/sdg/scoring';
import { TrafficBadge } from './TrafficBadge';
import { TrendArrow } from './TrendArrow';
import { SDGScenarioSimulator } from './SDGScenarioSimulator';

export interface FiscalContext {
  independence: number; // 재정자립도 %
  autonomy: number; // 재정자주도 %
  debtRatio: number; // 채무비율 % (채무/예산)
  budget: number; // 예산규모(억원)
  population: number;
}

/** goal에 데이터가 있는 광역 중 region의 순위(1=최고). 데이터 없으면 null. */
function goalRank(matrix: Matrix, region: string, goal: number): { rank: number; total: number } | null {
  const vals: { metro: string; v: number }[] = [];
  for (const [metro, row] of Object.entries(matrix)) {
    const v = row[goal];
    if (v != null) vals.push({ metro, v });
  }
  if (vals.length === 0) return null;
  vals.sort((a, b) => b.v - a.v); // 높을수록 좋음(정규화 점수)
  const idx = vals.findIndex((x) => x.metro === region);
  if (idx < 0) return null;
  return { rank: idx + 1, total: vals.length };
}

export function SDGRegionProfile({
  region,
  matrix,
  fiscal,
  onSelectGoal,
  valuesByIndicator,
  base2018ByIndicator,
  direction,
}: {
  region: string;
  matrix: Matrix;
  fiscal: FiscalContext | null;
  onSelectGoal: (g: number) => void;
  valuesByIndicator: Record<string, Record<string, number>>;
  base2018ByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
}) {
  const [showSim, setShowSim] = useState(false);
  const row = matrix[region] ?? {};
  // 목표값 기준 달성도(신호등) — 상대점수(row)와 별개.
  const achievement = useMemo(
    () => regionGoalAchievement(valuesByIndicator, region, direction),
    [valuesByIndicator, region, direction],
  );
  // 추세(2점 2018→최신 SDSN CR) — 달성도와 의미 구분(개략).
  const trend = useMemo(
    () => regionGoalTrend(valuesByIndicator, base2018ByIndicator, region, direction),
    [valuesByIndicator, base2018ByIndicator, region, direction],
  );
  const scored = SDG_GOALS.map((g) => ({ g, v: row[g.num] })).filter(
    (x): x is { g: (typeof SDG_GOALS)[number]; v: number } => x.v != null,
  );
  const top = [...scored].sort((a, b) => b.v - a.v).slice(0, 3);
  const bottom = [...scored].sort((a, b) => a.v - b.v).slice(0, 3);

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-100">
        {region} <span className="text-sm text-gray-500">지역 프로파일</span>
      </h3>

      {/* 재정 맥락 패널 */}
      {fiscal && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800/50 rounded p-2">
            <span className="text-gray-400">재정자립도</span>
            <div className="font-mono text-gray-100">{fiscal.independence}%</div>
          </div>
          <div className="bg-gray-800/50 rounded p-2">
            <span className="text-gray-400">재정자주도</span>
            <div className="font-mono text-gray-100">{fiscal.autonomy}%</div>
          </div>
          <div className="bg-gray-800/50 rounded p-2">
            <span className="text-gray-400">채무비율</span>
            <div className="font-mono text-gray-100">{fiscal.debtRatio}%</div>
          </div>
          <div className="bg-gray-800/50 rounded p-2">
            <span className="text-gray-400">예산규모</span>
            <div className="font-mono text-gray-100">{fiscal.budget.toLocaleString()}억</div>
          </div>
        </div>
      )}

      {/* 17목표 미니 게이지 */}
      <div className="grid grid-cols-2 gap-1.5">
        {SDG_GOALS.map((g) => {
          const v = row[g.num];
          const rk = v != null ? goalRank(matrix, region, g.num) : null;
          const a = achievement[g.num];
          const tr = trend[g.num];
          // 게이지 채우기: 달성도 있으면 신호등 색, 없으면 goal 색.
          const barColor = a ? trafficColor(a.light) : g.color;
          const targetNote = a
            ? a.indicators
                .map((ind) => `${ind.indicatorId}: 목표 ${ind.green} (${ind.type})`)
                .join(' · ')
            : '';
          return (
            <button
              key={g.num}
              onClick={() => onSelectGoal(g.num)}
              title={targetNote || undefined}
              className="flex items-center gap-2 text-left hover:bg-gray-800/40 rounded px-1 py-0.5"
            >
              <span className="w-5 text-[11px] font-mono text-gray-500">{g.num}</span>
              <span className="w-14 text-[11px] text-gray-300 truncate">{g.name}</span>
              <span className="flex-1 h-2 rounded bg-gray-800 overflow-hidden">
                {a ? (
                  <span
                    className="block h-full"
                    style={{ width: `${Math.max(a.score, 2)}%`, background: barColor }}
                  />
                ) : (
                  v != null && (
                    <span
                      className="block h-full"
                      style={{ width: `${Math.max(v, 2)}%`, background: g.color }}
                    />
                  )
                )}
              </span>
              {tr && (
                <span className="w-9 text-right">
                  <TrendArrow arrow={tr.arrow} gap={a ? 100 - a.score : null} size="sm" />
                </span>
              )}
              {a ? (
                <span className="w-7 text-right">
                  <TrafficBadge score={a.score} light={a.light} size="sm" />
                </span>
              ) : (
                <span className="w-7 text-right text-[11px] font-mono text-gray-400">
                  {v ?? '–'}
                </span>
              )}
              <span className="w-12 text-right text-[10px] font-mono text-gray-500">
                {rk ? `${rk.rank}/${rk.total}위` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* 강점/약점 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-emerald-400 font-semibold mb-1">강점 Top3</div>
          {top.map((x) => (
            <div key={x.g.num} className="text-gray-300">
              {x.g.name} <span className="font-mono text-gray-500">{x.v}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-rose-400 font-semibold mb-1">약점 Top3</div>
          {bottom.map((x) => (
            <div key={x.g.num} className="text-gray-300">
              {x.g.name} <span className="font-mono text-gray-500">{x.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* what-if 시뮬레이터 토글 */}
      <div className="border-t border-gray-800 pt-3">
        <button
          onClick={() => setShowSim((s) => !s)}
          className="text-sm px-3 py-1.5 rounded border border-amber-700/60 text-amber-200 hover:bg-amber-900/30"
        >
          🧪 what-if 시뮬레이터 {showSim ? '닫기' : '열기'}
        </button>
      </div>
      {showSim && (
        <SDGScenarioSimulator
          key={region}
          metro={region}
          valuesByIndicator={valuesByIndicator}
          direction={direction}
          baselineRow={row}
        />
      )}

      <div className="text-[11px] text-gray-600 border-t border-gray-800 pt-2 space-y-1">
        <p>
          <span style={{ color: '#16a34a' }}>●</span> 게이지·배지 ={' '}
          <strong className="text-gray-500">목표값 기준 달성도(0~100)</strong> · SDSN SDG Index 방법론 적응.
          목표값(green)은 유형(공식·규범·벤치마크)·출처를 명시하며, 게이지 위에 마우스를 올리면 표시됩니다.
        </p>
        <p>
          순위(N/M위) = 16광역 분포 대비 <strong className="text-gray-500">상대 정규화 순위</strong>로,
          위 달성도와 의미가 <strong className="text-gray-500">구분</strong>됩니다(상대 ≠ 목표 달성). 데이터 미보유 목표는 회색.
        </p>
        <p>
          <span className="text-gray-500">↗→↘↓</span> 추세 ={' '}
          <strong className="text-gray-500">2점(2018→최신) 개략</strong> · 중간연도 미반영 · 목표 2030 ·
          SDSN CR(AGRa/AGRr). 속도 신호일 뿐 인과 주장이 아니며, &apos;갭N&apos;은 100−달성도(남은 거리)입니다.
        </p>
      </div>
    </div>
  );
}
