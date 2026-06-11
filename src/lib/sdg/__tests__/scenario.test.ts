import { applyScenario, targetHint, indicatorsForGoal, indicatorDomainBounds, SLIDER_PAD_RATIO } from '@/lib/sdg/scenario';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

// 실 INDICATOR_TO_GOAL 매핑 사용: goal 8 = emp_rate(higher) · emp_unemp(lower) · emp_youth(lower).
// 테스트는 emp_rate·emp_unemp만 채워(데이터 보유분만 반영) 작은 케이스로 검증.
const direction: Record<string, IndicatorDirection> = {
  emp_rate: 'higher_better',
  emp_unemp: 'lower_better',
};

// 3개 광역 단순 케이스.
const baseValues: Record<string, Record<string, number>> = {
  emp_rate: { 서울: 60, 부산: 50, 경기: 70 },
  emp_unemp: { 서울: 3, 부산: 5, 경기: 2 },
};

describe('indicatorsForGoal', () => {
  it('goal 8에 고용 지표들이 포함', () => {
    const inds = indicatorsForGoal(8);
    expect(inds).toEqual(expect.arrayContaining(['emp_rate', 'emp_unemp', 'emp_youth']));
  });
  it('데이터 매핑 없는 goal(2)은 빈 배열', () => {
    expect(indicatorsForGoal(2)).toEqual([]);
  });
});

describe('applyScenario — baseline 수동계산', () => {
  // emp_rate higher {60,50,70}: 서울50 부산0 경기100
  // emp_unemp lower {3,5,2}: 서울67 부산0 경기100
  // goal8 평균: 서울59 부산0 경기100. 순위: 경기1 서울2 부산3.
  it('서울 baseline score=59, rank=2', () => {
    const r = applyScenario({ valuesByIndicator: baseValues, direction, metro: '서울', goalNum: 8, overrides: {} });
    expect(r.score).toBe(59);
    expect(r.rankAmong16).toBe(2);
  });
  it('경기 baseline score=100, rank=1', () => {
    const r = applyScenario({ valuesByIndicator: baseValues, direction, metro: '경기', goalNum: 8, overrides: {} });
    expect(r.score).toBe(100);
    expect(r.rankAmong16).toBe(1);
  });
  it('부산 baseline score=0, rank=3', () => {
    const r = applyScenario({ valuesByIndicator: baseValues, direction, metro: '부산', goalNum: 8, overrides: {} });
    expect(r.score).toBe(0);
    expect(r.rankAmong16).toBe(3);
  });
});

describe('applyScenario — override 반영', () => {
  // 서울 emp_rate 60→70 (max 동률): emp_rate range 50~70 → 서울100 부산0 경기100
  // goal8 서울=(100+67)/2=83.5→84, 경기100, 부산0. 순위: 경기1 서울2 부산3.
  it('서울 emp_rate=70 → score 84, rank 2', () => {
    const r = applyScenario({
      valuesByIndicator: baseValues, direction, metro: '서울', goalNum: 8, overrides: { emp_rate: 70 },
    });
    expect(r.score).toBe(84);
    expect(r.rankAmong16).toBe(2);
  });
  it('override가 분포 경계를 넓혀 타 지역 순위에 영향 (서울 emp_rate=200)', () => {
    // emp_rate range 50~200 → 서울100 부산0 경기(70-50)/150*100=13
    // emp_unemp 불변: 서울67 부산0 경기100
    // goal8: 서울(100+67)/2=83.5→84, 경기(13+100)/2=56.5→57, 부산0
    // 서울이 1위로 올라서고 경기는 2위로 밀림 → 타 지역 순위 영향 확인.
    const r = applyScenario({
      valuesByIndicator: baseValues, direction, metro: '서울', goalNum: 8, overrides: { emp_rate: 200 },
    });
    expect(r.score).toBe(84);
    expect(r.rankAmong16).toBe(1);
  });
});

