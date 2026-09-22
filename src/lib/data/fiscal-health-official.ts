// ============================================================
// 공식 채무 overlay
// ─────────────────────────────────────────────────────────────
// 수정 금지 파일 `fiscal-health-data.ts`(추정치 포함)를 건드리지 않고,
// 지방재정365 결산 공식값(`local-debt-official.ts`)을 그 위에 덮어쓴다.
//
// 출처: 지방재정365 통합공시 예산대비채무비율(결산), 통합회계 채무잔액.
//       순증은 발행액이 아니라 잔액 증감(발행 − 상환).
// 단위: 억원.
// ============================================================

import {
  generateDistrictDebtHistory,
  getAllDistrictFiscalData,
  getDistrictFiscalData,
  getMetroDebtHistory,
  getMetroFiscalData,
  type DistrictDebtHistoryEntry,
  type DistrictFiscalData,
  type MetroDebtHistoryEntry,
  type MetroFiscalData,
} from './fiscal-health-data';
import {
  OFFICIAL_DEBT_YEARS,
  OFFICIAL_LOCAL_DEBT,
  type OfficialDebtEntity,
  type OfficialDebtYear,
} from './local-debt-official';

export type DebtSourceTag = 'official' | 'estimated';

export interface MetroFiscalDataX extends MetroFiscalData {
  debtSource: DebtSourceTag;
}

export interface DistrictFiscalDataX extends DistrictFiscalData {
  debtSource: DebtSourceTag;
}

export interface NetIncreaseRow {
  key: string;
  region: string;
  name: string;
  level: 'metro' | 'basic';
  /** 전년 말 채무잔액 (억원) */
  prevEok: number;
  /** 당해 말 채무잔액 (억원) */
  currEok: number;
  /** 순증 = 당해 − 전년 (억원) */
  deltaEok: number;
  /** 당해 최종예산액 (억원) */
  budgetEok: number | null;
  /** 예산 대비 순증 (%) */
  deltaPctOfBudget: number | null;
  /** 예산 대비 채무비율 (%) */
  ratioPct: number | null;
}

// ─── 시도 약칭 표 ───────────────────────────────────────────
// 사이트 광역 이름 → 원자료 시도 약칭.
// `전남광주통합특별시`는 광주·전남이 합쳐진 이름이라 여기 넣지 않고 따로 분기한다.
const METRO_REGION_ABBR: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  강원도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라북도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주특별자치도: '제주',
};

/** 통합 광역 이름 */
const MERGED_METRO = '전남광주통합특별시';

/** 통합 광역 소속 시군구 중 원자료에서 `광주`인 자치구 */
const GWANGJU_DISTRICTS = new Set(['광산구', '서구', '북구', '동구', '남구']);

const ENTITY_BY_KEY: ReadonlyMap<string, OfficialDebtEntity> = new Map(
  OFFICIAL_LOCAL_DEBT.map((e) => [e.key, e]),
);

/** 연도 → OFFICIAL_DEBT_YEARS 인덱스. 없으면 -1 */
function yearIndex(year: number): number {
  return (OFFICIAL_DEBT_YEARS as readonly number[]).indexOf(year);
}

/** 소수 n자리 반올림 (부동소수점 잔차 제거) */
function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** 사이트 광역 이름 → 원자료 key 목록. 전남광주통합특별시 → ['광주본청','전남본청'] */
export function metroOfficialKeys(metroFullName: string): string[] {
  if (metroFullName === MERGED_METRO) return ['광주본청', '전남본청'];
  const abbr = METRO_REGION_ABBR[metroFullName];
  return abbr ? [`${abbr}본청`] : [];
}

/** 사이트 시군구 → 원자료 key. 전남광주통합특별시의 광산구·서구·북구·동구·남구 → '광주…', 나머지 → '전남…' */
export function districtOfficialKey(metroFullName: string, districtName: string): string {
  if (metroFullName === MERGED_METRO) {
    return `${GWANGJU_DISTRICTS.has(districtName) ? '광주' : '전남'}${districtName}`;
  }
  const abbr = METRO_REGION_ABBR[metroFullName];
  return abbr ? `${abbr}${districtName}` : districtName;
}

/** 광역의 모든 원자료 행. 하나라도 없으면 빈 배열(= 공식값 사용 불가) */
function metroEntities(metroFullName: string): OfficialDebtEntity[] {
  const keys = metroOfficialKeys(metroFullName);
  if (keys.length === 0) return [];
  const entities: OfficialDebtEntity[] = [];
  for (const key of keys) {
    const entity = ENTITY_BY_KEY.get(key);
    if (!entity) return [];
    entities.push(entity);
  }
  return entities;
}

/** 해당 연도 값의 합계. 하나라도 null이면 null */
function sumAt(
  entities: readonly OfficialDebtEntity[],
  field: 'debtEok' | 'budgetEok',
  index: number,
): number | null {
  if (entities.length === 0 || index < 0) return null;
  let total = 0;
  for (const entity of entities) {
    const value = entity[field][index];
    if (value === null || value === undefined) return null;
    total += value;
  }
  return round(total, 1);
}

const LATEST_INDEX = OFFICIAL_DEBT_YEARS.length - 1;

