// ============================================================
// 추세(목표-갭 + 화살표) — 2점(2018→최신) SDSN CR 방법론 (순수·TDD)
// ============================================================
//
// 근거: SDSN/UNESCAP 추세 방법론. CR(Current Ratio of progress) = AGRa / AGRr.
//   - AGRa(actual annual growth rate)  = (current/base)^(1/Δt_actual) − 1
//   - AGRr(required annual growth rate) = (green/base)^(1/Δt_target) − 1
//   - CR = AGRa / AGRr (목표 궤도 대비 실제 진전 비율)
//
// ⚠️ 정직성 (spec D1·D4, CLAUDE.md PART 9):
//   - **2점 개략** 추세다. base=2018 실측 끝점, current=최신 실측. 중간연도(보간) 미사용·미표시.
//   - 인과 주장 0. 화살표는 "목표 궤도 대비 진전 속도"의 개략 신호일 뿐이다.
//   - 방향(direction)은 green/base 위치로 자연 처리되나 명시 인자로 받는다.
//     값(current/base/green)은 양수 가정 → 실수 거듭제곱 안전.

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { scoreTargetBased } from './scoring';
import { INDICATOR_TO_GOAL } from './indicator-map';
import { INDICATOR_TARGETS } from './targets-data';

// ── 기본 연도 상수(고지용) ──────────────────────────────────
export const TREND_BASE_YEAR = 2018;
export const TREND_CURRENT_YEAR = 2025;
export const TREND_TARGET_YEAR = 2030;

// ── 화살표(추세 신호) ────────────────────────────────────────
export type TrendArrow = 'on_track' | 'improving' | 'stagnating' | 'decreasing';

// CR → 화살표 경계(상수·고지용): ≥0.95 on_track / [0.6,0.95) improving /
//   [0,0.6) stagnating / <0 decreasing.
export const CR_ON_TRACK_MIN = 0.95;
export const CR_IMPROVING_MIN = 0.6;

/** AGRr≈0 판정 임계값(목표≈기준). */
const AGRR_EPS = 1e-9;

// ────────────────────────────────────────────────────────────
// 목표-갭
// ────────────────────────────────────────────────────────────

export interface TargetGap {
  /** 목표값 기준 달성도 0~100 (scoreTargetBased). */
  achievement: number;
  /** 목표까지 남은 거리 = 100 − achievement (0~100). */
  gapToTarget: number;
}

/**
 * 목표-갭. achievement=scoreTargetBased(current,green,floor,direction),
 * gapToTarget=100−achievement.
 */
export function targetGap(
  current: number,
  green: number,
  floor: number,
  direction: IndicatorDirection,
): TargetGap {
  const achievement = scoreTargetBased(current, green, floor, direction);
  return { achievement, gapToTarget: 100 - achievement };
}

// ────────────────────────────────────────────────────────────
// 추세 CR
// ────────────────────────────────────────────────────────────

export interface TrendCR {
  /** 실제 연평균성장률 (current/base 기반). */
  agra: number;
  /** 목표 도달 필요 연평균성장률 (green/base 기반). */
  agrr: number;
  /** CR = AGRa/AGRr. */
  cr: number;
  /** 추세 화살표. */
  arrow: TrendArrow;
}

export interface TrendOpts {
  baseYear?: number;
  currentYear?: number;
  targetYear?: number;
}

/** CR → 화살표 매핑(경계 포함). */
function crToArrow(cr: number): TrendArrow {
  if (cr >= CR_ON_TRACK_MIN) return 'on_track';
  if (cr >= CR_IMPROVING_MIN) return 'improving';
  if (cr >= 0) return 'stagnating';
  return 'decreasing';
}

/** current가 목표(green)를 방향상 충족하는가. */
function meetsTarget(current: number, green: number, direction: IndicatorDirection): boolean {
  return direction === 'lower_better' ? current <= green : current >= green;
}

/**
 * 2점(base→current) CR 추세.
 *
 * @returns 정의 가능 시 {agra,agrr,cr,arrow}, 방어 케이스(base≤0)면 null.
 *
 * 방어:
 *   - base≤0 → null (성장률 정의 불가, 거듭제곱·나눗셈 위험).
 *   - |AGRr|<ε (목표≈기준, 사실상 이미 달성 영역) → CR 계산 불안정 →
 *     current가 목표 충족이면 on_track, 아니면 decreasing.
 */
