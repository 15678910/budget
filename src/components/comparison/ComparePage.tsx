"use client";

import { useState, useMemo } from "react";
import type { BudgetComparison, BudgetTreeNode, DatasetMetadata, ViewMode } from "@/types/budget";
import { buildComparison } from "@/lib/data/transform";
import { formatKoreanWon, formatPercent, cn } from "@/lib/utils/format";
import { getNodeColor } from "@/lib/utils/colors";
import { ShareButton } from "@/components/shared/ShareButton";
import { DataSources } from "@/components/shared/DataSources";

type SortKey = "amount" | "change" | "name";
type CompareViewMode = 'domain' | 'metro' | 'district' | 'education';

const COMPARE_VIEWS: { key: CompareViewMode; label: string; headerLabel: string }[] = [
  { key: 'domain', label: '분야별', headerLabel: '분야' },
  { key: 'metro', label: '광역별', headerLabel: '광역시도' },
  { key: 'district', label: '자치구별', headerLabel: '자치구' },
  { key: 'education', label: '교육청별', headerLabel: '교육청' },
];

interface ComparePageProps {
  domainDataByYear: Record<number, BudgetTreeNode>;
  metroDataByYear: Record<number, BudgetTreeNode>;
  districtDataByYear: Record<number, BudgetTreeNode>;
  educationDataByYear: Record<number, BudgetTreeNode>;
  metadata: DatasetMetadata;
  defaultYearA: number;
  defaultYearB: number;
}

