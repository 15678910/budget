// src/lib/data/__tests__/fiscal-health-official.test.ts
import {
  metroOfficialKeys,
  districtOfficialKey,
  getMetroFiscalDataOfficial,
  getAllDistrictFiscalDataOfficial,
  netIncreaseRows,
  getMetroYearlyIncreaseOfficial,
  getDistrictDebtHistoryOfficial,
} from '../fiscal-health-official';

describe('공식 채무 overlay', () => {
  it('이름 매핑', () => {
    expect(metroOfficialKeys('서울특별시')).toEqual(['서울본청']);
    expect(metroOfficialKeys('전남광주통합특별시').sort()).toEqual(['광주본청', '전남본청']);
    expect(districtOfficialKey('전남광주통합특별시', '광산구')).toBe('광주광산구');
    expect(districtOfficialKey('전남광주통합특별시', '여수시')).toBe('전남여수시');
    expect(districtOfficialKey('강원특별자치도', '춘천시')).toBe('강원춘천시');
  });
  it('광역 16곳 전부 공식값으로 덮인다', () => {
    const rows = getMetroFiscalDataOfficial();
    expect(rows.every((r) => r.debtSource === 'official')).toBe(true);
    expect(rows.find((r) => r.name === '서울특별시')!.debt).toBe(113375);
  });
  it('시군구 227곳 중 제주시·서귀포시(행정시, 원자료 없음)만 추정치로 남는다', () => {
    const rows = getAllDistrictFiscalDataOfficial();
    expect(rows.filter((r) => r.debtSource === 'estimated').map((r) => r.name).sort()).toEqual(['서귀포시', '제주시']);
    expect(rows.find((r) => r.metro === '서울특별시' && r.name === '강남구')!.debt).toBe(0);
    expect(rows.find((r) => r.metro === '전북특별자치도' && r.name === '전주시')!.debt).toBe(4653);
  });
  it('2024 광역 순증: 경기 +4,780억, 서울 −1,050억 (반올림)', () => {
    const rows = netIncreaseRows(2024, 'metro');
    expect(rows).toHaveLength(17);
    expect(Math.round(rows.find((r) => r.region === '경기')!.deltaEok)).toBe(4780);
    expect(Math.round(rows.find((r) => r.region === '서울')!.deltaEok)).toBe(-1050);
  });
  it('2024 기초 순증 1위 전주시', () => {
    const rows = netIncreaseRows(2024, 'basic').sort((a, b) => b.deltaEok - a.deltaEok);
    expect(rows[0].key).toBe('전북전주시');
  });
  it('시계용 연간 증가액은 공식 3년 평균이고 전남광주는 합산', () => {
    expect(getMetroYearlyIncreaseOfficial('서울특별시')).toBeDefined();
    expect(getMetroYearlyIncreaseOfficial('전남광주통합특별시')).toBeDefined();
  });
  it('시군구 채무 이력은 공식 7개 연도', () => {
    const d = getAllDistrictFiscalDataOfficial().find((r) => r.name === '전주시')!;
    const h = getDistrictDebtHistoryOfficial(d);
    expect(h.map((x) => x.year)).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  });
});
