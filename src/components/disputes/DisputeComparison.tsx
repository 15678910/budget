import type { DisputeFigure } from '@/lib/disputes/types';
import { FIGURE_KIND_LABEL } from '@/lib/datacenter/types';

export function DisputeComparison({
  caption,
  rows,
}: {
  caption: string;
  rows: DisputeFigure[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[420px] text-base">
        <caption className="p-3 text-left font-mono text-xs text-muted-foreground">
          {caption}
        </caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="px-4 py-3 text-foreground">
                {r.label}{' '}
                <span className="font-mono text-xs text-muted-foreground">
                  {FIGURE_KIND_LABEL[r.kind]}
                </span>
                {r.note && (
                  <span className="block text-sm text-muted-foreground">{r.note}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
