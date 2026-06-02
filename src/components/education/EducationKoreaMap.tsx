'use client';

import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

// 느슨한 TopoJSON 타입 (topojson-specification 미설치)
type Topology = { type: 'Topology'; objects: Record<string, unknown>; arcs: unknown[]; [k: string]: unknown };

// TopoJSON 정식 시도명 → 교육 데이터 약칭
const NAME_MAP: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주',
};

interface Props {
  geoData: Topology;
  selectedSido: string | null;
  onSelect: (sido: string) => void;
  // 시도 약칭 → 색상 강도용 메트릭(0~1 정규화 전 원본값)
  metricBySido?: Record<string, number>;
}

export function EducationKoreaMap({ geoData, selectedSido, onSelect, metricBySido }: Props) {
  const { paths, width, height } = useMemo(() => {
    const objName = Object.keys(geoData.objects)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = feature(geoData as any, (geoData as any).objects[objName]) as any;
    const W = 360, H = 440;
    const projection = geoMercator().fitSize([W, H], fc);
    const pathGen = geoPath(projection);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = fc.features.map((f: any) => {
      const full = f.properties.name as string;
      const sido = NAME_MAP[full] ?? full;
      const centroid = pathGen.centroid(f);
      return { sido, full, d: pathGen(f) ?? '', cx: centroid[0], cy: centroid[1] };
    });
    return { paths: items, width: W, height: H };
  }, [geoData]);

  const max = useMemo(() => {
    const vals = metricBySido ? Object.values(metricBySido) : [];
    return vals.length ? Math.max(...vals) : 0;
  }, [metricBySido]);

  function fillOf(sido: string) {
    if (selectedSido === sido) return '#3b82f6';
    const v = metricBySido?.[sido] ?? 0;
    if (max <= 0) return '#374151';
    const t = v / max; // 0~1
    // 진한 청록 그라데이션 (어두운 → 밝은)
    const light = 18 + Math.round(t * 32); // 18~50% lightness
    return `hsl(190 45% ${light}%)`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
      {paths.map((p: { sido: string; full: string; d: string; cx: number; cy: number }) => (
        <g key={p.full} onClick={() => onSelect(p.sido)} className="cursor-pointer">
          <path
            d={p.d}
            fill={fillOf(p.sido)}
            stroke={selectedSido === p.sido ? '#93c5fd' : '#0f172a'}
            strokeWidth={selectedSido === p.sido ? 1.8 : 0.6}
            className="transition-colors hover:brightness-125"
          />
          <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="middle"
            className="pointer-events-none fill-white" style={{ fontSize: 9, fontWeight: selectedSido === p.sido ? 700 : 400 }}>
            {p.sido}
          </text>
        </g>
      ))}
    </svg>
  );
}
