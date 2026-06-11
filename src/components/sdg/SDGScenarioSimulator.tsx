import { useMemo, useState } from 'react';
import { SDG_DOMAINS, type IndicatorDirection } from '@/lib/data/local-sdg-data';
import { SDG_GOALS } from '@/lib/sdg/goals';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { applyScenario, targetHint, indicatorsForGoal } from '@/lib/sdg/scenario';

interface IndicatorMeta {
  id: string;
  name: string;
  unit: string;
  direction: IndicatorDirection;
}

// 지표 id → 메타(SDG_DOMAINS). 모듈 1회 계산.
const INDICATOR_META: Record<string, IndicatorMeta> = (() => {
  const out: Record<string, IndicatorMeta> = {};
  for (const d of SDG_DOMAINS) {
    for (const ind of d.indicators) {
      out[ind.id] = { id: ind.id, name: ind.name, unit: ind.unit, direction: ind.direction };
    }
  }
  return out;
})();

function goalName(num: number): string {
  return SDG_GOALS.find((g) => g.num === num)?.name ?? `Goal ${num}`;
}

/** 16광역 분포 [min,max]에 ±15% 여유를 둔 슬라이더 범위. */
function sliderRange(values: Record<string, number>): { min: number; max: number; step: number } {
  const nums = Object.values(values);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const span = hi - lo || Math.max(Math.abs(hi), 1);
  const min = lo - span * 0.15;
  const max = hi + span * 0.15;
  const step = span > 0 ? Math.max(span / 200, 0.01) : 0.01;
  return { min, max, step };
}

