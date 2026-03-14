'use client';

import { useCallback } from 'react';

interface DataDownloadProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}

export function DataDownload({ data, filename, label = '데이터 다운로드' }: DataDownloadProps) {
  const downloadCSV = useCallback(() => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val ?? '');
        }).join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filename]);

  const downloadJSON = useCallback(() => {
    if (data.length === 0) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, filename]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <button
        onClick={downloadCSV}
        className="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded text-sm text-foreground transition-colors cursor-pointer"
      >
        CSV
      </button>
      <button
        onClick={downloadJSON}
        className="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded text-sm text-foreground transition-colors cursor-pointer"
      >
        JSON
      </button>
    </div>
  );
}
