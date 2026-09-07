import { computeGrant, LEGACY_LINK_RATE } from '../grant-formula';

describe('교부금 산식', () => {
  it('반영률이 0이면 학령인구가 결과를 바꾸지 못한다', () => {
    const base = { previousGrantJo: 100, nominalGrowth: 0.05, reflectRate: 0 };
    const a = computeGrant({ ...base, schoolAgeChange: -0.05 });
    const b = computeGrant({ ...base, schoolAgeChange: -0.2 });
    expect(a.grantJo).toBeCloseTo(b.grantJo, 6);
    expect(a.grantJo).toBeCloseTo(105, 6);
  });

  it('학령인구가 줄면 반영률이 클수록 교부금이 적어진다', () => {
    const base = { previousGrantJo: 100, nominalGrowth: 0.05, schoolAgeChange: -0.05 };
    const low = computeGrant({ ...base, reflectRate: 0.35 });
    const high = computeGrant({ ...base, reflectRate: 0.5 });
    expect(high.grantJo).toBeLessThan(low.grantJo);
  });

  it('산식 결과가 전년보다 적으면 감소분 보전 하한이 걸린다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: -0.1,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
    });
    expect(r.grantJo).toBe(100);
    expect(r.rawJo).toBeLessThan(100);
    expect(r.floorApplied).toBe(true);
  });

  it('하한이 걸리지 않으면 floorApplied가 false다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: 0.05,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
    });
    expect(r.floorApplied).toBe(false);
    expect(r.grantJo).toBeCloseTo(r.rawJo, 6);
  });

  it('내국세를 주면 기존 연동 방식 금액과 차액을 함께 낸다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: 0.05,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
      internalTaxJo: 500,
    });
    expect(r.legacyJo).toBeCloseTo(500 * LEGACY_LINK_RATE, 6);
    expect(r.gapJo).toBeCloseTo(r.grantJo - 500 * LEGACY_LINK_RATE, 6);
  });

  it('내국세를 주지 않으면 비교값이 null이다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: 0.05,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
    });
    expect(r.legacyJo).toBeNull();
    expect(r.gapJo).toBeNull();
  });

  it('범위를 벗어난 반영률을 거부한다', () => {
    expect(() =>
      computeGrant({
        previousGrantJo: 100,
        nominalGrowth: 0.05,
        schoolAgeChange: -0.05,
        reflectRate: 1.5,
      }),
    ).toThrow();
  });

  it('전년도 교부금이 0 이하면 거부한다', () => {
    expect(() =>
      computeGrant({
        previousGrantJo: 0,
        nominalGrowth: 0.05,
        schoolAgeChange: -0.05,
        reflectRate: 0.35,
      }),
    ).toThrow();
  });
});
