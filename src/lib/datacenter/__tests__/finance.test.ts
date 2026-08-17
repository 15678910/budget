/**
 * 재무 레이어 골든 테스트 (설계문서 §5.1)
 *
 * 이 테스트의 목적은 "계산이 그럴듯한가"가 아니라 "원보고서의 수치를 정확히
 * 재현하는가"다. 재현에 실패하면 우리 모델이 보고서와 다른 것을 계산하고 있다는
 * 뜻이고, 그러면 보고서를 비판할 근거를 잃는다.
 */

import { analyze, annualCashflows, summarize } from '../finance';
import { AssumptionError, DEFAULT_FINANCE, withFinance } from '../assumptions';
import {
  consistentPessimistic,
  reportOptimistic,
  reportPessimistic,
  rentDeclineApplied,
} from '../scenarios';

const BILLION = 1e9;

// ─── 골든 테스트: 보고서 수치 재현 ────────────────────────────────────────────

describe('보고서 회수기간 재현', () => {
  it('낙관 시나리오: 380억 ÷ (120억 − 9억 − 19.6억) = 4.16년', () => {
    const { summary } = analyze(reportOptimistic.assumptions);
    expect(summary.paybackYears).toBeCloseTo(4.16, 2);
  });

  it('낙관 시나리오의 연간 이자는 19.6억 달러다', () => {
    const rows = annualCashflows(reportOptimistic.assumptions);
    expect(rows[0].interest).toBeCloseTo(1.96 * BILLION, -6);
  });

  it('비관 시나리오: 470억 ÷ (120억 − 9억 − 28.0억) = 5.66년 (보고서와 정확히 일치)', () => {
    const { summary } = analyze(reportPessimistic.assumptions);
    expect(summary.paybackYears).toBeCloseTo(5.66, 2);
  });

  it('비관 시나리오의 이자 28억 달러는 CAPEX 380억 기준으로 계산된 값이다', () => {
    const rows = annualCashflows(reportPessimistic.assumptions);
    expect(rows[0].interest).toBeCloseTo(2.8 * BILLION, -6);
  });

  it('이자를 CAPEX 470억에 일관 적용하면 6.16년이 된다 — 보고서보다 0.5년 늦다', () => {
    const { summary } = analyze(consistentPessimistic.assumptions);
    expect(summary.paybackYears).toBeCloseTo(6.16, 1);

    const reported = analyze(reportPessimistic.assumptions).summary.paybackYears;
    expect(summary.paybackYears! - reported!).toBeGreaterThan(0.4);
  });

  it('일관 적용 시 이자는 34.6억 달러다', () => {
    const rows = annualCashflows(consistentPessimistic.assumptions);
    expect(rows[0].interest / BILLION).toBeCloseTo(3.46, 1);
  });
});

// ─── 임대료 하락을 반영하면 답이 뒤집힌다 (§2.1) ──────────────────────────────

describe('임대료 하락 반영', () => {
  it('낙관 시나리오도 GPU 수명 5년 안에 원금의 62%밖에 회수하지 못한다', () => {
    const { summary } = analyze(rentDeclineApplied.assumptions);
    expect(summary.recoveryRatioAtGpuEol).toBeCloseTo(0.62, 2);
  });

  it('5년 누적 순현금은 234억 달러 수준이다', () => {
    const rows = annualCashflows(rentDeclineApplied.assumptions);
    const fiveYear = rows[4].cumulative;
    expect(fiveYear / BILLION).toBeCloseTo(23.4, 0);
  });

  it('임대료가 일정하다고 가정하면 5년 안에 회수하지만, 하락을 넣으면 실패한다', () => {
    const flat = analyze(reportOptimistic.assumptions).summary;
    const declining = analyze(rentDeclineApplied.assumptions).summary;

    expect(flat.recoveryRatioAtGpuEol).toBeGreaterThan(1);
    expect(declining.recoveryRatioAtGpuEol).toBeLessThan(1);
  });
});

// ─── 현금흐름 구조 ────────────────────────────────────────────────────────────

