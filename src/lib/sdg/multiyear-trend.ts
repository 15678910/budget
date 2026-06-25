// ============================================================
// 다년 실측 추세 — KOSIS 다년 시계열 선형회귀 (순수·TDD)
// ============================================================
//
// 근거: spec 2026-06-25-kosis-multiyear-trend-design (D3·D4).
//   검증된 KOSIS 지표(고용률 goal8, GRDP goal9)의 **실측 다년 시계열**을
//   최소제곱 선형회귀로 요약(slope·CAGR·R²)하고, 목표(green) 대비 도달 페이스를
//   B(trend.ts)의 CR 임계와 **일관**되게 화살표로 매핑한다.
//
// ⚠️ 정직성 (spec D4, CLAUDE.md PART 9):
//   - 실측 연도점만 사용(보간 0). 회귀선은 추세 요약·외삽일 뿐 중간값을 "데이터"로 표시하지 않는다.
//   - 인과/정책효과 단정 0. 화살표는 "목표 궤도 대비 진전 속도"의 개략 신호.
//   - 2점 개략(trend.ts)과 구분되는 **실측 N년 회귀** 신호다(라벨로 구분).

import type { TrendArrow } from './trend';
import { CR_ON_TRACK_MIN, CR_IMPROVING_MIN } from './trend';

export interface MultiYearTrend {
  /** 회귀에 사용된 유효 연도점 수(≥3). */
  n: number;
  /** 최소 연도. */
  firstYear: number;
  /** 최대 연도. */
  lastYear: number;
  /** 연간 변화량(최소제곱 회귀 기울기, x=year y=value). */
  slope: number;
  /** 연복리성장률 (last/first)^(1/Δyr)−1. firstValue≤0이면 null. */
  cagr: number | null;
  /** 결정계수 R² (0~1, 완전 직선=1). */
  r2: number;
}

export interface YearPoint {
  year: number;
  value: number;
}

/** CR → 화살표 매핑 — trend.ts 임계와 동일(≥0.95 / ≥0.6 / ≥0 / <0). */
function crToArrow(cr: number): TrendArrow {
  if (cr >= CR_ON_TRACK_MIN) return 'on_track';
  if (cr >= CR_IMPROVING_MIN) return 'improving';
  if (cr >= 0) return 'stagnating';
  return 'decreasing';
}

/**
 * 다년 실측 시계열 → 최소제곱 선형회귀 요약.
 *
 * @returns 유효 연도점(year·value 모두 유한) ≥3이면 {n,firstYear,lastYear,slope,cagr,r2},
 *          아니면 null. firstYear/lastYear는 정렬된 첫·끝 연도. cagr은 첫값>0일 때만.
 */
export function linearTrend(points: YearPoint[]): MultiYearTrend | null {
  const pts = points
    .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
    .sort((a, b) => a.year - b.year);
  const n = pts.length;
  if (n < 3) return null;

  const sx = pts.reduce((s, p) => s + p.year, 0);
  const sy = pts.reduce((s, p) => s + p.value, 0);
  const mx = sx / n;
  const my = sy / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    const dx = p.year - mx;
    const dy = p.value - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  // 연도분산 0(이론상 정렬 후 중복연도만 남는 경우)이면 회귀 정의 불가.
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  // R²: syy=0(완전 수평)면 회귀가 분산을 설명할 게 없음 → r2=1(완전 적합)로 둔다.
  const r2 = syy === 0 ? 1 : Math.max(0, Math.min(1, (sxy * sxy) / (sxx * syy)));

  const firstYear = pts[0].year;
  const lastYear = pts[n - 1].year;
  const firstValue = pts[0].value;
  const lastValue = pts[n - 1].value;
  const dyr = lastYear - firstYear;
  const cagr =
    firstValue > 0 && dyr > 0 ? Math.pow(lastValue / firstValue, 1 / dyr) - 1 : null;

  return { n, firstYear, lastYear, slope, cagr, r2 };
}

/**
 * 다년 실측 추세 화살표.
 *
 * - green 있음: 회귀선을 targetYear까지 외삽 → 첫연도 대비 예측 진전(slope*Δ)을
 *   목표 도달에 필요한 진전(green−firstValue)과 비교한 CR을 trend.ts 임계에 매핑.
 *   방향(higherBetter)은 필요 진전의 부호로 자연 반영된다(예: lower_better면
 *   green<firstValue → 필요 진전 음수 → 하락 slope가 양의 CR).
 * - green 없음: slope 부호와 higherBetter로 단순 판정(개선=on_track, 정체=stagnating,
 *   악화=decreasing). 회귀 불가(n<3)면 신호 보류(stagnating).
 *
 * @param points        실측 연도점(보간 아님).
 * @param green         목표값(2030). null이면 slope 부호 판정.
 * @param higherBetter  true=높을수록 양호.
 * @param targetYear    목표 연도(기본 2030).
 */
export function multiYearArrow(
  points: YearPoint[],
  green: number | null,
  higherBetter: boolean,
  targetYear = 2030,
): TrendArrow {
  const t = linearTrend(points);
  if (!t) return 'stagnating'; // 회귀 불가 → 신호 보류

  // 방향 정규화: higherBetter=false면 "개선"은 값 감소 → 부호 반전해 통일 처리.
  const dirSign = higherBetter ? 1 : -1;

  if (green == null) {
    // ⚠️ 한계: slope(회귀 기울기)로만 판정 — firstValue(실측 생값)와 혼용 아님. green 없는 goal(9 등)은
    //   방향 신호만 가능하며, 목표 달성 페이스(CR) 산정은 불가. 방어 가능한 green 확보 시 이 분기 제거.
    const adjSlope = t.slope * dirSign; // >0=개선, <0=악화
    if (adjSlope > 0) return 'on_track';
    if (adjSlope < 0) return 'decreasing';
    return 'stagnating';
  }

  // green 기준 CR — 회귀 외삽(첫연도 기준) vs 목표 진전.
  // firstValue를 회귀선상 첫연도 예측값으로 잡지 않고 실측 첫값으로 둔다(보수적·해석 단순).
  const sorted = points
    .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
    .sort((a, b) => a.year - b.year);
  const firstValue = sorted[0].value;
  const dtTarget = targetYear - t.firstYear;
  if (dtTarget <= 0) return 'stagnating';

  // 필요 진전(연간) = (green − firstValue)/Δtarget. 예측 진전(연간) = slope.
  const requiredPerYear = (green - firstValue) / dtTarget;

  // 목표≈첫값(필요 진전 0): CR 불안정 → 방향상 충족 여부로 직접 판정.
  if (Math.abs(requiredPerYear) < 1e-12) {
    const meets = higherBetter ? firstValue >= green : firstValue <= green;
    return meets ? 'on_track' : 'decreasing';
  }

  // CR = 실제 연간 진전 / 필요 연간 진전. 부호가 일치(같은 방향)하면 양수.
  const cr = t.slope / requiredPerYear;
  return crToArrow(cr);
}
