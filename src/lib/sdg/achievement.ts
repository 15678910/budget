// ============================================================
// 달성도 빌더 — valuesByIndicator(지표→지역→값)에서
// 전국(인구가중) / 특정 지역 단일값 맵을 추출해 goalAchievement에 투입.
// ============================================================

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { goalAchievement, type GoalAchievementByGoal } from './scoring';

/** 지표→(지역→값)에서 특정 지역의 지표→값 맵 추출. */
export function regionIndicatorValues(
  valuesByIndicator: Record<string, Record<string, number>>,
  region: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [ind, byRegion] of Object.entries(valuesByIndicator)) {
    const v = byRegion[region];
    if (v != null && Number.isFinite(v)) out[ind] = v;
  }
  return out;
}

/** 지표→(지역→값)에서 인구가중 전국 지표→값 맵 추출. 가중치 없으면 단순평균. */
export function nationalIndicatorValues(
  valuesByIndicator: Record<string, Record<string, number>>,
  population: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [ind, byRegion] of Object.entries(valuesByIndicator)) {
    let wSum = 0;
    let vSum = 0;
    let simpleSum = 0;
    let n = 0;
    for (const [region, v] of Object.entries(byRegion)) {
      if (v == null || !Number.isFinite(v)) continue;
      simpleSum += v;
      n++;
      const w = population[region];
      if (w && w > 0) {
        wSum += w;
        vSum += v * w;
      }
    }
    if (n === 0) continue;
    out[ind] = wSum > 0 ? vSum / wSum : simpleSum / n;
  }
  return out;
}

/** 전국 goal 달성도. */
export function nationalGoalAchievement(
  valuesByIndicator: Record<string, Record<string, number>>,
  population: Record<string, number>,
  direction: Record<string, IndicatorDirection>,
): GoalAchievementByGoal {
  return goalAchievement(nationalIndicatorValues(valuesByIndicator, population), direction);
}

/** 특정 지역 goal 달성도. */
export function regionGoalAchievement(
  valuesByIndicator: Record<string, Record<string, number>>,
  region: string,
  direction: Record<string, IndicatorDirection>,
): GoalAchievementByGoal {
  return goalAchievement(regionIndicatorValues(valuesByIndicator, region), direction);
}
