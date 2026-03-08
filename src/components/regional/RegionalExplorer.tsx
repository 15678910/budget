"use client";

import { useState, useEffect, useMemo } from 'react';
import { BudgetTreemap } from '../treemap/BudgetTreemap';
import { BudgetBubbleChart } from '../bubble/BudgetBubbleChart';
import { BubbleLegend } from '../bubble/BubbleLegend';
import { Breadcrumb } from '../layout/Breadcrumb';
import { BudgetDetailPanel } from '../detail/BudgetDetailPanel';
import { UnitConverter } from '../shared/UnitConverter';
import { useTreemapNavigation } from '@/hooks/useTreemapNavigation';
import type { BudgetTreeNode, ViewMode, VisualizationMode, DatasetMetadata } from '@/types/budget';
import { formatKoreanWon, cn } from '@/lib/utils/format';
import { formatUnitConversion, type BudgetUnit } from '@/lib/utils/units';

interface RegionalExplorerProps {
  metroDataByYear: Record<number, BudgetTreeNode>;
  districtDataByYear: Record<number, BudgetTreeNode>;
  metadata: DatasetMetadata;
  initialYear: number;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

function createShallowTree(node: BudgetTreeNode): BudgetTreeNode {
  if (!node.children || node.children.length === 0) return node;
  return {
    ...node,
    children: node.children.map(child => ({
      id: child.id,
      name: child.name,
      value: calculateTotal(child),
      meta: child.meta,
    })),
  };
}

function findChild(node: BudgetTreeNode, name: string): BudgetTreeNode | undefined {
  return node.children?.find(c => c.name === name);
}

export function RegionalExplorer({ metroDataByYear, districtDataByYear, metadata, initialYear }: RegionalExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('metro');
  const [year, setYear] = useState(initialYear);
  const [vizMode, setVizMode] = useState<VisualizationMode>('treemap');
  const [colorMode, setColorMode] = useState<'category' | 'change'>('category');
  const [selectedUnit, setSelectedUnit] = useState<BudgetUnit | null>(null);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);

  const metroData = metroDataByYear[year];
  const districtData = districtDataByYear[year];
  const activeData = viewMode === 'metro' ? metroData : districtData;
  const { currentNode, breadcrumbs, path, drillDown, navigateTo } = useTreemapNavigation(activeData);

  useEffect(() => {
    navigateTo([]);
    setSelectedNodeName(null);
  }, [viewMode, activeData, navigateTo]);

  const totalValue = calculateTotal(currentNode);
  const shallowData = useMemo(() => createShallowTree(currentNode), [currentNode]);

  const domainContext = path.length > 0 ? path[0] : undefined;

  const selectedNode = selectedNodeName ? findChild(currentNode, selectedNodeName) : null;
  const selectedPath = selectedNode ? [...path, selectedNodeName!] : null;

  const activeDataByYear = viewMode === 'metro' ? metroDataByYear : districtDataByYear;

  // Previous year data for bubble chart change colors
  const prevYear = year - 1;
  const prevYearRoot = activeDataByYear[prevYear];
  const prevYearNode = useMemo(() => {
    if (!prevYearRoot) return undefined;
    let current = prevYearRoot;
    for (const segment of path) {
      const child = current.children?.find(c => c.name === segment);
      if (!child) return undefined;
      current = child;
    }
    return current;
  }, [prevYearRoot, path]);

  const totalUnitText = selectedUnit ? formatUnitConversion(totalValue, selectedUnit) : '';

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('metro')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                viewMode === 'metro' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              광역별
            </button>
            <button
              onClick={() => setViewMode('district')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                viewMode === 'district' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              자치구별
            </button>
          </div>

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); navigateTo([]); setSelectedNodeName(null); }}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background"
          >
            {metadata.availableYears.map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          {/* Unit converter */}
          <UnitConverter selectedUnit={selectedUnit} onSelectUnit={setSelectedUnit} />

          {/* Visualization mode toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setVizMode('treemap')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                vizMode === 'treemap' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              트리맵
            </button>
            <button
              onClick={() => setVizMode('bubble')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                vizMode === 'bubble' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              버블
            </button>
          </div>

          {/* Color mode toggle (only for bubble) */}
          {vizMode === 'bubble' && (
            <button
              onClick={() => setColorMode(prev => prev === 'category' ? 'change' : 'category')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                colorMode === 'change'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              변동률
            </button>
          )}
        </div>

        {/* Total amount display */}
        <div className="text-right">
          <div className="text-sm font-medium">
            총 {formatKoreanWon(totalValue)}
          </div>
          {totalUnitText && (
            <div className="text-xs text-muted-foreground">
              {totalUnitText}
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} onNavigate={(p) => { navigateTo(p); setSelectedNodeName(null); }} />

      {/* Bubble legend (when in bubble mode) */}
      {vizMode === 'bubble' && (
        <BubbleLegend maxAmount={totalValue} />
      )}

      {/* Main content: Visualization + optional Detail Panel */}
      <div className={cn('flex gap-4', selectedNode ? 'flex-col lg:flex-row' : '')}>
        {/* Visualization */}
        <div className={cn('flex-1 min-w-0', selectedNode ? 'lg:flex-[2]' : '')}>
          {vizMode === 'treemap' ? (
            <BudgetTreemap
              data={shallowData}
              domainContext={domainContext}
              viewMode={viewMode}
              onNodeClick={(nodeName) => {
                const targetNode = currentNode.children?.find(c => c.name === nodeName);
                if (targetNode && targetNode.children && targetNode.children.length > 0) {
                  drillDown(nodeName);
                  setSelectedNodeName(null);
                } else {
                  setSelectedNodeName(nodeName);
                }
              }}
            />
          ) : (
            <BudgetBubbleChart
              data={shallowData}
              domainContext={domainContext}
              viewMode={viewMode}
              colorMode={colorMode}
              prevYearData={prevYearNode ? createShallowTree(prevYearNode) : undefined}
              onNodeClick={(nodeName) => {
                const targetNode = currentNode.children?.find(c => c.name === nodeName);
                if (targetNode && targetNode.children && targetNode.children.length > 0) {
                  drillDown(nodeName);
                  setSelectedNodeName(null);
                } else {
                  setSelectedNodeName(nodeName);
                }
              }}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selectedNode && selectedPath && (
          <div className="lg:w-80 shrink-0">
            <BudgetDetailPanel
              node={selectedNode}
              path={selectedPath}
              allYearsData={activeDataByYear}
              availableYears={metadata.availableYears}
              currentYear={year}
              selectedUnit={selectedUnit}
              onClose={() => setSelectedNodeName(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
