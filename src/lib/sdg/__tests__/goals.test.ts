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

describe('SDG_DOMAINS_5', () => {
  it('5개 영역과 goals 분할이 정의된다', () => {
    expect(SDG_DOMAINS_5).toHaveLength(5);
    const allGoals = SDG_DOMAINS_5.flatMap((d) => d.goals).sort((a, b) => a - b);
    expect(allGoals).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });
});
