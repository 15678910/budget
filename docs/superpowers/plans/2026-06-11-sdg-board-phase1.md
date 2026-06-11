# SDG 지역 상황판 Phase 1 (매트릭스 허브 MVP) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 16 광역 × 17 SDG목표 히트맵 매트릭스 허브 + 지역 프로파일(재정 맥락)을 만들고, 열 클릭 시 기존 choropleth로 드릴다운하는 동작하는 상황판 MVP를 만든다.

**Architecture:** 순수 로직 모듈(지역병합·지표매핑·정규화·매트릭스 빌드)을 먼저 TDD(jest)로 구축하고, 그 위에 React 컴포넌트(허브 매트릭스·지역 프로파일)를 얹는다. 모든 셀 점수는 **검증된 실데이터(local-sdg-data RAW 광역 실값 + KOSIS + 진학률)만** min-max 정규화하며, 없는 목표는 `null`(준비중)로 정직하게 비운다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, d3-geo/topojson(기존), jest + ts-jest(`npx jest <path>`).

**Spec:** `docs/superpowers/specs/2026-06-11-sdg-situation-board-design.md` (Phase 1 범위만)

---

## 사전 확정 사실 (조사 완료)

- `src/lib/data/local-sdg-data.ts`:
  - `SDG_DOMAINS` (11도메인 34지표), 각 지표 `{id, name, unit, direction, source}`.
  - **광역 currentValue = 실데이터**(RAW 테이블, 출처 명시). `getMetroIndicatorData(metroName, indicatorId) → {currentValue, targetValue, history}`.
  - **시군구 = 합성(해시 ±10%)** → Phase 1 매트릭스에 사용 금지.
  - `direction: 'higher_better' | 'lower_better'`.
- KOSIS: `public/data/sdg-sido.json` = `{goals: {8:{bySido}, 9:{bySido}}}` (16시도 약칭 키).
- 진학률: `src/lib/data/admission-rate.ts` `ADMISSION_SIDO[] = {sido, latest}`.
- 재정: `src/lib/data/fiscal-health-data.ts` `getMetroFiscalData()` (17 광역시도, 인구·예산·자립도·자주도·채무).
- 기존: `src/lib/sdg/goals.ts`(17 SDG_GOALS, SIDO_FULL_TO_SHORT), `src/components/sdg/SDGMapDashboard.tsx`(choropleth+순위), `data/geo/korea-provinces-topo.json`(17 시도).
- jest config: `@/`→`src/`, node env. 실행: `npx jest <path>`.

### 16 광역 약칭 (정규화 후 캐논)
`서울 부산 대구 인천 대전 울산 세종 경기 강원 충북 충남 전북 광주전남 경북 경남 제주`
(원시 '광주' + '전남' → '광주전남' 병합)

### 지표 → SDG 목표 매핑 (INDICATOR_TO_GOAL, 확정)
| Goal | 지표 id (local-sdg-data) | 추가 출처 |
|------|--------------------------|-----------|
| 1 빈곤 | `wel_basic`, `wel_budget` | |
| 3 건강 | `hlt_life`, `hlt_doctor`, `hlt_suicide`, `hlt_obesity` | |
| 4 교육 | `edu_student`, `edu_private`, `edu_univ` | 진학률(admission) |
| 5 성평등 | `emp_female` | |
| 8 일자리 | `emp_rate`, `emp_unemp`, `emp_youth` | KOSIS 고용률(8) |
| 9 인프라 | `trn_road` | KOSIS GRDP(9) |
| 10 불평등 | `wel_pension`, `wel_elderly` | |
| 11 도시 | `hou_supply`, `hou_area`, `hou_pir`, `hou_rental`, `env_park`, `trn_public`, `cul_facility`, `cul_sports` | |
| 13 기후 | `env_pm25`, `env_recycle`, `env_sewage` | |
| 16 제도 | `saf_crime`, `saf_traffic`, `saf_fire` | |
| (미매핑→준비중) | 2,6,7,12,14,15,17 | |
| (재정/인구=맥락, 목표 아님) | `fin_*`, `dem_*` | 재정 패널 |

---

## 파일 구조

| 파일 | 책임 | 신규/수정 |
|------|------|-----------|
| `src/lib/sdg/goals.ts` | SDG_GOALS에 `domain` 추가, 광주전남 통합 키 | 수정 |
| `src/lib/sdg/region-normalize.ts` | 원시 시도값[] → 16 광역 병합(인구가중/합산) | 신규 |
| `src/lib/sdg/indicator-map.ts` | INDICATOR_TO_GOAL + min-max 정규화 + goal별 16광역 셀값 | 신규 |
| `src/lib/sdg/matrix.ts` | 16×17 매트릭스(cell=score\|null) 빌드 | 신규 |
| `src/lib/sdg/__tests__/region-normalize.test.ts` | TDD | 신규 |
| `src/lib/sdg/__tests__/indicator-map.test.ts` | TDD | 신규 |
| `src/lib/sdg/__tests__/matrix.test.ts` | TDD | 신규 |
| `src/components/sdg/SDGBoardMatrix.tsx` | 허브 히트맵(16×17) | 신규 |
| `src/components/sdg/SDGRegionProfile.tsx` | 지역 프로파일 + 재정 패널 | 신규 |
| `src/components/sdg/SDGBoard.tsx` | 상황판 컨테이너(매트릭스+프로파일+목표상세 상태) | 신규 |
| `src/app/sdg/page.tsx` | SDGBoard에 geo/kosis/matrix prop 주입 | 수정 |

