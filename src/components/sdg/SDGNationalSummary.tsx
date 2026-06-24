import { SDG_GOALS } from '@/lib/sdg/goals';
import type { NationalByGoal } from '@/lib/sdg/national';
import type { GoalAchievementByGoal } from '@/lib/sdg/scoring';
import { TrafficBadge } from './TrafficBadge';

/** 절대값 표시 포맷 (정수면 그대로, 소수면 1자리). */
function fmt(v: number): string {
  return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1);
}

export function SDGNationalSummary({
  national,
  achievement,
  onSelectGoal,
}: {
  national: NationalByGoal;
  achievement: GoalAchievementByGoal;
  onSelectGoal: (g: number) => void;
}) {
  const haveCount = SDG_GOALS.filter((g) => national[g.num] != null).length;

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-100">
          전국 종합 <span className="text-sm text-gray-500">17개 SDG 목표</span>
        </h3>
        <span className="text-sm text-emerald-400 font-semibold">
          데이터 보유 {haveCount}/17 목표
        </span>
      </div>

      {/* 17목표 카드 (픽토그램 + 전국 절대값 + 단위 + 지표명) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {SDG_GOALS.map((g) => {
          const n = national[g.num];
          const a = achievement[g.num];
          return (
            <button
              key={g.num}
              onClick={() => onSelectGoal(g.num)}
              className="flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900/40 p-2 text-left hover:border-gray-600 hover:bg-gray-800/40 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/sdg/sdg-${g.num}-pic.svg?v=12`}
                alt={g.name}
                className="w-9 h-9 shrink-0 rounded"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-[11px] text-gray-400 truncate">
                    {g.num}. {g.short}
                  </div>
                  {a && <TrafficBadge score={a.score} light={a.light} size="sm" />}
                </div>
                {n ? (
                  <>
                    <div className="font-mono text-sm text-gray-100">
                      {fmt(n.value)}
                      <span className="ml-0.5 text-[11px] text-gray-500">{n.unit}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{n.label}</div>
                    <div className="text-[9px] text-gray-500">
                      {n.direction === 'lower_better' ? '↓ 낮을수록 양호' : '↑ 높을수록 양호'}
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-gray-600">데이터 준비중</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[11px] text-gray-600 border-t border-gray-800 pt-2 space-y-1">
        <p>
          전국값 = 16개 광역 실값의 <strong className="text-gray-500">인구 가중 평균(절대값)</strong>이며,
          목표별 <strong className="text-gray-500">대표지표 1개</strong> 기준입니다. 정규화 점수가 아니라
          실제 단위의 절대값이며, 종합 SDG 달성도와 다를 수 있습니다. 데이터 미보유 목표는 &apos;준비중&apos;.
        </p>
        <p>
          <span style={{ color: '#16a34a' }}>●</span> 배지 ={' '}
          <strong className="text-gray-500">목표값 기준 달성도(0~100)</strong> · SDSN SDG Index 방법론 적응.
          목표값은 유형(공식·규범·벤치마크)과 출처를 명시하며{' '}
          <strong className="text-gray-500">16광역 상대점수와 구분</strong>됩니다(목표별 매핑 지표 평균).
        </p>
      </div>
    </div>
  );
}
