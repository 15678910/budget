'use client';

import { cn } from '@/lib/utils/format';
import type { BudgetRawItem } from '@/types/budget';

interface ExportButtonProps {
  items: BudgetRawItem[];
  filename?: string;
  className?: string;
}

function toCSV(items: BudgetRawItem[]): string {
  const headers = [
    '회계연도', '부처명', '회계명', '분야명', '부문명',
    '프로그램명', '단위사업명', '세부사업명', '예산구분', '예산액(백만원)',
  ];
  const escape = (val: string | number) => {
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const it of items) {
    lines.push([
      it.fiscalYear, it.ministryName, it.accountTypeName, it.domainName,
      it.sectorName, it.programName, it.unitProjectName, it.detailProjectName,
      it.budgetType, it.amount,
    ].map(escape).join(','));
  }
  return lines.join('\n');
}

export function ExportButton({ items, filename = '예산데이터.csv', className }: ExportButtonProps) {
  const handleExport = () => {
    const csv = toCSV(items);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-base',
        'border border-border text-muted-foreground',
        'hover:bg-muted hover:text-foreground transition-colors',
        className
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      CSV 내보내기
    </button>
  );
}
