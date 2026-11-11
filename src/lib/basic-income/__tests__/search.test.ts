import { simulate } from '@/lib/basic-income/engine';
import { firstPassingYear, maxSustainableNow } from '@/lib/basic-income/search';
import { base } from '@/lib/basic-income/__fixtures__/base';

describe('maxSustainableNow', () => {
  it('기금 40조면 월 10만 원이 최대', () => {
    const m = maxSustainableNow({ ...base, initialFund: 40 });
    expect(m.monthlyWon).toBeGreaterThanOrEqual(99_999);
    expect(m.monthlyWon).toBeLessThanOrEqual(100_000);
    expect(m.annualWon).toBe(m.monthlyWon * 12);
    expect(m.impossible).toBe(false);
  });

  it('판정은 액수에 대해 단조', () => {
    const pass = [50_000, 90_000, 99_000, 101_000, 150_000].map(
      (w) => simulate({ ...base, initialFund: 40, monthlyPerPerson: w }).verdict.sustainable,
    );
    expect(pass).toEqual([true, true, true, false, false]);
  });

  it('보전액만으로 실패하면 impossible', () => {
    expect(maxSustainableNow({ ...base, socialInsuranceTopUp: { enabled: true, annual: 1 } }).impossible).toBe(true);
  });

  it('시작 연도를 늦춰 둔 입력이어도 지금(기준 연도) 기준으로 찾는다', () => {
    const m = maxSustainableNow({ ...base, initialFund: 40, payStartYear: 2040 });
    expect(m.monthlyWon).toBeLessThanOrEqual(100_000);
    expect(m.monthlyWon).toBeGreaterThanOrEqual(99_999);
  });
});

describe('firstPassingYear', () => {
  it('유산 연 4조 적립이면 2036년에 처음 통과', () => {
    const i = { ...base, bequest: { eligibleEstate: 40, uptake: 1, shareToFund: 0.1, effectiveTaxRate: 0, specialRate: 0 } };
    expect(firstPassingYear(i)).toBe(2036);
  });

  it('firstPassingYear returns null when never passing', () => {
    expect(firstPassingYear(base)).toBeNull();
  });

  it('지금 통과하면 기준 연도', () => {
    expect(firstPassingYear({ ...base, initialFund: 40 })).toBe(2027);
  });
});
