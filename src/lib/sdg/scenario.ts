// SDG 시나리오(what-if) 순수 계산 — 정적 import만, 클라이언트 호출 가능.
// 시나리오는 가정 레이어: 실데이터·matrix 불변. 여기서는 입력값을 복제해 재계산만 한다.
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { normalizeMinMax, INDICATOR_TO_GOAL } from './indicator-map';

/**
 * 슬라이더/도메인 범위 산출에 쓰는 패딩 비율(분포폭의 15%).
 * SDGScenarioSimulator의 sliderRange()와 targetHint()가 동일 상수를 사용.
 */
export const SLIDER_PAD_RATIO = 0.15;

/**
 * 지표 원시값 분포에서 슬라이더(도메인) 경계를 계산한다.
 * SDGScenarioSimulator.sliderRange()와 동일 로직 — 단일 소스.
 */
export function indicatorDomainBounds(values: Record<string, number>): { lo: number; hi: number } {
  const nums = Object.values(values);
  const lo0 = Math.min(...nums);
  const hi0 = Math.max(...nums);
  const span = hi0 - lo0 || Math.max(Math.abs(hi0), 1);
  return { lo: lo0 - span * SLIDER_PAD_RATIO, hi: hi0 + span * SLIDER_PAD_RATIO };
}

export interface ScenarioArgs {
  /** 지표 id → (광역 → 실값) */
  valuesByIndicator: Record<string, Record<string, number>>;
  /** 지표 id → 해석방향 */
  direction: Record<string, IndicatorDirection>;
  /** 점수를 계산할 광역 */
  metro: string;
  /** SDG 목표 번호 */
  goalNum: number;
  /** 지표 id → 가정값(해당 metro에만 적용). 비었으면 baseline. */
  overrides: Record<string, number>;
}

export interface ScenarioResult {
  /** goal 점수(0~100, 반올림). 매핑 지표/데이터 없으면 null. */
  score: number | null;
  /** 데이터 보유 광역 중 metro 순위(1=최고). 없으면 null. */
  rankAmong16: number | null;
}

/** goal 번호 → 그 목표에 매핑된 지표 id[] (INDICATOR_TO_GOAL 역) */
export function indicatorsForGoal(goalNum: number): string[] {
  return Object.entries(INDICATOR_TO_GOAL)
    .filter(([, g]) => g === goalNum)
    .map(([ind]) => ind);
}

/**
 * 한 광역의 지표 override를 반영해 goal 점수를 재계산하고, 그 결과를
 * 16광역 전체에 동일 적용했을 때의 metro 순위를 반환한다.
 *
 * override가 해당 지표의 분포(min/max)를 바꾸므로 다른 광역 점수도 변동한다 →
 * 상대 점수의 본질이라 정직하게 순위에 반영한다.
 */
export function applyScenario(args: ScenarioArgs): ScenarioResult {
  const { valuesByIndicator, direction, metro, goalNum, overrides } = args;
  const indicators = indicatorsForGoal(goalNum).filter((ind) => {
    const vals = valuesByIndicator[ind];
    return vals && Object.keys(vals).length > 0 && vals[metro] != null;
  });
  if (indicators.length === 0) return { score: null, rankAmong16: null };

  // 지표별로 metro override를 반영한 분포를 재정규화.
  const normByIndicator: Record<string, Record<string, number>> = {};
  for (const ind of indicators) {
    const merged = { ...valuesByIndicator[ind] };
    if (overrides[ind] != null) merged[metro] = overrides[ind];
    normByIndicator[ind] = normalizeMinMax(merged, direction[ind]);
  }

  // 데이터 보유 광역 = 모든 지표 정규화 결과에 등장하는 광역의 합집합.
  const regionSet = new Set<string>();
  for (const ind of indicators) {
    for (const r of Object.keys(normByIndicator[ind])) regionSet.add(r);
  }

  // 광역별 goal 점수 = 보유 지표 정규화값 평균(반올림). matrix와 동일 규칙.
  const scoreByRegion: Record<string, number> = {};
  for (const region of regionSet) {
    const present = indicators.filter((ind) => normByIndicator[ind][region] != null);
    if (present.length === 0) continue;
    const avg = present.reduce((s, ind) => s + normByIndicator[ind][region], 0) / present.length;
    scoreByRegion[region] = Math.round(avg);
  }

  const metroScore = scoreByRegion[metro];
  if (metroScore == null) return { score: null, rankAmong16: null };

  // 순위 = metro보다 점수 높은 광역 수 + 1 (내림차순).
  let rank = 1;
  for (const [region, sc] of Object.entries(scoreByRegion)) {
    if (region !== metro && sc > metroScore) rank += 1;
  }
  return { score: metroScore, rankAmong16: rank };
}

