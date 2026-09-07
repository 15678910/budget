import { regionalImpact } from '@/lib/disputes/regional-impact';

export function RegionalImpactTable({ cutEok }: { cutEok: number }) {
  const rows = regionalImpact(cutEok);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-base">
        <caption className="p-3 text-left font-mono text-sm text-muted-foreground">
          2024 회계연도 결산 · 지방교육재정알리미 교육청별 재정도표
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-sm text-muted-foreground">
            <th scope="col" className="px-4 py-2 font-medium">
              지역
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              감소액(억원)
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              인건비 비중
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              비인건비 대비
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const overCapacity = r.pressure > 1;
            return (
              <tr
                key={r.name}
                className={`border-t border-border ${overCapacity ? 'bg-red-500/10' : ''}`}
              >
                <td className="px-4 py-3 text-foreground">{r.name}</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                  {Math.round(r.cutEok).toLocaleString('ko-KR')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {(r.payrollRatio * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {(r.pressure * 100).toFixed(1)}%
                  {overCapacity && (
                    <span className="ml-1 font-mono text-sm font-bold text-foreground">
                      인건비 불가피
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
