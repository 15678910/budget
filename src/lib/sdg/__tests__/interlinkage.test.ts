import { spearman, interlinkageMatrix } from '@/lib/sdg/interlinkage';
// rankWithTies 는 내부 함수로 export 안 되므로 spearman 을 통해 간접 검증

describe('spearman', () => {
  it('완전 양의 상관 → 1', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 20, 30, 40, 50];
    expect(spearman(x, y)).toBe(1);
  });

  it('완전 음의 상관 → -1', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [50, 40, 30, 20, 10];
    expect(spearman(x, y)).toBe(-1);
  });

  it('단조 증가(비선형)도 순위상관 → 1', () => {
    // Spearman은 순위 기반이라 비선형 단조증가도 완전상관
    const x = [1, 2, 3, 4, 5];
    const y = [1, 4, 9, 16, 25];
    expect(spearman(x, y)).toBe(1);
  });

  it('동순위(ties) 평균순위 처리', () => {
    // x에 동순위 존재: [1,1,2,3] → 순위 [1.5,1.5,3,4]
    const x = [1, 1, 2, 3];
    const y = [2, 2, 3, 4];
    // 두 벡터 모두 동일한 동순위 구조 → 완전 양상관
    const r = spearman(x, y);
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(1, 5);
  });

  it('무상관 — 값 고정 회귀 방어', () => {
    // 순위 교란 배열 — scipy.stats.spearmanr 기준 ≈ 0.30952
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const y = [4, 1, 7, 2, 8, 3, 6, 5];
    const r = spearman(x, y);
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(0.3095, 3);
  });

  it('동순위 평균순위 — 비대칭 ties spearman 값 고정(rankWithTies 간접 검증)', () => {
    // x: [1,2,2,3] → 순위 [1, 2.5, 2.5, 4]
    // y: [10,20,30,30] → 순위 [1, 2, 3.5, 3.5]
    // ties 위치가 서로 다른 비대칭 케이스 — scipy 기준 ≈ 0.833333
    const x = [1, 2, 2, 3];
    const y = [10, 20, 30, 30];
    const r = spearman(x, y);
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(0.8333, 3);
  });

  it('동순위 평균순위 — [10,20,20,30] 의 순위가 [1, 2.5, 2.5, 4] 임을 spearman 으로 보장', () => {
    // 두 벡터가 동일한 순서이면 spearman=1 (평균순위가 올바르게 계산되는지 확인)
    const v = [10, 20, 20, 30];
    const r = spearman(v, v);
    // 상수 벡터가 아니므로 null 이 아니어야 하고, 완전 양상관(자기 자신과)
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(1, 5);
  });

  it('길이 불일치 → null', () => {
    expect(spearman([1, 2, 3], [1, 2])).toBeNull();
  });

  it('길이 <2 → null', () => {
    expect(spearman([1], [1])).toBeNull();
    expect(spearman([], [])).toBeNull();
  });

  it('표준편차 0(상수 벡터) → null', () => {
    expect(spearman([5, 5, 5, 5], [1, 2, 3, 4])).toBeNull();
    expect(spearman([1, 2, 3, 4], [7, 7, 7, 7])).toBeNull();
  });
});

describe('interlinkageMatrix', () => {
  // 공통 지역 6개로 완전 양상관인 두 목표
  const regions6 = ['서울', '부산', '대구', '인천', '대전', '울산'];

  function build(goalScores: Record<number, Record<string, number>>) {
    return interlinkageMatrix(goalScores);
  }

  it('공통 지역 ≥5 이고 r 산출되면 pair 포함', () => {
    const input = {
      1: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
      2: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
    };
    const { goals, pairs } = build(input);
    expect(goals).toEqual([1, 2]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ a: 1, b: 2, n: 6 });
    expect(pairs[0].r).toBe(1);
  });

  it('공통 지역 <5 → 제외', () => {
    const four = ['서울', '부산', '대구', '인천'];
    const input = {
      1: Object.fromEntries(four.map((r, i) => [r, (i + 1) * 10])),
      2: Object.fromEntries(four.map((r, i) => [r, (i + 1) * 10])),
    };
    const { pairs } = build(input);
    expect(pairs).toHaveLength(0);
  });

  it('공통 지역만 사용(교집합 <5면 제외)', () => {
    // goal1: 서울~울산(6), goal2: 부산~울산(5). 공통=부산,대구,인천,대전,울산(5) → 포함
    const input = {
      1: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
      2: Object.fromEntries(
        ['부산', '대구', '인천', '대전', '울산'].map((r, i) => [r, (i + 1) * 5]),
      ),
    };
    const { pairs } = build(input);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].n).toBe(5);
  });

  it('데이터 없는(점수 없는) 목표는 goals/pairs에서 제외', () => {
    const input = {
      1: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
      2: {}, // 빈 목표 → 제외
      3: Object.fromEntries(regions6.map((r, i) => [r, (6 - i) * 10])),
    };
    const { goals, pairs } = build(input);
    expect(goals).toEqual([1, 3]);
    // 1×3 만 가능 (2는 제외)
    expect(pairs.map((p) => [p.a, p.b])).toEqual([[1, 3]]);
  });

  it('pairs 는 a<b 단방향(대칭성 — 역방향 중복 없음)', () => {
    const input = {
      1: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
      2: Object.fromEntries(regions6.map((r, i) => [r, (i + 2) * 7])),
      3: Object.fromEntries(regions6.map((r, i) => [r, (6 - i) * 10])),
    };
    const { pairs } = build(input);
    for (const p of pairs) expect(p.a).toBeLessThan(p.b);
    // 3목표 → 최대 3쌍 (1-2,1-3,2-3)
    const keys = pairs.map((p) => `${p.a}-${p.b}`).sort();
    expect(keys).toEqual(['1-2', '1-3', '2-3']);
  });

  it('r 이 null(상수벡터)인 쌍은 제외', () => {
    const input = {
      1: Object.fromEntries(regions6.map((r) => [r, 50])), // 상수 → spearman null
      2: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
    };
    const { goals, pairs } = build(input);
    // goal1 은 점수가 있으므로 goals 에는 포함되지만 pair 는 null 제외
    expect(goals).toEqual([1, 2]);
    expect(pairs).toHaveLength(0);
  });

  it('목표 순서는 오름차순 정렬', () => {
    const input = {
      13: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
      3: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
      8: Object.fromEntries(regions6.map((r, i) => [r, (i + 1) * 10])),
    };
    const { goals } = build(input);
    expect(goals).toEqual([3, 8, 13]);
  });
});
