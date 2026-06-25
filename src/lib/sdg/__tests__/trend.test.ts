import {
  targetGap,
  trendCR,
  goalTrend,
  CR_ON_TRACK_MIN,
  CR_IMPROVING_MIN,
  TREND_BASE_YEAR,
  TREND_CURRENT_YEAR,
  TREND_TARGET_YEAR,
} from '@/lib/sdg/trend';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

// 기본 연도 폭: actual 2018→2025 = 7년, target 2018→2030 = 12년.
const DT_A = TREND_CURRENT_YEAR - TREND_BASE_YEAR; // 7
const DT_T = TREND_TARGET_YEAR - TREND_BASE_YEAR; // 12

/** 주어진 base·green·목표CR을 정확히 만드는 current를 역산(higher_better 가정 수식, 양수). */
function currentForCR(base: number, green: number, cr: number): number {
  const agrr = Math.pow(green / base, 1 / DT_T) - 1;
  const agra = cr * agrr;
  return base * Math.pow(1 + agra, DT_A);
}

describe('targetGap', () => {
  it('current=green → 달성도 100, 갭 0 (higher_better)', () => {
    expect(targetGap(100, 100, 0, 'higher_better')).toEqual({ achievement: 100, gapToTarget: 0 });
  });
  it('current=floor → 달성도 0, 갭 100', () => {
    expect(targetGap(0, 100, 0, 'higher_better')).toEqual({ achievement: 0, gapToTarget: 100 });
  });
  it('중간값 → 갭 = 100 − 달성도', () => {
    const g = targetGap(50, 100, 0, 'higher_better');
    expect(g.achievement).toBe(50);
    expect(g.gapToTarget).toBe(50);
  });
  it('lower_better current=green → 갭 0', () => {
    // green=5, floor=18 (env_pm25류). current=5 → 달성 100.
    expect(targetGap(5, 5, 18, 'lower_better')).toEqual({ achievement: 100, gapToTarget: 0 });
  });
});

describe('trendCR — higher_better (green>base)', () => {
  const base = 50;
  const green = 100;
  const dir: IndicatorDirection = 'higher_better';

  it('CR=1 근방 → on_track', () => {
    const current = currentForCR(base, green, 1.0);
    const t = trendCR(base, current, green, dir);
    expect(t).not.toBeNull();
    expect(t!.cr).toBeCloseTo(1.0, 6);
    expect(t!.arrow).toBe('on_track');
  });

  it('CR=0.95 경계(이상) → on_track (포함)', () => {
    // 부동소수 round-trip 오차를 피해 경계 약간 위를 타겟 → 경계 포함 의미 검증.
    const current = currentForCR(base, green, CR_ON_TRACK_MIN + 1e-6);
    const t = trendCR(base, current, green, dir);
    expect(t!.cr).toBeGreaterThanOrEqual(CR_ON_TRACK_MIN);
    expect(t!.arrow).toBe('on_track');
  });

  it('CR=0.8 → improving', () => {
    const current = currentForCR(base, green, 0.8);
    expect(trendCR(base, current, green, dir)!.arrow).toBe('improving');
  });

  it('CR=0.6 경계(이상) → improving (포함)', () => {
    const current = currentForCR(base, green, CR_IMPROVING_MIN + 1e-6);
    const t = trendCR(base, current, green, dir);
    expect(t!.cr).toBeGreaterThanOrEqual(CR_IMPROVING_MIN);
    expect(t!.cr).toBeLessThan(CR_ON_TRACK_MIN);
    expect(t!.arrow).toBe('improving');
  });

  it('CR=0.3 → stagnating', () => {
    const current = currentForCR(base, green, 0.3);
    expect(trendCR(base, current, green, dir)!.arrow).toBe('stagnating');
  });

  it('CR<0 (current<base, 악화) → decreasing', () => {
    const current = 40; // base 50 미만 → AGRa<0 → CR<0
    const t = trendCR(base, current, green, dir);
    expect(t!.cr).toBeLessThan(0);
    expect(t!.arrow).toBe('decreasing');
  });
});

describe('trendCR — lower_better (green<base)', () => {
  // 자살률류: base=30, green=10 (낮을수록 양호). green<base.
  const base = 30;
  const green = 10;
  const dir: IndicatorDirection = 'lower_better';

  it('목표 향해 충분히 감소 → on_track', () => {
    // AGRr = (10/30)^(1/12)−1 (음수). current가 목표 궤도만큼 감소하면 CR≈1.
    const agrr = Math.pow(green / base, 1 / DT_T) - 1;
    const current = base * Math.pow(1 + agrr, DT_A); // CR=1
    const t = trendCR(base, current, green, dir);
    expect(t).not.toBeNull();
    expect(t!.cr).toBeCloseTo(1.0, 6);
    expect(t!.arrow).toBe('on_track');
  });

  it('값이 오히려 증가(악화) → CR<0 → decreasing', () => {
    const current = 35; // base 30보다 증가 = lower_better 악화
    const t = trendCR(base, current, green, dir);
    expect(t!.cr).toBeLessThan(0);
    expect(t!.arrow).toBe('decreasing');
  });
});

