import { perpetualFund, withdrawalCap } from '@/lib/basic-income/spending-rule';

describe('spending-rule', () => {
  it('perpetualFund: 연 51.4조를 3%·4%로', () => {
    expect(perpetualFund(51.4, 0.03)).toBeCloseTo(1713.33, 2);
    expect(perpetualFund(51.4, 0.04)).toBeCloseTo(1285, 6);
  });

  it('perpetualFund: 순필요액이 0 이하면 0', () => {
    expect(perpetualFund(-3, 0.03)).toBe(0);
  });

  it('perpetualFund: 인출률 0이면 Infinity', () => {
    expect(perpetualFund(1, 0)).toBe(Infinity);
  });

  it('withdrawalCap: 음수 기금은 0', () => {
    expect(withdrawalCap(162.3, 0.03)).toBeCloseTo(4.869, 6);
    expect(withdrawalCap(-5, 0.03)).toBe(0);
  });
});
