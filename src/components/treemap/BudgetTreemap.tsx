"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { BudgetTreeNode, ViewMode } from '@/types/budget';
import { formatKoreanWon, formatKoreanWonFull } from '@/lib/utils/format';
import { getNodeColor } from '@/lib/utils/colors';
import { squarify, calculateTotal, darken } from '@/lib/utils/squarify';
import type { SquarifyRect } from '@/lib/utils/squarify';

interface BudgetTreemapProps {
  data: BudgetTreeNode;
  onNodeClick: (nodeName: string) => void;
  /** Current domain/ministry context for consistent coloring during drill-down */
  domainContext?: string;
  /** Current view mode for color mapping */
  viewMode: ViewMode;
}

export function BudgetTreemap({ data, onNodeClick, domainContext, viewMode }: BudgetTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; rect: SquarifyRect } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const parentTotal = useMemo(() => calculateTotal(data), [data]);

  const items = useMemo(() => {
    if (!data.children) return [];
    return data.children
      .map(child => ({
        name: child.name,
        value: calculateTotal(child),
        color: getNodeColor(domainContext ?? child.name, viewMode),
        meta: child.meta,
      }))
      .filter(i => i.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, domainContext, viewMode]);

  const rects = useMemo(
    () => squarify(items, 0, 0, dimensions.width, dimensions.height),
    [items, dimensions],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const hasChildren = data.children && data.children.length > 0;

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
      ref={containerRef}
      style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      className="border border-border rounded-lg overflow-hidden relative"
      onMouseLeave={handleMouseLeave}
    >
      {rects.map((rect) => {
        const showLabel = rect.width > 50 && rect.height > 28;
        const fontSize = rect.width > 120 && rect.height > 40 ? 13 : 11;
        const maxChars = Math.floor(rect.width / (fontSize * 0.65));
        const label = rect.name.length > maxChars
          ? rect.name.slice(0, maxChars) + '…'
          : rect.name;

        return (
          <div
            key={rect.name}
            onClick={() => onNodeClick(rect.name)}
            onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, rect })}
            onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              backgroundColor: rect.color,
              borderWidth: 2,
              borderColor: darken(rect.color, 0.3),
              cursor: 'pointer',
            }}
            className="border flex items-center justify-center overflow-hidden transition-opacity hover:opacity-90"
          >
            {showLabel && (
              <span
                style={{ fontSize, color: darken(rect.color, 0.65) }}
                className="font-medium pointer-events-none select-none truncate px-1"
              >
                {label}
              </span>
            )}
          </div>
        );
      })}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-card text-card-foreground border border-border rounded-lg shadow-lg px-3 py-2 text-base max-w-xs pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: tooltip.rect.color }} />
            <span className="font-semibold truncate">{tooltip.rect.name}</span>
          </div>
          <div className="space-y-0.5 text-sm">
            <div className="text-foreground font-medium">{formatKoreanWon(tooltip.rect.value)}</div>
            <div className="text-muted-foreground">({formatKoreanWonFull(tooltip.rect.value)})</div>
            {parentTotal > 0 && (
              <div className="text-muted-foreground">
                비중: {((tooltip.rect.value / parentTotal) * 100).toFixed(1)}%
              </div>
            )}
            {tooltip.rect.meta?.ministryName && (
              <div className="text-muted-foreground">소관: {tooltip.rect.meta.ministryName}</div>
            )}
            {tooltip.rect.meta?.accountType && (
              <div className="text-muted-foreground">회계: {tooltip.rect.meta.accountType}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
