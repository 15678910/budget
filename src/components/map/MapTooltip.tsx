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
}

export function MapTooltip({ regionName, value, metric, population, x, y }: MapTooltipProps) {
  const formattedValue = (() => {
    switch (metric) {
      case 'totalBudget':
        return formatKoreanWon(value);
      case 'perCapita':
        return `${Math.round(value).toLocaleString('ko-KR')}원/인`;
      case 'yoyChange':
        return formatPercent(value);
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
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">{metricLabel}</span>
        <span className="font-medium">{formattedValue}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">인구</span>
        <span className="font-medium">{population.toLocaleString('ko-KR')}명</span>
      </div>
    </div>
  );
}
