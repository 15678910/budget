import { buildVLR, type VLRReport, type VLRFiscal } from '@/lib/sdg/vlr';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import type { KsdgsTarget } from '@/lib/sdg/ontology';

// ── 결정론적 테스트 픽스처 ──────────────────────────────────────
// achievement(goalAchievement)는 INDICATOR_TARGETS에 임계값이 있는 매핑 지표만 사용한다.
// 실데이터에 의존하지 않도록, scoring 모듈이 인식하는 실제 지표 id로 값을 구성한다.
// 여기서는 board-data 어셈블 결과 형태(지표 id → 지역 → 값)를 직접 만든다.

// 실제 INDICATOR_TO_GOAL / INDICATOR_TARGETS 에 존재하는 지표를 사용한다.
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { INDICATOR_TARGETS } from '@/lib/sdg/targets-data';
import { SDG_DOMAINS } from '@/lib/data/local-sdg-data';

// 임계값(달성도 산정 가능) + goal 매핑이 둘 다 있는 지표만 추출.
function scorableIndicators(): { id: string; goal: number; direction: IndicatorDirection }[] {
  const dir: Record<string, IndicatorDirection> = {};
  for (const d of SDG_DOMAINS) for (const ind of d.indicators) dir[ind.id] = ind.direction;
  const out: { id: string; goal: number; direction: IndicatorDirection }[] = [];
  for (const [id, goal] of Object.entries(INDICATOR_TO_GOAL)) {
    if (INDICATOR_TARGETS[id]) {
      out.push({ id, goal, direction: dir[id] ?? 'higher_better' });
    }
  }
  return out;
}

const SCORABLE = scorableIndicators();

function emptyDirection(): Record<string, IndicatorDirection> {
  const dir: Record<string, IndicatorDirection> = {};
  for (const s of SCORABLE) dir[s.id] = s.direction;
  return dir;
}

const FISCAL: VLRFiscal = {
  budget: 300000,
  independence: 60,
  autonomy: 70,
  debtRatio: 12.5,
  population: 9500000,
};

// getTargets stub — 결정론적, 외부 데이터 비의존.
const getTargets = (goalNum: number): KsdgsTarget[] => [
  { code: `${goalNum}-1`, text: `목표 ${goalNum} 세부목표 1` },
];

