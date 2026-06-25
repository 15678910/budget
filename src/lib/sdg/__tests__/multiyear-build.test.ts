import {
  buildRegionSeries,
  regionMultiYearTrend,
  MULTIYEAR_GREEN,
} from '@/lib/sdg/multiyear-build';

describe('buildRegionSeries', () => {
  it('연도별 16광역 병합 — 광주+전남 → 광주전남 단일 시계열', () => {
    const series = {
      서울: { '2018': 60, '2019': 62, '2020': 64 },
      광주: { '2018': 50, '2019': 52, '2020': 54 },
      전남: { '2018': 70, '2019': 72, '2020': 74 },
    };
    const r = buildRegionSeries(series);
    expect(r.years).toEqual([2018, 2019, 2020]);
    expect(r.byRegion['서울']).toEqual([
      { year: 2018, value: 60 },
      { year: 2019, value: 62 },
      { year: 2020, value: 64 },
    ]);
    // 광주전남 = (50+70)/2 = 60 등(단순평균, pop 미제공)
    expect(r.byRegion['광주전남']).toEqual([
      { year: 2018, value: 60 },
      { year: 2019, value: 62 },
      { year: 2020, value: 64 },
    ]);
    expect(r.byRegion['광주']).toBeUndefined();
    expect(r.byRegion['전남']).toBeUndefined();
  });

  it('pop 가중치 적용 시 광주전남 = 인구가중평균', () => {
    const series = {
      광주: { '2020': 60 },
      전남: { '2020': 80 },
    };
    const r = buildRegionSeries(series, { 광주: 1, 전남: 3 });
    // (60*1 + 80*3)/4 = 75
    expect(r.byRegion['광주전남']).toEqual([{ year: 2020, value: 75 }]);
  });

  it('national = 각 연도 병합 광역 단순평균', () => {
    const series = {
      서울: { '2020': 10 },
      부산: { '2020': 30 },
    };
    const r = buildRegionSeries(series);
    expect(r.national).toEqual([{ year: 2020, value: 20 }]);
  });

  it('비연도 키/누락값 무시', () => {
    const series = { 서울: { '2020': 10, abc: 5, '2021': NaN as unknown as number } };
    const r = buildRegionSeries(series);
    expect(r.years).toEqual([2020]);
    expect(r.byRegion['서울']).toEqual([{ year: 2020, value: 10 }]);
  });
});

describe('regionMultiYearTrend', () => {
  it('연도점<3 → trend/arrow null', () => {
    const r = regionMultiYearTrend([{ year: 2020, value: 5 }], 8, true);
    expect(r.trend).toBeNull();
    expect(r.arrow).toBeNull();
  });

  it('goal8(green=70) 상승 시계열 → 화살표·trend 존재', () => {
    const pts = [
      { year: 2016, value: 65 },
      { year: 2017, value: 66 },
      { year: 2018, value: 67 },
      { year: 2019, value: 68 },
    ];
    const r = regionMultiYearTrend(pts, 8, true);
    expect(r.green).toBe(70);
    expect(r.trend).not.toBeNull();
    expect(r.trend!.slope).toBeGreaterThan(0);
    expect(['on_track', 'improving', 'stagnating', 'decreasing']).toContain(r.arrow);
  });

  it('goal9(green=null) → slope 부호 판정', () => {
    expect(MULTIYEAR_GREEN[9]).toBeNull();
    const up = [
      { year: 2016, value: 100 },
      { year: 2017, value: 110 },
      { year: 2018, value: 120 },
    ];
    const r = regionMultiYearTrend(up, 9, true);
    expect(r.green).toBeNull();
    expect(r.arrow).toBe('on_track'); // slope>0, higherBetter
  });
});
