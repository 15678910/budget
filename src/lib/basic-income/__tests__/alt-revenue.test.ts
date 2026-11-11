import { carbonTax, dataTax, robotTax } from '@/lib/basic-income/alt-revenue';
import type { CarbonTaxInput } from '@/lib/basic-income/types';

describe('alt-revenue', () => {
  it('로봇세는 해마다 감소율만큼 줄어든다', () => {
    const r = { base: 100, rate: 0.01, annualDecline: 0.1, mode: 'save' as const };
    expect(robotTax(r, 0)).toBeCloseTo(1, 9);
    expect(robotTax(r, 1)).toBeCloseTo(0.9, 9);
  });

  it('데이터세 3%', () => {
    expect(dataTax({ base: 10, rate: 0.03, annualGrowth: 0, mode: 'pay' }, 5)).toBeCloseTo(0.3, 9);
  });

  it('탄소세는 탄소중립 연도까지 직선으로 줄어든다', () => {
    const c: CarbonTaxInput = { emissionsMt: 600, pricePerTonWon: 50_000, netZeroYear: 2050, taxableShare: 1, mode: 'save' };
    expect(carbonTax(c, 2027, 2027)).toBeCloseTo(30, 9);
    expect(carbonTax(c, 2039, 2027)).toBeCloseTo(14.347826, 5);
    expect(carbonTax(c, 2050, 2027)).toBe(0);
    expect(carbonTax(c, 2060, 2027)).toBe(0);
  });

  it('carbon is zero when netZeroYear <= baseYear', () => {
    const c: CarbonTaxInput = { emissionsMt: 600, pricePerTonWon: 50_000, netZeroYear: 2027, taxableShare: 1, mode: 'save' };
    expect(carbonTax(c, 2027, 2027)).toBe(0);
    expect(carbonTax({ ...c, netZeroYear: 2020 }, 2027, 2027)).toBe(0);
  });
});
