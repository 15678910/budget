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
  /**
   * 전국 절대값 (인구 가중 평균). regionalOnly=true(예: 면적류 지표)면 전국 집계를
   * 내지 않으므로 null — 시도별 값만 존재(지도에서 비교).
   */
  value: number | null;
  /** 해석방향 (표시 맥락용) */
  direction: IndicatorDirection;
  hasData: true;
  /** true면 전국 집계가 없고 시도별 값만 있는 지표(예: 갯벌 면적, nationalAggregate='none'). */
  regionalOnly?: boolean;
  /** 대리지표·결측 등 해석 고지문. 있으면 목록에 "대리지표" 태그로 노출. */
  proxyNote?: string;
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
/**
 * 특정 goal의 대표지표를 명시적으로 오버라이드.
 * 여기 없는 goal은 INDICATOR_TO_GOAL 선언순 첫 지표를 사용.
 */
const REP_INDICATOR_BY_GOAL: Record<number, string> = {
  4: 'edu_admission', // 대학 진학률(KEDI 실측, admission-rate.ts) — 합성 추정치 edu_univ 대체
};

/**
 * goal → 상황판 대표지표 id. INDICATOR_TO_GOAL 선언순 첫 매핑 지표 + REP_INDICATOR_BY_GOAL 오버라이드.
 * ⚠️ 지도(map-source.ts)도 이 함수를 그대로 재사용한다 — 전국 목록과 지도의 대표지표 선택을
 *    다르게 두지 않기 위함(다른 선택 로직 중복 금지).
 */
export function pickRepresentativeIndicators(
  valuesByIndicator: Record<string, Record<string, number>>,
): Record<number, string> {
  const repByGoal: Record<number, string> = {};
  for (const [ind, goal] of Object.entries(INDICATOR_TO_GOAL)) {
    if (!(goal in repByGoal)) repByGoal[goal] = ind;
  }
  // 오버라이드 적용 (데이터가 실제로 있는 경우에만)
  for (const [goalStr, overrideInd] of Object.entries(REP_INDICATOR_BY_GOAL)) {
    const goal = Number(goalStr);
    if (valuesByIndicator[overrideInd] && Object.keys(valuesByIndicator[overrideInd]).length > 0) {
      repByGoal[goal] = overrideInd;
    }
  }
  return repByGoal;
}

export function nationalByGoal(
  valuesByIndicator: Record<string, Record<string, number>>,
  population: Record<string, number>,
  directionMap: Record<string, IndicatorDirection>,
  indicatorLabels: Record<string, IndicatorLabel>,
): NationalByGoal {
  const repByGoal = pickRepresentativeIndicators(valuesByIndicator);

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

export interface KosisIndicatorLike {
  label: string;
  unit: string;
  higherBetter: boolean;
  bySido: Record<string, number>;
  /** 미지정='weightedMean'. 'none'이면 전국 집계를 만들지 않는다(예: 면적류 지표). */
  nationalAggregate?: 'weightedMean' | 'none';
  /** 대리지표·결측 고지문. */
  proxyNote?: string;
}

/**
 * board 대표지표가 없는 goal에 한해 KOSIS 지표의 전국값(인구 가중 평균)을 채운다.
 * board 대표지표가 이미 있는 goal(national[g] != null)은 건드리지 않는다(board 우선순위 유지).
 * nationalAggregate='none'인 지표(예: 갯벌 면적)는 전국 집계를 만들지 않고
 * value=null·regionalOnly=true로 채운다 — "데이터 보유"에는 포함되지만 전국 숫자는 없다.
 *
 * @param national      nationalByGoal() 결과.
 * @param kosisGoals    public/data/sdg-sido.json의 goals (goal번호 문자열 → KOSIS 지표).
 * @param rawPopulation 원시 17개 시도 약칭(광주·전남 분리) → 인구. KOSIS bySido도 17개 원시 키라
 *                       assembleIndicatorValues().population(병합 전)을 그대로 써야 키가 맞는다.
 */
export function fillNationalFromKosis(
  national: NationalByGoal,
  kosisGoals: Record<string, KosisIndicatorLike>,
  rawPopulation: Record<string, number>,
): NationalByGoal {
  const out: NationalByGoal = { ...national };
  for (const [goalStr, indicator] of Object.entries(kosisGoals)) {
    const goal = Number(goalStr);
    if (!Number.isInteger(goal) || goal < 1 || goal > 17) continue;
    if (out[goal] != null) continue; // board 대표지표가 이미 있으면 유지
    const vals = indicator?.bySido;
    if (!vals || Object.keys(vals).length === 0) continue;
    const noAggregate = indicator.nationalAggregate === 'none';
    out[goal] = {
      indicatorId: `kosis_goal${goal}`,
      label: indicator.label,
      unit: indicator.unit,
      value: noAggregate ? null : weightedMean(vals, rawPopulation),
      direction: indicator.higherBetter ? 'higher_better' : 'lower_better',
      hasData: true,
      ...(noAggregate ? { regionalOnly: true } : {}),
      ...(indicator.proxyNote ? { proxyNote: indicator.proxyNote } : {}),
    };
  }
  return out;
}

/** 인구 가중 평균. 가중치 미제공/0이면 단순평균. */
export function weightedMean(
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
