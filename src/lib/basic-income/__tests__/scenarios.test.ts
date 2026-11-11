import { compareToBudget } from '@/lib/basic-income/budget-compare';
import { runFutureFundScenarios } from '@/lib/basic-income/future-fund-scenarios';
import type { FutureFundInput, SourcedValue } from '@/lib/basic-income/types';
import { base } from '@/lib/basic-income/__fixtures__/base';

const ff: FutureFundInput = {
  totalFund: 162.3,
  surplusFund: 104.4,
  depositRate: 0.03,
  consignReturn: 0.05,
  child: { births: 250_000, targetWon: 1e8, rate: 0.066, years: 18 },
};

describe('runFutureFundScenarios', () => {
  it('네 시나리오, S4만 종잣돈 104.4', () => {
    const rows = runFutureFundScenarios(base, ff);
    expect(rows.map((r) => r.id)).toEqual(['S1', 'S2', 'S3', 'S4']);
    expect(rows[3].seed).toBeCloseTo(104.4, 9);
    expect(rows[0].seed).toBe(0);
  });

  it('S2 추가 수익, S3 아동 결과, 나머지는 null', () => {
    const [s1, s2, s3, s4] = runFutureFundScenarios(base, ff);
    expect(s2.extraReturnToGeneral).toBeCloseTo(2.088, 9);
    expect(s3.child?.coveredShare).toBeCloseTo(0.22774, 4);
    expect(s1.extraReturnToGeneral).toBeNull();
    expect(s1.child).toBeNull();
    expect(s4.child).toBeNull();
  });

  it('S4 지금 1인당: 104.4×3%/100만 명', () => {
    const s4 = runFutureFundScenarios(base, ff)[3];
    expect(s4.nowAnnualWon).toBeGreaterThanOrEqual(3_131_988);
    expect(s4.nowAnnualWon).toBeLessThanOrEqual(3_132_000);
    expect(s4.targetYear).toBe(2027);
  });

  it('S1은 종잣돈 0이라 목표 연도가 없고 판정 실패', () => {
    const s1 = runFutureFundScenarios(base, ff)[0];
    expect(s1.sustainable).toBe(false);
    expect(s1.targetYear).toBeNull();
    expect(s1.control).not.toBe('');
    expect(s1.futureGeneration).not.toBe('');
  });
});

describe('compareToBudget', () => {
  it('금액 내림차순, 0 이하 항목은 뺀다', () => {
    const src: SourcedValue = { label: 'x', value: 0, unit: '조 원', kind: 'assumption' };
    const r = compareToBudget(60, [
      { id: 'a', label: 'a', amount: 30, source: src },
      { id: 'b', label: 'b', amount: 120, source: src },
      { id: 'z', label: 'z', amount: 0, source: src },
    ]);
    expect(r.map((x) => x.id)).toEqual(['b', 'a']);
    expect(r[0].ratio).toBeCloseTo(0.5, 9);
  });
});
