// src/lib/data/__tests__/local-debt-official.test.ts
import { OFFICIAL_LOCAL_DEBT, OFFICIAL_DEBT_YEARS, OFFICIAL_DEBT_SOURCE } from '../local-debt-official';

const find = (key: string) => OFFICIAL_LOCAL_DEBT.find((e) => e.key === key)!;
const y = (year: number) => OFFICIAL_DEBT_YEARS.indexOf(year as 2024);

describe('지방채무 공식 데이터', () => {
  it('2018~2024, 243개 자치단체(광역 17 + 기초 226)', () => {
    expect(OFFICIAL_DEBT_YEARS).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    expect(OFFICIAL_LOCAL_DEBT).toHaveLength(243);
    expect(OFFICIAL_LOCAL_DEBT.filter((e) => e.level === 'metro')).toHaveLength(17);
  });
  it('서울본청 2024 채무잔액 113,375.4억, 최종예산 526,690.0억', () => {
    const s = find('서울본청');
    expect(s.region).toBe('서울'); expect(s.name).toBe('본청');
    expect(s.debtEok[y(2024)]).toBeCloseTo(113375.4, 1);
    expect(s.budgetEok[y(2024)]).toBeCloseTo(526690.0, 1);
  });
  it('경기수원시 2024 채무 2,054.5억, 서울강남구 0', () => {
    expect(find('경기수원시').debtEok[y(2024)]).toBeCloseTo(2054.5, 1);
    expect(find('서울강남구').debtEok[y(2024)]).toBe(0);
    expect(find('경기수원시').region).toBe('경기');
    expect(find('경기수원시').name).toBe('수원시');
  });
  it('모든 행의 배열 길이가 연도 수와 같고 key가 유일하다', () => {
    for (const e of OFFICIAL_LOCAL_DEBT) {
      expect(e.debtEok).toHaveLength(OFFICIAL_DEBT_YEARS.length);
      expect(e.budgetEok).toHaveLength(OFFICIAL_DEBT_YEARS.length);
    }
    expect(new Set(OFFICIAL_LOCAL_DEBT.map((e) => e.key)).size).toBe(243);
  });
  it('출처에 지방재정365 URL과 수집일이 있다', () => {
    expect(OFFICIAL_DEBT_SOURCE.url).toContain('lofin365.go.kr');
    expect(OFFICIAL_DEBT_SOURCE.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
