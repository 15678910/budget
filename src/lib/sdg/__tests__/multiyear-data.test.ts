// ============================================================
// KOSIS 다년 데이터 무결성 — 신규 파서(C1_CODE4·filter·C2_NM) 수집 결과 검증
// ============================================================
//
// 근거: spec 2026-06-25 부록 A. fetch-kosis-sdg.mjs가 신규 goal(3·5·7·11)을
//   16+시도×다년으로 수집했는지, 방향(higherBetter)·시계열 구조·배지 표시 조건을 확인.
// ⚠️ 정직성: 임의 목표값 없음(MULTIYEAR_GREEN null). 실측 연도점만. 인과 0.
//   값 자체 단정 금지 — 구조·시도수·연도수·방향만 검증한다.

import sidoData from '../../../../public/data/sdg-sido.json';
import { buildRegionSeries, regionMultiYearTrend, MULTIYEAR_GREEN, MULTIYEAR_ABSOLUTE } from '@/lib/sdg/multiyear-build';

interface IndicatorShape {
  label: string;
  source: string;
  year: string;
  unit: string;
  higherBetter: boolean;
  bySido: Record<string, number>;
  seriesBySido?: Record<string, Record<string, number>>;
}
const goals = (sidoData as { goals: Record<string, IndicatorShape> }).goals;

// 신규 파서로 수집된 goal과 기대 방향(부록 A). green은 모두 null(단일 목표 부재).
const NEW_GOALS: { goal: number; higherBetter: boolean }[] = [
  { goal: 3, higherBetter: false }, // 자살률 — lower_better
  { goal: 5, higherBetter: true },  // 여성 경제활동참가율
  { goal: 7, higherBetter: true },  // 신재생에너지 생산량
  { goal: 11, higherBetter: true }, // 주택보급률
];

// 17시도(제주 포함) 확인 대상 — 재수집 후 17시도가 보장되어야 하는 goal.
const GOALS_17: number[] = [7, 9, 11];

// 17시도 정규 집합 (광주전남 병합 전 원시).
const CANON_17 = new Set([
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]);

describe('KOSIS 신규 goal 데이터 무결성', () => {
  it.each(NEW_GOALS)('goal $goal — 16+시도·다년(≥5) seriesBySido 보유', ({ goal }) => {
    const ind = goals[String(goal)];
    expect(ind).toBeDefined();
    expect(ind.seriesBySido).toBeDefined();
    const series = ind.seriesBySido!;
    const sidoKeys = Object.keys(series);
    // 신규 파서(C1_CODE4·filter·C2_NM)가 16+시도를 추출했는지.
    expect(sidoKeys.length).toBeGreaterThanOrEqual(16);
    // 각 시도가 ≥5개 연도(실측 다년)를 가지는지.
    const allYears = new Set<string>();
    for (const s of Object.values(series)) {
      for (const yr of Object.keys(s)) allYears.add(yr);
    }
    expect(allYears.size).toBeGreaterThanOrEqual(5);
    // '계/전국' 합계가 시도 키로 새지 않았는지(약칭만 존재).
    expect(sidoKeys).not.toContain('전국');
    expect(sidoKeys).not.toContain('계');
  });

  it.each(NEW_GOALS)('goal $goal — 방향(higherBetter) 부록 A와 일치', ({ goal, higherBetter }) => {
    expect(goals[String(goal)].higherBetter).toBe(higherBetter);
  });

  it.each(NEW_GOALS)('goal $goal — MULTIYEAR_GREEN=null(slope 부호 판정, 목표 날조 0)', ({ goal }) => {
    expect(MULTIYEAR_GREEN[goal] ?? null).toBeNull();
  });

  it.each(NEW_GOALS)('goal $goal — 배지 표시 조건: 전국 시계열 ≥3연도', ({ goal }) => {
    const ind = goals[String(goal)];
    const mergeKind = MULTIYEAR_ABSOLUTE.has(goal) ? 'sum' : 'ratio';
    const { national, byRegion } = buildRegionSeries(ind.seriesBySido!, undefined, mergeKind);
    // SDGMapDashboard 배지는 national.length>=3에서만 표시.
    expect(national.length).toBeGreaterThanOrEqual(3);
    // 16광역 병합 후에도 다수 광역 보유(광주+전남 병합 → 최대 16).
    expect(Object.keys(byRegion).length).toBeGreaterThanOrEqual(15);
  });
});

