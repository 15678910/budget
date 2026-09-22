// src/lib/data/__tests__/local-indicators-official.test.ts
import {
  OFFICIAL_INDICATORS,
  INDICATOR_YEARS,
  INDICATOR_KEYS,
  INDICATOR_META,
  INDICATOR_SOURCE,
} from '../local-indicators-official';

const find = (key: string) => OFFICIAL_INDICATORS.find((e) => e.key === key)!;
const y = (year: number) => INDICATOR_YEARS.indexOf(year as 2024);

describe('지방재정365 결산 지표 12종 공식 데이터', () => {
  it('2019~2024, 243개 자치단체(광역 17 + 기초 226)', () => {
    expect(INDICATOR_YEARS).toEqual([2019, 2020, 2021, 2022, 2023, 2024]);
    expect(OFFICIAL_INDICATORS).toHaveLength(243);
    expect(OFFICIAL_INDICATORS.filter((e) => e.level === 'metro')).toHaveLength(17);
  });

  it('모든 행의 값 배열 길이가 연도 수와 같고, 12개 지표 키를 모두 갖는다', () => {
    for (const e of OFFICIAL_INDICATORS) {
      for (const k of INDICATOR_KEYS) {
        expect(e.values[k]).toBeDefined();
        expect(e.values[k]).toHaveLength(INDICATOR_YEARS.length);
      }
    }
  });

  it('INDICATOR_KEYS 12개가 모두 유일하다', () => {
    expect(INDICATOR_KEYS).toHaveLength(12);
    expect(new Set(INDICATOR_KEYS).size).toBe(12);
  });

  it('key(lafNm)가 유일하다', () => {
    expect(new Set(OFFICIAL_INDICATORS.map((e) => e.key)).size).toBe(243);
  });

  it('서울본청 2024 지표값', () => {
    const s = find('서울본청');
    expect(s.values.fiscalBalance[y(2024)]).toBeCloseTo(-3.16, 2);
    expect(s.values.festival[y(2024)]).toBeCloseTo(0.28, 2);
    expect(s.values.fundBalance[y(2024)]).toBeCloseTo(82171.6, 1);
    expect(s.values.privateContract[y(2024)]).toBeCloseTo(14.64, 2);
  });

  it('경기수원시 typeCd/peerCd, 서울종로구 typeCd', () => {
    const suwon = find('경기수원시');
    expect(suwon.typeCd).toBe('31');
    expect(suwon.peerCd).toBe('31A');

    const jongno = find('서울종로구');
    expect(jongno.typeCd).toBe('33');
  });

  it('출처에 lofin365 URL이 포함된다', () => {
    expect(INDICATOR_SOURCE.url).toContain('lofin365.go.kr');
    expect(INDICATOR_SOURCE.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('INDICATOR_META가 12개 지표를 모두 설명한다', () => {
    expect(INDICATOR_META).toHaveLength(12);
    const keys = INDICATOR_META.map((m) => m.key);
    expect(new Set(keys).size).toBe(12);
    for (const k of INDICATOR_KEYS) {
      expect(keys).toContain(k);
    }
  });
});
