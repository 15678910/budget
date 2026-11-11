'use client';

import { rowsToCsv } from '@/lib/basic-income';
import type { YearRow } from '@/lib/basic-income/types';

const BOM = String.fromCodePoint(0xfeff);
const BTN = 'rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:border-blue-500 hover:text-blue-300';

/** CSV 내려받기와 인쇄(PDF 저장). 인쇄할 때는 이 시뮬레이터만 보이게 body에 표시를 단다. */
export function ExportButtons({ rows, fileYear }: { rows: YearRow[]; fileYear: number }) {
  const downloadCsv = () => {
    const blob = new Blob([BOM + rowsToCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-basic-income-fund-${fileYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const print = () => {
    document.body.dataset.biPrint = '1';
    window.addEventListener('afterprint', () => delete document.body.dataset.biPrint, { once: true });
    window.print();
  };
  return (
    <div className="bi-no-print flex flex-wrap gap-2">
      <button type="button" className={BTN} onClick={downloadCsv}>
        CSV 내려받기
      </button>
      <button type="button" className={BTN} onClick={print}>
        인쇄 · PDF 저장
      </button>
    </div>
  );
}