export function trendCR(
  base: number,
  current: number,
  green: number,
  direction: IndicatorDirection,
  opts: TrendOpts = {},
): TrendCR | null {
  const baseYear = opts.baseYear ?? TREND_BASE_YEAR;
  const currentYear = opts.currentYear ?? TREND_CURRENT_YEAR;
  const targetYear = opts.targetYear ?? TREND_TARGET_YEAR;

  // base≤0 또는 비유한 → 성장률 정의 불가.
  if (!Number.isFinite(base) || base <= 0) return null;
  if (!Number.isFinite(current) || current <= 0 || !Number.isFinite(green) || green <= 0) {
    return null;
  }

  const dtActual = currentYear - baseYear;
  const dtTarget = targetYear - baseYear;
  if (dtActual <= 0 || dtTarget <= 0) return null;

  const agra = Math.pow(current / base, 1 / dtActual) - 1;
  const agrr = Math.pow(green / base, 1 / dtTarget) - 1;

  // base가 이미 목표를 충족/초과: AGRr 부호가 역전되어 CR 신호가 뒤집힌다.
  // (예: higher_better base=110, green=100 → AGRr<0, AGRa>0 → CR<0 → 'decreasing' 오신호)
  // base 충족 시 CR 계산을 건너뛰고 current 상태로 직접 화살표 결정.
  const baseMeets = meetsTarget(base, green, direction);
  if (baseMeets) {
    const curMeets = meetsTarget(current, green, direction);
    const improved =
      direction === 'lower_better' ? current <= base : current >= base;
    const arrow: TrendArrow = curMeets ? (improved ? 'on_track' : 'improving') : 'decreasing';
    return { agra, agrr, cr: curMeets ? 1 : -1, arrow };
  }

  // 목표≈기준: 필요 성장률 0 → CR 불안정. current 목표 충족 여부로 직접 판정.
  // (baseMeets의 부분집합이지만 |agrr|<ε 수치 방어로 유지)
  if (Math.abs(agrr) < AGRR_EPS) {
    const arrow: TrendArrow = meetsTarget(current, green, direction) ? 'on_track' : 'decreasing';
    return { agra, agrr, cr: meetsTarget(current, green, direction) ? 1 : -1, arrow };
  }

  const cr = agra / agrr;
  return { agra, agrr, cr, arrow: crToArrow(cr) };
}

// ────────────────────────────────────────────────────────────
// Goal 추세 종합
// ────────────────────────────────────────────────────────────

export interface GoalTrend {
  goal: number;
  /** 대표 CR (매핑 지표 CR 평균). */
  cr: number;
  /** 종합 화살표 (평균 CR 기준). */
  arrow: TrendArrow;
  /** 추세 산정에 포함된 지표 수. */
  indicatorCount: number;
}

/**
 * 한 goal의 매핑 지표 추세를 종합. 각 지표의 (base, current, green)로 trendCR을 구해
 * 유효한 CR들의 평균 → 종합 화살표. 유효 데이터 없으면 null.
 *
 * @param goalNum        SDG 목표 번호.
 * @param currentByInd   지표 id → 해당 지역 현재값.
 * @param baseByInd      지표 id → 해당 지역 base2018 값.
 * @param direction      지표 id → 해석방향.
 * @param opts           연도 오버라이드.
 */
export function goalTrend(
  goalNum: number,
  currentByInd: Record<string, number>,
  baseByInd: Record<string, number>,
  direction: Record<string, IndicatorDirection>,
  opts: TrendOpts = {},
): GoalTrend | null {
  const crs: number[] = [];
  for (const [ind, goal] of Object.entries(INDICATOR_TO_GOAL)) {
    if (goal !== goalNum) continue;
    const target = INDICATOR_TARGETS[ind];
    if (!target) continue;
    const current = currentByInd[ind];
    const base = baseByInd[ind];
    if (current == null || base == null) continue;
    const dir = direction[ind] ?? 'higher_better';
    const t = trendCR(base, current, target.green, dir, opts);
    if (t) crs.push(Math.max(-2, Math.min(2, t.cr)));
  }
  if (crs.length === 0) return null;
  const cr = crs.reduce((s, v) => s + v, 0) / crs.length;
  return { goal: goalNum, cr, arrow: crToArrow(cr), indicatorCount: crs.length };
}
