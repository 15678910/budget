"use client";

import { useMemo, useCallback } from 'react';
import { ResponsiveTreeMapHtml } from '@nivo/treemap';
import type { ComputedNode, ComputedNodeWithoutStyles } from '@nivo/treemap';
import type { BudgetTreeNode } from '@/types/budget';
import { formatKoreanWon } from '@/lib/utils/format';
import { getNodeColor } from '@/lib/utils/colors';
import { TreemapTooltip } from './TreemapTooltip';
import type { ViewMode } from '@/types/budget';

interface BudgetTreemapProps {
  data: BudgetTreeNode;
  onNodeClick: (nodeName: string) => void;
  /** Current domain/ministry context for consistent coloring during drill-down */
  domainContext?: string;
  /** Current view mode for color mapping */
  viewMode: ViewMode;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

export function BudgetTreemap({ data, onNodeClick, domainContext, viewMode }: BudgetTreemapProps) {
  const parentTotal = useMemo(() => calculateTotal(data), [data]);
  const hasChildren = data.children && data.children.length > 0;

  const handleClick = useCallback(
    (node: ComputedNode<BudgetTreeNode>, _event: React.MouseEvent) => {
      onNodeClick(node.data?.name ?? String(node.id));
    },
    [onNodeClick]
  );

  const colorFunction = useCallback(
    (node: ComputedNodeWithoutStyles<BudgetTreeNode>): string => {
      // If we have a context (drilled into a domain/ministry), use that color
      if (domainContext) {
        return getNodeColor(domainContext, viewMode);
      }
      // At root level, each child IS a domain/ministry - use its own name
      return getNodeColor(node.data?.name ?? '', viewMode);
    },
    [domainContext, viewMode]
  );

  const tooltip = useCallback(
    (props: { node: ComputedNode<BudgetTreeNode> }) => (
      <TreemapTooltip node={props.node} parentTotal={parentTotal} />
    ),
    [parentTotal]
  );

  if (!hasChildren) {
    return (
      <div
        className="flex items-center justify-center border border-border rounded-lg bg-muted/50"
        style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">하위 항목이 없습니다</p>
          <p className="text-sm">이 항목은 최하위 세부사업입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      className="border border-border rounded-lg overflow-hidden"
    >
      <ResponsiveTreeMapHtml<BudgetTreeNode>
        data={data}
        identity="name"
        value="value"
        tile="squarify"
        leavesOnly={true}
        innerPadding={2}
        outerPadding={4}
        nodeOpacity={1}
        labelSkipSize={30}
        enableLabel={true}
        orientLabel={false}
        label={(node) => node.data.name}
        valueFormat={(v) => formatKoreanWon(v)}
        colors={colorFunction}
        borderWidth={2}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.5]],
        }}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 2.5]],
        }}
        onClick={handleClick}
        tooltip={tooltip}
        motionConfig="gentle"
        animate={true}
      />
    </div>
  );
}