describe('trendCR — 경계 방어', () => {
  it('base≤0 → null', () => {
    expect(trendCR(0, 50, 100, 'higher_better')).toBeNull();
    expect(trendCR(-5, 50, 100, 'higher_better')).toBeNull();
  });

  it('current≤0 또는 green≤0 → null', () => {
    expect(trendCR(50, 0, 100, 'higher_better')).toBeNull();
    expect(trendCR(50, 60, 0, 'higher_better')).toBeNull();
  });

  it('비유한 입력 → null', () => {
    expect(trendCR(NaN, 50, 100, 'higher_better')).toBeNull();
    expect(trendCR(50, Infinity, 100, 'higher_better')).toBeNull();
  });

  it('AGRr≈0 (목표≈기준) & current 목표 충족 → on_track', () => {
    // green=base → AGRr=0. current가 목표 충족(higher: current≥green).
    const t = trendCR(80, 85, 80, 'higher_better');
    expect(t).not.toBeNull();
    expect(t!.arrow).toBe('on_track');
  });

  it('AGRr≈0 (목표≈기준) & current 미달 → decreasing', () => {
    // green=base=80, lower_better. current=85 > green → 미달.
    const t = trendCR(80, 85, 80, 'lower_better');
    expect(t!.arrow).toBe('decreasing');
  });
});

describe('trendCR — base가 이미 목표를 충족/초과한 경우 (CRITICAL CR 역전 방지)', () => {
  // higher_better, green=100, base=110(초과). AGRr<0이 되어 CR이 역전되는 케이스.

  it('[higher_better] base>green, current>base → on_track (개선·목표충족)', () => {
    // 강원 hou_supply류: base=110, green=100, current=112 (더 개선됨)
    const t = trendCR(110, 112, 100, 'higher_better');
    expect(t).not.toBeNull();
    expect(t!.arrow).toBe('on_track');
    expect(t!.cr).toBe(1);
  });

  it('[higher_better] base>green, current<green → decreasing (목표 밑으로 하락)', () => {
    // base=110, green=100, current=95 → 목표 아래로 떨어짐
    const t = trendCR(110, 95, 100, 'higher_better');
    expect(t).not.toBeNull();
    expect(t!.arrow).toBe('decreasing');
    expect(t!.cr).toBe(-1);
  });

  it('[lower_better] base<green, current<base → on_track (개선·목표충족)', () => {
    // lower_better, green=30, base=20(이미 목표 달성), current=18(더 낮아짐)
    const t = trendCR(20, 18, 30, 'lower_better');
    expect(t).not.toBeNull();
    expect(t!.arrow).toBe('on_track');
    expect(t!.cr).toBe(1);
  });

  it('[lower_better] base<green, current>green → decreasing (목표 위로 상승)', () => {
    // lower_better, green=30, base=20(이미 달성), current=35 → 목표 초과(악화)
    const t = trendCR(20, 35, 30, 'lower_better');
    expect(t).not.toBeNull();
    expect(t!.arrow).toBe('decreasing');
    expect(t!.cr).toBe(-1);
  });

  it('[sanity] 강원 hou_supply (base=110, current=112, green=100, higher_better) → 강원 더 이상 decreasing 아님', () => {
    // 실데이터 상사치 검증 — 이 케이스가 'decreasing'이면 CRITICAL 버그 재발.
    const t = trendCR(110, 112, 100, 'higher_better');
    expect(t!.arrow).not.toBe('decreasing');
  });
});

describe('goalTrend', () => {
  const direction: Record<string, IndicatorDirection> = {
    emp_rate: 'higher_better',
    emp_unemp: 'lower_better',
    emp_youth: 'lower_better',
  };

  it('goal 매핑 지표들의 CR 평균으로 화살표 산정', () => {
    // Goal 8: emp_rate(higher), emp_unemp(lower), emp_youth(lower).
    // 모두 목표 궤도에 근접하도록 current 구성.
    const baseByInd = { emp_rate: 60, emp_unemp: 4, emp_youth: 9 };
    const currentByInd = { emp_rate: 67, emp_unemp: 2.5, emp_youth: 6 };
    const gt = goalTrend(8, currentByInd, baseByInd, direction);
    expect(gt).not.toBeNull();
    expect(gt!.goal).toBe(8);
    expect(gt!.indicatorCount).toBeGreaterThan(0);
    expect(['on_track', 'improving', 'stagnating', 'decreasing']).toContain(gt!.arrow);
  });

  it('데이터 없으면 null', () => {
    expect(goalTrend(8, {}, {}, direction)).toBeNull();
  });

  it('매핑 지표 없는 goal → null', () => {
    // Goal 2(기아)는 INDICATOR_TO_GOAL 매핑 없음.
    expect(goalTrend(2, { emp_rate: 67 }, { emp_rate: 60 }, direction)).toBeNull();
  });
});
