import { SDG_GOALS } from '@/lib/sdg/goals';
import type { NationalByGoal } from '@/lib/sdg/national';
import type { GoalAchievementByGoal } from '@/lib/sdg/scoring';
import type { GoalTrendByGoal } from '@/lib/sdg/trend-build';
import { GOAL_BG_CLASS } from '@/lib/sdg/goal-style';
import { TrafficBadge } from './TrafficBadge';
import { TrendArrow } from './TrendArrow';

/** 절대값 표시 포맷 (정수면 그대로, 소수면 1자리). */
function fmt(v: number): string {
  return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1);
}

/** 목표 번호 컬러 타일 — SDG 공식색(GOAL_BG_CLASS), 흰 굵은 숫자. */
function GoalTile({ num }: { num: number }) {
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm font-bold text-white ${GOAL_BG_CLASS[num]}`}
    >
      {num}
    </span>
  );
}

// md+에서 헤더 행과 데이터 행이 같은 컬럼 폭을 쓰도록 공유하는 그리드 클래스.
const ROW_GRID =
  'md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_auto_auto_auto] md:items-center md:gap-4';

/**
 * 전국 SDG 17목표 목록 — 목표당 1행(md+: 표, 모바일: 2줄 스택).
 * 데이터 없는 목표는 행이 아니라 목록 하단의 축약 칩으로 표시한다.
 */
export function SDGGoalList({
  national,
  achievement,
  trend,
  onSelectGoal,
  selectedGoal,
}: {
  national: NationalByGoal;
  achievement: GoalAchievementByGoal;
  trend: GoalTrendByGoal;
  onSelectGoal: (g: number) => void;
  selectedGoal?: number | null;
}) {
  const withData = SDG_GOALS.filter((g) => national[g.num] != null);
  const missing = SDG_GOALS.filter((g) => national[g.num] == null);

  return (
    <div className="space-y-2">
      {/* 헤더(md+ 전용) */}
      <div
        className={`hidden px-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${ROW_GRID}`}
      >
        <span>목표</span>
        <span>대표지표</span>
        <span className="text-right">전국값</span>
        <span className="text-right">달성도</span>
        <span className="text-right">추세</span>
      </div>

      <div className="space-y-1.5">
        {withData.map((g) => {
          const n = national[g.num]!;
          const a = achievement[g.num];
          const tr = trend[g.num];
          const selected = selectedGoal === g.num;
          return (
            <button
              key={g.num}
              type="button"
              onClick={() => onSelectGoal(g.num)}
              aria-pressed={selected}
              className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selected
                  ? 'border-emerald-600 bg-emerald-950/30'
                  : 'border-gray-800 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-800/40'
              }`}
            >
              {/* 모바일: 2줄 스택 */}
              <div className="flex flex-col gap-1.5 md:hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <GoalTile num={g.num} />
                    <span className="break-keep text-base font-semibold text-gray-100">
                      {g.name}
                    </span>
                  </span>
                  {(a || tr) && (
                    <span className="flex shrink-0 items-center gap-2">
                      {a && <TrafficBadge score={a.score} light={a.light} size="sm" showLabel />}
                      {tr && <TrendArrow arrow={tr.arrow} gap={a ? 100 - a.score : null} showLabel />}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pl-9">
                  <span className="break-keep text-sm text-gray-300">{n.label}</span>
                  <span className="flex shrink-0 items-baseline gap-1 whitespace-nowrap">
                    <span className="font-mono text-base tabular-nums text-gray-50">
                      {fmt(n.value)}
                    </span>
                    <span className="text-xs text-gray-400">{n.unit}</span>
                  </span>
                </div>
              </div>

              {/* md+: 표 행 */}
              <div className={`hidden ${ROW_GRID}`}>
                <span className="flex min-w-0 items-center gap-2">
                  <GoalTile num={g.num} />
                  <span className="break-keep text-base font-semibold text-gray-100">
                    {g.name}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block break-keep text-sm text-gray-200">{n.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    {n.direction === 'lower_better' ? '낮을수록 좋음' : '높을수록 좋음'}
                  </span>
                </span>
                <span className="flex items-baseline justify-end gap-1 whitespace-nowrap">
                  <span className="font-mono text-lg tabular-nums text-gray-50">
                    {fmt(n.value)}
                  </span>
                  <span className="text-sm text-gray-400">{n.unit}</span>
                </span>
                <span className="justify-self-end">
                  {a ? (
                    <TrafficBadge score={a.score} light={a.light} showLabel />
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </span>
                <span className="justify-self-end">
                  {tr ? (
                    <TrendArrow arrow={tr.arrow} gap={a ? 100 - a.score : null} showLabel />
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 pt-1 text-xs text-gray-500">
          <span>데이터 준비 중:</span>
          {missing.map((g, i) => (
            <span key={g.num} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>·</span>}
              <button
                type="button"
                onClick={() => onSelectGoal(g.num)}
                title={`SDG ${g.num} ${g.name}: 데이터 준비중`}
                className="rounded border border-gray-800 bg-gray-900/40 px-1.5 py-0.5 hover:border-gray-600 hover:text-gray-300"
              >
                {g.num} {g.short}
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