/** 광역 재정 데이터에 2024 공식 채무잔액을 덮어쓴다. 공식값이 없으면 원값 + estimated */
export function getMetroFiscalDataOfficial(): MetroFiscalDataX[] {
  return getMetroFiscalData().map((metro) => {
    const debtEok = sumAt(metroEntities(metro.name), 'debtEok', LATEST_INDEX);
    if (debtEok === null) return { ...metro, debtSource: 'estimated' };
    return { ...metro, debt: Math.round(debtEok), debtSource: 'official' };
  });
}

/** 시군구 한 행에 2024 공식 채무잔액을 덮어쓴다 */
function overlayDistrict(district: DistrictFiscalData): DistrictFiscalDataX {
  const entity = ENTITY_BY_KEY.get(districtOfficialKey(district.metro, district.name));
  const debtEok = entity ? entity.debtEok[LATEST_INDEX] : null;
  if (debtEok === null || debtEok === undefined) {
    return { ...district, debtSource: 'estimated' };
  }
  return { ...district, debt: Math.round(debtEok), debtSource: 'official' };
}

/** 전체 시군구 재정 데이터(공식 채무잔액 반영) */
export function getAllDistrictFiscalDataOfficial(): DistrictFiscalDataX[] {
  return getAllDistrictFiscalData().map(overlayDistrict);
}

/** 특정 광역의 시군구 재정 데이터(공식 채무잔액 반영) */
export function getDistrictFiscalDataOfficial(metroFullName: string): DistrictFiscalDataX[] {
  return getDistrictFiscalData(metroFullName).map(overlayDistrict);
}

/** 광역 연도별 채무/예산/비율 (2018~2024 공식). 공식값이 없으면 기존 추정 이력 */
export function getMetroDebtHistoryOfficial(metroFullName: string): MetroDebtHistoryEntry[] {
  const entities = metroEntities(metroFullName);
  if (entities.length === 0) return getMetroDebtHistory(metroFullName);

  const history: MetroDebtHistoryEntry[] = [];
  OFFICIAL_DEBT_YEARS.forEach((year, index) => {
    const debtEok = sumAt(entities, 'debtEok', index);
    if (debtEok === null) return;
    const budgetEok = sumAt(entities, 'budgetEok', index);
    history.push({
      year,
      debt: Math.round(debtEok),
      budget: budgetEok === null ? 0 : Math.round(budgetEok),
      ratio: budgetEok ? round((debtEok / budgetEok) * 100, 2) : 0,
    });
  });

  return history.length > 0 ? history : getMetroDebtHistory(metroFullName);
}

/** 시군구 연도별 채무/비율. 공식 행이 있으면 공식, 없으면 기존 추정 이력 */
export function getDistrictDebtHistoryOfficial(d: DistrictFiscalData): DistrictDebtHistoryEntry[] {
  const entity = ENTITY_BY_KEY.get(districtOfficialKey(d.metro, d.name));
  if (!entity) return generateDistrictDebtHistory(d);

  const history: DistrictDebtHistoryEntry[] = [];
  OFFICIAL_DEBT_YEARS.forEach((year, index) => {
    const debtEok = entity.debtEok[index];
    if (debtEok === null || debtEok === undefined) return;
    const budgetEok = entity.budgetEok[index];
    history.push({
      year,
      debt: Math.round(debtEok),
      ratio: budgetEok ? round((debtEok / budgetEok) * 100, 2) : 0,
    });
  });

  return history.length > 0 ? history : generateDistrictDebtHistory(d);
}

/** 최근 3개 연도(2022·2023·2024) 순증 평균(억원/년). 실시간 시계용. 공식값 없으면 undefined */
export function getMetroYearlyIncreaseOfficial(metroFullName: string): number | undefined {
  const entities = metroEntities(metroFullName);
  if (entities.length === 0) return undefined;

  const deltas: number[] = [];
  for (let index = LATEST_INDEX; index > 0 && deltas.length < 3; index -= 1) {
    const curr = sumAt(entities, 'debtEok', index);
    const prev = sumAt(entities, 'debtEok', index - 1);
    if (curr === null || prev === null) continue;
    deltas.push(round(curr - prev, 1));
  }
  if (deltas.length === 0) return undefined;

  return round(deltas.reduce((sum, d) => sum + d, 0) / deltas.length, 1);
}

/** 연도별 채무 순증(= 잔액 증감) 행. year ≥ 2019, 전년·당해 둘 다 있는 행만 */
export function netIncreaseRows(year: OfficialDebtYear, level: 'metro' | 'basic'): NetIncreaseRow[] {
  const index = yearIndex(year);
  if (index < 1) return [];

  const rows: NetIncreaseRow[] = [];
  for (const entity of OFFICIAL_LOCAL_DEBT) {
    if (entity.level !== level) continue;
    const prev = entity.debtEok[index - 1];
    const curr = entity.debtEok[index];
    if (prev === null || prev === undefined || curr === null || curr === undefined) continue;

    const deltaEok = round(curr - prev, 1);
    const budgetEok = entity.budgetEok[index] ?? null;
    rows.push({
      key: entity.key,
      region: entity.region,
      name: entity.name,
      level: entity.level,
      prevEok: prev,
      currEok: curr,
      deltaEok,
      budgetEok,
      deltaPctOfBudget: budgetEok ? (deltaEok / budgetEok) * 100 : null,
      ratioPct: budgetEok ? (curr / budgetEok) * 100 : null,
    });
  }
  return rows;
}
