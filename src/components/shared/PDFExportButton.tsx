'use client';

import { useCallback } from 'react';

interface PDFExportButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
}

export function PDFExportButton({ targetRef, filename }: PDFExportButtonProps) {
  const handleExport = useCallback(() => {
    if (!targetRef.current) return;

    const element = targetRef.current;
    const today = new Date().toISOString().split('T')[0];

    // Clone content and build print-friendly HTML
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>마을살림/나라살림 - ${filename} - ${today}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm; }
        }
        body {
          font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
          background: #fff; color: #222; padding: 20px; margin: 0;
        }
        .header {
          border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;
        }
        .header h1 { font-size: 18px; color: #2563eb; margin: 0; }
        .header p { font-size: 12px; color: #888; margin: 4px 0 0; }
        .content { font-size: 13px; line-height: 1.8; }
        .content table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        .content td, .content th {
          border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 12px;
        }
        .content th { background: #f5f5f5; font-weight: 600; }
        .footer {
          margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd;
          font-size: 10px; color: #999; text-align: center;
        }
        /* Convert dark theme colors to light for print */
        [class*="text-gray-"] { color: #333 !important; }
        [class*="text-emerald"] { color: #059669 !important; }
        [class*="text-blue"] { color: #2563eb !important; }
        [class*="text-red"] { color: #dc2626 !important; }
        [class*="text-amber"] { color: #d97706 !important; }
        [class*="text-purple"] { color: #7c3aed !important; }
        [class*="text-cyan"] { color: #0891b2 !important; }
        [class*="bg-gray"], [class*="bg-zinc"] { background: #fff !important; }
        [class*="border-gray"] { border-color: #ddd !important; }
        svg { display: none; }
        button { display: none; }
        input { display: none; }
      </style>
    </head><body>
      <div class="header">
        <h1>마을살림/나라살림 | ${filename}</h1>
        <p>${today} | budget.ai.kr</p>
      </div>
      <div class="content">${element.innerHTML}</div>
      <div class="footer">마을살림/나라살림 (budget.ai.kr) - AI 기반 재정 분석 플랫폼</div>
      <script>
        // Remove interactive elements
        document.querySelectorAll('button, input, select, [role="button"]').forEach(el => el.remove());
        // Auto print
        setTimeout(function() { window.print(); }, 500);
      </script>
    </body></html>`);
    win.document.close();
  }, [targetRef, filename]);

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 18 15 15" />
      </svg>
      PDF
    </button>
  );
}
