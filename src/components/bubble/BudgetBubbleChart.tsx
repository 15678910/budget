"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3Hierarchy from 'd3-hierarchy';
import * as d3Scale from 'd3-scale';
import type { BudgetTreeNode } from '@/types/budget';
import { formatKoreanWon } from '@/lib/utils/format';
import { getChangeColor } from '@/lib/utils/change-colors';
import { getNodeColor } from '@/lib/utils/colors';
import type { ViewMode } from '@/types/budget';

interface BudgetBubbleChartProps {
  data: BudgetTreeNode;
  onNodeClick: (nodeName: string) => void;
  domainContext?: string;
  viewMode: ViewMode;
  /** Previous year's data for computing change rates */
  prevYearData?: BudgetTreeNode;
  /** Color mode: 'category' uses domain/ministry colors, 'change' uses YoY change colors */
  colorMode?: 'category' | 'change';
}

interface BubbleNode {
  name: string;
  value: number;
  changePercent: number | null;
  isNew: boolean;
  x: number;
  y: number;
  r: number;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

function findChildValue(root: BudgetTreeNode | undefined, name: string): number | null {
  if (!root?.children) return null;
  const child = root.children.find(c => c.name === name);
  if (!child) return null;
  return calculateTotal(child);
}

export function BudgetBubbleChart({
  data,
  onNodeClick,
  domainContext,
  viewMode,
  prevYearData,
  colorMode = 'category',
}: BudgetBubbleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute bubble layout
  const bubbles: BubbleNode[] = useMemo(() => {
    if (!data.children || data.children.length === 0) return [];

    const children = data.children.map(child => {
      const value = child.value ?? calculateTotal(child);
      const prevValue = findChildValue(prevYearData, child.name);
      const changePercent = prevValue !== null && prevValue > 0
        ? ((value - prevValue) / prevValue) * 100
        : null;
      const isNew = prevValue === null;
      return { name: child.name, value: Math.max(value, 1), changePercent, isNew };
    });

    // Create hierarchy for d3 pack layout
    const root = d3Hierarchy.hierarchy({ name: 'root', children })
      .sum(d => ('value' in d ? (d as { value: number }).value : 0));

    const pack = d3Hierarchy.pack<typeof root.data>()
      .size([dimensions.width - 20, dimensions.height - 20])
      .padding(3);

    const packed = pack(root);

    return packed.children?.map(node => ({
      name: (node.data as unknown as { name: string }).name,
      value: (node.data as unknown as { value: number }).value,
      changePercent: (node.data as unknown as { changePercent: number | null }).changePercent,
      isNew: (node.data as unknown as { isNew: boolean }).isNew,
      x: node.x + 10,
      y: node.y + 10,
      r: node.r,
    })) ?? [];
  }, [data, prevYearData, dimensions]);

  const getColor = useCallback((bubble: BubbleNode) => {
    if (colorMode === 'change') {
      return getChangeColor(bubble.changePercent ?? 0, bubble.isNew);
    }
    if (domainContext) {
      return getNodeColor(domainContext, viewMode);
    }
    return getNodeColor(bubble.name, viewMode);
  }, [colorMode, domainContext, viewMode]);

  // Min radius for showing label
  const labelMinRadius = 25;

  const hoveredBubble = bubbles.find(b => b.name === hoveredNode);

  if (!data.children || data.children.length === 0) {
    return (
      <div
        ref={containerRef}
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
      ref={containerRef}
      className="relative border border-border rounded-lg overflow-hidden"
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
    >
      <svg width={dimensions.width} height={dimensions.height}>
        {bubbles.map(bubble => {
          const color = getColor(bubble);
          const isHovered = hoveredNode === bubble.name;
          return (
            <g
              key={bubble.name}
              onClick={() => onNodeClick(bubble.name)}
              onMouseEnter={(e) => {
                setHoveredNode(bubble.name);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r}
                fill={color}
                fillOpacity={isHovered ? 0.9 : 0.75}
                stroke={isHovered ? 'hsl(var(--foreground))' : color}
                strokeWidth={isHovered ? 2 : 1}
                strokeOpacity={0.6}
              />
              {bubble.r >= labelMinRadius && (
                <text
                  x={bubble.x}
                  y={bubble.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  fill="hsl(var(--foreground))"
                  fontSize={Math.min(12, bubble.r / 4)}
                  fontWeight={500}
                >
                  <tspan x={bubble.x} dy="-0.4em">{bubble.name}</tspan>
                  <tspan x={bubble.x} dy="1.3em" fontSize={Math.min(10, bubble.r / 5)}>
                    {formatKoreanWon(bubble.value)}
                  </tspan>
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredBubble && (
        <div
          className="fixed z-50 pointer-events-none bg-card text-card-foreground border border-border rounded-lg shadow-lg px-3 py-2 text-base max-w-xs"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
          }}
        >
          <div className="font-semibold">{hoveredBubble.name}</div>
          <div className="text-foreground">{formatKoreanWon(hoveredBubble.value)}</div>
          {hoveredBubble.changePercent !== null && (
            <div className={hoveredBubble.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}>
              전년대비 {hoveredBubble.changePercent >= 0 ? '+' : ''}{hoveredBubble.changePercent.toFixed(1)}%
            </div>
          )}
          {hoveredBubble.isNew && (
            <div className="text-red-500">신규 항목</div>
          )}
        </div>
      )}
    </div>
  );
}
