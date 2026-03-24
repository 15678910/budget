// ─── Download Helpers ───
export function downloadAsCSV(data: Record<string, unknown>, filename: string) {
  const rows: string[][] = [['항목', '값']];
  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      const label = prefix ? `${prefix} > ${key}` : key;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flatten(val as Record<string, unknown>, label);
      } else if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (typeof item === 'object') {
            flatten(item as Record<string, unknown>, `${label}[${i + 1}]`);
          } else {
            rows.push([`${label}[${i + 1}]`, String(item)]);
          }
        });
      } else {
        rows.push([label, String(val ?? '')]);
      }
    }
  }
  flatten(data);
  const bom = '\uFEFF';
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAsJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAsPDF(data: Record<string, unknown>, filename: string) {
  // Build HTML report
  const rows: Array<[string, string]> = [];
  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      const label = prefix ? `${prefix} > ${key}` : key;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        flatten(val as Record<string, unknown>, label);
      } else if (Array.isArray(val)) {
        val.forEach((item, i) => {
          if (typeof item === 'object') {
            flatten(item as Record<string, unknown>, `${label}[${i + 1}]`);
          } else {
            rows.push([`${label}[${i + 1}]`, String(item)]);
          }
        });
      } else {
        rows.push([label, String(val ?? '')]);
      }
    }
  }
  flatten(data);

  const tableRows = rows.map(([k, v]) =>
    `<tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:500;white-space:nowrap;vertical-align:top;background:#f9f9f9">${k}</td><td style="padding:6px 12px;border:1px solid #ddd;word-break:break-all">${v}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; padding: 40px; color: #222; }
    h1 { font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #2563eb; }
    h2 { font-size: 14px; color: #666; margin-top: 4px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 13px; }
    .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; }
  </style></head><body>
    <h1>정책 시뮬레이션 보고서</h1>
    <h2>${String(data['지역'] || '')} | ${String(data['정책'] || '')} | ${String(data['분석일시'] || '')}</h2>
    <table>${tableRows}</table>
    <div class="footer">마을살림/나라살림 (budget.ai.kr) | AI 정책진단 시뮬레이션 보고서</div>
    <script>window.onload=function(){window.print();}</script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
