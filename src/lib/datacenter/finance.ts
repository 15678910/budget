/**
 * 연도별 현금흐름 · 회수기간 · NPV · IRR (설계문서 §4.2)
 *
 * 이 레이어는 아래 레이어(assumptions)의 출력만 소비하고 위 레이어를 알지 못한다.
 * 순수 함수만 두어 UI 없이 테스트할 수 있게 한다.
 */

import { validateFinance } from './assumptions';
import type { FinanceAssumptions, FinanceSummary, YearRow } from './types';

/**
 * 원리금 균등상환 시의 연간 납입액.
 * 금리 0일 때 0으로 나누는 것을 피하려고 분기한다.
 */
function annuityPayment(principal: number, rate: number, years: number): number {
  if (rate === 0) return principal / years;
  const factor = (1 + rate) ** years;
  return (principal * rate * factor) / (factor - 1);
}

/**
 * 연도별 현금흐름표를 만든다.
 *
 * 계산 규칙:
 * - 매출은 임대료 하락률만큼 매년 체감한다. 가동이 지연된 해의 매출은 0이지만
 *   임대료 시세 자체는 계속 떨어지므로 하락은 1년차부터 센다.
 * - 지연 기간에도 운영비와 이자는 그대로 발생한다 (설계문서 §4.4).
 * - interestOnly는 원금을 갚지 않아 분석기간 말에 잔액이 남는다. 원보고서와 동일한 처리다.
 */
export function annualCashflows(a: FinanceAssumptions): YearRow[] {
  validateFinance(a);

  const debtPrincipal = a.capexUsd * a.debtRatio;

  /**
   * 이자는 원칙적으로 실제 CAPEX 기준이지만, interestBasisCapexUsd가 지정되면
   * 그 값을 기준으로 계산한다. 원보고서가 비관 시나리오에서 CAPEX는 470억으로
   * 늘리면서 이자는 380억 기준을 그대로 쓴 불일치를 재현하기 위한 장치다 (§2.2b).
   */
  const interestBasis = (a.interestBasisCapexUsd ?? a.capexUsd) * a.debtRatio;

  const salvageValue = a.capexUsd * a.capexSplitServer * a.salvageRate;
  const payment =
    a.loanType === 'amortizing'
      ? annuityPayment(debtPrincipal, a.interestRate, a.gpuLifeYears)
      : 0;

  const rows: YearRow[] = [];
  let debtBalance = debtPrincipal;
  let cumulative = 0;

  for (let year = 1; year <= a.horizonYears; year += 1) {
    const isDelayed = year <= a.commissioningDelayYears;
    const revenue = isDelayed
      ? 0
      : a.revenueYear1Usd * (1 - a.rentDeclineAnnual) ** (year - 1) * a.utilization;
    const opex = a.opexAnnualUsd * (1 + a.opexInflation) ** (year - 1);
    const ebitda = revenue - opex;

    // 이자는 직전 연말 잔액에 붙는다. interestOnly면 잔액이 줄지 않아 매년 같은 금액이다.
    const interest =
      a.loanType === 'amortizing'
        ? debtBalance * a.interestRate
        : interestBasis * a.interestRate;

    let principal = 0;
    if (a.loanType === 'amortizing' && debtBalance > 0) {
      principal = Math.min(payment - interest, debtBalance);
      if (principal < 0) principal = 0;
      debtBalance -= principal;
    }

    const salvage = year === a.gpuLifeYears ? salvageValue : 0;
    const netCash = ebitda - interest - principal + salvage;
    cumulative += netCash;

    rows.push({
      year,
      revenue,
      opex,
      ebitda,
      interest,
      principal,
      salvage,
      netCash,
      cumulative,
      debtBalance,
    });
  }

  return rows;
}

/**
 * 누적 순현금이 CAPEX를 처음 넘는 시점을 선형보간해 소수로 반환한다.
 * 분석기간 내에 넘지 못하면 null — "회수 못 함"을 큰 숫자로 얼버무리지 않는다.
 */
function paybackYears(rows: YearRow[], capexUsd: number): number | null {
  let previous = 0;
  for (const row of rows) {
    if (row.cumulative >= capexUsd) {
      const gap = capexUsd - previous;
      // 그 해의 순현금이 0 이하인데 누적이 넘었다면 보간이 무의미하므로 연말로 처리한다.
      if (row.netCash <= 0) return row.year;
      return row.year - 1 + gap / row.netCash;
    }
    previous = row.cumulative;
  }
  return null;
}

function npvOf(rows: YearRow[], capexUsd: number, rate: number): number {
  return rows.reduce((acc, row) => acc + row.netCash / (1 + rate) ** row.year, -capexUsd);
}

/**
 * 이분법으로 IRR을 찾는다. 구간 양 끝의 부호가 같으면 해가 없다고 보고 null을 낸다
 * (예: 어떤 할인율에서도 원금을 회수하지 못하는 현금흐름).
 */
function irrOf(rows: YearRow[], capexUsd: number): number | null {
  const LOW = -0.99;
  const HIGH = 10.0;
  const TOLERANCE = 1e-7;
  const MAX_ITERATIONS = 200;

  let low = LOW;
  let high = HIGH;
  let npvLow = npvOf(rows, capexUsd, low);
  let npvHigh = npvOf(rows, capexUsd, high);

  if (npvLow * npvHigh > 0) return null;

  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const mid = (low + high) / 2;
    const npvMid = npvOf(rows, capexUsd, mid);
    if (Math.abs(npvMid) < TOLERANCE || (high - low) / 2 < TOLERANCE) return mid;
    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }
  return (low + high) / 2;
}

export function summarize(rows: YearRow[], a: FinanceAssumptions): FinanceSummary {
  const atEol = rows.find((row) => row.year === Math.floor(a.gpuLifeYears));
  const last = rows[rows.length - 1];

  return {
    paybackYears: paybackYears(rows, a.capexUsd),
    npv: npvOf(rows, a.capexUsd, a.discountRate),
    irr: irrOf(rows, a.capexUsd),
    // GPU 수명이 분석기간을 넘으면 회수비율을 정의할 수 없으므로 0으로 두지 않고 마지막 값을 쓴다.
    recoveryRatioAtGpuEol: (atEol?.cumulative ?? last.cumulative) / a.capexUsd,
    totalNetCash: last.cumulative,
    remainingDebt: last.debtBalance,
  };
}

/** 가정 하나로 현금흐름과 요약을 한 번에 낸다. UI에서 쓰는 진입점이다. */
export function analyze(a: FinanceAssumptions): { rows: YearRow[]; summary: FinanceSummary } {
  const rows = annualCashflows(a);
  return { rows, summary: summarize(rows, a) };
}
