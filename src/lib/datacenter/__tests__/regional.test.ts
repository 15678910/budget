/**
 * 지역 영향 레이어 테스트 (설계문서 §5.2)
 *
 * 핵심 검증: 공랭 선택 시 용수 0 · 전력 증가, 18.4GW가 원전 10기 근처로 환산되는지.
 */

import {
  amenityImpact,
  carbonImpact,
  gridRisk,
  landImpact,
  powerImpact,
  propertyEffect,
  waterImpact,
} from '../regional';
import { ALL_REGIONAL_FIGURES } from '../sources-regional';

describe('powerImpact', () => {
  it('18.4GW는 원전 10기 근처로 환산된다', () => {
    const p = powerImpact(18.4);
    expect(p.nuclearUnits).toBeCloseTo(10, 1);
  });

  it('1GW는 연 7.9TWh 안팎을 쓴다 (이용률 90%)', () => {
    const p = powerImpact(1);
    expect(p.annualTwh).toBeCloseTo(7.88, 1);
  });

  it('용량에 선형 비례한다', () => {
    expect(powerImpact(2).annualTwh).toBeCloseTo(powerImpact(1).annualTwh * 2, 6);
  });

  it('공랭식은 전력을 늘린다', () => {
    const water = powerImpact(1, 'water');
    const air = powerImpact(1, 'air');

    expect(air.annualTwh).toBeGreaterThan(water.annualTwh);
    expect(air.coolingPenaltyTwh).toBeGreaterThan(0);
    expect(water.coolingPenaltyTwh).toBe(0);
  });

  it('음수 용량을 거부한다', () => {
    expect(() => powerImpact(0)).toThrow();
    expect(() => powerImpact(-1)).toThrow();
  });
});

describe('waterImpact', () => {
  it('공랭식은 용수를 0으로 만든다', () => {
    expect(waterImpact(1, 'air').dailyTons).toBe(0);
  });

  it('수랭식은 용수를 소비한다', () => {
    expect(waterImpact(1, 'water').dailyTons).toBeGreaterThan(0);
  });

  it('무용수는 공짜가 아니다 — 용수 0인 대신 전력이 늘어난다', () => {
    const airWater = waterImpact(1, 'air');
    const airPower = powerImpact(1, 'air');
    const waterPower = powerImpact(1, 'water');

    expect(airWater.dailyTons).toBe(0);
    expect(airPower.annualTwh).toBeGreaterThan(waterPower.annualTwh);
  });

  it('영산강·섬진강 장래 부족량 대비 비율을 낸다', () => {
    const w = waterImpact(1, 'water');
    expect(w.shareOfProjectedShortage).toBeCloseTo(20000 / 368000, 6);
  });

  it('발표된 클러스터 맥락 수치를 함께 낸다', () => {
    expect(waterImpact(1).context).toHaveLength(3);
  });
});

describe('carbonImpact', () => {
  it('18.4GW 누적 배출은 발표 추산치 8,500만 톤과 일치한다', () => {
    expect(carbonImpact(18.4).cumulative2035Tons).toBeCloseTo(85_000_000, 0);
  });

  it('연간 배출은 전력량 × 배출계수다', () => {
    const c = carbonImpact(1);
    const twh = powerImpact(1).annualTwh;
    expect(c.annualTons).toBeCloseTo(twh * 1e6 * 0.4594, 0);
  });

  it('공랭식은 전력이 늘어난 만큼 탄소도 늘어난다', () => {
    expect(carbonImpact(1, 'air').annualTons).toBeGreaterThan(carbonImpact(1, 'water').annualTons);
  });

  it('음수 배출계수를 거부한다', () => {
    expect(() => carbonImpact(1, 'water', -0.1)).toThrow();
  });
});

describe('landImpact', () => {
  it('1GW는 30만~40만 평이다', () => {
    const l = landImpact(1);
    expect(l.pyeongLow).toBe(300_000);
    expect(l.pyeongHigh).toBe(400_000);
  });

  it('해남 실사례(3GW = 120만 평)를 재현한다', () => {
    expect(landImpact(3).pyeongHigh).toBe(1_200_000);
  });

  it('축구장·여의도 면적으로 환산한다', () => {
    const l = landImpact(1);
    expect(l.km2High).toBeCloseTo(1.32, 1);
    expect(l.footballFields).toBeGreaterThan(100);
    expect(l.yeouidoRatio).toBeGreaterThan(0);
  });

  it('농지 전용 비율을 파라미터로 받는다', () => {
    expect(landImpact(1, 0).farmlandPyeong).toBe(0);
    expect(landImpact(1, 1).farmlandPyeong).toBe(400_000);
    expect(landImpact(1, 0.5).farmlandPyeong).toBe(200_000);
  });

  it('범위를 벗어난 농지 비율을 거부한다', () => {
    expect(() => landImpact(1, 1.5)).toThrow(/농지 비율/);
  });
});

describe('amenityImpact', () => {
  it('소음과 온도는 측정값 그대로 낸다 — 용량에 따라 부풀리지 않는다', () => {
    const a1 = amenityImpact(1);
    const a10 = amenityImpact(10);

    expect(a1.noiseDb).toBe(97);
    expect(a10.noiseDb).toBe(97);
    expect(a10.tempRiseMax).toBe(a1.tempRiseMax);
  });

  it('건강피해 비용은 용량에 비례한다', () => {
    const a = amenityImpact(2);
    expect(a.healthCostLowUsd).toBeCloseTo(3.0e7 * 2, 0);
    expect(a.prematureDeathsHigh).toBeCloseTo(6.5 * 2, 6);
  });
});

describe('gridRisk', () => {
  it('11차 계획 실측 지연율(56%)을 그대로 쓴다', () => {
    expect(gridRisk().delayRate).toBeCloseTo(0.56, 2);
  });

  it('기대 지연 연수는 지연율 × 통상 지연기간이다', () => {
    const g = gridRisk();
    expect(g.expectedDelayYears).toBeCloseTo(g.delayRate * g.typicalDelayYears, 6);
  });
});

describe('propertyEffect', () => {
  it('가격 증거와 주민 우려를 함께 낸다 — 어느 쪽도 생략하지 않는다', () => {
    const p = propertyEffect();
    expect(p.priceEvidence.length).toBeGreaterThan(0);
    expect(p.residentConcerns.length).toBe(3);
  });
});

describe('출처 메타데이터', () => {
  it('모든 지역 수치가 출처 주체·시점·성격을 갖는다', () => {
    for (const f of ALL_REGIONAL_FIGURES) {
      expect(f.source.trim().length).toBeGreaterThan(0);
      expect(f.date).toMatch(/^\d{4}-\d{2}$/);
      expect(['measured', 'announced', 'derived', 'estimated']).toContain(f.kind);
    }
  });
});