export function SDGScenarioSimulator({
  metro,
  valuesByIndicator,
  direction,
  baselineRow,
}: {
  metro: string;
  valuesByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
  /** matrix[metro] — baseline goal 점수(표시용) */
  baselineRow: Record<number, number | null>;
}) {
  // 선택 광역이 데이터를 보유한 지표만 슬라이더로.
  const indicatorIds = useMemo(
    () =>
      Object.keys(INDICATOR_TO_GOAL).filter((id) => {
        const vals = valuesByIndicator[id];
        return vals && vals[metro] != null && INDICATOR_META[id];
      }),
    [valuesByIndicator, metro],
  );

  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [hintGoal, setHintGoal] = useState<number | null>(null);
  const [hintIndicator, setHintIndicator] = useState<string>('');
  const [hintTarget, setHintTarget] = useState<number>(70);

  // override가 영향을 주는 goal 집합(변경된 지표가 매핑된 목표).
  const affectedGoals = useMemo(() => {
    const set = new Set<number>();
    for (const id of Object.keys(overrides)) {
      const g = INDICATOR_TO_GOAL[id];
      if (g != null) set.add(g);
    }
    return [...set].sort((a, b) => a - b);
  }, [overrides]);

  const hintIndicatorsForGoal = useMemo(
    () => (hintGoal != null ? indicatorsForGoal(hintGoal).filter((id) => indicatorIds.includes(id)) : []),
    [hintGoal, indicatorIds],
  );

  const hintResult = useMemo(() => {
    if (hintGoal == null || !hintIndicator) return null;
    return targetHint({
      valuesByIndicator,
      direction,
      metro,
      indicatorId: hintIndicator,
      targetScore: hintTarget,
    });
  }, [hintGoal, hintIndicator, hintTarget, valuesByIndicator, direction, metro]);

  const hasOverride = Object.keys(overrides).length > 0;

  return (
    <div className="border border-amber-700/50 rounded-lg bg-amber-950/20 p-4 space-y-4">
      {/* 가정 배너 */}
      <div className="rounded bg-amber-900/40 border border-amber-700/60 px-3 py-2">
        <div className="text-amber-200 font-bold text-sm">🧪 가정 시나리오 — 실제 데이터 아님</div>
        <p className="text-[11px] text-amber-300/80 mt-0.5">
          슬라이더로 가정값을 조정해 점수·순위 변화를 탐색합니다. 저장되지 않으며 실데이터를 변경하지 않습니다.
        </p>
        <p className="text-[11px] text-amber-300/70 mt-0.5">
          상대 점수: 한 지역 값 변경이 분포를 바꿔 전체 순위에 영향을 줍니다.
        </p>
      </div>

      {/* 지표 슬라이더 */}
      <div className="space-y-3">
        {indicatorIds.length === 0 && (
          <p className="text-sm text-gray-500">{metro}에 조정 가능한 지표 데이터가 없습니다.</p>
        )}
        {indicatorIds.map((id) => {
          const meta = INDICATOR_META[id];
          const baseVal = valuesByIndicator[id][metro];
          const cur = overrides[id] ?? baseVal;
          const { min, max, step } = sliderRange(valuesByIndicator[id]);
          const changed = overrides[id] != null && overrides[id] !== baseVal;
          return (
            <div key={id} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300">
                  {meta.name}{' '}
                  <span className="text-[10px] text-gray-500">
                    ({meta.direction === 'higher_better' ? '↑좋음' : '↓좋음'})
                  </span>
                </span>
                <span className={`font-mono text-xs ${changed ? 'text-amber-300' : 'text-gray-400'}`}>
                  {cur.toFixed(2)}
                  {meta.unit} {changed && <span className="text-gray-500">(실값 {baseVal}{meta.unit})</span>}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={cur}
                onChange={(e) =>
                  setOverrides((o) => ({ ...o, [id]: Number(e.target.value) }))
                }
                className="w-full accent-amber-500"
              />
            </div>
          );
        })}
      </div>

      {/* 영향받는 목표 Δ */}
      {hasOverride && (
        <div className="space-y-1.5 border-t border-amber-800/40 pt-3">
          <div className="text-xs font-semibold text-amber-200">영향받는 목표 (Δ)</div>
          {affectedGoals.map((g) => {
            const baseScore = baselineRow[g] ?? null;
            const baseRank = applyScenario({ valuesByIndicator, direction, metro, goalNum: g, overrides: {} });
            const sim = applyScenario({ valuesByIndicator, direction, metro, goalNum: g, overrides });
            if (sim.score == null) return null;
            const refScore = baseScore ?? baseRank.score;
            const delta = refScore != null ? sim.score - refScore : null;
            return (
              <div key={g} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  {g}. {goalName(g)}
                </span>
                <span className="font-mono text-xs">
                  <span className="text-gray-400">{refScore ?? '–'}</span>
                  <span className="text-amber-300">→{sim.score}</span>{' '}
                  {delta != null && (
                    <span className={delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-gray-500'}>
                      ({delta > 0 ? '+' : ''}
                      {delta})
                    </span>
                  )}
                  <span className="text-gray-500">
                    {' '}
                    순위 {baseRank.rankAmong16 ?? '–'}→{sim.rankAmong16 ?? '–'}위
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 목표 힌트(역산) */}
      <div className="space-y-2 border-t border-amber-800/40 pt-3">
        <div className="text-xs font-semibold text-amber-200">🎯 목표 도달 힌트 (단일 지표 역산, 다른 지역 고정 가정)</div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={hintGoal ?? ''}
            onChange={(e) => {
              const g = e.target.value ? Number(e.target.value) : null;
              setHintGoal(g);
              setHintIndicator('');
            }}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs"
          >
            <option value="">목표 선택</option>
            {[...new Set(indicatorIds.map((id) => INDICATOR_TO_GOAL[id]))]
              .sort((a, b) => a - b)
              .map((g) => (
                <option key={g} value={g}>
                  {g}. {goalName(g)}
                </option>
              ))}
          </select>
          {hintGoal != null && (
            <select
              value={hintIndicator}
              onChange={(e) => setHintIndicator(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs"
            >
              <option value="">지표 선택</option>
              {hintIndicatorsForGoal.map((id) => (
                <option key={id} value={id}>
                  {INDICATOR_META[id].name}
                </option>
              ))}
            </select>
          )}
          <label className="text-xs text-gray-400">
            목표점수
            <input
              type="number"
              min={0}
              max={100}
              value={hintTarget}
              onChange={(e) => setHintTarget(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="ml-1 w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 text-xs"
            />
          </label>
        </div>
        {hintResult && hintIndicator && (
          <p className="text-sm">
            {hintResult.achievable ? (
              <span className="text-emerald-300">
                {INDICATOR_META[hintIndicator].name} 필요 값{' '}
                {INDICATOR_META[hintIndicator].direction === 'higher_better' ? '≥ ' : '≤ '}
                <span className="font-mono">{hintResult.requiredValue}</span>
                {INDICATOR_META[hintIndicator].unit} (목표점수 {hintTarget})
              </span>
            ) : (
              <span className="text-rose-300">현 분포에서 목표점수 {hintTarget}에 도달 불가</span>
            )}
          </p>
        )}
      </div>

      {/* 리셋 */}
      <div className="flex justify-end border-t border-amber-800/40 pt-3">
        <button
          onClick={() => setOverrides({})}
          disabled={!hasOverride}
          className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40"
        >
          리셋(실값 복귀)
        </button>
      </div>
    </div>
  );
}
