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
  healthScore: '재정건전성 점수',
};

function formatLegendValue(value: number, metric: MapMetric): string {
  switch (metric) {
    case 'totalBudget':
      return formatKoreanWon(value);
    case 'perCapita':
      return `${Math.round(value).toLocaleString('ko-KR')}원`;
    case 'yoyChange':
      return formatPercent(value);
    case 'healthScore':
      return `${value}점`;
  }
}

const HEALTH_GRADE_LEGEND = [
  { grade: 'A', color: '#22c55e', label: 'A (80~100)' },
  { grade: 'B', color: '#3b82f6', label: 'B (65~79)' },
  { grade: 'C', color: '#eab308', label: 'C (50~64)' },
  { grade: 'D', color: '#f97316', label: 'D (35~49)' },
  { grade: 'F', color: '#ef4444', label: 'F (0~34)' },
];

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

  if (metric === 'healthScore') {
    return (
      <div className="flex flex-col gap-1 bg-card border border-border rounded-lg px-4 py-3">
        <span className="text-xs text-muted-foreground font-medium">{METRIC_UNIT[metric]}</span>
        <div className="flex flex-wrap gap-3">
          {HEALTH_GRADE_LEGEND.map(({ grade, color, label }) => (
            <div key={grade} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: '#6b7280' }} />
            <span className="text-xs text-muted-foreground">데이터 없음</span>
          </div>
        </div>
      </div>
    );
  }

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
