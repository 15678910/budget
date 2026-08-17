/**
 * 지방세수 레이어 테스트 (설계문서 §5.2)
 *
 * 핵심 검증: 과세표준에서 서버·GPU 55%가 제외되는지, 감면율 0/1 경계.
 */

import { DEFAULT_TAX, localTax } from '../tax';
import { USD_KRW } from '../constants';

const BILLION = 1e9;
const CAPEX = 38 * BILLION;

describe('과세표준 분해 (§2.5)', () => {
  it('서버·GPU 55%는 과세대상에서 제외된다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    expect(r.base.serverKrw).toBeCloseTo(CAPEX * USD_KRW * 0.55, -6);
    // 과세대상에 서버가 포함되지 않는다
    expect(r.base.taxableKrw).toBeLessThan(CAPEX * USD_KRW - r.base.serverKrw + 1);
  });

  it('과세대상은 건축물 30% + 기타 15%의 30%만이다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    const expected = 0.3 + 0.15 * DEFAULT_TAX.otherTaxableRatio; // 0.345
    expect(r.base.taxableShare).toBeCloseTo(expected, 6);
  });

  it('투자액의 65% 이상에는 지방세가 붙지 않는다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    expect(r.base.taxableShare).toBeLessThan(0.35);
  });

  it('서버 비중이 커질수록 과세대상이 줄어든다', () => {
    const low = localTax(CAPEX, 0.4, 0.4, 1).base.taxableShare;
    const high = localTax(CAPEX, 0.7, 0.2, 1).base.taxableShare;
    expect(high).toBeLessThan(low);
  });

  it('부지는 CAPEX와 별도로 평가된다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    // 1GW → 40만 평 × 50만 원
    expect(r.base.landValueKrw).toBeCloseTo(400_000 * 500_000, -3);
  });
});

describe('세목별 계산', () => {
  it('취득세는 감면율을 반영한다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    const expected = r.base.taxableKrw * 0.04 * 0.5;
    expect(r.acquisitionTaxKrw).toBeCloseTo(expected, -3);
  });

  it('감면율 0이면 취득세가 두 배가 된다', () => {
    const full = localTax(CAPEX, 0.55, 0.3, 1, null, {
      ...DEFAULT_TAX,
      acquisitionTaxExemption: 0,
    });
    const half = localTax(CAPEX, 0.55, 0.3, 1);
    expect(full.acquisitionTaxKrw).toBeCloseTo(half.acquisitionTaxKrw * 2, -3);
  });

  it('감면율 1이면 취득세가 0이다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1, null, {
      ...DEFAULT_TAX,
      acquisitionTaxExemption: 1,
    });
    expect(r.acquisitionTaxKrw).toBe(0);
  });

  it('지방교육세는 재산세의 20%다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    const propertyTax = r.propertyTaxBuildingKrw + r.propertyTaxLandKrw;
    expect(r.localEducationTaxKrw).toBeCloseTo(propertyTax * 0.2, -3);
  });

  it('연간 세수는 항목 합계와 일치한다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    const sum =
      r.propertyTaxBuildingKrw +
      r.propertyTaxLandKrw +
      r.regionalResourceTaxKrw +
      r.localEducationTaxKrw;
    expect(r.annualTotalKrw).toBeCloseTo(sum, -3);
  });

  it('재산세는 시가표준액(취득가액의 70%) 기준이다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    expect(r.propertyTaxBuildingKrw).toBeCloseTo(r.base.taxableKrw * 0.7 * 0.0025, -3);
  });
});

describe('파생 지표', () => {
  it('연간 세수는 투자액의 1% 미만이다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1);
    expect(r.annualPerCapex).toBeLessThan(0.01);
    expect(r.annualPerCapex).toBeGreaterThan(0);
  });

  it('상시 일자리를 주면 1인당 세수를 낸다', () => {
    const r = localTax(CAPEX, 0.55, 0.3, 1, 717);
    expect(r.annualPerJobKrw).toBeCloseTo(r.annualTotalKrw / 717, -3);
  });

  it('일자리 수가 없으면 1인당 세수는 null이다', () => {
    expect(localTax(CAPEX, 0.55, 0.3, 1).annualPerJobKrw).toBeNull();
    expect(localTax(CAPEX, 0.55, 0.3, 1, 0).annualPerJobKrw).toBeNull();
  });
});

describe('입력 검증', () => {
  it('음수 CAPEX를 거부한다', () => {
    expect(() => localTax(-1, 0.55, 0.3, 1)).toThrow();
  });

  it('음수 용량을 거부한다', () => {
    expect(() => localTax(CAPEX, 0.55, 0.3, 0)).toThrow();
  });

  it('1을 초과하는 비중을 거부한다', () => {
    expect(() => localTax(CAPEX, 1.5, 0.3, 1)).toThrow(/서버 비중/);
  });

  it('범위를 벗어난 감면율을 거부한다', () => {
    expect(() =>
      localTax(CAPEX, 0.55, 0.3, 1, null, { ...DEFAULT_TAX, acquisitionTaxExemption: 1.5 }),
    ).toThrow(/감면율/);
  });
});
