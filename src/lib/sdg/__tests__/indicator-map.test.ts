import { normalizeMinMax, INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';

describe('normalizeMinMax', () => {
  it('higher_better: 최대=100, 최소=0', () => {
    const out = normalizeMinMax({ a: 10, b: 20, c: 30 }, 'higher_better');
    expect(out.a).toBe(0);
    expect(out.b).toBe(50);
    expect(out.c).toBe(100);
  });
  it('lower_better: 최소=100, 최대=0 (반전)', () => {
    const out = normalizeMinMax({ a: 10, b: 30 }, 'lower_better');
    expect(out.a).toBe(100);
    expect(out.b).toBe(0);
  });
  it('모든 값이 같으면 50으로 평탄화', () => {
    const out = normalizeMinMax({ a: 5, b: 5 }, 'higher_better');
    expect(out.a).toBe(50);
    expect(out.b).toBe(50);
  });
});

describe('INDICATOR_TO_GOAL', () => {
  it('대표 지표가 올바른 목표로 매핑된다', () => {
    expect(INDICATOR_TO_GOAL['wel_basic']).toBe(1);
    expect(INDICATOR_TO_GOAL['hlt_life']).toBe(3);
    expect(INDICATOR_TO_GOAL['emp_female']).toBe(5);
    expect(INDICATOR_TO_GOAL['saf_crime']).toBe(16);
  });
  it('재정·인구 지표는 목표에 매핑되지 않는다(맥락)', () => {
    expect(INDICATOR_TO_GOAL['fin_independence']).toBeUndefined();
    expect(INDICATOR_TO_GOAL['dem_aging']).toBeUndefined();
  });
});