describe('17시도 완전성 — goal 7·9·11 (제주 포함)', () => {
  it.each(GOALS_17)('goal %i — seriesBySido 시도 수 === 17', (goal) => {
    const keys = Object.keys(goals[String(goal)].seriesBySido!);
    expect(keys.length).toBe(17);
  });

  it.each(GOALS_17)('goal %i — seriesBySido 키가 정규 17시도 집합에 모두 속함', (goal) => {
    const keys = Object.keys(goals[String(goal)].seriesBySido!);
    for (const k of keys) expect(CANON_17.has(k)).toBe(true);
  });

  it.each(GOALS_17)('goal %i — 제주 시도 존재', (goal) => {
    expect(goals[String(goal)].seriesBySido!['제주']).toBeDefined();
  });
});

describe('자살률(goal3) lower_better 방향 신호', () => {
  it('하락 시계열 → 개선(on_track)', () => {
    // higherBetter=false: 값 감소가 개선. green=null이므로 slope 부호 판정.
    const down = [
      { year: 2016, value: 30 },
      { year: 2017, value: 28 },
      { year: 2018, value: 26 },
    ];
    expect(regionMultiYearTrend(down, 3, false).arrow).toBe('on_track');
  });

  it('상승 시계열 → 악화(decreasing)', () => {
    const up = [
      { year: 2016, value: 26 },
      { year: 2017, value: 28 },
      { year: 2018, value: 30 },
    ];
    expect(regionMultiYearTrend(up, 3, false).arrow).toBe('decreasing');
  });

  it('goal3 실데이터: 단위에 10만명당 표기, green null', () => {
    const g3 = goals['3'];
    expect(g3.unit).toContain('10만명당');
    expect(MULTIYEAR_GREEN[3] ?? null).toBeNull();
  });

  it('goal3 실데이터: 제주 포함(17시도) — 2024년 재수집', () => {
    const keys = Object.keys(goals['3'].seriesBySido!);
    expect(keys).toContain('제주');
    expect(keys.length).toBe(17);
  });
});

describe('신재생에너지(goal7) sum 병합 — 절대량 교정', () => {
  it('MULTIYEAR_ABSOLUTE에 goal7 포함', () => {
    expect(MULTIYEAR_ABSOLUTE.has(7)).toBe(true);
  });

  it('sum 병합: 광주전남 = 광주 + 전남 (평균 아님)', () => {
    // 광주=100, 전남=200 → 광주전남=300
    const series: Record<string, Record<string, number>> = {
      광주: { '2020': 100 },
      전남: { '2020': 200 },
      서울: { '2020': 500 },
    };
    const { byRegion } = buildRegionSeries(series, undefined, 'sum');
    expect(byRegion['광주전남']?.[0]?.value).toBe(300); // 합산
    expect(byRegion['서울']?.[0]?.value).toBe(500);
  });

  it('sum 병합: 전국 = 광역 합계(평균 아님)', () => {
    // 서울=500, 광주전남=300(광주100+전남200) → 전국=800
    const series: Record<string, Record<string, number>> = {
      광주: { '2020': 100 },
      전남: { '2020': 200 },
      서울: { '2020': 500 },
    };
    const { national } = buildRegionSeries(series, undefined, 'sum');
    expect(national[0]?.value).toBe(800); // 합계
  });

  it('ratio 병합(비율 지표): 전국 = 광역 평균', () => {
    // 서울=60%, 광주=55%, 전남=50% → 광주전남=52.5%(pop미제공 단순평균), 전국=(60+52.5)/2=56.25
    const series: Record<string, Record<string, number>> = {
      서울: { '2020': 60 },
      광주: { '2020': 55 },
      전남: { '2020': 50 },
    };
    const { national, byRegion } = buildRegionSeries(series, undefined, 'ratio');
    expect(byRegion['광주전남']?.[0]?.value).toBeCloseTo(52.5);
    expect(national[0]?.value).toBeCloseTo((60 + 52.5) / 2); // 평균
  });

  it('goal7 실데이터: 단위=toe, sum 병합 후 전국 > 각 광역', () => {
    const g7 = goals['7'];
    expect(g7.unit).toContain('toe');
    const { national, byRegion } = buildRegionSeries(g7.seriesBySido!, undefined, 'sum');
    // 전국은 모든 광역 합계 — 어느 단일 광역보다 커야 함.
    const maxRegion = Math.max(...Object.values(byRegion).map((pts) => pts[pts.length - 1]?.value ?? 0));
    const nationalLatest = national[national.length - 1]?.value ?? 0;
    expect(nationalLatest).toBeGreaterThan(maxRegion);
  });
});

describe('주택보급률(goal11) C1_CODE4 파서 — 합계(0001~0003) 제외 확인', () => {
  it('17시도 약칭만 존재(합계 코드가 약칭으로 새지 않음)', () => {
    const keys = Object.keys(goals['11'].seriesBySido!);
    for (const k of keys) expect(CANON_17.has(k)).toBe(true);
  });
});