---

## Task 1: goals.ts — 5대 영역 분류 (SIDO_FULL_TO_SHORT는 손대지 않음)

**중요:** 광주+전남 → '광주전남' 병합은 **region-normalize(Task 2) 한 곳에서만** 수행한다. `SIDO_FULL_TO_SHORT`는 원시 17 약칭('광주','전남' 분리)을 그대로 유지해야 한다 — 그래야 board-data가 광주·전남을 분리 키로 모은 뒤 `mergeToCanon16`로 병합할 수 있다. SIDO를 미리 병합하면 키 충돌로 병합이 깨진다.

**Files:**
- Modify: `src/lib/sdg/goals.ts` (domain 추가만)
- Test: `src/lib/sdg/__tests__/goals.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/sdg/__tests__/goals.test.ts`:
```ts
import { SDG_GOALS, SDG_DOMAINS_5, SIDO_FULL_TO_SHORT } from '@/lib/sdg/goals';

describe('goals domain classification', () => {
  it('17개 목표 모두 5대 영역 중 하나에 속한다', () => {
    const valid = new Set(['people', 'planet', 'prosperity', 'peace', 'partnership']);
    expect(SDG_GOALS).toHaveLength(17);
    for (const g of SDG_GOALS) expect(valid.has(g.domain)).toBe(true);
  });
  it('5대 영역이 17목표를 빠짐없이 분할한다', () => {
    const counts: Record<string, number> = {};
    for (const g of SDG_GOALS) counts[g.domain] = (counts[g.domain] ?? 0) + 1;
    expect(counts).toEqual({ people: 5, planet: 5, prosperity: 5, peace: 1, partnership: 1 });
  });
  it('SIDO_FULL_TO_SHORT는 광주·전남을 분리 유지한다(병합은 region-normalize 담당)', () => {
    expect(SIDO_FULL_TO_SHORT['광주광역시']).toBe('광주');
    expect(SIDO_FULL_TO_SHORT['전라남도']).toBe('전남');
    expect(SIDO_FULL_TO_SHORT['서울특별시']).toBe('서울');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/sdg/__tests__/goals.test.ts`
Expected: FAIL (`SDG_DOMAINS_5` / `domain` 없음)

- [ ] **Step 3: Implement**

In `src/lib/sdg/goals.ts`:
- Add to `SDGGoal` interface: `domain: 'people' | 'planet' | 'prosperity' | 'peace' | 'partnership';`
- Add `domain` to each of the 17 `SDG_GOALS` entries per this map:
  - people: 1,2,3,4,5 · planet: 6,12,13,14,15 · prosperity: 7,8,9,10,11 · peace: 16 · partnership: 17
- Add export:
```ts
export const SDG_DOMAINS_5 = [
  { id: 'people', label: '인간', en: 'People', goals: [1, 2, 3, 4, 5] },
  { id: 'planet', label: '지구', en: 'Planet', goals: [6, 12, 13, 14, 15] },
  { id: 'prosperity', label: '번영', en: 'Prosperity', goals: [7, 8, 9, 10, 11] },
  { id: 'peace', label: '평화', en: 'Peace', goals: [16] },
  { id: 'partnership', label: '파트너십', en: 'Partnership', goals: [17] },
] as const;
```
- **`SIDO_FULL_TO_SHORT`는 변경하지 않는다** (광주광역시→'광주', 전라남도→'전남' 유지).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/sdg/__tests__/goals.test.ts`
Expected: PASS

- [ ] **Step 5: Verify existing SDGMapDashboard still typechecks**

Run: `npx tsc --noEmit`
Expected: EXIT 0 (note: SDGMapDashboard 사용처는 `g.domain` 미사용이라 영향 없음)

- [ ] **Step 6: Commit**

```bash
git add src/lib/sdg/goals.ts src/lib/sdg/__tests__/goals.test.ts
git commit -m "feat(sdg): 5대 영역 분류 + 광주전남 통합 약칭"
```

---

## Task 2: region-normalize.ts — 17 시도 → 16 광역 병합

**Files:**
- Create: `src/lib/sdg/region-normalize.ts`
- Test: `src/lib/sdg/__tests__/region-normalize.test.ts`

병합 규칙: 비율(`ratio`)=인구 가중 평균, 절대(`sum`)=합산. 광주+전남만 병합, 나머지 14개는 그대로.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sdg/__tests__/region-normalize.test.ts`:
```ts
import { CANON_16, mergeToCanon16 } from '@/lib/sdg/region-normalize';

describe('region-normalize', () => {
  it('16개 캐논 광역을 노출한다', () => {
    expect(CANON_16).toHaveLength(16);
    expect(CANON_16).toContain('광주전남');
    expect(CANON_16).not.toContain('광주');
    expect(CANON_16).not.toContain('전남');
  });

  it('ratio 지표는 인구 가중 평균으로 광주+전남을 병합한다', () => {
    const raw = { 광주: 60, 전남: 40 };
    const pop = { 광주: 100, 전남: 300 };
    const out = mergeToCanon16(raw, 'ratio', pop);
    // (60*100 + 40*300) / (100+300) = 18000/400 = 45
    expect(out['광주전남']).toBe(45);
  });

  it('sum 지표는 광주+전남을 합산한다', () => {
    const raw = { 광주: 100, 전남: 250 };
    const out = mergeToCanon16(raw, 'sum');
    expect(out['광주전남']).toBe(350);
  });

  it('병합 대상이 아닌 시도는 그대로 통과한다', () => {
    const raw = { 서울: 70, 경기: 65 };
    const out = mergeToCanon16(raw, 'ratio', { 서울: 1, 경기: 1 });
    expect(out['서울']).toBe(70);
    expect(out['경기']).toBe(65);
  });

  it('한쪽 값만 있으면 그 값을 사용한다', () => {
    expect(mergeToCanon16({ 광주: 50 }, 'ratio', { 광주: 100 })['광주전남']).toBe(50);
    expect(mergeToCanon16({ 전남: 30 }, 'sum')['광주전남']).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/sdg/__tests__/region-normalize.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

Create `src/lib/sdg/region-normalize.ts`:
```ts
// 17 원시 시도 → 16 광역 병합 (광주광역시 + 전라남도 → 광주전남특별시)
// 비율 지표(ratio)는 인구 가중 평균, 절대 지표(sum)는 합산.

