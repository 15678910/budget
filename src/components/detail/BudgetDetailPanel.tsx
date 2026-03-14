"use client";

import { useMemo } from 'react';
import type { BudgetTreeNode } from '@/types/budget';
import { formatKoreanWon, formatPercent } from '@/lib/utils/format';
import { formatUnitConversion, type BudgetUnit } from '@/lib/utils/units';
import { YearTrendChart } from './YearTrendChart';
import { VoteButtons } from './VoteButtons';

interface BudgetDetailPanelProps {
  node: BudgetTreeNode;
  path: string[];
  /** All years' root data for computing trend */
  allYearsData: Record<number, BudgetTreeNode>;
  availableYears: number[];
  currentYear: number;
  selectedUnit: BudgetUnit | null;
  onClose: () => void;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/** Traverse a tree by path and return the node's total value, or null if not found */
function getValueAtPath(root: BudgetTreeNode, path: string[]): number | null {
  let current = root;
  for (const segment of path) {
    const child = current.children?.find(c => c.name === segment);
    if (!child) return null;
    current = child;
  }
  return calculateTotal(current);
}

export function BudgetDetailPanel({
  node,
  path,
  allYearsData,
  availableYears,
  currentYear,
  selectedUnit,
  onClose,
}: BudgetDetailPanelProps) {
  const amount = calculateTotal(node);

  // Compute year-over-year change
  const prevYear = currentYear - 1;
  const prevYearData = allYearsData[prevYear];
  const prevAmount = prevYearData ? getValueAtPath(prevYearData, path) : null;
  const changePercent = prevAmount && prevAmount > 0
    ? ((amount - prevAmount) / prevAmount) * 100
    : null;

  // Build trend data across all years
  const trendData = useMemo(() => {
    return availableYears.map(year => {
      const yearRoot = allYearsData[year];
      const value = yearRoot ? getValueAtPath(yearRoot, path) : null;
      return { year, amount: value ?? 0 };
    });
  }, [allYearsData, availableYears, path]);

  // Build the full hierarchy path for display
  const hierarchyPath = path.length > 0 ? path.join(' > ') : node.name;

  // Unit conversion text
  const unitText = selectedUnit ? formatUnitConversion(amount, selectedUnit) : '';

  // Permalink
  const encodedPath = path.map(s => encodeURIComponent(s)).join('/');
  const permalink = `/explore/${encodedPath}`;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4 text-base">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-base text-foreground truncate">{node.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{hierarchyPath}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
          aria-label="닫기"
        >
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* Amount */}
      <div>
        <div className="text-xl font-bold text-foreground">
          {formatKoreanWon(amount)}
        </div>
        {changePercent !== null && (
          <div className={`text-base font-medium ${changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
            전년대비 {formatPercent(changePercent)}
          </div>
        )}
        {unitText && (
          <div className="text-sm text-muted-foreground mt-1">
            {unitText}
          </div>
        )}
      </div>

      {/* Meta info */}
      {(node.meta?.ministryName || node.meta?.accountType) && (
        <div className="space-y-0.5 text-sm text-muted-foreground">
          {node.meta?.ministryName && <div>소관: {node.meta.ministryName}</div>}
          {node.meta?.accountType && <div>회계: {node.meta.accountType}</div>}
        </div>
      )}

      {/* Permalink */}
      {path.length > 0 && (
        <div className="text-sm">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + permalink);
            }}
            className="text-primary hover:underline"
          >
            링크 복사
          </button>
        </div>
      )}

      {/* Year trend chart */}
      {trendData.length > 1 && (
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">연도별 추이</div>
          <YearTrendChart data={trendData} />
        </div>
      )}

      {/* Vote buttons */}
      <div>
        <div className="text-sm font-medium text-muted-foreground mb-2">이 예산에 대한 의견</div>
        <VoteButtons itemId={node.id} />
      </div>
    </div>
  );
}
