"use client";

import { useMemo, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { TreemapNode } from 'recharts';
import type { BudgetTreeNode } from '@/types/budget';
import { formatKoreanWon, formatKoreanWonFull } from '@/lib/utils/format';
import { getNodeColor } from '@/lib/utils/colors';
import type { ViewMode } from '@/types/budget';

interface BudgetTreemapProps {
  data: BudgetTreeNode;
  onNodeClick: (nodeName: string) => void;
  /** Current domain/ministry context for consistent coloring during drill-down */
  domainContext?: string;
  /** Current view mode for color mapping */
  viewMode: ViewMode;
}

/** Recharts-compatible data node */
interface RechartsTreeNode {
  name: string;
  size?: number;
  color: string;
  children?: RechartsTreeNode[];
  meta?: BudgetTreeNode['meta'];
  [key: string]: unknown;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/** Flatten a BudgetTreeNode tree into recharts format (leaf-only with size) */
function toRechartsData(
  node: BudgetTreeNode,
  domainContext: string | undefined,
  viewMode: ViewMode,
): RechartsTreeNode[] {
  if (!node.children || node.children.length === 0) return [];

  return node.children.map((child) => {
    const colorKey = domainContext ?? child.name;
    const color = getNodeColor(colorKey, viewMode);

    if (child.children && child.children.length > 0) {
      // For branch nodes, flatten leaves so recharts can size them
      const leaves = flattenLeaves(child, color);
      const totalValue = leaves.reduce((s, l) => s + (l.size ?? 0), 0);
      return {
        name: child.name,
        size: totalValue,
        color,
        meta: child.meta,
        children: leaves,
      };
    }

    return {
      name: child.name,
      size: child.value ?? 0,
      color,
      meta: child.meta,
    };
  });
}

/** Recursively collect leaves, preserving the parent color */
function flattenLeaves(node: BudgetTreeNode, color: string): RechartsTreeNode[] {
  if (!node.children || node.children.length === 0) {
    return [{ name: node.name, size: node.value ?? 0, color, meta: node.meta }];
  }
  return node.children.flatMap((child) => flattenLeaves(child, color));
}

/** Darken a hex color by a factor (0-1, where 0 = original, 1 = black) */
function darken(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - factor));
  return `rgb(${r},${g},${b})`;
}

/** Custom content renderer for each rectangle in the treemap */
function CustomContent(props: TreemapNode) {
  const { x, y, width, height, name, color } = props as TreemapNode & {
    color: string;
  };

  const numX = Number(x) || 0;
  const numY = Number(y) || 0;
  const numW = Number(width) || 0;
  const numH = Number(height) || 0;

  // Only render label if rectangle is large enough
  const showLabel = numW > 40 && numH > 24;
  const fontSize = numW > 120 && numH > 40 ? 13 : 11;
  const nodeColor = (color as string) || '#AAAAAA';

  return (
    <g>
      <rect
        x={numX}
        y={numY}
        width={numW}
        height={numH}
        fill={nodeColor}
        stroke={darken(nodeColor, 0.3)}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
      {showLabel && (
        <text
          x={numX + numW / 2}
          y={numY + numH / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={darken(nodeColor, 0.65)}
          fontSize={fontSize}
          fontWeight={500}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {String(name).length > Math.floor(numW / (fontSize * 0.7))
            ? String(name).slice(0, Math.floor(numW / (fontSize * 0.7))) + '…'
            : String(name)}
        </text>
      )}
    </g>
  );
}

/** Custom tooltip content */
function TreemapTooltipContent({
  active,
  payload,
  parentTotal,
}: {
  active?: boolean;
  payload?: Array<{ payload: RechartsTreeNode & { size: number } }>;
  parentTotal: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const node = payload[0].payload;
  const value = node.size ?? 0;
  const percentage =
    parentTotal > 0 ? ((value / parentTotal) * 100).toFixed(1) : null;
  const ministryName = node.meta?.ministryName;
  const accountType = node.meta?.accountType;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-lg px-3 py-2 text-base max-w-xs">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: node.color }}
        />
        <span className="font-semibold truncate">{node.name}</span>
      </div>
      <div className="space-y-0.5 text-sm">
        <div className="text-foreground font-medium">
          {formatKoreanWon(value)}
        </div>
        <div className="text-muted-foreground">
          ({formatKoreanWonFull(value)})
        </div>
        {percentage && (
          <div className="text-muted-foreground">비중: {percentage}%</div>
        )}
        {ministryName && (
          <div className="text-muted-foreground">소관: {ministryName}</div>
        )}
        {accountType && (
          <div className="text-muted-foreground">회계: {accountType}</div>
        )}
      </div>
    </div>
  );
}

export function BudgetTreemap({ data, onNodeClick, domainContext, viewMode }: BudgetTreemapProps) {
  const parentTotal = useMemo(() => calculateTotal(data), [data]);
  const hasChildren = data.children && data.children.length > 0;

  const rechartsData = useMemo(
    () => toRechartsData(data, domainContext, viewMode),
    [data, domainContext, viewMode],
  );

  const handleClick = useCallback(
    (node: TreemapNode) => {
      const name = node?.name;
      if (name) {
        onNodeClick(String(name));
      }
    },
    [onNodeClick],
  );

  const tooltipContent = useCallback(
    (props: { active?: boolean; payload?: Array<{ payload: RechartsTreeNode & { size: number } }> }) => (
      <TreemapTooltipContent {...props} parentTotal={parentTotal} />
    ),
    [parentTotal],
  );

  if (!hasChildren) {
    return (
      <div
        className="flex items-center justify-center border border-border rounded-lg bg-muted/50"
        style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">하위 항목이 없습니다</p>
          <p className="text-base">이 항목은 최하위 세부사업입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      className="border border-border rounded-lg overflow-hidden"
    >
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={rechartsData}
          dataKey="size"
          nameKey="name"
          type="flat"
          content={CustomContent}
          onClick={handleClick}
          isAnimationActive={false}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={tooltipContent as any} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