export const CANON_16 = [
  '서울', '부산', '대구', '인천', '대전', '울산', '세종', '경기',
  '강원', '충북', '충남', '전북', '광주전남', '경북', '경남', '제주',
] as const;

export type MergeKind = 'ratio' | 'sum';
const MERGED = { from: ['광주', '전남'] as const, to: '광주전남' };

/**
 * 원시 시도 약칭→값 맵을 16 캐논 광역으로 병합.
 * @param values 시도 약칭(예: '광주','전남','서울')→값
 * @param kind   'ratio'=인구가중평균, 'sum'=합산
 * @param pop    ratio일 때 시도 약칭→인구(가중치). 미제공 시 단순평균.
 */
export function mergeToCanon16(
  values: Record<string, number>,
  kind: MergeKind,
  pop?: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  // 병합 비대상 그대로 통과
  for (const [k, v] of Object.entries(values)) {
    if (k === '광주' || k === '전남') continue;
    out[k] = v;
  }
  // 광주+전남 병합
  const parts = MERGED.from.filter((k) => values[k] != null);
  if (parts.length === 1) {
    out[MERGED.to] = values[parts[0]];
  } else if (parts.length === 2) {
    if (kind === 'sum') {
      out[MERGED.to] = values['광주'] + values['전남'];
    } else {
      const w1 = pop?.['광주'] ?? 1;
      const w2 = pop?.['전남'] ?? 1;
      out[MERGED.to] = (values['광주'] * w1 + values['전남'] * w2) / (w1 + w2);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/sdg/__tests__/region-normalize.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sdg/region-normalize.ts src/lib/sdg/__tests__/region-normalize.test.ts
git commit -m "feat(sdg): 16광역 병합 로직(region-normalize) — 광주전남 인구가중/합산"
```

---

## Task 3: indicator-map.ts — 지표→목표 매핑 + min-max 정규화

**Files:**
- Create: `src/lib/sdg/indicator-map.ts`
- Test: `src/lib/sdg/__tests__/indicator-map.test.ts`

핵심 함수:
- `normalizeMinMax(values, direction)` — 0~100, `lower_better`면 반전. 분포가 한 값뿐이면 모두 50.
- `INDICATOR_TO_GOAL` — 위 매핑 테이블(지표 id → goalNum).

- [ ] **Step 1: Write the failing test**

Create `src/lib/sdg/__tests__/indicator-map.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/sdg/__tests__/indicator-map.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

Create `src/lib/sdg/indicator-map.ts`:
```ts
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

/** 지표 id → SDG 목표 번호 (재정/인구는 맥락이라 제외) */
export const INDICATOR_TO_GOAL: Record<string, number> = {
  // Goal 1 빈곤
  wel_basic: 1, wel_budget: 1,
  // Goal 3 건강
  hlt_life: 3, hlt_doctor: 3, hlt_suicide: 3, hlt_obesity: 3,
  // Goal 4 교육
  edu_student: 4, edu_private: 4, edu_univ: 4,
  // Goal 5 성평등
  emp_female: 5,
  // Goal 8 일자리
  emp_rate: 8, emp_unemp: 8, emp_youth: 8,
  // Goal 9 인프라
  trn_road: 9,
  // Goal 10 불평등
  wel_pension: 10, wel_elderly: 10,
  // Goal 11 도시
  hou_supply: 11, hou_area: 11, hou_pir: 11, hou_rental: 11,
  env_park: 11, trn_public: 11, cul_facility: 11, cul_sports: 11,
  // Goal 13 기후
  env_pm25: 13, env_recycle: 13, env_sewage: 13,
  // Goal 16 제도
  saf_crime: 16, saf_traffic: 16, saf_fire: 16,
};

/** 16광역 분포에서 0~100 정규화. lower_better면 반전. 단일값이면 50. */
export function normalizeMinMax(
  values: Record<string, number>,
  direction: IndicatorDirection,
): Record<string, number> {
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(values)) {
    if (max === min) { out[k] = 50; continue; }
    let t = ((v - min) / (max - min)) * 100;
    if (direction === 'lower_better') t = 100 - t;
    out[k] = Math.round(t);
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/sdg/__tests__/indicator-map.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/sdg/indicator-map.ts src/lib/sdg/__tests__/indicator-map.test.ts
git commit -m "feat(sdg): 지표→목표 매핑 + min-max 정규화"
```

---

## Task 4: matrix.ts — 16×17 매트릭스 빌드

**Files:**
- Create: `src/lib/sdg/matrix.ts`
- Test: `src/lib/sdg/__tests__/matrix.test.ts`

`buildMatrix()`는 실데이터를 모아 `{ [metro]: { [goalNum]: number|null } }`를 만든다. goal에 매핑된 지표들의 정규화 점수를 광역별로 평균. 매핑 지표가 없는 목표는 모든 셀 `null`.

데이터 소스 주입은 순수성을 위해 **인자로 받는다**(테스트 용이):
- `metroValues(indicatorId) → Record<canon16, number>` (이미 16광역으로 병합된 실값)
- 셀 = 해당 goal의 지표별 `normalizeMinMax` 후 광역별 평균(반올림). 지표 0개면 null.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sdg/__tests__/matrix.test.ts`:
```ts
import { buildMatrix } from '@/lib/sdg/matrix';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

const dir: Record<string, IndicatorDirection> = {
  emp_rate: 'higher_better', emp_unemp: 'lower_better', wel_basic: 'lower_better',
};
// 3개 광역만으로 단순화
const values: Record<string, Record<string, number>> = {
  emp_rate: { 서울: 60, 부산: 50, 경기: 70 },
  emp_unemp: { 서울: 3, 부산: 5, 경기: 2 },
  wel_basic: { 서울: 2, 부산: 4, 경기: 1 },
};

describe('buildMatrix', () => {
  const m = buildMatrix({
    metros: ['서울', '부산', '경기'],
    indicatorToGoal: { emp_rate: 8, emp_unemp: 8, wel_basic: 1 },
    direction: dir,
    valuesByIndicator: values,
  });

  it('goal 8 = emp_rate·emp_unemp 정규화 평균', () => {
    // emp_rate higher: 서울50 부산0 경기100 / emp_unemp lower: 서울50 부산0 경기100
    // 평균: 서울50 부산0 경기100
    expect(m['경기'][8]).toBe(100);
    expect(m['부산'][8]).toBe(0);
    expect(m['서울'][8]).toBe(50);
  });
  it('데이터 없는 목표는 null', () => {
    expect(m['서울'][2]).toBeNull();
    expect(m['서울'][17]).toBeNull();
  });
  it('모든 16(여기선 3) 광역 × 17목표 키가 존재한다', () => {
    for (const metro of ['서울', '부산', '경기']) {
      for (let g = 1; g <= 17; g++) expect(g in m[metro]).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/sdg/__tests__/matrix.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

Create `src/lib/sdg/matrix.ts`:
```ts
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { normalizeMinMax } from './indicator-map';

export interface BuildMatrixArgs {
  metros: readonly string[];
  indicatorToGoal: Record<string, number>;
  direction: Record<string, IndicatorDirection>;
  valuesByIndicator: Record<string, Record<string, number>>; // 이미 광역 병합된 실값
}

export type MatrixCell = number | null;
export type Matrix = Record<string, Record<number, MatrixCell>>;

export function buildMatrix(args: BuildMatrixArgs): Matrix {
  const { metros, indicatorToGoal, direction, valuesByIndicator } = args;
  // goal → 지표 id[]
  const goalIndicators: Record<number, string[]> = {};
  for (const [ind, goal] of Object.entries(indicatorToGoal)) {
    (goalIndicators[goal] ??= []).push(ind);
  }
  // 지표별 정규화 결과 캐시
  const norm: Record<string, Record<string, number>> = {};
  for (const ind of Object.keys(indicatorToGoal)) {
    const vals = valuesByIndicator[ind];
    if (vals && Object.keys(vals).length) {
      norm[ind] = normalizeMinMax(vals, direction[ind]);
    }
  }
  const matrix: Matrix = {};
  for (const metro of metros) {
    matrix[metro] = {};
    for (let goal = 1; goal <= 17; goal++) {
      const inds = (goalIndicators[goal] ?? []).filter((i) => norm[i]?.[metro] != null);
      if (inds.length === 0) { matrix[metro][goal] = null; continue; }
      const avg = inds.reduce((s, i) => s + norm[i][metro], 0) / inds.length;
      matrix[metro][goal] = Math.round(avg);
    }
  }
  return matrix;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/sdg/__tests__/matrix.test.ts`
Expected: PASS

- [ ] **Step 5: Run all sdg logic tests together**

Run: `npx jest src/lib/sdg`
Expected: PASS (goals, region-normalize, indicator-map, matrix)

- [ ] **Step 6: Commit**

```bash
git add src/lib/sdg/matrix.ts src/lib/sdg/__tests__/matrix.test.ts
git commit -m "feat(sdg): 16x17 매트릭스 빌더(실데이터 정규화 평균, 공백=null)"
```

---

## Task 5: 데이터 어셈블러 — 실데이터 → valuesByIndicator (서버측)

**Files:**
- Create: `src/lib/sdg/board-data.ts`
- Test: `src/lib/sdg/__tests__/board-data.test.ts`

local-sdg-data(광역 실값) + KOSIS + 진학률을 모아 `valuesByIndicator`(16광역 병합)와 direction 맵, 재정 맥락 데이터를 만든다. **서버 컴포넌트에서 호출**(fs/정적 import). 비율 지표라 ratio 병합(인구 가중) 사용.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sdg/__tests__/board-data.test.ts`:
```ts
import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { CANON_16 } from '@/lib/sdg/region-normalize';

describe('assembleIndicatorValues', () => {
  const { valuesByIndicator, direction } = assembleIndicatorValues();

  it('매핑된 지표마다 16광역(또는 그 부분집합) 값이 광주전남 통합 키를 쓴다', () => {
    const empRate = valuesByIndicator['emp_rate'];
    expect(empRate).toBeDefined();
    // 광주/전남 분리 키가 없어야 함
    expect(empRate['광주']).toBeUndefined();
    expect(empRate['전남']).toBeUndefined();
    // 키는 CANON_16 부분집합
    for (const k of Object.keys(empRate)) expect(CANON_16).toContain(k as never);
  });

  it('direction 맵이 채워진다', () => {
    expect(direction['emp_rate']).toBe('higher_better');
    expect(direction['saf_crime']).toBe('lower_better');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/sdg/__tests__/board-data.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

Create `src/lib/sdg/board-data.ts`:
```ts
import {
  SDG_DOMAINS,
  getMetroIndicatorData,
  type IndicatorDirection,
} from '@/lib/data/local-sdg-data';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { INDICATOR_TO_GOAL } from './indicator-map';
import { mergeToCanon16 } from './region-normalize';
import { SIDO_FULL_TO_SHORT } from './goals';

// 원시 17 시도 약칭 목록 (local-sdg-data의 metroName은 정식/약칭? → 매핑 필요)
// local-sdg-data getMetroIndicatorData는 metroName(정식 시도명) 기준.
// 정식명 목록은 fiscal-health-data getMetroFiscalData()에서 가져온다.

export interface BoardData {
  valuesByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
  population: Record<string, number>; // 원시 시도 약칭→인구 (ratio 가중치)
}

export function assembleIndicatorValues(): BoardData {
  const fiscal = getMetroFiscalData(); // [{name(정식 또는 약칭), population, ...}]
  // 정식명→약칭 (SIDO_FULL_TO_SHORT). fiscal name이 이미 약칭이면 그대로.
  const toShort = (name: string) => SIDO_FULL_TO_SHORT[name] ?? name;

  // direction 맵 (SDG_DOMAINS에서 추출)
  const direction: Record<string, IndicatorDirection> = {};
  for (const d of SDG_DOMAINS) for (const ind of d.indicators) direction[ind.id] = ind.direction;

  // 원시 시도 약칭→인구 (ratio 병합 가중치)
  const population: Record<string, number> = {};
  for (const m of fiscal) population[toShort(m.name)] = m.population;

  // 매핑된 각 지표에 대해 원시 시도값 수집 → 16광역 병합(ratio)
  const valuesByIndicator: Record<string, Record<string, number>> = {};
  for (const indId of Object.keys(INDICATOR_TO_GOAL)) {
    const raw: Record<string, number> = {};
    for (const m of fiscal) {
      const d = getMetroIndicatorData(m.name, indId);
      if (d && Number.isFinite(d.currentValue)) raw[toShort(m.name)] = d.currentValue;
    }
    if (Object.keys(raw).length) {
      valuesByIndicator[indId] = mergeToCanon16(raw, 'ratio', population);
    }
  }
  return { valuesByIndicator, direction, population };
}
```

> ⚠️ **실행 중 확인사항(구현자 메모):** `getMetroFiscalData()` 항목의 `name`이 정식명('서울특별시')인지 약칭('서울')인지, `getMetroIndicatorData(metroName, ...)`가 기대하는 키 형식을 코드에서 확인하고 `toShort`/호출 인자를 맞춘다. 테스트가 `emp_rate` 값 존재를 검증하므로 키 불일치 시 빈 객체가 되어 FAIL → 즉시 드러난다.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/sdg/__tests__/board-data.test.ts`
Expected: PASS. (FAIL이면 위 메모대로 name 키 형식 정렬 후 재실행)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sdg/board-data.ts src/lib/sdg/__tests__/board-data.test.ts
git commit -m "feat(sdg): 실데이터 어셈블러(local-sdg-data 광역 실값→16광역 병합)"
```

---

## Task 6: SDGBoardMatrix.tsx — 허브 히트맵 (16×17)

**Files:**
- Create: `src/components/sdg/SDGBoardMatrix.tsx`

검증: jsdom 미설정이라 jest 대신 `tsc`+`build`+브라우저 프리뷰. 컴포넌트는 순수 prop 렌더.

- [ ] **Step 1: Implement component**

Create `src/components/sdg/SDGBoardMatrix.tsx`:
```tsx
'use client';
import { SDG_GOALS, SDG_DOMAINS_5 } from '@/lib/sdg/goals';
import type { Matrix } from '@/lib/sdg/matrix';

function cellColor(v: number | null, color: string): string {
  if (v == null) return 'transparent';
  // 0~100 → 투명도 0.15~1.0
  const a = 0.15 + (v / 100) * 0.85;
  const h = color.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a.toFixed(2)})`;
}

export function SDGBoardMatrix({
  matrix, metros, onSelectRegion, onSelectGoal, selectedRegion, selectedGoal,
}: {
  matrix: Matrix;
  metros: readonly string[];
  onSelectRegion: (m: string) => void;
  onSelectGoal: (g: number) => void;
  selectedRegion: string | null;
  selectedGoal: number | null;
}) {
  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-900/30">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-950 px-2 py-1 text-left text-gray-400">지역＼목표</th>
            {SDG_GOALS.map((g) => (
              <th key={g.num}
                  onClick={() => onSelectGoal(g.num)}
                  title={`SDG ${g.num} ${g.name}`}
                  className={`px-1 py-1 cursor-pointer hover:brightness-125 ${selectedGoal === g.num ? 'ring-2 ring-white' : ''}`}
                  style={{ background: g.color }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/sdg/sdg-${g.num}-pic.svg?v=12`} alt={g.name} className="w-6 h-6 mx-auto" />
                <div className="text-white text-[9px] mt-0.5">{g.num}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metros.map((m) => (
            <tr key={m}>
              <td onClick={() => onSelectRegion(m)}
                  className={`sticky left-0 z-10 bg-gray-950 px-2 py-1 cursor-pointer whitespace-nowrap font-semibold ${selectedRegion === m ? 'text-white' : 'text-gray-300'} hover:text-white`}>
                {m}
              </td>
              {SDG_GOALS.map((g) => {
                const v = matrix[m]?.[g.num] ?? null;
                return (
                  <td key={g.num}
                      onClick={() => onSelectRegion(m)}
                      title={v == null ? `${m} · ${g.name}: 데이터 준비중` : `${m} · ${g.name}: ${v}/100`}
                      className="w-7 h-7 text-center border border-gray-900/50 cursor-pointer"
                      style={{ background: cellColor(v, g.color) }}>
                    {v == null
                      ? <span className="text-gray-700 text-[9px]">·</span>
                      : <span className="text-[9px] font-mono text-white/90">{v}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 px-3 py-2 text-[11px] text-gray-500 border-t border-gray-800">
        {SDG_DOMAINS_5.map((d) => (
          <span key={d.id}>{d.label}({d.en}): {d.goals.join('·')}</span>
        ))}
        <span className="ml-auto">셀 = 대표지표 정규화(0~100) · ' · '=데이터 준비중</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 3: Commit**

```bash
git add src/components/sdg/SDGBoardMatrix.tsx
git commit -m "feat(sdg): 허브 히트맵 매트릭스 컴포넌트(16x17)"
```

---

## Task 7: SDGRegionProfile.tsx — 지역 프로파일 + 재정 맥락 패널

**Files:**
- Create: `src/components/sdg/SDGRegionProfile.tsx`

선택 지역의 17목표 미니 게이지 + 재정 맥락(재정자립도·자주도·1인당세출·채무·예산규모) + 강점/약점 Top3. 재정값은 `getMetroFiscalData()`를 16광역 병합 없이 **광주전남은 합산/가중**해 전달받는다(상위에서 준비). Phase 1에서는 재정은 원시 광역 매칭이 단순치 않으므로 **선택 지역이 '광주전남'이면 광주+전남 재정 합산/가중 표시**.

- [ ] **Step 1: Implement component**

Create `src/components/sdg/SDGRegionProfile.tsx`:
```tsx
'use client';
import { SDG_GOALS } from '@/lib/sdg/goals';
import type { Matrix } from '@/lib/sdg/matrix';

export interface FiscalContext {
  independence: number; // 재정자립도 %
  autonomy: number;     // 재정자주도 %
  debtRatio: number;    // 채무비율 %
  budget: number;       // 예산규모(억원)
  population: number;
}

export function SDGRegionProfile({
  region, matrix, fiscal, onSelectGoal,
}: {
  region: string;
  matrix: Matrix;
  fiscal: FiscalContext | null;
  onSelectGoal: (g: number) => void;
}) {
  const row = matrix[region] ?? {};
  const scored = SDG_GOALS
    .map((g) => ({ g, v: row[g.num] }))
    .filter((x): x is { g: typeof SDG_GOALS[number]; v: number } => x.v != null);
  const top = [...scored].sort((a, b) => b.v - a.v).slice(0, 3);
  const bottom = [...scored].sort((a, b) => a.v - b.v).slice(0, 3);

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-100">{region} <span className="text-sm text-gray-500">지역 프로파일</span></h3>

      {/* 재정 맥락 패널 */}
      {fiscal && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800/50 rounded p-2"><span className="text-gray-400">재정자립도</span><div className="font-mono text-gray-100">{fiscal.independence}%</div></div>
          <div className="bg-gray-800/50 rounded p-2"><span className="text-gray-400">재정자주도</span><div className="font-mono text-gray-100">{fiscal.autonomy}%</div></div>
          <div className="bg-gray-800/50 rounded p-2"><span className="text-gray-400">채무비율</span><div className="font-mono text-gray-100">{fiscal.debtRatio}%</div></div>
          <div className="bg-gray-800/50 rounded p-2"><span className="text-gray-400">예산규모</span><div className="font-mono text-gray-100">{fiscal.budget.toLocaleString()}억</div></div>
        </div>
      )}

      {/* 17목표 미니 게이지 */}
      <div className="grid grid-cols-2 gap-1.5">
        {SDG_GOALS.map((g) => {
          const v = row[g.num];
          return (
            <button key={g.num} onClick={() => onSelectGoal(g.num)}
              className="flex items-center gap-2 text-left hover:bg-gray-800/40 rounded px-1 py-0.5">
              <span className="w-5 text-[11px] font-mono text-gray-500">{g.num}</span>
              <span className="w-16 text-[11px] text-gray-300 truncate">{g.name}</span>
              <span className="flex-1 h-2 rounded bg-gray-800 overflow-hidden">
                {v != null && <span className="block h-full" style={{ width: `${v}%`, background: g.color }} />}
              </span>
              <span className="w-8 text-right text-[11px] font-mono text-gray-400">{v ?? '–'}</span>
            </button>
          );
        })}
      </div>

      {/* 강점/약점 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-emerald-400 font-semibold mb-1">강점 Top3</div>
          {top.map((x) => <div key={x.g.num} className="text-gray-300">{x.g.name} <span className="font-mono text-gray-500">{x.v}</span></div>)}
        </div>
        <div>
          <div className="text-rose-400 font-semibold mb-1">약점 Top3</div>
          {bottom.map((x) => <div key={x.g.num} className="text-gray-300">{x.g.name} <span className="font-mono text-gray-500">{x.v}</span></div>)}
        </div>
      </div>

      <p className="text-[11px] text-gray-600 border-t border-gray-800 pt-2">
        점수 = 16광역 분포 대비 대표지표 정규화값(0~100). 종합 SDG 달성도와 다를 수 있으며, 지역 여건 차이를 고려해 해석하세요.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: EXIT 0

- [ ] **Step 3: Commit**

```bash
git add src/components/sdg/SDGRegionProfile.tsx
git commit -m "feat(sdg): 지역 프로파일 + 재정 맥락 패널 컴포넌트"
```

---

## Task 8: SDGBoard.tsx 컨테이너 + page.tsx 통합 + 검증/배포

**Files:**
- Create: `src/components/sdg/SDGBoard.tsx`
- Modify: `src/app/sdg/page.tsx`

컨테이너는 선택 상태(region/goal)를 관리하고, 열 클릭 시 기존 `SDGMapDashboard`(choropleth)를 목표상세로 재사용한다.

- [ ] **Step 1: Implement SDGBoard container**

Create `src/components/sdg/SDGBoard.tsx`:
```tsx
'use client';
import { useState } from 'react';
import { SDGBoardMatrix } from './SDGBoardMatrix';
import { SDGRegionProfile, type FiscalContext } from './SDGRegionProfile';
import { SDGMapDashboard } from './SDGMapDashboard';
import type { Matrix } from '@/lib/sdg/matrix';
import type { SDGIndicator } from '@/lib/sdg/goals';

interface KosisData { goals: Record<string, SDGIndicator> }

export function SDGBoard({
  matrix, metros, fiscalByRegion, geoData, kosis,
}: {
  matrix: Matrix;
  metros: readonly string[];
  fiscalByRegion: Record<string, FiscalContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoData: any;
  kosis: KosisData;
}) {
  const [region, setRegion] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-50">SDG 지역 상황판</h2>
        <p className="text-sm text-gray-400 mt-1">16개 광역 × 17개 SDG 목표. 행(지역) 클릭 → 프로파일, 열(목표) 클릭 → 전국 비교.</p>
      </div>

      <SDGBoardMatrix
        matrix={matrix} metros={metros}
        selectedRegion={region} selectedGoal={goal}
        onSelectRegion={(m) => { setRegion(m); }}
        onSelectGoal={(g) => { setGoal(g); }}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {region
          ? <SDGRegionProfile region={region} matrix={matrix} fiscal={fiscalByRegion[region] ?? null} onSelectGoal={setGoal} />
          : <div className="border border-gray-800 rounded-lg bg-gray-900/20 p-8 text-center text-gray-500 text-sm">행(지역)을 클릭하면 프로파일이 표시됩니다.</div>}
        {goal
          ? <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-2"><SDGMapDashboard geoData={geoData} kosis={kosis} /></div>
          : <div className="border border-gray-800 rounded-lg bg-gray-900/20 p-8 text-center text-gray-500 text-sm">열(목표)을 클릭하면 전국 지도가 표시됩니다.</div>}
      </div>
    </div>
  );
}
```

> 참고: 기존 `SDGMapDashboard`는 자체 goal 선택 그리드를 가짐 — Phase 1에서는 목표상세 칸에 그대로 재사용(중복 허용). Phase 2에서 `SDGGoalDetail`로 대체.

- [ ] **Step 2: Wire page.tsx**

Modify `src/app/sdg/page.tsx` — `loadGeo()`/`loadKosis()` 유지하고, 매트릭스·재정을 서버측에서 빌드해 주입:
```tsx
import { SDGBoard } from '@/components/sdg/SDGBoard';
import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { buildMatrix } from '@/lib/sdg/matrix';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { CANON_16, mergeToCanon16 } from '@/lib/sdg/region-normalize';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { SIDO_FULL_TO_SHORT } from '@/lib/sdg/goals';
import type { FiscalContext } from '@/components/sdg/SDGRegionProfile';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'SDG 지역 상황판 (16광역×17목표) | 마을살림/나라살림',
  description: '16개 광역 × 17개 SDG 목표 매트릭스 상황판. 실데이터 대표지표 정규화, 출처 명시.',
};

function loadKosis() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'sdg-sido.json'), 'utf-8')); }
  catch { return { goals: {} }; }
}
function loadGeo() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'geo', 'korea-provinces-topo.json'), 'utf-8')); }
  catch { return null; }
}

function buildFiscalByRegion(): Record<string, FiscalContext> {
  const fiscal = getMetroFiscalData();
  const toShort = (n: string) => SIDO_FULL_TO_SHORT[n] ?? n;
  // 각 재정 필드를 16광역으로 병합 (비율=인구가중, 예산·인구=합산)
  const ind: Record<string, number> = {}, aut: Record<string, number> = {},
        debt: Record<string, number> = {}, bud: Record<string, number> = {}, pop: Record<string, number> = {};
  for (const m of fiscal) { const s = toShort(m.name);
    ind[s] = m.independence; aut[s] = m.autonomy; debt[s] = m.debtRatio ?? 0; bud[s] = m.budget; pop[s] = m.population; }
  const mInd = mergeToCanon16(ind, 'ratio', pop), mAut = mergeToCanon16(aut, 'ratio', pop),
        mDebt = mergeToCanon16(debt, 'ratio', pop), mBud = mergeToCanon16(bud, 'sum'), mPop = mergeToCanon16(pop, 'sum');
  const out: Record<string, FiscalContext> = {};
  for (const r of CANON_16) out[r] = {
    independence: Math.round((mInd[r] ?? 0) * 10) / 10, autonomy: Math.round((mAut[r] ?? 0) * 10) / 10,
    debtRatio: Math.round((mDebt[r] ?? 0) * 10) / 10, budget: Math.round(mBud[r] ?? 0), population: Math.round(mPop[r] ?? 0),
  };
  return out;
}

export default function SDGPage() {
  const geoData = loadGeo();
  const kosis = loadKosis();
  const { valuesByIndicator, direction } = assembleIndicatorValues();
  const matrix = buildMatrix({ metros: CANON_16, indicatorToGoal: INDICATOR_TO_GOAL, direction, valuesByIndicator });
  const fiscalByRegion = buildFiscalByRegion();
  return (
    <div className="w-full max-w-6xl mx-auto">
      <SDGBoard matrix={matrix} metros={CANON_16} fiscalByRegion={fiscalByRegion} geoData={geoData} kosis={kosis} />
    </div>
  );
}
```

> ⚠️ 구현자 메모: `getMetroFiscalData()` 항목에 `debtRatio` 필드명이 다를 수 있다(`debt`, `debtRatio`, `localDebt` 등). `fiscal-health-data.ts`의 `MetroFiscalData` 타입을 열어 정확한 필드명으로 맞춘다. 없으면 채무/예산에서 계산.

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npx next build`
Expected: tsc EXIT 0, build 성공

- [ ] **Step 4: 브라우저 프리뷰 검증**

- `preview_start` → `/sdg` 이동.
- `preview_screenshot`로 확인: 16행×17열 매트릭스 표시, 실데이터 목표(1·3·4·5·8·9·10·11·13·16) 셀 색칠 + 점수, 나머지(2·6·7·12·14·15·17) ' · ' 빈셀.
- 행(예: 서울) 클릭 → 좌측 프로파일 + 재정 패널.
- 열(예: 4 교육) 클릭 → 우측 choropleth.
- `preview_console_logs`(error)로 런타임 에러 0 확인.
- (스크린샷 도구 멈출 경우 `preview_eval`로 `document.querySelectorAll('table td').length > 0` 및 매트릭스 셀 수 확인.)

- [ ] **Step 5: 네비게이션 링크 확인**

`src/components/layout/Header.tsx`에 `/sdg` 링크가 이미 있으면 라벨을 'SDG 상황판'으로 갱신, 없으면 추가(기존 네비 패턴 따름). 변경 시 `tsc` 재확인.

- [ ] **Step 6: 전체 검증 + 커밋 + 배포**

```bash
npx jest src/lib/sdg
npx tsc --noEmit
npx next build
git add -A
git commit -m "feat(sdg): SDG 지역 상황판 Phase1 — 16x17 매트릭스 허브 + 지역 프로파일(재정 맥락)"
git push origin main
```
Expected: jest PASS, tsc EXIT 0, build 성공, push 완료(HEAD==origin/main).

---

## 완료 기준 (Phase 1 Definition of Done)
- [ ] `npx jest src/lib/sdg` 전부 PASS (goals·region-normalize·indicator-map·matrix·board-data)
- [ ] `npx tsc --noEmit` EXIT 0, `npx next build` 성공
- [ ] `/sdg`에 16×17 매트릭스 표시, 실데이터 10목표 색칠·점수, 7목표 정직한 빈셀
- [ ] 행 클릭→지역 프로파일+재정 패널, 열 클릭→기존 choropleth
- [ ] 광주+전남이 '광주전남' 1행으로 병합(인구가중/합산)
- [ ] 모든 셀/패널에 "대표지표 정규화·종합달성도 아님" 고지 노출
- [ ] origin/main 동기화

## 비범위(후속 Phase)
- UN 169 세부목표(targets.ts) + 목표상세 패널 → Phase 2
- 예산-성과 효율 사분면 + 규칙형 편성 코멘트 → Phase 2
- 기초 시군구 드릴다운(실데이터 수집) + KOSIS 지표 확장 + AI 코멘트 → Phase 3
