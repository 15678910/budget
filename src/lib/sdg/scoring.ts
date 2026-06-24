// ============================================================
// SDG 목표값 기준 달성도 점수 + 신호등 (국제기준 코어)
// ============================================================
//
// 근거: SDSN/Bertelsmann SDG Index 방법론(green/red 앵커 min-max 정규화),
//   프랑스/UNESCAP 신호등 임계값 적응.
//
// 기존 16광역 상대 min-max 점수(matrix.ts)와 **의미가 다른** 별개 점수다:
//   - 상대 점수: 16광역 분포 내 순위(항상 best=100, worst=0).
//   - 달성도 점수(여기): 고정된 목표값(green) 대비 거리. 전 지역이 동시에 높/낮을 수 있음.
// ============================================================

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { INDICATOR_TARGETS } from './targets-data';
import { INDICATOR_TO_GOAL } from './indicator-map';

export type TrafficLight = 'green' | 'yellow' | 'orange' | 'red';

// ── 신호등 임계값(상수·고지용) ──────────────────────────────
// SDSN 대시보드 적응: 점수 = 목표(green)까지의 거리.
//   Green ≥75 · Yellow 50~75 · Orange 25~50 · Red <25
export const TRAFFIC_GREEN_MIN = 75;
export const TRAFFIC_YELLOW_MIN = 50;
export const TRAFFIC_ORANGE_MIN = 25;

// ── 색상(고정 팔레트) ────────────────────────────────────────
export const TRAFFIC_COLORS: Record<TrafficLight, string> = {
  green: '#16a34a',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#dc2626',
};

/**
 * 목표값 기준 0~100 달성도 점수.
 *
 * higher_better: t = (value - floor) / (green - floor)
 * lower_better:  t = (floor - value) / (floor - green)   // green < floor
 * → clamp(round(t*100), 0, 100). value=green→100, value=floor→0.
 *
 * green==floor 방어: 분모 0이면 의미 정의 불가 → 50 반환(중립). 일관 사용.
 */
export function scoreTargetBased(
  value: number,
  green: number,
  floor: number,
  direction: IndicatorDirection,
): number {
  const denom = direction === 'lower_better' ? floor - green : green - floor;
  if (denom === 0) return 50; // green==floor 방어 (중립)
  const num = direction === 'lower_better' ? floor - value : value - floor;
  const t = num / denom;
  return clamp(Math.round(t * 100), 0, 100);
}

/** 점수(0~100) → 신호등. 경계: 75↑green · [50,75)yellow · [25,50)orange · <25 red. */
export function trafficLight(score: number): TrafficLight {
  if (score >= TRAFFIC_GREEN_MIN) return 'green';
  if (score >= TRAFFIC_YELLOW_MIN) return 'yellow';
  if (score >= TRAFFIC_ORANGE_MIN) return 'orange';
  return 'red';
}

/** 신호등 → HEX 색상. */
export function trafficColor(light: TrafficLight): string {
  return TRAFFIC_COLORS[light];
}

/** 점수 → 색상(편의 합성). */
export function scoreColor(score: number): string {
  return TRAFFIC_COLORS[trafficLight(score)];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ────────────────────────────────────────────────────────────
// 지표 달성도 (단일 지표)
// ────────────────────────────────────────────────────────────

export interface IndicatorAchievement {
  indicatorId: string;
  value: number;
  score: number;
  light: TrafficLight;
  green: number;
  floor: number;
  type: import('./targets-data').TargetType;
  source: string;
}

/**
 * 한 지표의 한 지역 값에 대한 달성도. INDICATOR_TARGETS에 임계값이 없으면 null.
 */
export function indicatorAchievement(
  indicatorId: string,
  value: number,
  direction: IndicatorDirection,
): IndicatorAchievement | null {
  const t = INDICATOR_TARGETS[indicatorId];
  if (!t) return null;
  const score = scoreTargetBased(value, t.green, t.floor, direction);
  return {
    indicatorId,
    value,
    score,
    light: trafficLight(score),
    green: t.green,
    floor: t.floor,
    type: t.type,
    source: t.source,
  };
}

// ────────────────────────────────────────────────────────────
// Goal 달성도 (goal에 매핑된 지표 달성도 평균)
// ────────────────────────────────────────────────────────────

export interface GoalAchievement {
  goal: number;
  /** 0~100, 매핑 지표 달성도 평균(반올림) */
  score: number;
  light: TrafficLight;
  /** 평균에 포함된 지표 수 */
  indicatorCount: number;
  /** 지표별 달성도 상세 */
  indicators: IndicatorAchievement[];
}

export type GoalAchievementByGoal = Record<number, GoalAchievement | null>;

/**
 * 한 지역(또는 전국)의 지표값 맵으로 goal별 달성도 산정.
 *
 * @param valuesByIndicator 지표 id → 값(해당 지역 단일 값). 전국이면 가중평균값 주입.
 * @param direction         지표 id → 해석방향.
 * 기존 matrix 상대점수와 별개. INDICATOR_TARGETS에 임계값 있는 매핑 지표만 사용.
 */
export function goalAchievement(
  valuesByIndicator: Record<string, number>,
  direction: Record<string, IndicatorDirection>,
): GoalAchievementByGoal {
  // goal → 지표 id[]
  const goalIndicators: Record<number, string[]> = {};
  for (const [ind, goal] of Object.entries(INDICATOR_TO_GOAL)) {
    (goalIndicators[goal] ??= []).push(ind);
  }

  const out: GoalAchievementByGoal = {};
  for (let goal = 1; goal <= 17; goal++) {
    const inds = goalIndicators[goal] ?? [];
    const achievements: IndicatorAchievement[] = [];
    for (const ind of inds) {
      const v = valuesByIndicator[ind];
      if (v == null || !Number.isFinite(v)) continue;
      const dir = direction[ind] ?? 'higher_better';
      const a = indicatorAchievement(ind, v, dir);
      if (a) achievements.push(a);
    }
    if (achievements.length === 0) {
      out[goal] = null;
      continue;
    }
    const avg = Math.round(
      achievements.reduce((s, a) => s + a.score, 0) / achievements.length,
    );
    out[goal] = {
      goal,
      score: avg,
      light: trafficLight(avg),
      indicatorCount: achievements.length,
      indicators: achievements,
    };
  }
  return out;
}
