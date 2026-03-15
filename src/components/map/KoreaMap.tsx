'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as topojson from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';
import * as d3Scale from 'd3-scale';
import type { BudgetTreeNode } from '@/types/budget';
import { METRO_POPULATION } from '@/lib/utils/extract-entity';
import { MapControls, type MapMetric } from './MapControls';
import { MapTooltip } from './MapTooltip';
import { MapLegend } from './MapLegend';
import { RegionDetailPanel } from './RegionDetailPanel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KoreaMapProps {
  metroDataByYear: Record<number, BudgetTreeNode>;
  geoData: any; // TopoJSON object
  availableYears: number[];
}

interface RegionMetricData {
  budgetName: string;
  totalBudget: number;   // in 백만원
  population: number;
  perCapita: number;      // 원/인
  yoyChange: number | null;
}

// ---------------------------------------------------------------------------
// GeoJSON name -> Budget name mapping
// ---------------------------------------------------------------------------

const GEO_TO_BUDGET: Record<string, string> = {
  '서울특별시': '서울특별시',
  '부산광역시': '부산광역시',
  '대구광역시': '대구광역시',
  '인천광역시': '인천광역시',
  '광주광역시': '광주광역시',
  '대전광역시': '대전광역시',
  '울산광역시': '울산광역시',
  '세종특별자치시': '세종특별자치시',
  '경기도': '경기도',
  '강원도': '강원특별자치도',
  '충청북도': '충청북도',
  '충청남도': '충청남도',
  '전라북도': '전북특별자치도',
  '전라남도': '전라남도',
  '경상북도': '경상북도',
  '경상남도': '경상남도',
  '제주특별자치도': '제주특별자치도',
};

