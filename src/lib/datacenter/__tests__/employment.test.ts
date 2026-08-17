/**
 * 고용 레이어 테스트 (설계문서 §5.2)
 *
 * 핵심은 두 가지다 — 인건비 역산과 실측 벤치마크가 겹치는지(§2.3),
 * 그리고 발표된 고용효과가 통상 취업유발계수로 설명되는지(§2.4).
 */

import { estimateJobs, laborCostCrosscheck, verifyClaim } from '../employment';
import { ALL_FIGURES, ULSAN_CLAIMED_EFFECT, ULSAN_PERMANENT } from '../sources';

const BILLION = 1e9;

// ─── §2.3 인건비 교차검증 ─────────────────────────────────────────────────────

describe('laborCostCrosscheck', () => {
  it('1GW OPEX 9억 달러의 인건비 5%는 약 300명을 가리킨다', () => {
    const result = laborCostCrosscheck(0.9 * BILLION, 0.05, 1000);
    expect(result.impliedHeadcount).toBeCloseTo(300, 0);
  });

  it('역산값 300명은 실측 벤치마크 300~500명 구간 안에 들어온다', () => {
    const result = laborCostCrosscheck(0.9 * BILLION, 0.05, 1000);

    expect(result.benchmarkLow).toBe(300);
    expect(result.benchmarkHigh).toBe(500);
    expect(result.overlaps).toBe(true);
  });

  it('인건비 비중이 비정상적으로 높으면 실측 범위를 벗어난다', () => {
    const result = laborCostCrosscheck(0.9 * BILLION, 0.5, 1000);
    expect(result.overlaps).toBe(false);
    expect(result.impliedHeadcount).toBeGreaterThan(result.benchmarkHigh);
  });

  it('잘못된 인건비 비중을 거부한다', () => {
    expect(() => laborCostCrosscheck(0.9 * BILLION, 1.5, 1000)).toThrow(/인건비 비중/);
  });
});

// ─── §2.4 발표 고용효과 검증 ──────────────────────────────────────────────────

describe('verifyClaim', () => {
  it('SK 울산의 7만 8천 명은 상시 140명의 557배다', () => {
    const verdict = verifyClaim(ULSAN_CLAIMED_EFFECT.value, ULSAN_PERMANENT.value);
    expect(verdict.multiple).toBeCloseTo(557, 0);
  });

  it('통상 취업유발계수(2~3배)로는 280~420명까지만 설명된다', () => {
    const verdict = verifyClaim(ULSAN_CLAIMED_EFFECT.value, ULSAN_PERMANENT.value);

    expect(verdict.impliedByTypical.low).toBe(280);
    expect(verdict.impliedByTypical.high).toBe(420);
    expect(verdict.explained).toBe(false);
  });

  it('통상 계수 상단으로도 설명되지 않는 배수를 낸다', () => {
    const verdict = verifyClaim(ULSAN_CLAIMED_EFFECT.value, ULSAN_PERMANENT.value);
    expect(verdict.unexplainedFactor).toBeCloseTo(185.7, 0);
  });

  it('통상 범위 안의 발표치는 설명된 것으로 판정한다', () => {
    const verdict = verifyClaim(400, 140);
    expect(verdict.explained).toBe(true);
    expect(verdict.unexplainedFactor).toBeLessThan(1);
  });

  it('기준 인원이 0이면 거부한다', () => {
    expect(() => verifyClaim(78000, 0)).toThrow();
  });
});

// ─── 고용 규모 추정 ───────────────────────────────────────────────────────────

describe('estimateJobs', () => {
  it('1GW 상시 고용을 범위로 낸다 — 단일값을 내지 않는다', () => {
    const jobs = estimateJobs(1000, 38 * BILLION);

    expect(jobs.permanent.low).toBe(200);
    expect(jobs.permanent.high).toBe(2000);
    expect(jobs.permanent.mid).toBeGreaterThan(jobs.permanent.low);
    expect(jobs.permanent.mid).toBeLessThan(jobs.permanent.high);
  });

  it('100MW 기준 벤치마크를 선형 확대한다', () => {
    const oneGw = estimateJobs(1000, 38 * BILLION);
    const hundredMw = estimateJobs(100, 3.8 * BILLION);

    expect(oneGw.permanent.mid).toBeCloseTo(hundredMw.permanent.mid * 10, 6);
  });

  it('상시 일자리 1개당 투자액이 수백억 원 규모임을 보여준다', () => {
    const jobs = estimateJobs(1000, 38 * BILLION);
    // 380억 달러 ÷ 상시 약 550명 → 1인당 6천만 달러 이상
    expect(jobs.investmentPerJobUsd).toBeGreaterThan(5e7);
  });

  it('버지니아 실측(5,400만 달러당 1명)을 같은 투자액에 적용한 값을 병기한다', () => {
    const jobs = estimateJobs(1000, 38 * BILLION);
    expect(jobs.virginiaEquivalentJobs).toBeCloseTo((38 * BILLION) / 5.4e7, 6);
  });

  it('투자 1조 원당 일자리 수를 낸다', () => {
    const jobs = estimateJobs(1000, 38 * BILLION);
    expect(jobs.jobsPerTrillionKrw).toBeGreaterThan(0);
    expect(jobs.jobsPerTrillionKrw).toBeLessThan(20);
  });

  it('음수 용량과 투자액을 거부한다', () => {
    expect(() => estimateJobs(-1, 38 * BILLION)).toThrow();
    expect(() => estimateJobs(1000, 0)).toThrow();
  });
});

// ─── 출처 없는 숫자는 테스트가 막는다 (§3.3, §5.2) ────────────────────────────

describe('출처 메타데이터', () => {
  it('모든 수치가 출처 주체·시점·성격을 갖는다', () => {
    for (const figure of ALL_FIGURES) {
      expect(figure.source.trim().length).toBeGreaterThan(0);
      expect(figure.date).toMatch(/^\d{4}-\d{2}$/);
      expect(['measured', 'announced', 'derived', 'estimated']).toContain(figure.kind);
      expect(figure.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('범위 수치는 low ≤ high를 만족한다', () => {
    for (const figure of ALL_FIGURES) {
      if ('low' in figure) {
        expect(figure.low).toBeLessThanOrEqual(figure.high);
      }
    }
  });
});
