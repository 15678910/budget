// src/lib/programs/__tests__/reallocation.test.ts
import { rankPrograms, ZERO_WEIGHTS } from '../scoring';
import { reallocate, GRANT_GAP_CAP_EOK } from '../reallocation';
import { ALL_PROGRAMS } from '../index';

const ranked = () => rankPrograms(ALL_PROGRAMS.filter((p) => p.gov.code === '00'), ZERO_WEIGHTS);

describe('재배분', () => {
  it('삭감 0이면 아무것도 바뀌지 않는다', () => {
    const r = reallocate(ranked(), { bottomN: 5, cutRate: 0, split: { top: 1, grant: 0, debt: 0, reserve: 0 } });
    expect(r.freedEok).toBe(0);
    expect(r.totalAfterEok).toBe(454_000);
  });

  it('총액 불변식: 사업 합계 + 교부금 보전 + 국채 상환 + 적립 = 45.4조 (무작위 20회)', () => {
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 20; i++) {
      const a = rnd(), b = rnd(), c = rnd(), d = rnd();
      const s = a + b + c + d;
      const r = reallocate(ranked(), {
        bottomN: 1 + Math.floor(rnd() * 10),
        cutRate: rnd(),
        split: { top: a / s, grant: b / s, debt: c / s, reserve: d / s },
      });
      expect(Math.round(r.totalAfterEok + r.grantEok + r.debtEok + r.reserveEok)).toBe(454_000);
    }
  });

  it('잔여 행은 삭감 대상이 아니다', () => {
    const r = reallocate(ranked(), { bottomN: 10, cutRate: 1, split: { top: 0, grant: 0, debt: 0, reserve: 1 } });
    expect(r.cuts.some((c) => c.id.endsWith('-remainder'))).toBe(false);
  });

  it('교부금 보전은 21조를 넘지 않고 초과분은 적립으로 간다', () => {
    const r = reallocate(ranked(), { bottomN: 10, cutRate: 1, split: { top: 0, grant: 1, debt: 0, reserve: 0 } });
    expect(r.grantEok).toBeLessThanOrEqual(GRANT_GAP_CAP_EOK);
    expect(r.reserveEok).toBeCloseTo(Math.max(0, r.freedEok - GRANT_GAP_CAP_EOK), 6);
  });

  it('상위 배분은 상위 N건에 금액 비례로 간다', () => {
    const rk = ranked();
    const r = reallocate(rk, { bottomN: 3, cutRate: 0.5, split: { top: 1, grant: 0, debt: 0, reserve: 0 } });
    const tops = r.adds.map((a) => a.id);
    expect(tops.length).toBe(3);
    const ratio = r.adds.map((a) => (a.toEok - a.fromEok) / a.fromEok);
    expect(Math.max(...ratio) - Math.min(...ratio)).toBeLessThan(1e-9);
  });
});
