import {
  overallAchievement,
  budgetEfficiency,
  outcomeSummary,
  type FiscalInput,
} from '@/lib/sdg/effectiveness';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

// ── 테스트 설계 메모 ───────────────────────────────────────────
// effectiveness는 scoring.ts(목표값 기준 달성도)·trend.ts(2점 CR)를 재사용한다.
// 실제 INDICATOR_TARGETS에 의존하므로, 달성도가 결정론적으로 나오는 실지표를 쓴다.
//   hlt_life(green=86, floor=80, higher_better): value=83 → t=(83-80)/(86-80)=0.5 → score 50.
//   hlt_life value=86 → score 100. value=80 → score 0.
//   emp_rate(green=70, floor=58, higher_better): value=64 → t=(64-58)/12=0.5 → score 50.
// goal당 단일 지표만 넣어 goal 달성도 = 해당 지표 달성도가 되게 한다.
const direction: Record<string, IndicatorDirection> = {
  hlt_life: 'higher_better',
  emp_rate: 'higher_better',
};

/** 단일 광역에 hlt_life·emp_rate 값을 주입한 valuesByIndicator 생성 헬퍼. */
function mkValues(
  byRegion: Record<string, { hlt_life?: number; emp_rate?: number }>,
): Record<string, Record<string, number>> {
  const hlt: Record<string, number> = {};
  const emp: Record<string, number> = {};
  for (const [region, v] of Object.entries(byRegion)) {
    if (v.hlt_life != null) hlt[region] = v.hlt_life;
    if (v.emp_rate != null) emp[region] = v.emp_rate;
  }
  const out: Record<string, Record<string, number>> = {};
  if (Object.keys(hlt).length) out.hlt_life = hlt;
  if (Object.keys(emp).length) out.emp_rate = emp;
  return out;
}

describe('overallAchievement', () => {
  it('단일 목표 데이터 → 그 목표 달성도 (hlt_life value=83 → 50)', () => {
    const values = mkValues({ 서울: { hlt_life: 83 } });
    expect(overallAchievement('서울', values, direction)).toBe(50);
  });

  it('두 목표 평균 (goal3=50, goal8=100 → 75)', () => {
    // hlt_life=83 → 50 (goal3), emp_rate=70 → 100 (goal8). 평균 75.
    const values = mkValues({ 서울: { hlt_life: 83, emp_rate: 70 } });
    expect(overallAchievement('서울', values, direction)).toBe(75);
  });

  it('반올림 (goal3=50, goal8=33 → 41.5 → 42)', () => {
    // emp_rate=62 → t=(62-58)/12=0.333 → 33.
    const values = mkValues({ 서울: { hlt_life: 83, emp_rate: 62 } });
    // 평균 (50+33)/2 = 41.5 → 반올림 42.
    expect(overallAchievement('서울', values, direction)).toBe(42);
  });

  it('데이터 없는 광역 → null', () => {
    const values = mkValues({ 서울: { hlt_life: 83 } });
    expect(overallAchievement('부산', values, direction)).toBeNull();
  });
});

