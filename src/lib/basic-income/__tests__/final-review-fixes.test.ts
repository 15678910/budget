import { carbonTax } from '@/lib/basic-income/alt-revenue';
import { bequestFlow } from '@/lib/basic-income/bequest';
import { DEFAULT_FUTURE_FUND, DEFAULT_INPUT, DEFAULT_SOURCES } from '@/lib/basic-income/defaults';
import { perpetualTarget, sanitizeInput } from '@/lib/basic-income/engine';
import { runFutureFundScenarios } from '@/lib/basic-income/future-fund-scenarios';
import { base } from '@/lib/basic-income/__fixtures__/base';
import type { CarbonTaxInput } from '@/lib/basic-income/types';

const carbon = (over: Partial<CarbonTaxInput>): CarbonTaxInput => ({
  emissionsMt: 100, pricePerTonWon: 50_000, netZeroYear: 2050, taxableShare: 1, mode: 'save', ...over,
});

describe('C1·I6: 확인 전 사실값', () => {
  it('로봇세·데이터세 기반, 유산 대상 재산, 초과 세수는 0과 "출처 확인 전"', () => {
    for (const k of ['robotBase', 'dataBase', 'bequestEstate', 'surplusExcess'] as const) {
      expect(DEFAULT_SOURCES[k].value).toBe(0);
      expect(DEFAULT_SOURCES[k].note).toBe('출처 확인 전');
      expect(DEFAULT_SOURCES[k].url).toBeUndefined();
    }
  });

  it('인구 변화율은 장래인구추계 대조 전이라 0% 가정', () => {
    expect(DEFAULT_SOURCES.populationGrowth).toMatchObject({ value: 0, kind: 'assumption' });
    expect(DEFAULT_INPUT.populationGrowth).toBe(0);
  });
});

describe('I2: 영구 목표는 오래가는 지급용 세입만 뺀다', () => {
  it('탄소세를 지급용으로 돌려도 목표는 그대로', () => {
    const t = perpetualTarget({ ...base, alt: { ...base.alt, carbon: carbon({ mode: 'pay' }) } });
    expect(t.target).toBeCloseTo(40, 6);
  });

  it('줄어드는 로봇세는 빼지 않고, 줄지 않는 로봇세와 데이터세는 뺀다', () => {
    const robot = { base: 10, rate: 0.03, annualDecline: 0.03, mode: 'pay' as const };
    expect(perpetualTarget({ ...base, alt: { ...base.alt, robot } }).target).toBeCloseTo(40, 6);
    expect(perpetualTarget({ ...base, alt: { ...base.alt, robot: { ...robot, annualDecline: 0 } } }).target).toBeCloseTo(30, 6);
    const data = { base: 10, rate: 0.03, annualGrowth: 0, mode: 'pay' as const };
    expect(perpetualTarget({ ...base, alt: { ...base.alt, data } }).target).toBeCloseTo(30, 6);
  });
});

describe('I3: 유산 특례 세율', () => {
  it('칼럼 예시: 100억 상속, 실효 45.4% → 기금 30억, 일반회계 상속세 45.4억이 14억으로(31.4억 감소)', () => {
    const b = bequestFlow({ eligibleEstate: 100, uptake: 1, shareToFund: 0.3, effectiveTaxRate: 0.454, specialRate: 0.2 });
    expect(b.toFund).toBeCloseTo(30, 9);
    expect(b.generalAccountLoss).toBeCloseTo(31.4, 9);
  });

  it('특례 세율 기본값은 칼럼 제안 20% 가정', () => {
    expect(DEFAULT_SOURCES.bequestSpecialRate).toMatchObject({ value: 0.2, kind: 'assumption' });
    expect(DEFAULT_INPUT.bequest.specialRate).toBe(0.2);
  });
});

describe('I1: 탄소세 과세 비율', () => {
  it('과세 비율만큼만 걷는다', () => {
    expect(carbonTax(carbon({ taxableShare: 0.26 }), 2027, 2027)).toBeCloseTo(1.3, 9);
  });

  it('기본값은 가정이고 K-ETS와 겹치지 않게 둔 이유를 밝힌다', () => {
    expect(DEFAULT_SOURCES.carbonTaxableShare.kind).toBe('assumption');
    expect(DEFAULT_SOURCES.carbonTaxableShare.note).toContain('K-ETS');
    expect(DEFAULT_INPUT.alt.carbon.taxableShare).toBe(DEFAULT_SOURCES.carbonTaxableShare.value);
  });

  it('과세 비율은 0~1로 다듬는다', () => {
    const s = sanitizeInput({ ...base, alt: { ...base.alt, carbon: carbon({ taxableShare: 3 }) } });
    expect(s.alt.carbon.taxableShare).toBe(1);
  });
});

describe('I5: S3 아동 계좌 결과', () => {
  it('해마다 여는 계좌 수(출생아 수)와 18세 목표 도달 여부를 돌려준다', () => {
    const [, , s3] = runFutureFundScenarios(base, DEFAULT_FUTURE_FUND);
    expect(s3.child?.births).toBe(DEFAULT_FUTURE_FUND.child.births);
    expect(s3.child?.reachesTarget).toBe(false);
    const rich = runFutureFundScenarios(base, { ...DEFAULT_FUTURE_FUND, surplusFund: 10_000 })[2];
    expect(rich.child?.reachesTarget).toBe(true);
  });
});
