import { perpetualTarget, sanitizeInput, simulate } from '@/lib/basic-income/engine';
import { base } from '@/lib/basic-income/__fixtures__/base';

describe('simulate', () => {
  it('기금·세입 0이면 첫해 부족으로 실패', () => {
    expect(simulate(base).verdict).toEqual({ sustainable: false, firstFailYear: 2027, reason: 'shortfall' });
  });

  it('기금 40조·인출률 3%=수익률 3%면 연 1.2조를 영구 지급', () => {
    const r = simulate({ ...base, initialFund: 40 });
    expect(r.verdict.sustainable).toBe(true);
    expect(r.rows).toHaveLength(50);
    expect(r.rows[49].fundEnd).toBeCloseTo(40, 6);
  });

  it('fails on principal when withdrawal rate exceeds return', () => {
    expect(simulate({ ...base, initialFund: 40, realReturn: 0.02 }).verdict).toEqual({
      sustainable: false,
      firstFailYear: 2027,
      reason: 'principal',
    });
  });

  it('excess pay revenue is saved into fund and principal', () => {
    const r = simulate({ ...base, alt: { ...base.alt, data: { base: 100, rate: 0.02, annualGrowth: 0, mode: 'pay' } } });
    expect(r.rows[0].saveInflow).toBeCloseTo(0.8, 9);
    expect(r.rows[0].principal).toBeCloseTo(0.8, 9);
    expect(r.verdict.sustainable).toBe(true);
  });

  it('사회보험 보전을 켜면 필요액에 더한다', () => {
    const r = simulate({ ...base, initialFund: 40, socialInsuranceTopUp: { enabled: true, annual: 0.5 } });
    expect(r.rows[0].need).toBeCloseTo(1.7, 9);
    expect(r.verdict.reason).toBe('shortfall');
  });

  it('기다리는 해에는 지급이 없다', () => {
    const r = simulate({ ...base, payStartYear: 2029, horizonYears: 1 });
    expect(r.rows.map((x) => x.paying)).toEqual([false, false, true]);
    expect(r.rows[0].need).toBe(0);
  });

  it('인출률 0이면 인출하지 않는다', () => {
    const r = simulate({ ...base, initialFund: 40, withdrawalRate: 0 });
    expect(r.rows[0].withdrawal).toBe(0);
    expect(r.verdict.reason).toBe('shortfall');
  });

  it('세입 내역을 해마다 기록한다', () => {
    const r = simulate({ ...base, bequest: { eligibleEstate: 10, uptake: 0.2, shareToFund: 0.3, effectiveTaxRate: 0.4, specialRate: 0 } });
    expect(r.rows[0].revenues.bequest).toBeCloseTo(0.6, 9);
    expect(r.rows[0].saveInflow).toBeCloseTo(0.6, 9);
  });
});

describe('sanitizeInput', () => {
  it('sanitizeInput clamps invalid values', () => {
    const s = sanitizeInput({ ...base, horizonYears: 0, populationGrowth: -2, withdrawalRate: Number.NaN, payStartYear: 2000 });
    expect(s.horizonYears).toBe(1);
    expect(s.populationGrowth).toBe(-0.5);
    expect(s.withdrawalRate).toBe(0);
    expect(s.payStartYear).toBe(2027);
  });

  it('음수 금액·인구는 0, 기간은 200 이하 정수', () => {
    const s = sanitizeInput({ ...base, initialFund: -5, population0: -1, monthlyPerPerson: -10, horizonYears: 999.7 });
    expect(s.initialFund).toBe(0);
    expect(s.population0).toBe(0);
    expect(s.monthlyPerPerson).toBe(0);
    expect(s.horizonYears).toBe(200);
  });

  it('NaN 입력으로도 simulate가 숫자를 낸다', () => {
    const r = simulate({ ...base, realReturn: Number.NaN, initialFund: Number.NaN });
    expect(r.rows.every((x) => Number.isFinite(x.fundEnd))).toBe(true);
  });
});

describe('perpetualTarget', () => {
  it('필요액 1.2조·3%면 목표 40조, 20조면 50%', () => {
    const t = perpetualTarget({ ...base, initialFund: 20 });
    expect(t.target).toBeCloseTo(40, 6);
    expect(t.progress).toBeCloseTo(0.5, 6);
  });
});
