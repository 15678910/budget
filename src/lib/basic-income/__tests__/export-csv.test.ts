import { base } from '@/lib/basic-income/__fixtures__/base';
import { simulate } from '@/lib/basic-income/engine';
import { rowsToCsv } from '@/lib/basic-income/export-csv';

describe('rowsToCsv', () => {
  it('CSV 머리글과 행 수', () => {
    const csv = rowsToCsv(simulate(base).rows);
    expect(csv.split('\n')[0]).toContain('연도');
    expect(csv.trim().split('\n')).toHaveLength(51);
  });

  it('머리글은 한글 10열이고 지급 여부는 예/아니오', () => {
    const lines = rowsToCsv(simulate(base).rows).trim().split('\n');
    expect(lines[0].trim()).toBe('연도,지급,인구,필요액(조),지급용 세입(조),적립(조),인출(조),부족(조),기금(조),원금(조)');
    expect(lines[1].split(',')[0]).toBe('2027');
    expect(lines[1].split(',')[1]).toBe('예');
  });

  it('BOM은 넣지 않는다(다운로드할 때 붙인다)', () => {
    expect(rowsToCsv(simulate(base).rows).codePointAt(0)).not.toBe(0xfeff);
  });
});
