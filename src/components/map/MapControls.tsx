'use client';

export type MapMetric = 'totalBudget' | 'perCapita' | 'yoyChange';

interface MapControlsProps {
  year: number;
  onYearChange: (year: number) => void;
  metric: MapMetric;
  onMetricChange: (metric: MapMetric) => void;
  availableYears: number[];
}

const METRIC_LABELS: Record<MapMetric, string> = {
  totalBudget: '총예산',
  perCapita: '1인당 예산',
  yoyChange: '전년 대비 증감률',
};

export function MapControls({
  year,
  onYearChange,
  metric,
  onMetricChange,
  availableYears,
}: MapControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
      {/* Year selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="map-year-select" className="text-sm font-medium text-muted-foreground">
          연도
        </label>
        <select
          id="map-year-select"
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="bg-muted text-foreground border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {/* Metric toggle buttons */}
      <div className="flex items-center gap-1 ml-auto">
        {(Object.keys(METRIC_LABELS) as MapMetric[]).map((m) => (
          <button
            key={m}
            onClick={() => onMetricChange(m)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              metric === m
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  );
}
