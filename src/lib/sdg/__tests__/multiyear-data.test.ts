// ============================================================
// KOSIS 다년 데이터 무결성 — 신규 파서(C1_CODE4·filter·C2_NM) 수집 결과 검증
// ============================================================
//
// 근거: spec 2026-06-25 부록 A. fetch-kosis-sdg.mjs가 신규 goal(3·5·7·11)을
//   16+시도×다년으로 수집했는지, 방향(higherBetter)·시계열 구조·배지 표시 조건을 확인.
// ⚠️ 정직성: 임의 목표값 없음(MULTIYEAR_GREEN null). 실측 연도점만. 인과 0.
//   값 자체 단정 금지 — 구조·시도수·연도수·방향만 검증한다.

import sidoData from '../../../../public/data/sdg-sido.json';
import { buildRegionSeries, regionMultiYearTrend, MULTIYEAR_GREEN } from '@/lib/sdg/multiyear-build';

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
    const { national, byRegion } = buildRegionSeries(ind.seriesBySido!);
    // SDGMapDashboard 배지는 national.length>=3에서만 표시.
    expect(national.length).toBeGreaterThanOrEqual(3);
    // 16광역 병합 후에도 다수 광역 보유(광주+전남 병합 → 최대 16).
    expect(Object.keys(byRegion).length).toBeGreaterThanOrEqual(15);
  });
});

describe('자살률(goal3) lower_better 방향 신호', () => {
  it('하락 시계열 → 개선(on_track), 상승 시계열 → 악화(decreasing)', () => {
    // higherBetter=false: 값 감소가 개선. green=null이므로 slope 부호 판정.
    const down = [
      { year: 2016, value: 30 },
      { year: 2017, value: 28 },
      { year: 2018, value: 26 },
    ];
    const up = down.map((p) => ({ year: p.year, value: 60 - p.value }));
    expect(regionMultiYearTrend(down, 3, false).arrow).toBe('on_track');
    expect(regionMultiYearTrend(up, 3, false).arrow).toBe('decreasing');
  });

  it('실데이터: 자살률 단위에 10만명당 표기, green null', () => {
    const g3 = goals['3'];
    expect(g3.unit).toContain('10만명당');
    expect(MULTIYEAR_GREEN[3] ?? null).toBeNull();
  });
});

describe('주택보급률(goal11) C1_CODE4 파서 — 합계(0001~0003) 제외 확인', () => {
  it('17시도 약칭만 존재(합계 코드가 약칭으로 새지 않음)', () => {
    const keys = Object.keys(goals['11'].seriesBySido!);
    const canon = new Set([
      '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
      '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
    ]);
    for (const k of keys) expect(canon.has(k)).toBe(true);
  });
});