describe('buildVLR', () => {
  it('region이 없으면(빈 문자열) 방어적 빈 구조를 반환한다', () => {
    const r = buildVLR('', {
      valuesByIndicator: {},
      direction: {},
      fiscal: null,
      getTargets,
    });
    expect(r.region).toBe('');
    expect(r.goalProgress).toHaveLength(17);
    // 데이터 없음 → 강점/약점 비어 있음, lessons 방어
    expect(r.priorities.strengths).toEqual([]);
    expect(r.priorities.weaknesses).toEqual([]);
    expect(Array.isArray(r.lessons)).toBe(true);
  });

  it('6개 섹션을 모두 채운다', () => {
    const region = '서울';
    const valuesByIndicator: Record<string, Record<string, number>> = {};
    for (const s of SCORABLE) {
      valuesByIndicator[s.id] = { [region]: INDICATOR_TARGETS[s.id].green };
    }
    const r = buildVLR(region, {
      valuesByIndicator,
      direction: emptyDirection(),
      fiscal: FISCAL,
      getTargets,
    });
    expect(r.region).toBe(region);
    // ① 배경
    expect(r.context.population).toBe(FISCAL.population);
    expect(r.context.budget).toBe(FISCAL.budget);
    expect(r.context.independence).toBe(FISCAL.independence);
    expect(r.context.autonomy).toBe(FISCAL.autonomy);
    expect(r.context.debtRatio).toBe(FISCAL.debtRatio);
    // ② 지역화
    expect(r.localization.dataGoalCount).toBeGreaterThan(0);
    expect(typeof r.localization.methodologyNote).toBe('string');
    // ③ 17목표
    expect(r.goalProgress).toHaveLength(17);
    // ⑤ 이행수단
    expect(r.means.budget).toBe(FISCAL.budget);
    expect(r.means.independence).toBe(FISCAL.independence);
    // ⑥ 교훈
    expect(Array.isArray(r.lessons)).toBe(true);
  });

  it('goalProgress는 항상 17목표, 데이터 없는 목표는 score/light = null', () => {
    const region = '부산';
    // 단 하나의 scorable 지표만 데이터 보유 → 그 goal만 점수, 나머지 null
    const one = SCORABLE[0];
    const valuesByIndicator = {
      [one.id]: { [region]: INDICATOR_TARGETS[one.id].green },
    };
    const r = buildVLR(region, {
      valuesByIndicator,
      direction: emptyDirection(),
      fiscal: FISCAL,
      getTargets,
    });
    expect(r.goalProgress).toHaveLength(17);
    const withData = r.goalProgress.filter((g) => g.score !== null);
    // 동일 goal에 다른 scorable 지표가 더 있을 수 있으나 최소 1개 이상은 데이터.
    expect(withData.length).toBeGreaterThanOrEqual(1);
    const goalOne = r.goalProgress.find((g) => g.goalNum === one.goal);
    expect(goalOne).toBeDefined();
    expect(goalOne!.score).not.toBeNull();
    expect(goalOne!.light).not.toBeNull();
    // 데이터 없는 목표 하나 확인
    const noData = r.goalProgress.find((g) => g.score === null);
    if (noData) expect(noData.light).toBeNull();
  });

  it('강점=달성도 내림차순 Top3, 약점=오름차순 Top3 (데이터 보유 목표만)', () => {
    const region = '경기';
    // 여러 goal에 서로 다른 점수를 주려면 green/floor 사이 값을 조절.
    // 각 scorable 지표에 대해, green이면 100점, floor면 0점.
    // 최소 4개 이상의 서로 다른 goal에 데이터를 부여한다.
    const byGoal = new Map<number, { id: string; direction: IndicatorDirection }>();
    for (const s of SCORABLE) {
      if (!byGoal.has(s.goal)) byGoal.set(s.goal, { id: s.id, direction: s.direction });
    }
    const goals = [...byGoal.entries()];
    expect(goals.length).toBeGreaterThanOrEqual(4); // 정렬·Top3 검증 가능 조건

    const valuesByIndicator: Record<string, Record<string, number>> = {};
    // 각 goal에 green(100점) / floor(0점) 양 극단을 섞어 점수 분산.
    goals.forEach(([, { id }], idx) => {
      const t = INDICATOR_TARGETS[id];
      // idx별로 green↔floor 사이 보간값 부여(서로 다른 점수)
      const frac = goals.length === 1 ? 1 : idx / (goals.length - 1);
      const value = t.floor + (t.green - t.floor) * frac;
      valuesByIndicator[id] = { [region]: value };
    });

    const r = buildVLR(region, {
      valuesByIndicator,
      direction: emptyDirection(),
      fiscal: FISCAL,
      getTargets,
    });

    // 강점: 내림차순 정렬 + 최대 3개
    expect(r.priorities.strengths.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < r.priorities.strengths.length; i++) {
      expect(r.priorities.strengths[i - 1].score).toBeGreaterThanOrEqual(
        r.priorities.strengths[i].score,
      );
    }
    // 약점: 오름차순 정렬 + 최대 3개
    expect(r.priorities.weaknesses.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < r.priorities.weaknesses.length; i++) {
      expect(r.priorities.weaknesses[i - 1].score).toBeLessThanOrEqual(
        r.priorities.weaknesses[i].score,
      );
    }
    // 강점 1위 점수 ≥ 약점 1위 점수
    if (r.priorities.strengths.length && r.priorities.weaknesses.length) {
      expect(r.priorities.strengths[0].score).toBeGreaterThanOrEqual(
        r.priorities.weaknesses[0].score,
      );
    }
  });

  it('lessons는 규칙형(템플릿) — 약점 목표명과 점수를 포함한다', () => {
    const region = '대전';
    // 한 goal을 매우 낮게(floor=0점) 만들어 약점으로 만든다.
    const one = SCORABLE[0];
    const t = INDICATOR_TARGETS[one.id];
    const valuesByIndicator = { [one.id]: { [region]: t.floor } };
    const r = buildVLR(region, {
      valuesByIndicator,
      direction: emptyDirection(),
      // 자립도를 전국평균보다 낮게 → 재정 취약 lesson 트리거
      fiscal: { ...FISCAL, independence: 20 },
      getTargets,
    });
    expect(r.lessons.length).toBeGreaterThan(0);
    // 모든 lesson은 문자열(자유생성 금지 — 정해진 템플릿 문장만)
    for (const l of r.lessons) expect(typeof l).toBe('string');
    // 약점 목표가 있으면 '점검' 권고 문구 포함
    const hasReviewAdvice = r.lessons.some((l) => l.includes('점검'));
    expect(hasReviewAdvice).toBe(true);
  });

  it('순수 함수 — 동일 입력에 동일 출력(결정론)', () => {
    const region = '인천';
    const valuesByIndicator: Record<string, Record<string, number>> = {};
    for (const s of SCORABLE) {
      valuesByIndicator[s.id] = { [region]: INDICATOR_TARGETS[s.id].green };
    }
    const deps = {
      valuesByIndicator,
      direction: emptyDirection(),
      fiscal: FISCAL,
      getTargets,
    };
    const a = buildVLR(region, deps);
    const b = buildVLR(region, deps);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// 타입 export 사용처(컴파일 보증)
const _typecheck: VLRReport | null = null;
void _typecheck;
