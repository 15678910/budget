/**
 * 재무 파라미터 기본값과 검증 (설계문서 §4.1)
 *
 * 잘못된 입력으로 조용히 틀린 답을 내지 않는다. 비율이 1을 넘거나 CAPEX가 음수면
 * 계산 전에 즉시 거부한다.
 */

import type { FinanceAssumptions } from './types';

/** 억 달러 단위를 USD로. 가독성을 위해 스펙의 표기(380억 달러)와 코드를 맞춘다. */
const BILLION = 1e9;

/**
 * 기본 가정 — 원보고서의 낙관 시나리오를 출발점으로 하되,
 * 임대료 하락(연 23.5%)은 기본값으로 켜 둔다.
 *
 * 보고서 수치를 그대로 재현하려면 rentDeclineAnnual을 0으로 두어야 한다
 * (scenarios의 reportReplication 프리셋이 이를 고정한다).
 */
export const DEFAULT_FINANCE: FinanceAssumptions = {
  capexUsd: 38 * BILLION,
  capexSplitServer: 0.55,
  capexSplitBuilding: 0.3,
  capexSplitOther: 0.15,

  opexAnnualUsd: 0.9 * BILLION,
  revenueYear1Usd: 12 * BILLION,
  utilization: 1.0,

  debtRatio: 0.7,
  interestRate: 0.07,
  loanType: 'interestOnly',

  rentDeclineAnnual: 0.235,
  gpuLifeYears: 5,
  salvageRate: 0.0,

  discountRate: 0.08,
  horizonYears: 10,
  opexInflation: 0.02,

  commissioningDelayYears: 0,
};

export class AssumptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssumptionError';
  }
}

const RATIO_FIELDS: readonly (keyof FinanceAssumptions)[] = [
  'capexSplitServer',
  'capexSplitBuilding',
  'capexSplitOther',
  'utilization',
  'debtRatio',
  'rentDeclineAnnual',
  'salvageRate',
];

/**
 * 부동소수점 합산 오차 허용치. 0.55 + 0.30 + 0.15 는 이진 부동소수점에서
 * 정확히 1이 되지 않으므로 엄격 비교를 쓸 수 없다.
 */
const EPSILON = 1e-9;

/** 계산 전에 반드시 통과해야 하는 검증. 위반 시 AssumptionError를 던진다. */
export function validateFinance(a: FinanceAssumptions): void {
  if (!Number.isFinite(a.capexUsd) || a.capexUsd <= 0) {
    throw new AssumptionError(`CAPEX는 양수여야 합니다: ${a.capexUsd}`);
  }
  if (!Number.isFinite(a.opexAnnualUsd) || a.opexAnnualUsd < 0) {
    throw new AssumptionError(`OPEX는 0 이상이어야 합니다: ${a.opexAnnualUsd}`);
  }
  if (!Number.isFinite(a.revenueYear1Usd) || a.revenueYear1Usd < 0) {
    throw new AssumptionError(`매출은 0 이상이어야 합니다: ${a.revenueYear1Usd}`);
  }

  for (const field of RATIO_FIELDS) {
    const v = a[field] as number;
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      throw new AssumptionError(`${String(field)}는 0~1 범위여야 합니다: ${v}`);
    }
  }

  const splitSum = a.capexSplitServer + a.capexSplitBuilding + a.capexSplitOther;
  if (Math.abs(splitSum - 1) > EPSILON) {
    throw new AssumptionError(`CAPEX 구성비의 합이 1이 아닙니다: ${splitSum}`);
  }

  if (a.horizonYears < 1 || !Number.isInteger(a.horizonYears)) {
    throw new AssumptionError(`분석기간은 1 이상의 정수여야 합니다: ${a.horizonYears}`);
  }
  if (a.gpuLifeYears < 1) {
    throw new AssumptionError(`GPU 수명은 1 이상이어야 합니다: ${a.gpuLifeYears}`);
  }
  if (a.commissioningDelayYears < 0 || !Number.isInteger(a.commissioningDelayYears)) {
    throw new AssumptionError(
      `가동 지연은 0 이상의 정수여야 합니다: ${a.commissioningDelayYears}`,
    );
  }
  if (a.interestRate < 0 || a.discountRate < 0) {
    throw new AssumptionError('금리와 할인율은 음수일 수 없습니다');
  }
  if (a.interestBasisCapexUsd !== undefined && a.interestBasisCapexUsd <= 0) {
    throw new AssumptionError(
      `이자 계산 기준 CAPEX는 양수여야 합니다: ${a.interestBasisCapexUsd}`,
    );
  }
}

/** 기본값 위에 일부 필드만 덮어써 새 가정을 만든다. */
export function withFinance(overrides: Partial<FinanceAssumptions>): FinanceAssumptions {
  const merged = { ...DEFAULT_FINANCE, ...overrides };
  validateFinance(merged);
  return merged;
}