function geoNameToBudgetName(geoName: string): string {
  return GEO_TO_BUDGET[geoName] ?? geoName;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/** Linearly interpolate between two hex colors */
function lerpColor(a: string, b: string, t: number): string {
  const parseHex = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(r1 + (r2 - r1) * t);
  const g = clamp(g1 + (g2 - g1) * t);
  const bl = clamp(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KoreaMap({ metroDataByYear, geoData, availableYears }: KoreaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [year, setYear] = useState(() => availableYears[availableYears.length - 1] ?? 2026);
  const [metric, setMetric] = useState<MapMetric>('totalBudget');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ---------- Resize observer ----------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ---------- Convert TopoJSON to GeoJSON features ----------
  const features = useMemo(() => {
    if (!geoData?.objects) return [];
    // Use the first available object key if the expected one isn't present
    const objectKey = geoData.objects.skorea_provinces_2018_geo
      ? 'skorea_provinces_2018_geo'
      : Object.keys(geoData.objects)[0];
    if (!objectKey) return [];
    const fc = topojson.feature(geoData, geoData.objects[objectKey]);
    return (fc as any).features as any[];
  }, [geoData]);

  // ---------- Projection & path generator ----------
  const { projection, pathGenerator } = useMemo(() => {
    if (features.length === 0 || dimensions.width === 0) {
      return { projection: null, pathGenerator: null };
    }
    const padding = 20;
    const proj = geoMercator().fitSize(
      [dimensions.width - padding * 2, dimensions.height - padding * 2],
      { type: 'FeatureCollection', features } as any,
    );
    // Shift by padding
    const [tx, ty] = proj.translate();
    proj.translate([tx + padding, ty + padding]);
    const pg = geoPath().projection(proj);
    return { projection: proj, pathGenerator: pg };
  }, [features, dimensions]);

  // ---------- Compute region metrics ----------
  const regionMetrics = useMemo(() => {
    const map = new Map<string, RegionMetricData>();
    const currentData = metroDataByYear[year];
    if (!currentData?.children) return map;

    const prevYear = year - 1;
    const prevData = metroDataByYear[prevYear];

    for (const metro of currentData.children) {
      const total = calculateTotal(metro);
      const pop = METRO_POPULATION[metro.name] ?? 0;
      const perCap = pop > 0 ? Math.round((total * 1_000_000) / pop) : 0;

      let yoy: number | null = null;
      if (prevData?.children) {
        const prevMetro = prevData.children.find((c) => c.name === metro.name);
        if (prevMetro) {
          const prevTotal = calculateTotal(prevMetro);
          if (prevTotal > 0) {
            yoy = ((total - prevTotal) / prevTotal) * 100;
          }
        }
      }

      map.set(metro.name, {
        budgetName: metro.name,
        totalBudget: total,
        population: pop,
        perCapita: perCap,
        yoyChange: yoy,
      });
    }

    return map;
  }, [metroDataByYear, year]);

  // ---------- Extract values for the active metric ----------
  const metricValues = useMemo(() => {
    const values = new Map<string, number>();
    for (const [name, data] of regionMetrics) {
      switch (metric) {
        case 'totalBudget':
          values.set(name, data.totalBudget);
          break;
        case 'perCapita':
          values.set(name, data.perCapita);
          break;
        case 'yoyChange':
          values.set(name, data.yoyChange ?? 0);
          break;
      }
    }
    return values;
  }, [regionMetrics, metric]);

  // ---------- Color scale ----------
  const { colorScale, minValue, maxValue } = useMemo(() => {
    const vals = Array.from(metricValues.values());
    if (vals.length === 0) {
      return {
        colorScale: () => '#cccccc',
        minValue: 0,
        maxValue: 1,
      };
    }

    const mn = Math.min(...vals);
    const mx = Math.max(...vals);

    if (metric === 'yoyChange') {
      // Diverging scale: blue (negative) -> white (zero) -> red (positive)
      const absMax = Math.max(Math.abs(mn), Math.abs(mx), 1);
      const scale = d3Scale.scaleLinear<number>().domain([-absMax, 0, absMax]).range([0, 0.5, 1]).clamp(true);
      const colorFn = (value: number): string => {
        const t = scale(value);
        if (t <= 0.5) {
          // Blue to white
          return lerpColor('#2166ac', '#f7f7f7', t * 2);
        }
        // White to red
        return lerpColor('#f7f7f7', '#b2182b', (t - 0.5) * 2);
      };
      return { colorScale: colorFn, minValue: -absMax, maxValue: absMax };
    }

    if (metric === 'perCapita') {
      const scale = d3Scale.scaleLinear<number>().domain([mn, mx]).range([0, 1]).clamp(true);
      const colorFn = (value: number): string => lerpColor('#e0f5e0', '#1a6b1a', scale(value));
      return { colorScale: colorFn, minValue: mn, maxValue: mx };
    }

    // totalBudget
    const scale = d3Scale.scaleLinear<number>().domain([mn, mx]).range([0, 1]).clamp(true);
    const colorFn = (value: number): string => lerpColor('#e0f0ff', '#1a5276', scale(value));
    return { colorScale: colorFn, minValue: mn, maxValue: mx };
  }, [metricValues, metric]);

  // ---------- Event handlers ----------
  const handleRegionClick = useCallback((budgetName: string) => {
    setSelectedRegion((prev) => (prev === budgetName ? null : budgetName));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // ---------- Get data for hovered region ----------
  const hoveredBudgetName = hoveredRegion ? geoNameToBudgetName(hoveredRegion) : null;
  const hoveredData = hoveredBudgetName ? regionMetrics.get(hoveredBudgetName) : null;
  const hoveredValue = hoveredBudgetName ? (metricValues.get(hoveredBudgetName) ?? 0) : 0;

  // ---------- Render ----------
  return (
    <div className="flex flex-col h-full gap-3">
      <MapControls
        year={year}
        onYearChange={setYear}
        metric={metric}
        onMetricChange={setMetric}
        availableYears={availableYears}
      />

      <div className="flex flex-1 gap-4 flex-col lg:flex-row">
        {/* Map area */}
        <div
          ref={containerRef}
          className="flex-1 relative min-h-[400px] border border-border rounded-lg overflow-hidden bg-card"
          onMouseMove={handleMouseMove}
        >
          {pathGenerator && (
            <svg width={dimensions.width} height={dimensions.height}>
              {features.map((feature) => {
                const geoName = feature.properties?.name ?? feature.properties?.NAME ?? '';
                const budgetName = geoNameToBudgetName(geoName);
                const value = metricValues.get(budgetName) ?? 0;
                const color = colorScale(value);
                const isHovered = hoveredRegion === geoName;
                const isSelected = selectedRegion === budgetName;

                return (
                  <path
                    key={geoName}
                    d={pathGenerator(feature) ?? ''}
                    fill={color}
                    stroke={
                      isSelected
                        ? 'hsl(var(--primary))'
                        : isHovered
                          ? 'hsl(var(--foreground))'
                          : 'hsl(var(--border))'
                    }
                    strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.5}
                    onMouseEnter={() => setHoveredRegion(geoName)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => handleRegionClick(budgetName)}
                    className="cursor-pointer transition-opacity"
                    fillOpacity={isHovered ? 0.9 : 0.8}
                  />
                );
              })}
            </svg>
          )}

          {/* Tooltip */}
          {hoveredRegion && hoveredData && (
            <MapTooltip
              regionName={hoveredBudgetName ?? hoveredRegion}
              value={hoveredValue}
              metric={metric}
              population={hoveredData.population}
              x={mousePos.x}
              y={mousePos.y}
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedRegion && metroDataByYear[year] && (
          <RegionDetailPanel
            regionName={selectedRegion}
            metroData={metroDataByYear[year]}
            prevYearData={metroDataByYear[year - 1]}
            year={year}
            onClose={() => setSelectedRegion(null)}
          />
        )}
      </div>

      <MapLegend
        min={minValue}
        max={maxValue}
        metric={metric}
        colorScale={colorScale}
      />
    </div>
  );
}
