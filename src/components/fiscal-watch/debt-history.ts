/**
 * 상세 화면의 예산대비 채무비율 이력.
 *
 * 값은 모두 지방재정365 결산 공시(`local-debt-official.ts`)에서 나온다.
 * `fiscal-health-official.ts`의 두 함수는 공식 공시가 한 해뿐인 곳(대구 군위군)에서
 * 추정 이력으로 되돌아가므로, 그런 경우에는 추정치를 섞지 않고 공식 계열만 보여준다.
 */
import {
  districtOfficialKey,
  getAllDistrictFiscalDataOfficial,
  getDistrictDebtHistoryOfficial,
  getMetroDebtHistoryOfficial,
} from '@/lib/data/fiscal-health-official';
import { OFFICIAL_DEBT_YEARS, OFFICIAL_LOCAL_DEBT } from '@/lib/data/local-debt-official';
import type { EntitySummary } from '@/lib/watch/signal-types';
import { REGION_FULL_NAME } from './warning-labels';

export interface DebtRow {
  year: number;
  /** 채무잔액(억원) */
  debt: number;
  /** 예산대비 채무비율(%). 최종예산액이 없으면 null */
  ratio: number | null;
}

/** `local-debt-official.ts`에서 곧바로 만든 공식 계열 */
export function officialDebtSeries(key: string): DebtRow[] {
  const entity = OFFICIAL_LOCAL_DEBT.find((e) => e.key === key);
  if (!entity) return [];
  const rows: DebtRow[] = [];
  OFFICIAL_DEBT_YEARS.forEach((year, index) => {
    const debt = entity.debtEok[index];
    if (debt === null || debt === undefined) return;
    const budget = entity.budgetEok[index];
    const ratio = budget ? Math.round((debt / budget) * 10000) / 100 : null;
    rows.push({ year, debt: Math.round(debt), ratio });
  });
  return rows;
}

/**
 * 광역은 `getMetroDebtHistoryOfficial`(사이트 광역 이름으로 조회),
 * 기초는 사이트 시군구 행이 있을 때 `getDistrictDebtHistoryOfficial`을 쓴다.
 */
export function debtHistoryOf(summary: EntitySummary): DebtRow[] {
  const direct = officialDebtSeries(summary.key);
  if (direct.length < 2) return direct;

  if (summary.level === 'metro') {
    const fullName = REGION_FULL_NAME[summary.region];
    if (!fullName) return direct;
    return getMetroDebtHistoryOfficial(fullName).map((entry) => ({
      year: entry.year,
      debt: entry.debt,
      ratio: entry.ratio,
    }));
  }

  const district = getAllDistrictFiscalDataOfficial().find(
    (d) => districtOfficialKey(d.metro, d.name) === summary.key,
  );
  if (!district) return direct;
  return getDistrictDebtHistoryOfficial(district).map((entry) => ({
    year: entry.year,
    debt: entry.debt,
    ratio: entry.ratio,
  }));
}
