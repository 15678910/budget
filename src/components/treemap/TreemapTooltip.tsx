"use client";

import type { BudgetTreeNode } from '@/types/budget';
import { formatKoreanWon, formatKoreanWonFull } from '@/lib/utils/format';

interface TreemapTooltipProps {
  node: {
    id: string;
    value: number;
    color: string;
    data: Omit<BudgetTreeNode, 'children'>;
    pathComponents: string[];
    formattedValue: number | string;
    treeDepth: number;
    isParent: boolean;
    isLeaf: boolean;
  };
  parentTotal?: number;
}

export function TreemapTooltip({ node, parentTotal }: TreemapTooltipProps) {
  const percentage = parentTotal && parentTotal > 0
    ? ((node.value / parentTotal) * 100).toFixed(1)
    : null;

  const ministryName = node.data?.meta?.ministryName;
  const accountType = node.data?.meta?.accountType;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-lg px-3 py-2 text-base max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: node.color }}
        />
        <span className="font-semibold truncate">{node.data?.name ?? node.id}</span>
      </div>
      <div className="space-y-0.5 text-sm">
        <div className="text-foreground font-medium">
          {formatKoreanWon(node.value)}
        </div>
        <div className="text-muted-foreground">
          ({formatKoreanWonFull(node.value)})
        </div>
        {percentage && (
          <div className="text-muted-foreground">
            비중: {percentage}%
          </div>
        )}
        {ministryName && (
          <div className="text-muted-foreground">
            소관: {ministryName}
          </div>
        )}
        {accountType && (
          <div className="text-muted-foreground">
            회계: {accountType}
          </div>
        )}
      </div>
    </div>
  );
}
