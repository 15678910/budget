import { POPULATION_BY_YEAR } from '@/lib/constants';
import { BUDGET_2027 } from '@/lib/basic-income/data/budget-2027';
import {
  DEFAULT_FUTURE_FUND,
  DEFAULT_INPUT,
  DEFAULT_SOURCES,
  EXCLUDED_REVENUES,
  SHARED_ASSET_CANDIDATES,
} from '@/lib/basic-income/defaults';
import { simulate } from '@/lib/basic-income/engine';

describe('defaults', () => {
  it('모든 기본값에 종류가 있고, source면 출처 문자열이 있다', () => {
    for (const v of Object.values(DEFAULT_SOURCES)) {
      expect(['source', 'derived', 'assumption']).toContain(v.kind);
      if (v.kind === 'source') expect((v.source ?? '').trim()).not.toBe('');
      if (v.value === 0 && v.kind !== 'assumption') expect(v.note).toBe('출처 확인 전');
    }
  });

  it('1차 자료 항목에는 링크가 있다', () => {
    for (const v of Object.values(DEFAULT_SOURCES)) {
      if (v.kind === 'source') expect(v.url ?? '').toMatch(/^https:\/\//);
    }
  });

  it('예산 표의 모든 항목이 source', () => {
    expect(BUDGET_2027.length).toBeGreaterThan(0);
    BUDGET_2027.forEach((s) => expect(s.source.kind).toBe('source'));
  });

  it('K-ETS는 제외 목록에 있다', () => {
    expect(EXCLUDED_REVENUES.some((e) => e.label.includes('K-ETS'))).toBe(true);
  });

  it('첫 화면은 S1, 월 10만 원', () => {
    expect(DEFAULT_INPUT.initialFund).toBe(0);
    expect(DEFAULT_INPUT.monthlyPerPerson).toBe(100_000);
    expect(DEFAULT_INPUT.baseYear).toBe(2027);
    expect(DEFAULT_INPUT.payStartYear).toBe(2027);
  });

  it('인구는 POPULATION_BY_YEAR[2026]', () => {
    expect(DEFAULT_INPUT.population0).toBe(POPULATION_BY_YEAR[2026]);
  });

  it('기본 입력으로 엔진이 돈다', () => {
    expect(simulate(DEFAULT_INPUT).rows.length).toBe(50);
  });

  it('미래대응기금 기본값은 162.3조·104.4조', () => {
    expect(DEFAULT_FUTURE_FUND.totalFund).toBeCloseTo(162.3, 9);
    expect(DEFAULT_FUTURE_FUND.surplusFund).toBeCloseTo(104.4, 9);
  });

  it('공유 자산 목록에 검토 후보가 있다', () => {
    expect(SHARED_ASSET_CANDIDATES.some((a) => a.candidate)).toBe(true);
    expect(SHARED_ASSET_CANDIDATES.every((a) => a.mode === 'save')).toBe(true);
  });

  it('금지 수치가 없다', () => {
    expect(JSON.stringify(DEFAULT_SOURCES)).not.toMatch(/66\.8/);
  });
});