describe('annualCashflows', () => {
  it('interestOnly는 원금을 갚지 않아 분석기간 말에 잔액이 남는다', () => {
    const { rows, summary } = analyze(reportOptimistic.assumptions);
    expect(rows.every((r) => r.principal === 0)).toBe(true);
    expect(summary.remainingDebt).toBeCloseTo(38 * BILLION * 0.7, -6);
  });

  it('amortizing은 GPU 수명에 걸쳐 부채를 모두 상환한다', () => {
    const a = withFinance({
      ...reportOptimistic.assumptions,
      loanType: 'amortizing',
      gpuLifeYears: 5,
    });
    const rows = annualCashflows(a);
    expect(rows[4].debtBalance).toBeCloseTo(0, -3);
  });

  it('가동 지연 기간에는 매출이 0이지만 이자와 운영비는 계속 발생한다', () => {
    const a = withFinance({
      ...reportOptimistic.assumptions,
      commissioningDelayYears: 2,
    });
    const rows = annualCashflows(a);

    expect(rows[0].revenue).toBe(0);
    expect(rows[1].revenue).toBe(0);
    expect(rows[2].revenue).toBeGreaterThan(0);
    expect(rows[0].interest).toBeGreaterThan(0);
    expect(rows[0].opex).toBeGreaterThan(0);
    expect(rows[0].netCash).toBeLessThan(0);
  });

  it('가동이 2년 지연되면 회수기간이 그만큼 밀린다', () => {
    const base = analyze(reportOptimistic.assumptions).summary;
    const delayed = analyze(
      withFinance({ ...reportOptimistic.assumptions, commissioningDelayYears: 2 }),
    ).summary;

    expect(delayed.paybackYears! - base.paybackYears!).toBeGreaterThan(2);
  });

  it('행 수는 분석기간과 같고 누적값은 단조 증가한다 (흑자 시나리오)', () => {
    const rows = annualCashflows(reportOptimistic.assumptions);
    expect(rows).toHaveLength(10);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i].cumulative).toBeGreaterThan(rows[i - 1].cumulative);
    }
  });
});

// ─── 회수 실패는 큰 숫자가 아니라 null로 표현한다 ─────────────────────────────

describe('회수 실패 처리', () => {
  it('분석기간 내 회수하지 못하면 paybackYears는 null이다', () => {
    const a = withFinance({
      ...reportOptimistic.assumptions,
      revenueYear1Usd: 2 * BILLION,
      horizonYears: 10,
    });
    expect(analyze(a).summary.paybackYears).toBeNull();
  });

  it('현금흐름이 계속 적자면 IRR은 null이다', () => {
    const a = withFinance({
      ...reportOptimistic.assumptions,
      revenueYear1Usd: 0,
    });
    expect(analyze(a).summary.irr).toBeNull();
  });
});

// ─── 잘못된 입력은 조용히 통과시키지 않는다 (§4.2) ────────────────────────────

describe('입력 검증', () => {
  it('음수 CAPEX를 거부한다', () => {
    expect(() => withFinance({ capexUsd: -1 })).toThrow(AssumptionError);
  });

  it('합이 1이 아닌 CAPEX 구성비를 거부한다', () => {
    expect(() =>
      withFinance({ capexSplitServer: 0.5, capexSplitBuilding: 0.3, capexSplitOther: 0.3 }),
    ).toThrow(/구성비의 합/);
  });

  it('1을 초과하는 비율을 거부한다', () => {
    expect(() => withFinance({ debtRatio: 1.2 })).toThrow(AssumptionError);
  });

  it('기본 가정은 검증을 통과한다', () => {
    expect(() => withFinance({})).not.toThrow();
    expect(DEFAULT_FINANCE.capexSplitServer).toBe(0.55);
  });
});

// ─── summarize ────────────────────────────────────────────────────────────────

describe('summarize', () => {
  it('NPV와 IRR을 낸다', () => {
    const rows = annualCashflows(reportOptimistic.assumptions);
    const summary = summarize(rows, reportOptimistic.assumptions);

    expect(summary.npv).toBeGreaterThan(0);
    expect(summary.irr).not.toBeNull();
    expect(summary.irr!).toBeGreaterThan(0.1);
  });

  it('IRR로 할인하면 NPV가 0에 수렴한다', () => {
    const a = reportOptimistic.assumptions;
    const rows = annualCashflows(a);
    const { irr } = summarize(rows, a);

    const npvAtIrr = rows.reduce(
      (acc, row) => acc + row.netCash / (1 + irr!) ** row.year,
      -a.capexUsd,
    );
    // 이분법 허용오차(금리 1e-7)를 금액으로 환산하면 수천 달러가 되므로 CAPEX 대비 상대오차로 본다.
    expect(Math.abs(npvAtIrr) / a.capexUsd).toBeLessThan(1e-6);
  });
});
