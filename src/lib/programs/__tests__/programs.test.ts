import { ALL_PROGRAMS, ACCOUNT_TOTAL_EOK } from '../index';
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

describe('1단계 데이터 무결성', () => {
  const rows = ALL_PROGRAMS.filter((p) => p.gov.code === '00');

  it('id 중복 없음, gov 코드 유효', () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) expect(isValidGovCode(r.gov)).toBe(true);
  });

  it('계정별 합계가 홍보자료 사업지출과 억 단위까지 일치한다', () => {
    const sum = (acc: string) =>
      rows.filter((r) => r.account === acc).reduce((s, r) => s + r.amount27Eok, 0);
    expect(sum('youth')).toBe(133_000);
    expect(sum('growth')).toBe(142_000);
    expect(sum('regional')).toBe(103_000);
    expect(sum('education')).toBe(76_000);
    expect(rows.reduce((s, r) => s + r.amount27Eok, 0)).toBe(454_000);
    expect(ACCOUNT_TOTAL_EOK).toEqual({ youth: 133_000, growth: 142_000, regional: 103_000, education: 76_000 });
  });

  it('잔여 행은 계정마다 정확히 하나이고 분류가 unknown이다', () => {
    const rem = rows.filter((r) => r.isRemainder);
    expect(rem.map((r) => r.account).sort()).toEqual(['education', 'growth', 'regional', 'youth']);
    for (const r of rem) {
      expect(r.spendType).toBe('unknown');
      expect(r.nature).toBe('unknown');
      expect(r.amount27Eok).toBeGreaterThan(0);
    }
  });

  it('행 수는 38이고 id는 kebab-case다', () => {
    expect(rows.length).toBe(38);
    for (const r of rows) expect(r.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('evidence의 field는 허용된 값만 쓴다', () => {
    const allowed = ['spendType', 'nature', 'route', 'unit', 'beneficiaries', 'amount27Eok'];
    for (const r of rows) {
      for (const e of r.evidence) expect(allowed).toContain(e.field);
    }
  });

  it('잔여가 아닌 행은 route 근거가 있고, 분류한 렌즈에는 인용문이, 분류하지 못한 렌즈에는 사유가 있다', () => {
    for (const r of rows.filter((r) => !r.isRemainder)) {
      expect(r.sources.length).toBeGreaterThan(0);

      const quoted = (f: 'spendType' | 'nature' | 'route') => {
        const e = r.evidence.find((x) => x.field === f);
        if (!e) throw new Error(`${r.id}.${f} 근거 없음`);
        expect(e.quote.length).toBeGreaterThan(5);
        expect(e.source.length).toBeGreaterThan(0);
      };
      const notQuoted = (f: 'spendType' | 'nature') => {
        const e = r.evidence.find((x) => x.field === f);
        if (e) throw new Error(`${r.id}.${f}가 unknown인데 근거 인용문이 남아 있다`);
      };

      quoted('route');
      if (r.spendType === 'unknown') notQuoted('spendType');
      else quoted('spendType');
      if (r.nature === 'unknown') notQuoted('nature');
      else quoted('nature');

      if (r.spendType === 'unknown' || r.nature === 'unknown') {
        expect(typeof r.classificationNote).toBe('string');
        expect(r.classificationNote!.length).toBeGreaterThan(0);
      }
    }
  });

  it('단가×수량이 있으면 matches가 ±1% 규칙과 맞는다', () => {
    for (const r of rows) {
      if (!r.unit) continue;
      const within = Math.abs(r.unit.product - r.amount27Eok) / r.amount27Eok <= 0.01;
      expect(r.unit.matches).toBe(within);
    }
  });

  it('신규(new)는 amount26Eok이 null이고, 확대·이관·전환은 숫자다', () => {
    for (const r of rows.filter((r) => !r.isRemainder)) {
      if (r.nature === 'new') expect(r.amount26Eok).toBeNull();
      else if (r.nature === 'unknown') continue; // 분류 근거 부족 — ’26년 금액도 문서에 없다
      else expect(typeof r.amount26Eok).toBe('number');
    }
  });
});
