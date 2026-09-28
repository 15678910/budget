import { SDG_GOALS } from '@/lib/sdg/goals';
import type { NationalByGoal } from '@/lib/sdg/national';
import type { GoalAchievementByGoal, TrafficLight } from '@/lib/sdg/scoring';
import type { GoalTrendByGoal } from '@/lib/sdg/trend-build';
import type { TrendArrow as TrendArrowKind } from '@/lib/sdg/trend';
import { TRAFFIC_BG_CLASS } from '@/lib/sdg/goal-style';
import { TRAFFIC_LABEL } from './TrafficBadge';
import { TREND_SHORT_LABEL } from './TrendArrow';
import { SDGGoalList } from './SDGGoalList';

const TRAFFIC_ORDER: TrafficLight[] = ['green', 'yellow', 'orange', 'red'];
const TREND_ORDER: TrendArrowKind[] = ['on_track', 'improving', 'stagnating', 'decreasing'];
const TREND_GLYPH: Record<TrendArrowKind, string> = {
  on_track: '↗',
  improving: '→',
  stagnating: '↘',
  decreasing: '↓',
};

export function SDGNationalSummary({
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
  const haveCount = SDG_GOALS.filter((g) => national[g.num] != null).length;
  // regionalOnly(예: 면적류) 목표는 전국 숫자가 없다 — "데이터 보유"가 전국값 보유로
  // 오독되지 않도록 몇 개가 시도별 값만 있는지 괄호로 병기한다.
  const regionalOnlyCount = SDG_GOALS.filter((g) => national[g.num]?.regionalOnly).length;

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-100">
          전국 종합 <span className="text-sm text-gray-500">17개 SDG 목표</span>
        </h3>
        <span className="text-sm text-emerald-400 font-semibold">
          데이터 보유 {haveCount}/17 목표
          {regionalOnlyCount > 0 && (
            <span className="text-gray-500 font-normal"> (시도별만 {regionalOnlyCount}개 포함)</span>
          )}
        </span>
      </div>

      <SDGGoalList
        national={national}
        achievement={achievement}
        trend={trend}
        onSelectGoal={onSelectGoal}
        selectedGoal={selectedGoal}
      />

      {/* 범례 — 달성도 신호등 4색 + 추세 화살표 4종을 말로 병기 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-800 pt-3 text-sm text-gray-300">
        <span className="font-semibold text-gray-500">달성도</span>
        {TRAFFIC_ORDER.map((light) => (
          <span key={light} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={`inline-block h-2.5 w-2.5 rounded-full ${TRAFFIC_BG_CLASS[light]}`}
            />
            {TRAFFIC_LABEL[light]}
          </span>
        ))}
        <span className="font-semibold text-gray-500 ml-1">추세</span>
        {TREND_ORDER.map((arrow) => (
          <span key={arrow} className="inline-flex items-center gap-1">
            <span aria-hidden className="font-mono font-bold">
              {TREND_GLYPH[arrow]}
            </span>
            {TREND_SHORT_LABEL[arrow]}
          </span>
        ))}
      </div>

      <details className="border-t border-gray-800 pt-3 text-sm text-gray-400">
        <summary className="cursor-pointer select-none font-semibold text-gray-300 hover:text-white">
          산출 방법
        </summary>
        <div className="mt-2 space-y-1.5">
          <p className="text-amber-500/80">
            ※ 위 수치는 대표지표 1개, 배지·화살표·목표갭은 목표 매핑 지표 종합 기준입니다.
          </p>
          <p>
            전국값 = 16개 광역 실값의 <strong className="text-gray-200">인구 가중 평균(절대값)</strong>
            이며, 목표별 <strong className="text-gray-200">대표지표 1개</strong> 기준입니다. 정규화
            점수가 아니라 실제 단위의 절대값이며, 종합 SDG 달성도와 다를 수 있습니다. 데이터
            미보유 목표는 &apos;준비중&apos;.
          </p>
          <p>
            <span
              aria-hidden
              className={`inline-block h-2.5 w-2.5 rounded-full ${TRAFFIC_BG_CLASS.green}`}
            />{' '}
            배지 = <strong className="text-gray-200">목표값 기준 달성도(0~100)</strong> · SDSN SDG
            Index 방법론 적응. 목표값은 유형(공식·규범·벤치마크)과 출처를 명시하며{' '}
            <strong className="text-gray-200">16광역 상대점수와 구분</strong>됩니다(목표별 매핑
            지표 평균).
          </p>
          <p>
            <span className="text-gray-300">↗→↘↓</span> 추세 ={' '}
            <strong className="text-gray-200">2점(2018→최신) 개략</strong> · 중간연도 미반영 · 목표
            2030 · SDSN CR(AGRa/AGRr) 방법론. 속도 신호일 뿐 인과 주장이 아니며 달성도와 의미가
            구분됩니다. &apos;목표갭&apos;은 100−달성도(남은 거리)입니다.
          </p>
        </div>
      </details>
    </div>
  );
}
