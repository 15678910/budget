// src/lib/data/__tests__/fiscal-health-official.test.ts
import {
  metroOfficialKeys,
  districtOfficialKey,
  getMetroFiscalDataOfficial,
  getAllDistrictFiscalDataOfficial,
  netIncreaseRows,
  getMetroYearlyIncreaseOfficial,
  getMetroPrevYearDebtOfficial,
  getMetroLatestDebtRatioOfficial,
  getDistrictDebtHistoryOfficial,
  getMetroDebtHistoryOfficial,
} from '../fiscal-health-official';
import { getChangeRate, type DistrictFiscalData } from '../fiscal-health-data';

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

  // 군위군은 2023년 대구 편입이라 공식 공시가 2024 한 해뿐이다.
  // 1개짜리 이력을 그대로 넘기면 차트 x축 분모(length-1)가 0이 되어 NaN 좌표가 나온다.
  it('공식 이력이 1개 연도뿐인 군위군은 1개짜리 이력을 반환하지 않는다', () => {
    const fromSite = getAllDistrictFiscalDataOfficial().find(
      (r) => r.metro === '대구광역시' && r.name === '군위군',
    );
    const gunwi: DistrictFiscalData = fromSite ?? {
      metro: '대구광역시',
      name: '군위군',
      independence: 10,
      autonomy: 48.5,
      debt: 0,
      population: 22000,
      budget: 6227,
    };
    const h = getDistrictDebtHistoryOfficial(gunwi);
    expect(h.length).not.toBe(1);
    expect(h.length).toBeGreaterThanOrEqual(2);
  });

  it('광역 이력도 1개짜리를 반환하지 않는다', () => {
    for (const metro of getMetroFiscalDataOfficial()) {
      expect(getMetroDebtHistoryOfficial(metro.name).length).not.toBe(1);
    }
  });

  it('전년比 채무는 2023 공식 결산 잔액 기준 (서울 114,425억, −0.92%)', () => {
    expect(getMetroPrevYearDebtOfficial('서울특별시')).toBe(114425);
    const seoul = getMetroFiscalDataOfficial().find((m) => m.name === '서울특별시')!;
    expect(getChangeRate(seoul.debt, getMetroPrevYearDebtOfficial('서울특별시')!)).toBeCloseTo(-0.92, 2);
    expect(getMetroPrevYearDebtOfficial('없는도')).toBeUndefined();
  });

  it('최신 채무비율은 2024 결산 기준 (서울 21.53%)', () => {
    expect(getMetroLatestDebtRatioOfficial('서울특별시')).toBe(21.53);
    expect(getMetroLatestDebtRatioOfficial('없는도')).toBeUndefined();
  });

  it('메모이즈해도 같은 값을 돌려준다', () => {
    expect(getMetroYearlyIncreaseOfficial('서울특별시')).toBe(getMetroYearlyIncreaseOfficial('서울특별시'));
    expect(getMetroLatestDebtRatioOfficial('경기도')).toBe(getMetroLatestDebtRatioOfficial('경기도'));
    expect(getMetroPrevYearDebtOfficial('전남광주통합특별시')).toBe(
      getMetroPrevYearDebtOfficial('전남광주통합특별시'),
    );
  });
});
