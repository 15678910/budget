// src/lib/programs/__tests__/scoring.test.ts
import { lensValues, rankPrograms, PRESETS, ZERO_WEIGHTS } from '../scoring';
import { CENTRAL_GOV } from '../gov';
import type { Program, Weights } from '../types';

const mk = (over: Partial<Program>): Program => ({
  id: over.id ?? 'p', name: 'p', gov: CENTRAL_GOV, ministry: 'm', area: 'youth', account: 'youth',
  amount26Eok: null, amount27Eok: 1000, nature: 'new', spendType: 'cash', route: 'fund',
  evidence: [], sources: ['s'], ...over,
});
const W = (o: Partial<Weights>): Weights =>
  ({ capital: 0, netNew: 0, execution: 0, route: 0, reach: 0, check: 0, ...o });

describe('렌즈 값', () => {
  it('자본축적성: equity/rnd/infra/matched-saving=1, service/grant=0.5, cash=0, unknown은 키 없음', () => {
    const ctx = { maxBeneficiaries: 1 };
    expect(lensValues(mk({ spendType: 'equity' }), ctx).capital).toBe(1);
    expect(lensValues(mk({ spendType: 'grant' }), ctx).capital).toBe(0.5);
    expect(lensValues(mk({ spendType: 'cash' }), ctx).capital).toBe(0);
    expect('capital' in lensValues(mk({ spendType: 'unknown' }), ctx)).toBe(false);
  });

  it('집행 위험: 배율 1.5 이하 1, 10 이상 0, 신규 0.5, 사이는 log 보간', () => {
    const ctx = { maxBeneficiaries: 1 };
    expect(lensValues(mk({ amount26Eok: 1000, amount27Eok: 1200, nature: 'expanded' }), ctx).execution).toBe(1);
    expect(lensValues(mk({ amount26Eok: 361, amount27Eok: 7925, nature: 'expanded' }), ctx).execution).toBe(0);
    expect(lensValues(mk({ nature: 'new' }), ctx).execution).toBe(0.5);
    const mid = lensValues(mk({ amount26Eok: 1000, amount27Eok: 3873, nature: 'expanded' }), ctx).execution!; // 배율 ≈ √(1.5·10)
    expect(mid).toBeCloseTo(0.5, 1);
  });

  it('순증: new/expanded 1, tax-converted 0.5, transferred 0', () => {
    const ctx = { maxBeneficiaries: 1 };
    expect(lensValues(mk({ nature: 'transferred', amount26Eok: 1 }), ctx).netNew).toBe(0);
    expect(lensValues(mk({ nature: 'tax-converted', amount26Eok: 1 }), ctx).netNew).toBe(0.5);
  });

  it('검산·수혜: 없으면 키 없음', () => {
    const v = lensValues(mk({}), { maxBeneficiaries: 1 });
    expect('check' in v).toBe(false);
    expect('reach' in v).toBe(false);
  });

  it('수혜 범위: 인원이 있으면 최대 대비 log 정규화, 최대와 같으면 1', () => {
    const p = mk({ beneficiaries: { value: 480000, unit: '명', source: 's' } });
    expect(lensValues(p, { maxBeneficiaries: 480000 }).reach).toBeCloseTo(1, 9);
    expect(lensValues(mk({ beneficiaries: { value: 1, unit: '명', source: 's' } }), { maxBeneficiaries: 1 }).reach).toBe(1);
  });
});

describe('순위', () => {
  const rows = [
    mk({ id: 'a', spendType: 'equity', amount27Eok: 100 }),
    mk({ id: 'b', spendType: 'cash', amount27Eok: 900 }),
    mk({ id: 'r', isRemainder: true, spendType: 'unknown', nature: 'unknown', amount27Eok: 500 }),
  ];

  it('가중치 전부 0이면 점수 없이 금액 내림차순', () => {
    const r = rankPrograms(rows, ZERO_WEIGHTS);
    expect(r.map((x) => x.program.id)).toEqual(['b', 'r', 'a']);
    expect(r.every((x) => x.score === undefined)).toBe(true);
  });

  it('자본축적성 가중치만 주면 equity가 cash보다 앞서고 잔여는 맨 뒤', () => {
    const r = rankPrograms(rows, W({ capital: 3 }));
    expect(r.map((x) => x.program.id)).toEqual(['a', 'b', 'r']);
    expect(r[2].score).toBeUndefined();
  });

  it('값이 없는 렌즈는 분모에서 빠진다', () => {
    const r = rankPrograms([mk({ id: 'a', spendType: 'equity' })], W({ capital: 3, check: 3 }));
    expect(r[0].score).toBe(1); // check 없음 → capital만으로 평균
  });

  it('프리셋은 3개이고 이름이 설계문서와 같다', () => {
    expect(PRESETS.map((p) => p.name)).toEqual(['정부 기준 (NEXT 원칙)', '국회 통제 우선', '자산형성 우선']);
  });

  it('서로 다른 정부의 사업을 섞으면 throw', () => {
    const seoul = { level: 'metro' as const, code: '11', name: '서울' };
    expect(() => rankPrograms([mk({ id: 'a' }), mk({ id: 'b', gov: seoul })], ZERO_WEIGHTS)).toThrow();
  });
});
