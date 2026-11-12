import { carbonTax } from '@/lib/basic-income/alt-revenue';
import { bequestFlow } from '@/lib/basic-income/bequest';
import { DEFAULT_FUTURE_FUND, DEFAULT_INPUT, DEFAULT_SOURCES } from '@/lib/basic-income/defaults';
import { perpetualTarget, sanitizeInput } from '@/lib/basic-income/engine';
import { runFutureFundScenarios } from '@/lib/basic-income/future-fund-scenarios';
import { base } from '@/lib/basic-income/__fixtures__/base';
import { BUDGET_2027 } from '@/lib/basic-income/data/budget-2027';
import type { CarbonTaxInput } from '@/lib/basic-income/types';

const carbon = (over: Partial<CarbonTaxInput>): CarbonTaxInput => ({
  emissionsMt: 100, pricePerTonWon: 50_000, netZeroYear: 2050, taxableShare: 1, mode: 'save', ...over,
});

describe('C1·I6: 확인 전 사실값', () => {
  it('초과 세수는 아직 0과 "출처 확인 전"', () => {
    expect(DEFAULT_SOURCES.surplusExcess.value).toBe(0);
    expect(DEFAULT_SOURCES.surplusExcess.note).toBe('출처 확인 전');
    expect(DEFAULT_SOURCES.surplusExcess.url).toBeUndefined();
  });

  it('로봇세 기반은 2024년 로봇산업 실태조사의 내수 출하액 4조 8,581억 원(수출 제외)', () => {
    expect(DEFAULT_SOURCES.robotBase).toMatchObject({ value: 4.8581, kind: 'source' });
    expect(DEFAULT_SOURCES.robotBase.source).toMatch(/로봇산업 실태조사/);
    expect(DEFAULT_SOURCES.robotBase.note).toMatch(/내수/);
    expect(DEFAULT_SOURCES.robotBase.note).toMatch(/원문 대조/);
    expect(DEFAULT_SOURCES.robotBase.note).not.toMatch(/대조 전/);
    expect(DEFAULT_SOURCES.robotBase.url).toContain('kiria.org');
    expect(DEFAULT_SOURCES.robotBase.url).toBeDefined();
    expect(DEFAULT_INPUT.alt.robot.base).toBe(4.8581);
  });

  it('데이터세 기반은 방미통위 보도자료의 2024년 온라인 광고비 10조 1,011억 원', () => {
    expect(DEFAULT_SOURCES.dataBase).toMatchObject({ value: 10.1011, kind: 'source' });
    expect(DEFAULT_SOURCES.dataBase.url).toContain('korea.kr');
    expect(DEFAULT_INPUT.alt.data.base).toBe(10.1011);
  });

  it('유산 대상 재산은 국세통계 2025년 결정분 중 총상속재산가액 50억 원 초과 합계(백만 원 → 조 원)', () => {
    // 6-2-2 표: 100억 이하 6,417,155 + 500억 이하 7,890,128 + 500억 초과 5,756,932 (백만 원)
    expect(DEFAULT_SOURCES.bequestEstate).toMatchObject({ value: 20.064215, kind: 'derived' });
    expect(DEFAULT_INPUT.bequest.eligibleEstate).toBe(20.064215);
  });

  it('상속세 실효율은 같은 구간의 총결정세액 ÷ 총상속재산가액', () => {
    // 1,524,956 + 2,634,822 + 2,221,334 = 6,381,112 (백만 원)
    expect(DEFAULT_SOURCES.bequestTaxRate.kind).toBe('derived');
    expect(DEFAULT_SOURCES.bequestTaxRate.value).toBeCloseTo(6_381_112 / 20_064_215, 3);
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

describe('2027 예산안 원문 PDF 대조(2026-11-12)', () => {
  const EXPECTED: Record<string, number> = {
    welfare: 289.0, admin: 149.0, education: 110.7, defense: 73.3, industry: 41.2, rnd: 39.5,
    agri: 30.7, soc: 28.9, safety: 28.8, environment: 14.6, culture: 11.6, diplomacy: 7.1,
  };

  it('12대 분야 금액은 홍보자료 4쪽 표와 같고, 원문 대조를 마친 출처로 표시된다', () => {
    expect(BUDGET_2027).toHaveLength(12);
    for (const s of BUDGET_2027) {
      expect(s.amount).toBe(EXPECTED[s.id]);
      expect(s.source.note).not.toMatch(/대조 전/);
      expect(s.source.note).toMatch(/홍보자료/);
    }
  });

  it('총지출 820.9조와 미래대응기금 162.3조도 원문 대조 표시를 단다', () => {
    expect(DEFAULT_SOURCES.budgetTotal2027.value).toBe(820.9);
    expect(DEFAULT_SOURCES.budgetTotal2027.note).not.toMatch(/대조 전/);
    expect(DEFAULT_SOURCES.futureFundTotal.note).toMatch(/보도자료/);
  });
});
