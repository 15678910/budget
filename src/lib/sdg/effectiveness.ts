// ============================================================
// 실효성·효율성 (D) — 예산 대비 성과(효율) + 산출→성과(실효) (순수·TDD)
// ============================================================
//
// 근거: OECD 평가 6기준(2024), output/outcome/impact 구분. A(달성도)·B(추세)·재정 위에 구축.
//
// ⚠️ 정직성 (spec D3, CLAUDE.md PART 9):
//   - **정책 인과 귀속 불가**(반사실 없음). 예산-성과 관계는 **상관**일 뿐 인과가 아니다.
//   - 지역 여건(인구·산업·고령화) 차이가 교란한다. SDG별 예산 배분은 세출 미분류로 추정 금지.
//   - 데이터 보유 목표만 사용한다(없는 목표는 평균에서 제외).
//
// 재사용:
//   - scoring.ts goalAchievement → 목표값 기준 0~100 달성도·신호등.
//   - achievement.ts regionGoalAchievement → 특정 지역 goal별 달성도.
//   - trend-build.ts regionGoalTrend → 특정 지역 goal별 2점 CR 추세(↗/↘).

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { regionGoalAchievement } from './achievement';
import { regionGoalTrend } from './trend-build';
import type { TrafficLight } from './scoring';

// ── 사분면 ───────────────────────────────────────────────────
// x=1인당 예산, y=종합 달성도. 중앙값 기준 4분할.
//   efficient : 저예산·고성과 (x<medianX, y≥medianY)
//   invest    : 고예산·고성과 (x≥medianX, y≥medianY)
//   review    : 고예산·저성과 (x≥medianX, y<medianY)
//   limited   : 저예산·저성과 (x<medianX, y<medianY)
// 경계(동률) 규칙: x≥medianX·y≥medianY를 '고'로 일관 처리(≥ 포함).
export type Quadrant = 'efficient' | 'invest' | 'review' | 'limited';

/** 한 광역의 재정 입력(효율 계산에 필요한 최소 필드). */
export interface FiscalInput {
  /** 예산규모 (억원). */
  budget: number;
  /** 인구 (명). */
  population: number;
  /** 재정자립도 (%). */
  independence: number;
  /** 지역채무 (억원). */
  debt: number;
}

export interface EfficiencyPoint {
  region: string;
  /** 1인당 예산 (만원/인) = budget억 * 1e8 / population / 10000. */
  perCapitaBudget: number;
  /** 종합 달성도 (0~100). */
  achievement: number;
  quadrant: Quadrant;
}

export interface BudgetEfficiencyResult {
  points: EfficiencyPoint[];
  /** 1인당 예산의 중앙값 (사분면 분할선). */
  medianX: number;
  /** 종합 달성도의 중앙값 (사분면 분할선). */
  medianY: number;
}

// ────────────────────────────────────────────────────────────
// 종합 달성도
// ────────────────────────────────────────────────────────────

/**
 * 특정 지역의 종합 달성도 = 데이터 보유 목표 달성도 평균(반올림, 0~100).
 * 데이터 보유 목표가 하나도 없으면 null.
 */
