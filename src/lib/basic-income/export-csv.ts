/** 해마다 계산 결과를 CSV 문자열로 바꾼다. BOM은 다운로드하는 쪽에서 붙인다. */
import Papa from 'papaparse';
import type { YearRow } from './types';

const HEADER = ['연도', '지급', '인구', '필요액(조)', '지급용 세입(조)', '적립(조)', '인출(조)', '부족(조)', '기금(조)', '원금(조)'];

const jo = (n: number): number => Math.round(n * 1000) / 1000;

export function rowsToCsv(rows: YearRow[]): string {
  const data = rows.map((r) => [
    r.year,
    r.paying ? '예' : '아니오',
    Math.round(r.population),
    jo(r.need),
    jo(r.payRevenue),
    jo(r.saveInflow),
    jo(r.withdrawal),
    jo(r.shortfall),
    jo(r.fundEnd),
    jo(r.principal),
  ]);
  return Papa.unparse({ fields: HEADER, data });
}
