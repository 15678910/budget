'use client';

import { formatKoreanWon, formatPercent } from '@/lib/utils/format';
import type { MapMetric } from './MapControls';

interface MapTooltipProps {
  regionName: string;
  value: number;
  metric: MapMetric;
  population: number;
  x: number;
  y: number;
  healthGrade?: string | null;
  /** True when hovering a 광역(시·도) on the province map (not a drilled-down 시·군·구). */
  isMetroLevel?: boolean;
  /** False when this region has no matching budget data (renders "데이터 없음" instead of a value). */
  hasData?: boolean;
}

export function MapTooltip({ regionName, value, metric, population, x, y, healthGrade, isMetroLevel, hasData = true }: MapTooltipProps) {
  const formattedValue = (() => {
    switch (metric) {
      case 'totalBudget':
        return formatKoreanWon(value);
      case 'perCapita':
        return `${Math.round(value).toLocaleString('ko-KR')}원/인`;
      case 'yoyChange':
        return formatPercent(value);
      case 'healthScore':
        return `등급: ${healthGrade ?? '-'} (${Math.round(value)}점)`;
    }
  })();

  const metricLabel = (() => {
    switch (metric) {
      case 'totalBudget':
        return '총예산';
      case 'perCapita':
        return '1인당 예산';
      case 'yoyChange':
        return '전년 대비';
      case 'healthScore':
        return '건전성 점수';
    }
  })();

  return (
    <div
      className="fixed z-50 pointer-events-none bg-card text-card-foreground border border-border rounded-lg shadow-lg p-3 text-sm max-w-xs"
      style={{
        left: x + 14,
        top: y + 14,
      }}
    >
      <div className="font-semibold text-base mb-1">{regionName}</div>
      {hasData ? (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{metricLabel}</span>
            <span className="font-medium">{formattedValue}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">인구</span>
            <span className="font-medium">{population.toLocaleString('ko-KR')}명</span>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground">데이터 없음</div>
      )}
      {isMetroLevel && (
        <div className="mt-1 text-[12px] text-muted-foreground">
          시·도 본청 예산(소속 시·군·구 제외)
        </div>
      )}
    </div>
  );
}
