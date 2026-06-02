'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

type Topology = { type: 'Topology'; objects: Record<string, unknown>; arcs: unknown[]; [k: string]: unknown };

const NAME_MAP: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주',
};
// 시도 약칭 → municipality TopoJSON 2자리 코드(2013 체계)
const SHORT_TO_PROVCODE: Record<string, string> = {
  서울: '11', 부산: '21', 대구: '22', 인천: '23', 광주: '24', 대전: '25', 울산: '26',
  세종: '29', 경기: '31', 강원: '32', 충북: '33', 충남: '34', 전북: '35', 전남: '36',
  경북: '37', 경남: '38', 제주: '39',
};

interface Props {
  geoData: Topology;            // 시도(provinces)
  municipalitiesGeo: Topology;  // 시군구(municipalities)
  selectedSido: string | null;
  onSelect: (sido: string) => void;
  onBack: () => void;
  metricBySido?: Record<string, number>;
}

const W = 360, H = 440;

export function EducationKoreaMap({ geoData, municipalitiesGeo, selectedSido, onSelect, onBack, metricBySido }: Props) {
  const [zoom, setZoom] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 마우스 휠 줌 (페이지 스크롤 방지 위해 passive:false)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(5, Math.max(1, +(z - Math.sign(e.deltaY) * 0.25).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // 줌 리셋 on 시도 변경
  useEffect(() => { setZoom(1); }, [selectedSido]);

  // 시도(province) 경로
  const provincePaths = useMemo(() => {
    const objName = Object.keys(geoData.objects)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = feature(geoData as any, (geoData as any).objects[objName]) as any;
    const proj = geoMercator().fitSize([W, H], fc);
    const pg = geoPath(proj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fc.features.map((f: any) => {
      const sido = NAME_MAP[f.properties.name] ?? f.properties.name;
      const c = pg.centroid(f);
      return { sido, full: f.properties.name, d: pg(f) ?? '', cx: c[0], cy: c[1] };
    });
  }, [geoData]);

  // 시군구(municipality) 경로 — 선택 시도만
  const muniPaths = useMemo(() => {
    if (!selectedSido) return [];
    const prov = SHORT_TO_PROVCODE[selectedSido];
    if (!prov) return [];
    const objName = Object.keys(municipalitiesGeo.objects)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = feature(municipalitiesGeo as any, (municipalitiesGeo as any).objects[objName]) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subset = { type: 'FeatureCollection', features: fc.features.filter((f: any) => String(f.properties.code ?? '').startsWith(prov)) };
    if (subset.features.length === 0) return [];
    const proj = geoMercator().fitSize([W - 20, H - 20], subset as never);
    const pg = geoPath(proj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return subset.features.map((f: any) => {
      const c = pg.centroid(f);
      return { name: f.properties.name as string, d: pg(f) ?? '', cx: c[0], cy: c[1] };
    });
  }, [municipalitiesGeo, selectedSido]);

  const max = useMemo(() => {
    const vals = metricBySido ? Object.values(metricBySido) : [];
    return vals.length ? Math.max(...vals) : 0;
  }, [metricBySido]);

  function provinceFill(sido: string) {
    const v = metricBySido?.[sido] ?? 0;
    if (max <= 0) return '#1f2937';
    const light = 16 + Math.round((v / max) * 12);
    return `hsl(200 22% ${light}%)`;
  }

  return (
    <div className="relative">
      {selectedSido && (
        <button onClick={onBack}
          className="absolute left-1 top-1 z-10 px-2.5 py-1 rounded bg-gray-800/90 border border-gray-700 text-gray-200 text-xs hover:bg-gray-700">
          ← 전국
        </button>
      )}
      <div ref={wrapRef} className="overflow-hidden rounded" style={{ touchAction: 'none' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="select-none mx-auto block"
          style={{ width: `${100 * zoom}%`, height: 'auto', transition: 'width 0.15s' }}>
          {!selectedSido ? (
            // 전국: 시도
            provincePaths.map((p: { sido: string; full: string; d: string; cx: number; cy: number }) => (
              <g key={p.full} onClick={() => onSelect(p.sido)} className="cursor-pointer">
                <path d={p.d} fill={provinceFill(p.sido)} stroke="#0f172a" strokeWidth={0.6}
                  className="transition-colors hover:brightness-150" />
                <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none fill-white" style={{ fontSize: 9 }}>{p.sido}</text>
              </g>
            ))
          ) : (
            // 드릴: 선택 시도의 시군구
            muniPaths.map((m: { name: string; d: string; cx: number; cy: number }, i: number) => (
              <g key={i} className="cursor-default">
                <path d={m.d} fill="#1e3a5f" stroke="#60a5fa" strokeWidth={0.5}
                  className="transition-colors hover:brightness-125" />
                <text x={m.cx} y={m.cy} textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none fill-white" style={{ fontSize: 7 }}>{m.name}</text>
              </g>
            ))
          )}
        </svg>
      </div>
    </div>
  );
}
