'use client';

import type { NetIncreaseRow } from '@/lib/data/fiscal-health-official';

// ============================================================
// Formatters (DebtIncreaseSection과 공용)
// ============================================================

/** 광역은 시도 약칭만('경기'), 기초는 '시도 자치단체'('경기 수원시') */
export function displayName(row: NetIncreaseRow): string {
  return row.level === 'metro' ? row.region : `${row.region} ${row.name}`;
}

export function formatEok(value: number): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
}

export function formatDelta(value: number): string {
  return `${value > 0 ? '+' : ''}${formatEok(value)}`;
}

export function formatPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`;
}

export function formatDeltaPct(value: number | null): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function deltaColor(value: number): string {
  if (value > 0) return 'text-red-400';
  if (value < 0) return 'text-emerald-400';
  return 'text-gray-600';
}

// ============================================================
// Table
// ============================================================

export function DebtIncreaseTable({ rows }: { rows: NetIncreaseRow[] }) {
  return (
    <div className="overflow-x-auto border border-gray-800">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="bg-gray-900 text-xs md:text-sm text-gray-500">
            <th className="text-left font-normal px-3 py-2">자치단체</th>
            <th className="text-right font-normal px-3 py-2">전년 말 잔액</th>
            <th className="text-right font-normal px-3 py-2">당해 말 잔액</th>
            <th className="text-right font-normal px-3 py-2">순증</th>
            <th className="text-right font-normal px-3 py-2">예산 대비 순증 %</th>
            <th className="text-right font-normal px-3 py-2">채무비율 %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-800/50">
              <td className="px-3 py-1.5 text-sm md:text-base text-gray-300 whitespace-nowrap">
                {displayName(row)}
              </td>
              <td className="px-3 py-1.5 text-sm font-mono tabular-nums text-right text-gray-400 whitespace-nowrap">
                {formatEok(row.prevEok)}
              </td>
              <td className="px-3 py-1.5 text-sm font-mono tabular-nums text-right text-gray-300 whitespace-nowrap">
                {formatEok(row.currEok)}
              </td>
              <td
                className={`px-3 py-1.5 text-sm md:text-base font-mono font-bold tabular-nums text-right whitespace-nowrap ${deltaColor(row.deltaEok)}`}
              >
                {formatDelta(row.deltaEok)}
              </td>
              <td
                className={`px-3 py-1.5 text-sm font-mono tabular-nums text-right whitespace-nowrap ${deltaColor(row.deltaEok)}`}
              >
                {formatDeltaPct(row.deltaPctOfBudget)}
              </td>
              <td className="px-3 py-1.5 text-sm font-mono tabular-nums text-right text-gray-400 whitespace-nowrap">
                {formatPct(row.ratioPct)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-600">
                해당 조건의 자치단체가 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
