"use client";

import { useState, useEffect, useMemo } from 'react';
import { BudgetTreemap } from './treemap/BudgetTreemap';
import { BudgetBubbleChart } from './bubble/BudgetBubbleChart';
import { BubbleLegend } from './bubble/BubbleLegend';
import { Breadcrumb } from './layout/Breadcrumb';
import { BudgetDetailPanel } from './detail/BudgetDetailPanel';
import { UnitConverter } from './shared/UnitConverter';
import { DataSources } from './shared/DataSources';
import { useTreemapNavigation } from '@/hooks/useTreemapNavigation';
import type { BudgetTreeNode, ViewMode, VisualizationMode, DatasetMetadata } from '@/types/budget';
import { formatKoreanWon, formatPerCapita, cn } from '@/lib/utils/format';
import { formatUnitConversion, type BudgetUnit } from '@/lib/utils/units';
import { POPULATION_BY_YEAR } from '@/lib/constants';

interface BudgetExplorerProps {
  domainDataByYear: Record<number, BudgetTreeNode>;
  ministryDataByYear: Record<number, BudgetTreeNode>;
  metroDataByYear: Record<number, BudgetTreeNode>;
  districtDataByYear: Record<number, BudgetTreeNode>;
  educationDataByYear: Record<number, BudgetTreeNode>;
  metadata: DatasetMetadata;
  initialYear: number;
}

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'domain', label: '분야별' },
  { key: 'ministry', label: '부처별' },
  { key: 'metro', label: '광역별' },
  { key: 'district', label: '자치구별' },
  { key: 'education', label: '교육청별' },
];

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

export function BudgetExplorer({
  domainDataByYear,
  ministryDataByYear,
  metroDataByYear,
  districtDataByYear,
  educationDataByYear,
  metadata,
  initialYear,
}: BudgetExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('domain');
  const [year, setYear] = useState(initialYear);
  const [showPerCapita, setShowPerCapita] = useState(false);
  const [vizMode, setVizMode] = useState<VisualizationMode>('treemap');
  const [colorMode, setColorMode] = useState<'category' | 'change'>('category');
  const [selectedUnit, setSelectedUnit] = useState<BudgetUnit | null>(null);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);

  const dataMap: Record<ViewMode, Record<number, BudgetTreeNode>> = {
    domain: domainDataByYear,
    ministry: ministryDataByYear,
    metro: metroDataByYear,
    district: districtDataByYear,
    education: educationDataByYear,
  };

  const activeDataByYear = dataMap[viewMode];
  const activeData = activeDataByYear[year];
  const { currentNode, breadcrumbs, path, drillDown, navigateTo } = useTreemapNavigation(activeData);

  // Reset navigation when viewMode or data changes
  useEffect(() => {
    navigateTo([]);
    setSelectedNodeName(null);
  }, [viewMode, activeData, navigateTo]);

  const totalValue = calculateTotal(currentNode);
  const shallowData = useMemo(() => createShallowTree(currentNode), [currentNode]);

  const domainContext = path.length > 0 ? path[0] : undefined;
  const population = POPULATION_BY_YEAR[year] ?? 51_486_000;

  // Selected node for detail panel
  const selectedNode = selectedNodeName ? findChild(currentNode, selectedNodeName) : null;
  const selectedPath = selectedNode ? [...path, selectedNodeName!] : null;

  // Previous year data for bubble chart change colors — traverse to same path
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

  // Unit conversion text for total
  const totalUnitText = selectedUnit ? formatUnitConversion(totalValue, selectedUnit) : '';

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            {VIEW_MODES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setViewMode(key); }}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  viewMode === key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
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

          {/* Per capita toggle */}
          <button
            onClick={() => setShowPerCapita(prev => !prev)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-lg border transition-colors',
              showPerCapita
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            )}
          >
            1인당
          </button>

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
          {showPerCapita && (
            <div className="text-xs text-muted-foreground">
              1인당 {formatPerCapita(totalValue, population)}
            </div>
          )}
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

      {/* Data Sources */}
      <DataSources />
    </div>
  );
}
