import { CENTRAL_GOV, assertSameGov, isValidGovCode } from '../gov';
import type { Program } from '../types';

const base = (over: Partial<Program>): Program => ({
  id: 'x', name: 'x', gov: CENTRAL_GOV, ministry: 'x', area: 'youth', account: 'youth',
  amount26Eok: null, amount27Eok: 100, nature: 'new', spendType: 'cash', route: 'fund',
  evidence: [], sources: ['t'], ...over,
});

describe('정부 단위', () => {
  it('중앙은 code 00, 시도는 2자리, 시군구는 5자리만 허용한다', () => {
    expect(isValidGovCode({ level: 'central', code: '00', name: '중앙정부' })).toBe(true);
    expect(isValidGovCode({ level: 'metro', code: '11', name: '서울' })).toBe(true);
    expect(isValidGovCode({ level: 'district', code: '11110', name: '종로구' })).toBe(true);
    expect(isValidGovCode({ level: 'metro', code: '11110', name: '서울' })).toBe(false);
    expect(isValidGovCode({ level: 'central', code: '11', name: '중앙' })).toBe(false);
  });

  it('서로 다른 정부의 사업을 섞으면 throw', () => {
    const seoul = { level: 'metro' as const, code: '11', name: '서울특별시' };
    expect(() => assertSameGov([base({}), base({ id: 'y', gov: seoul })])).toThrow(/gov/);
    expect(() => assertSameGov([base({}), base({ id: 'y' })])).not.toThrow();
  });
});
