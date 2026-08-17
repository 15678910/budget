'use client';

import type { FinanceAssumptions, YearRow } from '@/lib/datacenter/types';
import { formatEokUsd, formatSignedEokUsd } from './formatting';

interface CashflowTableProps {
  rows: YearRow[];
  assumptions: FinanceAssumptions;
  paybackYears: number | null;
}

/** 회수 시점이 속한 연도를 표에서 강조한다. */
function isPaybackYear(row: YearRow, paybackYears: number | null): boolean {
  if (paybackYears === null) return false;
  return row.year === Math.ceil(paybackYears);
}

export function CashflowTable({ rows, assumptions, paybackYears }: CashflowTableProps) {
  const { capexUsd, gpuLifeYears } = assumptions;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/50">
          <tr className="text-right">
            <th className="px-3 py-2 text-left font-semibold text-foreground">연차</th>
            <th className="px-3 py-2 font-semibold text-foreground">매출</th>
            <th className="px-3 py-2 font-semibold text-foreground">운영비</th>
            <th className="px-3 py-2 font-semibold text-foreground">이자</th>
            <th className="px-3 py-2 font-semibold text-foreground">순현금</th>
            <th className="px-3 py-2 font-semibold text-foreground">누적</th>
            <th className="px-3 py-2 font-semibold text-foreground">회수율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const recovery = row.cumulative / capexUsd;
            const eol = row.year === Math.floor(gpuLifeYears);
            return (
              <tr
                key={row.year}
                className={`border-t border-border text-right tabular-nums ${
                  isPaybackYear(row, paybackYears)
                    ? 'bg-emerald-500/10'
                    : eol
                      ? 'bg-amber-500/10'
                      : ''
                }`}
              >
                <td className="px-3 py-2 text-left font-medium text-foreground">
                  {row.year}년
                  {eol && (
                    <span className="ml-1.5 text-[11px] font-normal text-warning">
                      GPU 수명
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatEokUsd(row.revenue)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatEokUsd(row.opex)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatEokUsd(row.interest)}</td>
                <td
                  className={`px-3 py-2 font-medium ${
                    row.netCash < 0 ? 'text-danger' : 'text-foreground'
                  }`}
                >
                  {formatSignedEokUsd(row.netCash)}
                </td>
                <td className="px-3 py-2 text-foreground">{formatSignedEokUsd(row.cumulative)}</td>
                <td
                  className={`px-3 py-2 font-semibold ${
                    recovery >= 1 ? 'text-success' : 'text-foreground'
                  }`}
                >
                  {(recovery * 100).toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/30 text-right text-xs text-muted-foreground">
            <td className="px-3 py-2 text-left" colSpan={7}>
              총 투자비 {formatEokUsd(capexUsd)} 대비 누적 회수 비율. 회수율 100%가 원금 회수 시점이다.
              {assumptions.loanType === 'interestOnly' &&
                ' 원금 상환은 포함하지 않았다(만기일시상환) — 보고서와 동일한 처리다.'}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