export function overallAchievement(
  region: string,
  valuesByIndicator: Record<string, Record<string, number>>,
  direction: Record<string, IndicatorDirection>,
): number | null {
  const byGoal = regionGoalAchievement(valuesByIndicator, region, direction);
  const scores: number[] = [];
  for (const g of Object.values(byGoal)) {
    if (g) scores.push(g.score);
  }
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

// ────────────────────────────────────────────────────────────
// 효율 사분면
// ────────────────────────────────────────────────────────────

/** 1인당 예산 (만원/인). budget(억원)·population(명)→만원/인. 단위 일관. */
function perCapitaBudgetManwon(budgetEok: number, population: number): number {
  // budget억원 = budgetEok * 1e8 원. /population = 원/인. /10000 = 만원/인.
  return (budgetEok * 1e8) / population / 10000;
}

/** 정렬된 배열의 중앙값(짝수 길이는 두 중앙값 평균). 빈 배열은 0. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** x(예산)·y(달성도)·중앙값으로 사분면 결정. ≥median을 '고'로 일관 처리. */
function classifyQuadrant(x: number, y: number, medianX: number, medianY: number): Quadrant {
  const highX = x >= medianX;
  const highY = y >= medianY;
  if (highY) return highX ? 'invest' : 'efficient';
  return highX ? 'review' : 'limited';
}

/**
 * 16광역 예산-성과 효율 산점도 데이터.
 *
 * @param regions            대상 광역명 배열.
 * @param fiscalByRegion     광역명 → 재정 입력. 없는 광역 제외.
 * @param valuesByIndicator  지표 id → (광역 → 값).
 * @param direction          지표 id → 해석방향.
 *
 * 제외 규칙: 재정 없음 / budget·population ≤0 / 종합 달성도 null → 점에서 제외.
 * 중앙값은 **유효 점들로만** 산정한다.
 */
export function budgetEfficiency(
  regions: string[],
  fiscalByRegion: Record<string, FiscalInput>,
  valuesByIndicator: Record<string, Record<string, number>>,
  direction: Record<string, IndicatorDirection>,
): BudgetEfficiencyResult {
  // 1차: 유효 광역의 (perCapita, achievement) 산출.
  const raw: { region: string; perCapitaBudget: number; achievement: number }[] = [];
  for (const region of regions) {
    const f = fiscalByRegion[region];
    if (!f) continue;
    if (!(f.budget > 0) || !(f.population > 0)) continue;
    const achievement = overallAchievement(region, valuesByIndicator, direction);
    if (achievement == null) continue;
    raw.push({
      region,
      perCapitaBudget: perCapitaBudgetManwon(f.budget, f.population),
      achievement,
    });
  }

  const medianX = median(raw.map((r) => r.perCapitaBudget));
  const medianY = median(raw.map((r) => r.achievement));

  const points: EfficiencyPoint[] = raw.map((r) => ({
    ...r,
    quadrant: classifyQuadrant(r.perCapitaBudget, r.achievement, medianX, medianY),
  }));

  return { points, medianX, medianY };
}

// ────────────────────────────────────────────────────────────
// output / outcome 요약
// ────────────────────────────────────────────────────────────

export interface LightCounts {
  green: number;
  yellow: number;
  orange: number;
  red: number;
}

export interface OutcomeSummary {
  /** Output(투입·산출): 재정 지표. */
  output: {
    /** 예산규모 (억원). */
    budget: number;
    /** 재정자립도 (%). */
    independence: number;
    /** 채무비율 (%) = debt/budget*100. */
    debtRatio: number;
  };
  /** Outcome(성과): 달성도·신호등 분포·추세. */
  outcome: {
    /** 종합 달성도 (0~100) | null. */
    achievement: number | null;
    /** goal별 신호등 분포. */
    lightCounts: LightCounts;
    /** 추세: up=on_track/improving, flat=stagnating, down=decreasing 카운트. */
    trend: { up: number; flat: number; down: number };
  };
  /** Benchmarking: 16광역 순위(전달된 경우). */
  rank?: number;
}

/**
 * 특정 지역의 output/outcome 요약.
 *
 * ⚠️ Impact(인과 영향)는 산정하지 않는다 — 반사실 없음·귀속 불가(spec D3).
 *    output·outcome은 **상관 맥락**일 뿐 정책 효과를 의미하지 않는다.
 *
 * @param region              광역명.
 * @param fiscal              해당 광역 재정 입력.
 * @param valuesByIndicator   지표 id → (광역 → 현재값).
 * @param direction           지표 id → 해석방향.
 * @param base2018ByIndicator 지표 id → (광역 → 2018 기준값) — 추세용.
 * @param rank                16광역 순위(선택, 벤치마킹용).
 */
export function outcomeSummary(
  region: string,
  fiscal: FiscalInput,
  valuesByIndicator: Record<string, Record<string, number>>,
  direction: Record<string, IndicatorDirection>,
  base2018ByIndicator: Record<string, Record<string, number>>,
  rank?: number,
): OutcomeSummary {
  const debtRatio = fiscal.budget > 0 ? (fiscal.debt / fiscal.budget) * 100 : 0;

  // 신호등 분포 (A 달성도 재사용).
  const achByGoal = regionGoalAchievement(valuesByIndicator, region, direction);
  const lightCounts: LightCounts = { green: 0, yellow: 0, orange: 0, red: 0 };
  for (const g of Object.values(achByGoal)) {
    if (g) lightCounts[g.light as TrafficLight] += 1;
  }

  // 추세 분포 (B 추세 재사용). 3분류: up=on_track/improving, flat=stagnating, down=decreasing.
  const trendByGoal = regionGoalTrend(valuesByIndicator, base2018ByIndicator, region, direction);
  let up = 0;
  let flat = 0;
  let down = 0;
  for (const t of Object.values(trendByGoal)) {
    if (!t) continue;
    if (t.arrow === 'on_track' || t.arrow === 'improving') up += 1;
    else if (t.arrow === 'stagnating') flat += 1;
    else if (t.arrow === 'decreasing') down += 1;
  }

  return {
    output: {
      budget: fiscal.budget,
      independence: fiscal.independence,
      debtRatio,
    },
    outcome: {
      achievement: overallAchievement(region, valuesByIndicator, direction),
      lightCounts,
      trend: { up, flat, down },
    },
    rank,
  };
}
