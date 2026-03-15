'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as topojson from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';
import * as d3Scale from 'd3-scale';
import type { BudgetTreeNode } from '@/types/budget';
import { METRO_POPULATION } from '@/lib/utils/extract-entity';
import { BUDGET_NAME_TO_PROVINCE_CODE, matchDistrictName } from '@/lib/utils/geo-utils';
import { formatKoreanWon } from '@/lib/utils/format';
import { MapControls, type MapMetric } from './MapControls';
import { MapTooltip } from './MapTooltip';
import { MapLegend } from './MapLegend';
import { RegionDetailPanel } from './RegionDetailPanel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KoreaMapProps {
  metroDataByYear: Record<number, BudgetTreeNode>;
  districtDataByYear: Record<number, BudgetTreeNode>;
  geoData: any; // Province TopoJSON
  districtGeoData: any; // Municipality TopoJSON
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
// GeoJSON name -> Budget name mapping (province level)
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

export function KoreaMap({
  metroDataByYear,
  districtDataByYear,
  geoData,
  districtGeoData,
  availableYears,
}: KoreaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [year, setYear] = useState(() => availableYears[availableYears.length - 1] ?? 2026);
  const [metric, setMetric] = useState<MapMetric>('totalBudget');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [drillMetro, setDrillMetro] = useState<string | null>(null); // null = province view

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

  // ---------- Convert province TopoJSON to GeoJSON features ----------
  const provinceFeatures = useMemo(() => {
    if (!geoData?.objects) return [];
    const objectKey = geoData.objects.skorea_provinces_2018_geo
      ? 'skorea_provinces_2018_geo'
      : Object.keys(geoData.objects)[0];
    if (!objectKey) return [];
    const fc = topojson.feature(geoData, geoData.objects[objectKey]);
    return (fc as any).features as any[];
  }, [geoData]);

  // ---------- Convert municipality TopoJSON to GeoJSON features ----------
  const allDistrictFeatures = useMemo(() => {
    if (!districtGeoData?.objects) return [];
    const objectKey = districtGeoData.objects.skorea_municipalities_geo
      ? 'skorea_municipalities_geo'
      : Object.keys(districtGeoData.objects)[0];
    if (!objectKey) return [];
    const fc = topojson.feature(districtGeoData, districtGeoData.objects[objectKey]);
    return (fc as any).features as any[];
  }, [districtGeoData]);

  // ---------- Filter district features for drilled metro ----------
  const drillDistrictFeatures = useMemo(() => {
    if (!drillMetro) return [];
    const provinceCode = BUDGET_NAME_TO_PROVINCE_CODE[drillMetro];
    if (!provinceCode) return [];
    return allDistrictFeatures.filter(
      (f: any) => f.properties?.code?.startsWith(provinceCode)
    );
  }, [drillMetro, allDistrictFeatures]);

  // ---------- Active features (province or district) ----------
  const activeFeatures = drillMetro ? drillDistrictFeatures : provinceFeatures;

  // ---------- Get district budget nodes for drilled metro ----------
  const drillDistrictNodes = useMemo(() => {
    if (!drillMetro) return [];
    const districtRoot = districtDataByYear[year];
    if (!districtRoot?.children) return [];
    const metroNode = districtRoot.children.find((c) => c.name === drillMetro);
    return metroNode?.children ?? [];
  }, [drillMetro, districtDataByYear, year]);

  // ---------- Budget name list for name matching ----------
  const drillBudgetNames = useMemo(() => {
    return drillDistrictNodes.map((n) => n.name);
  }, [drillDistrictNodes]);

  // ---------- Geo-to-budget mapping for district drill-down ----------
  const districtGeoToBudget = useMemo(() => {
    if (!drillMetro) return new Map<string, string>();
    const provinceCode = BUDGET_NAME_TO_PROVINCE_CODE[drillMetro] ?? '';
    const mapping = new Map<string, string>();
    for (const feature of drillDistrictFeatures) {
      const geoName = feature.properties?.name ?? '';
      const matched = matchDistrictName(geoName, provinceCode, drillBudgetNames);
      if (matched) {
        mapping.set(geoName, matched);
      }
    }
    return mapping;
  }, [drillMetro, drillDistrictFeatures, drillBudgetNames]);

  // ---------- 본청 budget (not shown on map) ----------
  const hqBudget = useMemo(() => {
    if (!drillMetro) return 0;
    const hqNode = drillDistrictNodes.find((n) => n.name === '본청');
    return hqNode ? calculateTotal(hqNode) : 0;
  }, [drillMetro, drillDistrictNodes]);

  // ---------- Projection & path generator ----------
  const { pathGenerator } = useMemo(() => {
    if (activeFeatures.length === 0 || dimensions.width === 0) {
      return { projection: null, pathGenerator: null };
    }
    const padding = 20;
    const proj = geoMercator().fitSize(
      [dimensions.width - padding * 2, dimensions.height - padding * 2],
      { type: 'FeatureCollection', features: activeFeatures } as any,
    );
    const [tx, ty] = proj.translate();
    proj.translate([tx + padding, ty + padding]);
    const pg = geoPath().projection(proj);
    return { projection: proj, pathGenerator: pg };
  }, [activeFeatures, dimensions]);

  // ---------- Compute region metrics ----------
  const regionMetrics = useMemo(() => {
    const map = new Map<string, RegionMetricData>();

    if (drillMetro) {
      // District mode: compute from district budget nodes
      const prevDistrictRoot = districtDataByYear[year - 1];
      const prevMetroNode = prevDistrictRoot?.children?.find((c) => c.name === drillMetro);
      const prevDistrictNodes = prevMetroNode?.children ?? [];
      const metroPop = METRO_POPULATION[drillMetro] ?? 0;
      const numDistricts = drillDistrictNodes.filter((n) => n.name !== '본청').length || 1;

      for (const node of drillDistrictNodes) {
        if (node.name === '본청') continue; // Skip 본청 - no geo polygon
        const total = calculateTotal(node);
        const pop = Math.round(metroPop / numDistricts); // approximate
        const perCap = pop > 0 ? Math.round((total * 1_000_000) / pop) : 0;

        let yoy: number | null = null;
        const prevNode = prevDistrictNodes.find((c) => c.name === node.name);
        if (prevNode) {
          const prevTotal = calculateTotal(prevNode);
          if (prevTotal > 0) {
            yoy = ((total - prevTotal) / prevTotal) * 100;
          }
        }

        map.set(node.name, {
          budgetName: node.name,
          totalBudget: total,
          population: pop,
          perCapita: perCap,
          yoyChange: yoy,
        });
      }
    } else {
      // Province mode (existing logic)
      const currentData = metroDataByYear[year];
      if (!currentData?.children) return map;
      const prevData = metroDataByYear[year - 1];

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
    }

    return map;
  }, [metroDataByYear, districtDataByYear, drillMetro, drillDistrictNodes, year]);

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
      const absMax = Math.max(Math.abs(mn), Math.abs(mx), 1);
      const scale = d3Scale.scaleLinear<number>().domain([-absMax, 0, absMax]).range([0, 0.5, 1]).clamp(true);
      const colorFn = (value: number): string => {
        const t = scale(value);
        if (t <= 0.5) {
          return lerpColor('#2166ac', '#f7f7f7', t * 2);
        }
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
    if (drillMetro) {
      // In district view: select district for detail panel
      setSelectedRegion((prev) => (prev === budgetName ? null : budgetName));
    } else {
      // In province view: drill down into the province
      setDrillMetro(budgetName);
      setSelectedRegion(null);
      setHoveredRegion(null);
    }
  }, [drillMetro]);

  const handleBack = useCallback(() => {
    setDrillMetro(null);
    setSelectedRegion(null);
    setHoveredRegion(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // ---------- Resolve geo name to budget name ----------
  const resolveBudgetName = useCallback((geoName: string): string => {
    if (drillMetro) {
      return districtGeoToBudget.get(geoName) ?? geoName;
    }
    return geoNameToBudgetName(geoName);
  }, [drillMetro, districtGeoToBudget]);

  // ---------- Get data for hovered region ----------
  const hoveredBudgetName = hoveredRegion ? resolveBudgetName(hoveredRegion) : null;
  const hoveredData = hoveredBudgetName ? regionMetrics.get(hoveredBudgetName) : null;
  const hoveredValue = hoveredBudgetName ? (metricValues.get(hoveredBudgetName) ?? 0) : 0;

  // ---------- Render ----------
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {drillMetro && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            전국 지도
          </button>
        )}
        {drillMetro && (
          <span className="text-lg font-bold text-foreground">{drillMetro}</span>
        )}
        <div className={drillMetro ? 'ml-auto' : 'flex-1'}>
          <MapControls
            year={year}
            onYearChange={setYear}
            metric={metric}
            onMetricChange={setMetric}
            availableYears={availableYears}
          />
        </div>
      </div>

      <div className="flex flex-1 gap-4 flex-col lg:flex-row">
        {/* Map area */}
        <div
          ref={containerRef}
          className="flex-1 relative min-h-[400px] border border-border rounded-lg overflow-hidden bg-card"
          onMouseMove={handleMouseMove}
        >
          {pathGenerator && (
            <svg width={dimensions.width} height={dimensions.height}>
              {activeFeatures.map((feature: any, idx: number) => {
                const geoName = feature.properties?.name ?? feature.properties?.NAME ?? '';
                const budgetName = resolveBudgetName(geoName);
                const value = metricValues.get(budgetName) ?? 0;
                const color = colorScale(value);
                const isHovered = hoveredRegion === geoName;
                const isSelected = selectedRegion === budgetName;
                const featureKey = drillMetro
                  ? `${feature.properties?.code ?? idx}`
                  : geoName;

                return (
                  <path
                    key={featureKey}
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

          {/* 본청 budget info overlay (district view only) */}
          {drillMetro && hqBudget > 0 && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-card/90 border border-border text-xs text-muted-foreground">
              본청 직접 예산: {formatKoreanWon(hqBudget)}
            </div>
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

          {/* Drill-down hint (province view only) */}
          {!drillMetro && !hoveredRegion && !selectedRegion && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-card/80 border border-border text-xs text-muted-foreground">
              클릭하면 시군구별 예산을 볼 수 있습니다
            </div>
          )}
        </div>

        {/* Detail panel (district view only) */}
        {drillMetro && selectedRegion && districtDataByYear[year] && (
          <RegionDetailPanel
            regionName={selectedRegion}
            metroData={districtDataByYear[year]}
            prevYearData={districtDataByYear[year - 1]}
            year={year}
            onClose={() => setSelectedRegion(null)}
            parentMetroName={drillMetro}
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
