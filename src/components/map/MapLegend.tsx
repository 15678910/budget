'use client';

import { useMemo } from 'react';
import { formatKoreanWon, formatPercent } from '@/lib/utils/format';
import type { MapMetric } from './MapControls';

interface MapLegendProps {
  min: number;
  max: number;
  metric: MapMetric;
  colorScale: (value: number) => string;
}

const METRIC_UNIT: Record<MapMetric, string> = {
  totalBudget: '총예산(백만원)',
  perCapita: '1인당 예산(원/인)',
  yoyChange: '전년 대비 증감률(%)',
};

function formatLegendValue(value: number, metric: MapMetric): string {
  switch (metric) {
    case 'totalBudget':
      return formatKoreanWon(value);
    case 'perCapita':
      return `${Math.round(value).toLocaleString('ko-KR')}원`;
    case 'yoyChange':
      return formatPercent(value);
  }
}

export function MapLegend({ min, max, metric, colorScale }: MapLegendProps) {
  // Build gradient stops from the color scale
  const gradientStops = useMemo(() => {
    const steps = 20;
    const stops: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const value = min + t * (max - min);
      const color = colorScale(value);
      const pct = (t * 100).toFixed(1);
      stops.push(`${color} ${pct}%`);
    }
    return stops.join(', ');
  }, [min, max, colorScale]);

  return (
    <div className="flex flex-col gap-1 bg-card border border-border rounded-lg px-4 py-3">
      <span className="text-xs text-muted-foreground font-medium">{METRIC_UNIT[metric]}</span>
      <div
        className="h-3 rounded-sm w-full"
        style={{
          background: `linear-gradient(to right, ${gradientStops})`,
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatLegendValue(min, metric)}</span>
        <span>{formatLegendValue(max, metric)}</span>
      </div>
    </div>
  );
}