describe('budgetEfficiency', () => {
  // 4개 광역, 달성도와 1인당 예산이 명확히 분리되도록 구성.
  //   A: 고예산·고성과, B: 저예산·고성과, C: 고예산·저성과, D: 저예산·저성과.
  // perCapitaBudget = budget억 * 1e8 / population / 10000 (만원/인).
  //   budget 100억(1e10원), pop 100만 → 1e10/1e6/1e4 = 1 만원/인.
  const regions = ['A', 'B', 'C', 'D'];
  const fiscal: Record<string, FiscalInput> = {
    A: { budget: 200, population: 1_000_000, independence: 50, debt: 100 }, // 2 만원/인
    B: { budget: 100, population: 1_000_000, independence: 40, debt: 50 }, // 1 만원/인
    C: { budget: 200, population: 1_000_000, independence: 30, debt: 200 }, // 2 만원/인
    D: { budget: 100, population: 1_000_000, independence: 20, debt: 80 }, // 1 만원/인
  };
  // 달성도: A,B 고성과(hlt_life=86 → 100), C,D 저성과(hlt_life=80 → 0).
  const values = mkValues({
    A: { hlt_life: 86 },
    B: { hlt_life: 86 },
    C: { hlt_life: 80 },
    D: { hlt_life: 80 },
  });

  it('perCapitaBudget 계산 (200억/100만명 → 2 만원/인)', () => {
    const r = budgetEfficiency(regions, fiscal, values, direction);
    const a = r.points.find((p) => p.region === 'A')!;
    expect(a.perCapitaBudget).toBeCloseTo(2, 6);
    const b = r.points.find((p) => p.region === 'B')!;
    expect(b.perCapitaBudget).toBeCloseTo(1, 6);
  });

  it('중앙값으로 4사분면 분할 (medianX=1.5, medianY=50)', () => {
    const r = budgetEfficiency(regions, fiscal, values, direction);
    // x: [1,1,2,2] 중앙값 1.5. y: [0,0,100,100] 중앙값 50.
    expect(r.medianX).toBeCloseTo(1.5, 6);
    expect(r.medianY).toBeCloseTo(50, 6);
  });

  it('4사분면 분류 (경계: x≥medianX·y≥medianY 포함 규칙)', () => {
    const r = budgetEfficiency(regions, fiscal, values, direction);
    const q = (name: string) => r.points.find((p) => p.region === name)!.quadrant;
    // A: x=2(≥1.5)·y=100(≥50) → invest(고예산고성과)
    expect(q('A')).toBe('invest');
    // B: x=1(<1.5)·y=100(≥50) → efficient(저예산고성과)
    expect(q('B')).toBe('efficient');
    // C: x=2(≥1.5)·y=0(<50) → review(고예산저성과)
    expect(q('C')).toBe('review');
    // D: x=1(<1.5)·y=0(<50) → limited(저예산저성과)
    expect(q('D')).toBe('limited');
  });

  it('재정·달성도 없는 광역 제외', () => {
    const r = budgetEfficiency(
      [...regions, 'NOFISCAL', 'NODATA'],
      { ...fiscal, NODATA: { budget: 100, population: 1_000_000, independence: 10, debt: 10 } },
      values, // NODATA·NOFISCAL은 valuesByIndicator에 없음 → 달성도 null
      direction,
    );
    const names = r.points.map((p) => p.region);
    expect(names).not.toContain('NOFISCAL'); // 재정 없음
    expect(names).not.toContain('NODATA'); // 달성도 없음
    expect(names.sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('budget 또는 population 0 → 제외(방어)', () => {
    const r = budgetEfficiency(
      ['A', 'ZEROPOP', 'ZEROBUD'],
      {
        A: fiscal.A,
        ZEROPOP: { budget: 100, population: 0, independence: 10, debt: 0 },
        ZEROBUD: { budget: 0, population: 1_000_000, independence: 10, debt: 0 },
      },
      mkValues({ A: { hlt_life: 86 }, ZEROPOP: { hlt_life: 86 }, ZEROBUD: { hlt_life: 86 } }),
      direction,
    );
    const names = r.points.map((p) => p.region);
    expect(names).toContain('A');
    expect(names).not.toContain('ZEROPOP');
    expect(names).not.toContain('ZEROBUD');
  });
});

describe('outcomeSummary', () => {
  const fiscal: FiscalInput = {
    budget: 1000,
    population: 1_000_000,
    independence: 45,
    debt: 200,
  };

  it('output: budget·independence·debtRatio(=debt/budget*100)', () => {
    const values = mkValues({ 서울: { hlt_life: 83 } });
    const base = mkValues({ 서울: { hlt_life: 82 } });
    const s = outcomeSummary('서울', fiscal, values, direction, base, 3);
    expect(s.output.budget).toBe(1000);
    expect(s.output.independence).toBe(45);
    expect(s.output.debtRatio).toBeCloseTo(20, 6); // 200/1000*100
    expect(s.rank).toBe(3);
  });

  it('outcome.achievement = overallAchievement', () => {
    const values = mkValues({ 서울: { hlt_life: 83 } }); // → 50
    const base = mkValues({ 서울: { hlt_life: 82 } });
    const s = outcomeSummary('서울', fiscal, values, direction, base);
    expect(s.outcome.achievement).toBe(50);
  });

  it('lightCounts: goal별 신호등 분포 카운트', () => {
    // hlt_life=86 → score 100 → green (goal3). emp_rate=58 → score 0 → red (goal8).
    const values = mkValues({ 서울: { hlt_life: 86, emp_rate: 58 } });
    const base = mkValues({ 서울: { hlt_life: 82, emp_rate: 58 } });
    const s = outcomeSummary('서울', fiscal, values, direction, base);
    expect(s.outcome.lightCounts.green).toBe(1);
    expect(s.outcome.lightCounts.red).toBe(1);
    expect(s.outcome.lightCounts.yellow).toBe(0);
    expect(s.outcome.lightCounts.orange).toBe(0);
  });

  it('trend: up=on_track/improving, flat=stagnating, down=decreasing 3분류 카운트', () => {
    // goal3 hlt_life: base=82, current=86(green). 상승·목표충족 → on_track → up.
    // goal8 emp_rate: base=64, current=60. green=70. 하락 → decreasing → down.
    const values = mkValues({ 서울: { hlt_life: 86, emp_rate: 60 } });
    const base = mkValues({ 서울: { hlt_life: 82, emp_rate: 64 } });
    const s = outcomeSummary('서울', fiscal, values, direction, base);
    expect(s.outcome.trend.up).toBe(1);
    expect(s.outcome.trend.flat).toBe(0);
    expect(s.outcome.trend.down).toBe(1);
  });
});
