'use client';

import { useMemo, useState } from 'react';
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
  metricBySido?: Record<string, number>;
}

export function EducationKoreaMap({ geoData, selectedSido, onSelect, metricBySido }: Props) {
  const [zoom, setZoom] = useState(1);

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
    if (selectedSido === sido) return '#3b82f6'; // 선택만 강조(파랑)
    // 비선택: 매우 옅은 단색 베이스(원색) — 학생수에 따라 미세한 명암만
    const v = metricBySido?.[sido] ?? 0;
    if (max <= 0) return '#1f2937';
    const t = v / max; // 0~1
    const light = 16 + Math.round(t * 12); // 16~28% (subtle)
    return `hsl(200 22% ${light}%)`;
  }

  return (
    <div className="relative">
      {/* 줌 컨트롤 */}
      <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
        <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.4).toFixed(1)))}
          className="w-7 h-7 rounded bg-gray-800/90 border border-gray-700 text-gray-200 text-lg leading-none hover:bg-gray-700">+</button>
        <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.4).toFixed(1)))}
          className="w-7 h-7 rounded bg-gray-800/90 border border-gray-700 text-gray-200 text-lg leading-none hover:bg-gray-700">−</button>
        <button onClick={() => setZoom(1)}
          className="w-7 h-7 rounded bg-gray-800/90 border border-gray-700 text-gray-300 text-xs hover:bg-gray-700" title="원위치">⟳</button>
      </div>

      <div className="overflow-auto" style={{ maxHeight: 520 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="select-none transition-transform duration-200"
          style={{ width: `${100 * zoom}%`, height: 'auto', transformOrigin: 'center top' }}
        >
          {paths.map((p: { sido: string; full: string; d: string; cx: number; cy: number }) => (
            <g key={p.full} onClick={() => onSelect(p.sido)} className="cursor-pointer">
              <path
                d={p.d}
                fill={fillOf(p.sido)}
                stroke={selectedSido === p.sido ? '#93c5fd' : '#0f172a'}
                strokeWidth={selectedSido === p.sido ? 1.8 : 0.6}
                className="transition-colors hover:brightness-150"
              />
              <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="middle"
                className="pointer-events-none fill-white"
                style={{ fontSize: 9, fontWeight: selectedSido === p.sido ? 700 : 400 }}>
                {p.sido}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
