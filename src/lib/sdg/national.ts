// 전국 종합 — goal별 대표지표의 전국 절대값(인구 가중 평균).
//
// ★ 정규화 점수 평균 금지: min-max 특성상 16광역 정규화 평균은 항상 ~50 → 무의미.
//   대신 goal별 대표지표 1개의 16광역 절대값을 인구 가중 평균하여 '전국 수준'을 절대값으로 제시.
//   (전국=절대값/단위 표기, 광역=정규화 0~100 — 단위 혼동 방지)

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { INDICATOR_TO_GOAL } from './indicator-map';

export interface NationalGoalValue {
  /** 대표지표 id */
  indicatorId: string;
  /** 지표명 (SDG_DOMAINS 기준) */
  label: string;
  /** 단위 */
  unit: string;
  /** 전국 절대값 (인구 가중 평균) */
  value: number;
  /** 해석방향 (표시 맥락용) */
  direction: IndicatorDirection;
  hasData: true;
}

export type NationalByGoal = Record<number, NationalGoalValue | null>;

export interface IndicatorLabel {
  label: string;
  unit: string;
}

/**
 * goal별 대표지표(INDICATOR_TO_GOAL 선언순서상 그 goal의 첫 매핑 지표)의
 * 16광역 절대값을 인구 가중 평균하여 전국 절대값으로 반환.
 *
 * @param valuesByIndicator 지표 id → (16광역 약칭 → 절대값). board-data 결과.
 * @param population         16광역(또는 원시 약칭) → 인구 가중치. 비면 단순평균.
 * @param directionMap       지표 id → 해석방향.
 * @param indicatorLabels    지표 id → {label, unit} (SDG_DOMAINS에서 추출).
 */
export function nationalByGoal(
  valuesByIndicator: Record<string, Record<string, number>>,
  population: Record<string, number>,
  directionMap: Record<string, IndicatorDirection>,
  indicatorLabels: Record<string, IndicatorLabel>,
): NationalByGoal {
  // goal → 대표지표 id (선언순서상 첫 매핑 지표)
  const repByGoal: Record<number, string> = {};
  for (const [ind, goal] of Object.entries(INDICATOR_TO_GOAL)) {
    if (!(goal in repByGoal)) repByGoal[goal] = ind;
  }

  const out: NationalByGoal = {};
  for (let goal = 1; goal <= 17; goal++) {
    const ind = repByGoal[goal];
    const vals = ind ? valuesByIndicator[ind] : undefined;
    if (!ind || !vals || Object.keys(vals).length === 0) {
      out[goal] = null;
      continue;
    }
    out[goal] = {
      indicatorId: ind,
      label: indicatorLabels[ind]?.label ?? ind,
      unit: indicatorLabels[ind]?.unit ?? '',
      value: weightedMean(vals, population),
      direction: directionMap[ind] ?? 'higher_better',
      hasData: true,
    };
  }
  return out;
}

/** 인구 가중 평균. 가중치 미제공/0이면 단순평균. */
function weightedMean(
  values: Record<string, number>,
  population: Record<string, number>,
): number {
  let wSum = 0;
  let vSum = 0;
  for (const [region, v] of Object.entries(values)) {
    const w = population[region];
    if (w && w > 0) {
      wSum += w;
      vSum += v * w;
    }
  }
  if (wSum > 0) return vSum / wSum;
  // 폴백: 단순평균
  const nums = Object.values(values);
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}
