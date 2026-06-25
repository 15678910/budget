import { linearTrend, multiYearArrow } from '@/lib/sdg/multiyear-trend';
import { CR_ON_TRACK_MIN, CR_IMPROVING_MIN } from '@/lib/sdg/trend';

// ── linearTrend ──────────────────────────────────────────────
describe('linearTrend', () => {
  it('완전 직선 → slope 정확, r2≈1', () => {
    // y = 2x + 100 (x=year). 2016→132, 2017→134, … slope=2.
    const pts = [2016, 2017, 2018, 2019, 2020].map((year) => ({
      year,
      value: 2 * year - 2 * 2016 + 100, // 100,102,104,106,108
    }));
    const r = linearTrend(pts);
    expect(r).not.toBeNull();
    expect(r!.n).toBe(5);
    expect(r!.firstYear).toBe(2016);
    expect(r!.lastYear).toBe(2020);
    expect(r!.slope).toBeCloseTo(2, 9);
    expect(r!.r2).toBeCloseTo(1, 9);
  });

  it('완전 직선 하락 → slope 음수, r2≈1', () => {
    const pts = [2016, 2017, 2018, 2019].map((year) => ({ year, value: 200 - 3 * (year - 2016) }));
    const r = linearTrend(pts);
    expect(r!.slope).toBeCloseTo(-3, 9);
    expect(r!.r2).toBeCloseTo(1, 9);
  });

  it('n<3 → null', () => {
    expect(linearTrend([])).toBeNull();
    expect(linearTrend([{ year: 2020, value: 5 }])).toBeNull();
    expect(linearTrend([{ year: 2019, value: 5 }, { year: 2020, value: 6 }])).toBeNull();
  });

  it('cagr: first>0 → (last/first)^(1/Δyr)−1', () => {
    // first=100(2016), last=121(2018). Δyr=2 → cagr=(121/100)^(1/2)−1=0.1.
    const pts = [
      { year: 2016, value: 100 },
      { year: 2017, value: 110 },
      { year: 2018, value: 121 },
    ];
    const r = linearTrend(pts);
    expect(r!.cagr).toBeCloseTo(0.1, 9);
  });

  it('first≤0 → cagr null (slope/r2는 산출)', () => {
    const pts = [
      { year: 2016, value: 0 },
      { year: 2017, value: 5 },
      { year: 2018, value: 10 },
    ];
    const r = linearTrend(pts);
    expect(r).not.toBeNull();
    expect(r!.cagr).toBeNull();
    expect(r!.slope).toBeCloseTo(5, 9);
  });

  it('정렬 안 된 입력도 firstYear/lastYear 올바름', () => {
    const pts = [
      { year: 2018, value: 10 },
      { year: 2016, value: 6 },
      { year: 2017, value: 8 },
    ];
    const r = linearTrend(pts);
    expect(r!.firstYear).toBe(2016);
    expect(r!.lastYear).toBe(2018);
    expect(r!.slope).toBeCloseTo(2, 9);
  });

  it('비유한/누락 포인트 제외 후 n<3 → null', () => {
    const pts = [
      { year: 2016, value: NaN },
      { year: 2017, value: 8 },
      { year: 2018, value: 10 },
    ];
    expect(linearTrend(pts)).toBeNull();
  });
});

// ── multiYearArrow ───────────────────────────────────────────
describe('multiYearArrow — green 없음(slope 부호)', () => {
  const up = [
    { year: 2016, value: 60 },
    { year: 2017, value: 62 },
    { year: 2018, value: 64 },
    { year: 2019, value: 66 },
  ];
  const down = up.map((p) => ({ year: p.year, value: 200 - p.value }));

  it('higherBetter=true, 상승 → 개선(on_track/improving)', () => {
    const a = multiYearArrow(up, null, true);
    expect(['on_track', 'improving']).toContain(a);
  });

  it('higherBetter=true, 하락 → 악화(decreasing/stagnating)', () => {
    const a = multiYearArrow(down, null, true);
    expect(['decreasing', 'stagnating']).toContain(a);
  });

  it('higherBetter=false, 하락 → 개선 (방향 반영)', () => {
    const a = multiYearArrow(down, null, false);
    expect(['on_track', 'improving']).toContain(a);
  });

  it('higherBetter=false, 상승 → 악화 (방향 반영)', () => {
    const a = multiYearArrow(up, null, false);
    expect(['decreasing', 'stagnating']).toContain(a);
  });

  it('n<3 → 회귀 불가 → stagnating(신호 보류)', () => {
    expect(multiYearArrow([{ year: 2020, value: 5 }], null, true)).toBe('stagnating');
  });
});

describe('multiYearArrow — green 있음(회귀 외삽 vs 목표, CR 임계)', () => {
  // higherBetter, 목표 2030=green. 회귀로 2030 예측값 → 도달 페이스를 CR 임계에 매핑.
  const base = [
    { year: 2016, value: 60 },
    { year: 2017, value: 62 },
    { year: 2018, value: 64 },
    { year: 2019, value: 66 },
  ]; // slope=2/yr, 2030 예측 ≈ 60 + 2*14 = 88

  it('목표 도달 페이스 충분 → on_track', () => {
    // 2030 예측 88, green=88 → CR≈1 → on_track
    const a = multiYearArrow(base, 88, true, 2030);
    expect(a).toBe('on_track');
  });

  it('목표가 너무 높아 페이스 부족 → improving/stagnating', () => {
    const a = multiYearArrow(base, 200, true, 2030);
    expect(['improving', 'stagnating']).toContain(a);
  });

  it('목표가 위(green>first)인데 값이 하락(higherBetter) → decreasing', () => {
    // first=66, green=90(위). 값이 하락하면 목표서 멀어짐 → 필요진전>0, slope<0 → CR<0.
    const dn = [
      { year: 2016, value: 66 },
      { year: 2017, value: 64 },
      { year: 2018, value: 62 },
      { year: 2019, value: 60 },
    ];
    const a = multiYearArrow(dn, 90, true, 2030);
    expect(a).toBe('decreasing');
  });

  it('CR 임계 상수와 일관(trend.ts 재사용)', () => {
    expect(CR_ON_TRACK_MIN).toBe(0.95);
    expect(CR_IMPROVING_MIN).toBe(0.6);
  });
});
