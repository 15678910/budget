import { bequestFlow } from '@/lib/basic-income/bequest';
import { surplusToFund } from '@/lib/basic-income/surplus-tax';
import { sharedAssetFlows } from '@/lib/basic-income/shared-assets';
import { childAnnualContribution, childScenario } from '@/lib/basic-income/child-account';

describe('유산', () => {
  it('기금 유입과 일반회계 상속세 감소를 함께 계산한다', () => {
    const b = bequestFlow({ eligibleEstate: 10, uptake: 0.2, shareToFund: 0.3, effectiveTaxRate: 0.408, specialRate: 0 });
    expect(b.toFund).toBeCloseTo(0.6, 9);
    expect(b.generalAccountLoss).toBeCloseTo(0.816, 9);
  });
});

describe('초과세수', () => {
  it('음수 초과세수는 0으로 본다', () => {
    expect(surplusToFund({ annualExcess: 5, saveRatio: 0.5 })).toBeCloseTo(2.5, 9);
    expect(surplusToFund({ annualExcess: -3, saveRatio: 0.5 })).toBe(0);
  });
});

describe('공유 자산', () => {
  it('지급·적립으로 나눈다', () => {
    const f = sharedAssetFlows([
      { id: 'a', label: 'a', stake: 100, yieldRate: 0.05, mode: 'save', candidate: false },
      { id: 'b', label: 'b', stake: 10, yieldRate: 0.1, mode: 'pay', candidate: true },
    ]);
    expect(f.save).toBeCloseTo(5, 9);
    expect(f.pay).toBeCloseTo(1, 9);
  });
});

describe('아동 계좌', () => {
  it('1억 원·6.6%·18년이면 해마다 3,056,146원', () => {
    expect(childAnnualContribution(1e8, 0.066, 18)).toBe(3_056_146);
  });

  it('수익률 0이면 균등 분할', () => {
    expect(childAnnualContribution(1.8e7, 0, 18)).toBe(1_000_000);
  });

  it('출생아 25만 명의 정상 상태 비용과 104.4조 3%로 덮는 비율', () => {
    const c = childScenario({ births: 250_000, targetWon: 1e8, rate: 0.066, years: 18, fund: 104.4, withdrawalRate: 0.03 });
    expect(c.perChildAnnualWon).toBe(3_056_146);
    expect(c.annualCostSteady).toBeCloseTo(13.752657, 5);
    expect(c.coveredShare).toBeCloseTo(0.22774, 4);
  });
});