describe('applyScenario — 항등 / 없음', () => {
  it('overrides 비면 baseline과 동일', () => {
    const a = applyScenario({ valuesByIndicator: baseValues, direction, metro: '서울', goalNum: 8, overrides: {} });
    const b = applyScenario({ valuesByIndicator: baseValues, direction, metro: '서울', goalNum: 8, overrides: { emp_rate: 60, emp_unemp: 3 } });
    expect(b.score).toBe(a.score);
    expect(b.rankAmong16).toBe(a.rankAmong16);
  });
  it('매핑 지표 없는 goal은 null', () => {
    const r = applyScenario({ valuesByIndicator: baseValues, direction, metro: '서울', goalNum: 2, overrides: {} });
    expect(r.score).toBeNull();
    expect(r.rankAmong16).toBeNull();
  });
});

describe('targetHint — 역산 + round-trip', () => {
  // 단일 지표 emp_rate 기준 역산을 위해 emp_rate만 가진 분포 사용.
  const single: Record<string, Record<string, number>> = {
    emp_rate: { 서울: 60, 부산: 50, 경기: 70 },
  };
  it('round-trip: requiredValue를 override로 넣으면 목표점수 ±1', () => {
    for (const target of [0, 25, 50, 75, 100]) {
      const hint = targetHint({ valuesByIndicator: single, direction, metro: '서울', indicatorId: 'emp_rate', targetScore: target });
      if (!hint.achievable) continue;
      // emp_rate 단독 goal 점수 = 정규화값. override 적용 후 점수 확인.
      const merged = { ...single, emp_rate: { ...single.emp_rate, 서울: hint.requiredValue } };
      const r = applyScenario({ valuesByIndicator: merged, direction, metro: '서울', goalNum: 8, overrides: {} });
      expect(r.score).not.toBeNull();
      expect(Math.abs((r.score as number) - target)).toBeLessThanOrEqual(1);
    }
  });
  it('lower_better 지표도 round-trip ±1', () => {
    const lower: Record<string, Record<string, number>> = {
      emp_unemp: { 서울: 3, 부산: 5, 경기: 2 },
    };
    for (const target of [10, 40, 60, 90]) {
      const hint = targetHint({ valuesByIndicator: lower, direction, metro: '서울', indicatorId: 'emp_unemp', targetScore: target });
      if (!hint.achievable) continue;
      const merged = { ...lower, emp_unemp: { ...lower.emp_unemp, 서울: hint.requiredValue } };
      const r = applyScenario({ valuesByIndicator: merged, direction, metro: '서울', goalNum: 8, overrides: {} });
      expect(Math.abs((r.score as number) - target)).toBeLessThanOrEqual(1);
    }
  });
  it('지표 없으면 achievable:false', () => {
    const r = targetHint({ valuesByIndicator: single, direction, metro: '서울', indicatorId: 'nonexist', targetScore: 50 });
    expect(r.achievable).toBe(false);
  });
  it('경계: 모든 지역 동일값(분포 폭 0) → 점수는 항상 50, target 100 도달 불가', () => {
    // normalizeMinMax: max===min이면 모든 값 50. metro를 어떻게 바꿔도 다른 지역이 모두 같은 값이면
    // metro만 분포 폭을 만들 수 있으나, 다른 두 지역이 동일하면 metro=그 값일 때 폭 0 → 50.
    // 여기서는 다른 지역이 모두 동일하고 metro도 같은 극단을 잡아도 100엔 도달하나,
    // 진짜 도달 불가 케이스: 단일 지역(others 없음)이면 항상 50.
    const solo: Record<string, Record<string, number>> = { emp_rate: { 서울: 60 } };
    const r = targetHint({ valuesByIndicator: solo, direction, metro: '서울', indicatorId: 'emp_rate', targetScore: 100 });
    expect(r.achievable).toBe(false);
  });
});

