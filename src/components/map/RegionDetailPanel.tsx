'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { BudgetTreeNode } from '@/types/budget';
import { formatKoreanWon, formatPercent } from '@/lib/utils/format';
import { METRO_POPULATION } from '@/lib/utils/extract-entity';

interface RegionDetailPanelProps {
  regionName: string;
  metroData: BudgetTreeNode;
  prevYearData?: BudgetTreeNode;
  year: number;
  onClose: () => void;
  /** When set, we're in district drill-down mode. metroData is the district root. */
  parentMetroName?: string;
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

export function RegionDetailPanel({
  regionName,
  metroData,
  prevYearData,
  year,
  onClose,
  parentMetroName,
}: RegionDetailPanelProps) {
  // In district mode: metroData is the district root (지방재정 총계)
  // We need to find: root → parentMetro → regionName
  const regionNode = useMemo(() => {
    if (parentMetroName) {
      const metroNode = metroData.children?.find((c) => c.name === parentMetroName);
      return metroNode?.children?.find((c) => c.name === regionName) ?? null;
    }
    return metroData.children?.find((c) => c.name === regionName) ?? null;
  }, [metroData, regionName, parentMetroName]);

  const prevRegionNode = useMemo(() => {
    if (!prevYearData) return null;
    if (parentMetroName) {
      const prevMetroNode = prevYearData.children?.find((c) => c.name === parentMetroName);
      return prevMetroNode?.children?.find((c) => c.name === regionName) ?? null;
    }
    return prevYearData.children?.find((c) => c.name === regionName) ?? null;
  }, [prevYearData, regionName, parentMetroName]);

  const { totalBudget, population, perCapita, yoyChange, categories } = useMemo(() => {
    if (!regionNode) {
      return { totalBudget: 0, population: 0, perCapita: 0, yoyChange: null as number | null, categories: [] };
    }

    const cats = (regionNode.children || []).map((c) => ({
      name: c.name,
      value: calculateTotal(c),
    }));
    const total = cats.reduce((sum, c) => sum + c.value, 0);

    // Population: for district mode, approximate from metro population
    let pop: number;
    if (parentMetroName) {
      const metroPop = METRO_POPULATION[parentMetroName] ?? 0;
      // Find the metro node to count districts (excluding 본청)
      const metroNode = metroData.children?.find((c) => c.name === parentMetroName);
      const numDistricts = (metroNode?.children ?? []).filter((c) => c.name !== '본청').length || 1;
      pop = Math.round(metroPop / numDistricts);
    } else {
      pop = METRO_POPULATION[regionName] ?? 0;
    }
    const perCap = pop > 0 ? Math.round((total * 1_000_000) / pop) : 0;

    let yoy: number | null = null;
    if (prevRegionNode) {
      const prevCats = (prevRegionNode.children || []).map((c) => calculateTotal(c));
      const prevTotal = prevCats.reduce((sum, v) => sum + v, 0);
      if (prevTotal > 0) {
        yoy = ((total - prevTotal) / prevTotal) * 100;
      }
    }

    // Sort by value descending
    cats.sort((a, b) => b.value - a.value);

    return { totalBudget: total, population: pop, perCapita: perCap, yoyChange: yoy, categories: cats };
  }, [regionNode, prevRegionNode, regionName, parentMetroName, metroData]);

  if (!regionNode) {
    return null;
  }

  const maxCategoryValue = categories.length > 0 ? categories[0].value : 1;

  return (
    <div className="w-full lg:w-80 bg-card border border-border rounded-lg p-4 flex flex-col gap-3 overflow-y-auto max-h-[600px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{regionName}</h3>
          <p className="text-xs text-muted-foreground">
            {parentMetroName && <span>{parentMetroName} · </span>}
            {year}년 예산
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted rounded-md p-2">
          <div className="text-xs text-muted-foreground">총예산</div>
          <div className="text-sm font-semibold text-foreground">{formatKoreanWon(totalBudget)}</div>
        </div>
        <div className="bg-muted rounded-md p-2">
          <div className="text-xs text-muted-foreground">1인당 예산</div>
          <div className="text-sm font-semibold text-foreground">{perCapita.toLocaleString('ko-KR')}원</div>
        </div>
        <div className="bg-muted rounded-md p-2">
          <div className="text-xs text-muted-foreground">인구{parentMetroName ? ' (추정)' : ''}</div>
          <div className="text-sm font-semibold text-foreground">{population.toLocaleString('ko-KR')}명</div>
        </div>
        <div className="bg-muted rounded-md p-2">
          <div className="text-xs text-muted-foreground">전년 대비</div>
          <div className={`text-sm font-semibold ${
            yoyChange === null
              ? 'text-muted-foreground'
              : yoyChange >= 0
                ? 'text-red-500'
                : 'text-blue-500'
          }`}>
            {yoyChange !== null ? formatPercent(yoyChange) : '-'}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">분야별 예산</h4>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => {
            const pct = totalBudget > 0 ? (cat.value / totalBudget) * 100 : 0;
            const barWidth = maxCategoryValue > 0 ? (cat.value / maxCategoryValue) * 100 : 0;
            return (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-foreground truncate mr-2">{cat.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatKoreanWon(cat.value)} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action links */}
      <div className="flex flex-col gap-2 mt-auto">
        <Link
          href={
            parentMetroName
              ? `/fiscal-doctor?type=district&metro=${encodeURIComponent(parentMetroName)}&district=${encodeURIComponent(regionName)}`
              : `/fiscal-doctor?type=metro&metro=${encodeURIComponent(regionName)}`
          }
          className="block text-center text-sm bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 transition-colors"
        >
          AI 정책진단
        </Link>
        <Link
          href="/regional-compare"
          className="block text-center text-sm text-primary hover:text-primary/80 border border-primary/30 rounded-md py-2 transition-colors"
        >
          비교하기
        </Link>
      </div>
    </div>
  );
}