export function ComparePage({
  domainDataByYear,
  metroDataByYear,
  districtDataByYear,
  educationDataByYear,
  metadata,
  defaultYearA,
  defaultYearB,
}: ComparePageProps) {
  const [yearA, setYearA] = useState(defaultYearA);
  const [yearB, setYearB] = useState(defaultYearB);
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [compareView, setCompareView] = useState<CompareViewMode>("domain");

  const dataMap: Record<CompareViewMode, Record<number, BudgetTreeNode>> = {
    domain: domainDataByYear,
    metro: metroDataByYear,
    district: districtDataByYear,
    education: educationDataByYear,
  };

  const activeDataByYear = dataMap[compareView];
  const viewModeForColor: ViewMode = compareView;

  const headerLabel = COMPARE_VIEWS.find(v => v.key === compareView)?.headerLabel ?? '분야';

  const comparisons = useMemo(() => {
    const dataA = activeDataByYear[yearA];
    const dataB = activeDataByYear[yearB];
    if (!dataA || !dataB) return [];
    return buildComparison(dataA, dataB, yearA, yearB);
  }, [activeDataByYear, yearA, yearB]);

  // Sort the comparisons based on sortKey
  const sorted = useMemo(() => {
    const copy = [...comparisons];
    switch (sortKey) {
      case "amount":
        return copy.sort((a, b) => b.yearB.amount - a.yearB.amount);
      case "change":
        return copy.sort(
          (a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent)
        );
      case "name":
        return copy.sort((a, b) => a.name.localeCompare(b.name, "ko"));
      default:
        return copy;
    }
  }, [comparisons, sortKey]);

  // Summary stats
  const totalA = comparisons.reduce((s, c) => s + c.yearA.amount, 0);
  const totalB = comparisons.reduce((s, c) => s + c.yearB.amount, 0);
  const totalDelta = totalB - totalA;
  const totalDeltaPercent = totalA > 0 ? (totalDelta / totalA) * 100 : 0;

  // Max amount for bar scaling
  const maxAmount = Math.max(
    ...comparisons.map((c) => Math.max(c.yearA.amount, c.yearB.amount)),
    1
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">연도별 비교</h1>
          <ShareButton />
        </div>

        <div className="flex items-center gap-2">
          {/* Year A selector */}
          <select
            value={yearA}
            onChange={(e) => setYearA(Number(e.target.value))}
            className="px-3 py-1.5 text-base rounded-lg border border-border bg-background text-foreground"
          >
            {metadata.availableYears.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>

          <span className="text-muted-foreground text-base">vs</span>

          {/* Year B selector */}
          <select
            value={yearB}
            onChange={(e) => setYearB(Number(e.target.value))}
            className="px-3 py-1.5 text-base rounded-lg border border-border bg-background text-foreground"
          >
            {metadata.availableYears.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compare view toggle */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex bg-muted rounded-lg p-1">
          {COMPARE_VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCompareView(key)}
              className={cn(
                "px-3 py-1.5 text-base rounded-md transition-colors",
                compareView === key
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label={`${yearA}년 총예산`} value={formatKoreanWon(totalA)} />
        <SummaryCard label={`${yearB}년 총예산`} value={formatKoreanWon(totalB)} />
        <SummaryCard
          label="증감액"
          value={formatKoreanWon(totalDelta)}
          accent={totalDelta > 0 ? "increase" : totalDelta < 0 ? "decrease" : "neutral"}
        />
        <SummaryCard
          label="증감률"
          value={formatPercent(totalDeltaPercent)}
          accent={totalDeltaPercent > 0 ? "increase" : totalDeltaPercent < 0 ? "decrease" : "neutral"}
        />
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base text-muted-foreground">정렬:</span>
        <div className="flex bg-muted rounded-lg p-1">
          {([
            ["amount", "예산규모"],
            ["change", "변동률"],
            ["name", "이름"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={cn(
                "px-3 py-1 text-base rounded-md transition-colors",
                sortKey === key
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_2fr] gap-2 px-4 py-3 bg-muted text-base font-medium text-muted-foreground border-b border-border">
          <div>{headerLabel}</div>
          <div className="text-right">{yearA}년</div>
          <div className="text-right">{yearB}년</div>
          <div className="text-right">증감</div>
          <div className="text-right">증감률</div>
          <div>비교</div>
        </div>

        {/* Rows */}
        {sorted.map((item) => (
          <ComparisonRow
            key={item.id}
            item={item}
            maxAmount={maxAmount}
            yearA={yearA}
            yearB={yearB}
            viewMode={viewModeForColor}
          />
        ))}

        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-base">
            선택한 연도에 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* Data Sources */}
      <DataSources />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "increase" | "decrease" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div
        className={cn(
          "text-lg font-bold",
          accent === "increase" && "text-red-500 dark:text-red-400",
          accent === "decrease" && "text-blue-500 dark:text-blue-400",
          !accent && "text-card-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ComparisonRow({
  item,
  maxAmount,
  yearA,
  yearB,
  viewMode,
}: {
  item: BudgetComparison;
  maxAmount: number;
  yearA: number;
  yearB: number;
  viewMode: ViewMode;
}) {
  const barWidthA = (item.yearA.amount / maxAmount) * 100;
  const barWidthB = (item.yearB.amount / maxAmount) * 100;
  const itemColor = getNodeColor(item.name, viewMode);

  const isIncrease = item.delta > 0;
  const isDecrease = item.delta < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_100px_2fr] gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors items-center">
      {/* Name with color accent */}
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: itemColor }}
        />
        <span className="font-medium text-foreground text-base">{item.name}</span>
      </div>

      {/* Year A amount */}
      <div className="text-right text-base text-muted-foreground">
        <span className="md:hidden text-sm mr-1">{yearA}년:</span>
        {formatKoreanWon(item.yearA.amount)}
      </div>

      {/* Year B amount */}
      <div className="text-right text-base text-foreground font-medium">
        <span className="md:hidden text-sm mr-1 font-normal text-muted-foreground">{yearB}년:</span>
        {formatKoreanWon(item.yearB.amount)}
      </div>

      {/* Delta */}
      <div
        className={cn(
          "text-right text-base font-medium",
          isIncrease && "text-red-500 dark:text-red-400",
          isDecrease && "text-blue-500 dark:text-blue-400",
          !isIncrease && !isDecrease && "text-muted-foreground"
        )}
      >
        {formatKoreanWon(item.delta)}
      </div>

      {/* Delta percent */}
      <div
        className={cn(
          "text-right text-base font-bold",
          isIncrease && "text-red-500 dark:text-red-400",
          isDecrease && "text-blue-500 dark:text-blue-400",
          !isIncrease && !isDecrease && "text-muted-foreground"
        )}
      >
        {formatPercent(item.deltaPercent)}
      </div>

      {/* Bar chart */}
      <div className="flex flex-col gap-1 justify-center min-w-0">
        {/* Year A bar */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-6 shrink-0">
            {String(yearA).slice(2)}
          </span>
          <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm opacity-50"
              style={{
                width: `${barWidthA}%`,
                backgroundColor: itemColor,
              }}
            />
          </div>
        </div>
        {/* Year B bar */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground w-6 shrink-0">
            {String(yearB).slice(2)}
          </span>
          <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${barWidthB}%`,
                backgroundColor: itemColor,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
