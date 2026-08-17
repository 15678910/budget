/**
 * 고용 추정과 발표치 검증 (설계문서 §4.3)
 *
 * 단일값을 내지 않는다. 벤치마크마다 값이 크게 다르므로 범위로 낸다 —
 * 하나의 숫자를 고르는 순간 그 선택 자체가 주장이 된다.
 */

import {
  ANNUAL_WAGE_USD,
  CONSTRUCTION_PER_100MW,
  CROSSCHECK_BENCHMARK,
  INDUCED_MULTIPLIER,
  PERMANENT_PER_100MW,
  VIRGINIA_INVESTMENT_PER_JOB,
} from './sources';
import { USD_KRW } from './constants';

export interface JobsRange {
  low: number;
  mid: number;
  high: number;
}

export interface JobsResult {
  capacityMw: number;
  permanent: JobsRange;
  construction: JobsRange;
  /** 상시 일자리 1개당 투자액 (USD) — 중앙값 기준 */
  investmentPerJobUsd: number;
  /** 투자 1조 원당 상시 일자리 수 */
  jobsPerTrillionKrw: number;
  permanentPer100Mw: JobsRange;
  /** 버지니아 실측(5,400만 달러당 1명)을 같은 투자액에 적용하면 몇 명인가 */
  virginiaEquivalentJobs: number;
}

function rangeFrom(benchmarks: readonly { low: number; high: number }[]): JobsRange {
  const low = Math.min(...benchmarks.map((b) => b.low));
  const high = Math.max(...benchmarks.map((b) => b.high));
  // 중앙값은 벤치마크들의 중간값 평균이다. 산술 중앙이 아니라 출처별 대표값의 평균을 쓴다.
  const mid = benchmarks.reduce((acc, b) => acc + (b.low + b.high) / 2, 0) / benchmarks.length;
  return { low, mid, high };
}

/**
 * 용량과 투자액으로 고용 규모를 추정한다.
 * 100MW 기준 벤치마크를 선형 확대한다 — 규모의 경제는 반영하지 않는다.
 */
export function estimateJobs(capacityMw: number, capexUsd: number): JobsResult {
  if (capacityMw <= 0) throw new Error(`용량은 양수여야 합니다: ${capacityMw}`);
  if (capexUsd <= 0) throw new Error(`투자액은 양수여야 합니다: ${capexUsd}`);

  const units = capacityMw / 100;
  const per100 = rangeFrom(PERMANENT_PER_100MW);
  const permanent: JobsRange = {
    low: per100.low * units,
    mid: per100.mid * units,
    high: per100.high * units,
  };

  const constructionPer100 = rangeFrom(CONSTRUCTION_PER_100MW);
  const construction: JobsRange = {
    low: constructionPer100.low * units,
    mid: constructionPer100.mid * units,
    high: constructionPer100.high * units,
  };

  const capexKrw = capexUsd * USD_KRW;

  return {
    capacityMw,
    permanent,
    construction,
    investmentPerJobUsd: capexUsd / permanent.mid,
    jobsPerTrillionKrw: permanent.mid / (capexKrw / 1e12),
    permanentPer100Mw: per100,
    virginiaEquivalentJobs: capexUsd / VIRGINIA_INVESTMENT_PER_JOB.value,
  };
}

export interface ClaimVerdict {
  claimedJobs: number;
  /** 비교 기준이 된 상시 고용 인원 */
  baselineJobs: number;
  /** 발표치 ÷ 기준. SK 울산의 경우 557배가 나온다 */
  multiple: number;
  /** 통상 취업유발계수를 적용하면 나왔어야 할 인원 */
  impliedByTypical: { low: number; high: number };
  /**
   * 통상 계수 상단으로도 설명되지 않는 배수.
   * 이 값이 1보다 크면 발표치를 설명할 별도의 근거가 필요하다는 뜻이다.
   */
  unexplainedFactor: number;
  explained: boolean;
}

/**
 * 발표된 고용효과가 통상 취업유발계수로 설명되는지 검증한다.
 *
 * 간접·유발 효과 자체를 부정하지 않는다. 다만 산업연관표 취업유발계수는 통상
 * 직접고용의 2~3배 수준이므로, 그보다 훨씬 큰 배수는 별도의 근거를 요구한다.
 */
export function verifyClaim(claimedJobs: number, baselineJobs: number): ClaimVerdict {
  if (baselineJobs <= 0) throw new Error(`기준 인원은 양수여야 합니다: ${baselineJobs}`);

  const multiple = claimedJobs / baselineJobs;
  const impliedByTypical = {
    low: baselineJobs * INDUCED_MULTIPLIER.low,
    high: baselineJobs * INDUCED_MULTIPLIER.high,
  };

  return {
    claimedJobs,
    baselineJobs,
    multiple,
    impliedByTypical,
    unexplainedFactor: multiple / INDUCED_MULTIPLIER.high,
    explained: claimedJobs <= impliedByTypical.high,
  };
}

export interface CrossCheck {
  /** 운영비의 인건비 비중에서 역산한 인원 */
  impliedHeadcount: number;
  /** 실측 벤치마크를 같은 용량에 적용한 범위 */
  benchmarkLow: number;
  benchmarkHigh: number;
  /** 역산값이 실측 범위 안에 들어오는가 */
  overlaps: boolean;
}

/**
 * 운영비 구조에서 역산한 인원과 실측 벤치마크를 대조한다 (설계문서 §2.3).
 *
 * 서로 독립적인 두 출처가 같은 답을 가리키면 강한 증거다. 이 교차검증은
 * 보고서의 인건비 5% 가정이 과소평가가 아님을 보여준다 — 데이터센터는
 * 원래 사람을 거의 쓰지 않는 사업이다.
 */
export function laborCostCrosscheck(
  opexAnnualUsd: number,
  laborShare: number,
  capacityMw: number,
  wageUsd: number = ANNUAL_WAGE_USD.value,
): CrossCheck {
  if (wageUsd <= 0) throw new Error(`인건비는 양수여야 합니다: ${wageUsd}`);
  if (laborShare < 0 || laborShare > 1) {
    throw new Error(`인건비 비중은 0~1이어야 합니다: ${laborShare}`);
  }

  const impliedHeadcount = (opexAnnualUsd * laborShare) / wageUsd;
  const units = capacityMw / 100;
  const benchmarkLow = CROSSCHECK_BENCHMARK.low * units;
  const benchmarkHigh = CROSSCHECK_BENCHMARK.high * units;

  return {
    impliedHeadcount,
    benchmarkLow,
    benchmarkHigh,
    overlaps: impliedHeadcount >= benchmarkLow && impliedHeadcount <= benchmarkHigh,
  };
}
