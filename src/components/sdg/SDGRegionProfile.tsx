import { useState } from 'react';
import { SDG_GOALS } from '@/lib/sdg/goals';
import type { Matrix } from '@/lib/sdg/matrix';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
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
  direction,
}: {
  region: string;
  matrix: Matrix;
  fiscal: FiscalContext | null;
  onSelectGoal: (g: number) => void;
  valuesByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
}) {
  const [showSim, setShowSim] = useState(false);
  const row = matrix[region] ?? {};
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
          return (
            <button
              key={g.num}
              onClick={() => onSelectGoal(g.num)}
              className="flex items-center gap-2 text-left hover:bg-gray-800/40 rounded px-1 py-0.5"
            >
              <span className="w-5 text-[11px] font-mono text-gray-500">{g.num}</span>
              <span className="w-14 text-[11px] text-gray-300 truncate">{g.name}</span>
              <span className="flex-1 h-2 rounded bg-gray-800 overflow-hidden">
                {v != null && (
                  <span
                    className="block h-full"
                    style={{ width: `${Math.max(v, 2)}%`, background: g.color }}
                  />
                )}
              </span>
              <span className="w-7 text-right text-[11px] font-mono text-gray-400">
                {v ?? '–'}
              </span>
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

      <p className="text-[11px] text-gray-600 border-t border-gray-800 pt-2">
        점수 = 16광역 분포 대비 대표지표 정규화값(0~100), 순위(N/M위) = 데이터 보유 광역 중 순위.
        종합 SDG 달성도와 다를 수 있으며, 지역 여건 차이를 고려해 해석하세요.
      </p>
    </div>
  );
}