export interface TargetHintArgs {
  valuesByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
  metro: string;
  indicatorId: string;
  /** 목표 정규화 점수 0~100 */
  targetScore: number;
}

export interface TargetHintResult {
  /** 목표 점수 달성에 필요한 원시 지표값 */
  requiredValue: number;
  /** 현 분포에서 도달 가능 여부 */
  achievable: boolean;
}

/**
 * 단일 지표 역산: 다른 15광역 고정, metro 값만 변화시켜 targetScore에
 * 가장 근접하게 하는 원시값을 수치 탐색(bisection)으로 구한다.
 *
 * metro가 현재 열의 min/max면 값 변경이 경계를 옮겨 단순 선형 역산이 부정확하므로
 * bisection으로 자가검증 가능한 값을 찾는다.
 */
export function targetHint(args: TargetHintArgs): TargetHintResult {
  const { valuesByIndicator, direction, metro, indicatorId, targetScore } = args;
  const dist = valuesByIndicator[indicatorId];
  if (!dist || dist[metro] == null) {
    return { requiredValue: NaN, achievable: false };
  }
  const dir = direction[indicatorId];
  // metro 값 v → 정규화 점수(metro). normalizeMinMax와 동일 규칙(반올림 포함).
  const scoreAt = (v: number): number => {
    const merged = { ...dist, [metro]: v };
    return normalizeMinMax(merged, dir)[metro];
  };

  // 슬라이더/도메인 경계: 전체 분포(metro 포함) 기준으로 ±SLIDER_PAD_RATIO.
  // SDGScenarioSimulator.sliderRange()와 동일 로직(indicatorDomainBounds 사용).
  const { lo: loBound, hi: hiBound } = indicatorDomainBounds(dist);

  // bisection 탐색 범위 = 도메인 경계(슬라이더 범위)로 제한.
  let lo = loBound;
  let hi = hiBound;

  // 점수는 v에 대해 단조(higher_better면 증가, lower_better면 감소).
  // bisection으로 targetScore에 가장 근접한 v를 찾는다.
  const increasing = dir !== 'lower_better';
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const sc = scoreAt(mid);
    if (Math.abs(sc - targetScore) < 0.5) {
      // 정수 반올림 경계 — 더 정밀히 좁히되 충분히 근접하면 종료.
      lo = mid;
      hi = mid;
      break;
    }
    const above = sc > targetScore;
    // increasing: sc가 높으면 v를 낮춰야 함.
    if (above === increasing) hi = mid;
    else lo = mid;
  }
  const requiredValue = (lo + hi) / 2;
  const achieved = scoreAt(requiredValue);
  // 도달 가능 = 도메인(슬라이더) 범위 내이고 targetScore에 ±1 이내로 근접.
  // 도메인 밖 requiredValue(예: 고용률 110%)는 물리적 불가능 → achievable:false.
  const inDomain = requiredValue >= loBound && requiredValue <= hiBound;
  const achievable = inDomain && Math.abs(achieved - targetScore) <= 1;
  return { requiredValue: Math.round(requiredValue * 100) / 100, achievable };
}
