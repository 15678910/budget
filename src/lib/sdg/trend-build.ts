// ============================================================
// 추세 빌더 — current/base 지표맵에서 goal별 추세(GoalTrend)를 산정.
// achievement.ts의 값 추출 헬퍼(지역 단일값 / 전국 인구가중)를 재사용.
// ============================================================

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { regionIndicatorValues, nationalIndicatorValues } from './achievement';
import { goalTrend, type GoalTrend, type TrendOpts } from './trend';

export type GoalTrendByGoal = Record<number, GoalTrend | null>;

/** current/base 지표맵으로 1~17 goal 추세 산정. */
function trendsFromValues(
  currentByInd: Record<string, number>,
  baseByInd: Record<string, number>,
  direction: Record<string, IndicatorDirection>,
  opts: TrendOpts = {},
): GoalTrendByGoal {
  const out: GoalTrendByGoal = {};
  for (let goal = 1; goal <= 17; goal++) {
    out[goal] = goalTrend(goal, currentByInd, baseByInd, direction, opts);
  }
  return out;
}

/** 특정 지역 goal 추세. */
export function regionGoalTrend(
  valuesByIndicator: Record<string, Record<string, number>>,
  base2018ByIndicator: Record<string, Record<string, number>>,
  region: string,
  direction: Record<string, IndicatorDirection>,
  opts: TrendOpts = {},
): GoalTrendByGoal {
  return trendsFromValues(
    regionIndicatorValues(valuesByIndicator, region),
    regionIndicatorValues(base2018ByIndicator, region),
    direction,
    opts,
  );
}

/** 전국(인구가중) goal 추세. */
export function nationalGoalTrend(
  valuesByIndicator: Record<string, Record<string, number>>,
  base2018ByIndicator: Record<string, Record<string, number>>,
  population: Record<string, number>,
  direction: Record<string, IndicatorDirection>,
  opts: TrendOpts = {},
): GoalTrendByGoal {
  return trendsFromValues(
    nationalIndicatorValues(valuesByIndicator, population),
    nationalIndicatorValues(base2018ByIndicator, population),
    direction,
    opts,
  );
}