describe('targetHint — 도메인 클램프(HIGH-2 회귀 방지)', () => {
  // 2지역 분포에서 target 100: 도달에 필요한 값이 도메인(슬라이더) 범위 밖이면 achievable:false여야 한다.
  // 분포 {서울:60, 부산:50}, span=10, pad=10*0.15=1.5 → 슬라이더 [48.5, 71.5].
  // target 100(higher_better): 서울이 부산보다 훨씬 높아야 → 분포 최대가 서울 값으로 결정되므로
  // 서울=max 이면 항상 100 → requiredValue는 hi(71.5) 근방에서 달성됨 → 도메인 내 → achievable:true여야 함.
  // 반면 target 0(higher_better): 서울이 최솟값 이하여야 → loBound(48.5) 근방이고 도메인 내 → achievable:true.
  // 핵심 케이스: 3지역 {서울:60, 부산:59, 대구:58}, span=2, pad=0.3 → 슬라이더 [57.7, 60.3].
  // target 100: 서울이 60.3을 넘어야 한다면 도메인 밖 → achievable:false.
  // (실제로 higher_better에서 metro=max이면 100에 도달 — 60.3 이내에서 달성 가능하므로 achievable:true도 허용)
  // 핵심 보장: requiredValue가 도메인 밖이면 achievable:false — 이것만 강제 검증.

  it('2지역 분포 target 100: achievable이 false이거나 requiredValue가 도메인 내', () => {
    const twoRegion: Record<string, Record<string, number>> = {
      emp_rate: { 서울: 60, 부산: 50 },
    };
    const hint = targetHint({
      valuesByIndicator: twoRegion,
      direction,
      metro: '서울',
      indicatorId: 'emp_rate',
      targetScore: 100,
    });
    // 불변식: achievable:true 이면 requiredValue는 반드시 도메인 내여야 함.
    if (hint.achievable) {
      const { lo, hi } = indicatorDomainBounds(twoRegion.emp_rate);
      expect(hint.requiredValue).toBeGreaterThanOrEqual(lo);
      expect(hint.requiredValue).toBeLessThanOrEqual(hi);
    }
    // 도메인 밖 값이 achievable:true로 새어나오지 않는지 직접 확인.
    const { lo, hi } = indicatorDomainBounds(twoRegion.emp_rate);
    const outOfDomain = hint.requiredValue < lo || hint.requiredValue > hi;
    if (outOfDomain) {
      expect(hint.achievable).toBe(false);
    }
  });

  it('단일 지표 lower_better: requiredValue 도메인 밖이면 achievable:false', () => {
    // {서울:3, 부산:2}: span=1, pad=0.15 → 슬라이더 [1.85, 3.15].
    // target 0(lower_better → 서울이 최솟값): 현재 부산(2)이 min → 서울=2 이하여야 함 → 도메인 내.
    // target 100(lower_better → 서울이 최댓값): 서울>부산(2) 이상이어야 → 도메인 내.
    // target 불가능 케이스는 없지만, achievable:true 시 도메인 내임을 검증.
    const lowerDist: Record<string, Record<string, number>> = {
      emp_unemp: { 서울: 3, 부산: 2 },
    };
    for (const target of [0, 50, 100]) {
      const hint = targetHint({
        valuesByIndicator: lowerDist,
        direction,
        metro: '서울',
        indicatorId: 'emp_unemp',
        targetScore: target,
      });
      if (hint.achievable) {
        const { lo, hi } = indicatorDomainBounds(lowerDist.emp_unemp);
        expect(hint.requiredValue).toBeGreaterThanOrEqual(lo - 0.01); // float 허용
        expect(hint.requiredValue).toBeLessThanOrEqual(hi + 0.01);
      }
    }
  });

  it('SLIDER_PAD_RATIO가 0.15임을 확인(상수 회귀)', () => {
    expect(SLIDER_PAD_RATIO).toBe(0.15);
  });

  it('indicatorDomainBounds: span=10 분포 → lo=min-1.5, hi=max+1.5', () => {
    const bounds = indicatorDomainBounds({ 서울: 60, 부산: 50 });
    expect(bounds.lo).toBeCloseTo(50 - 10 * 0.15, 5);
    expect(bounds.hi).toBeCloseTo(60 + 10 * 0.15, 5);
  });
});
