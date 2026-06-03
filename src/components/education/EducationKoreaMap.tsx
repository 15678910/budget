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
  selectedSgg: string | null;
  onSelect: (sido: string) => void;
  onSelectSgg: (sgg: string | null) => void;
  onBack: () => void;
  metricBySido?: Record<string, number>;
  points?: MapPoint[]; // 시군구 드릴 시 표시할 위치 핀 (유치원·학교 등)
}

export interface MapPoint { lat: number; lng: number; label: string; color: string }

const W = 360, H = 440;

export function EducationKoreaMap({ geoData, municipalitiesGeo, selectedSido, selectedSgg, onSelect, onSelectSgg, onBack, metricBySido, points }: Props) {
  const [zoom, setZoom] = useState(1);
  const [emdTopo, setEmdTopo] = useState<Topology | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 읍면동 경계 lazy 로드 (시군구 선택 시 최초 1회)
  useEffect(() => {
    if (selectedSgg && !emdTopo) {
      fetch('/data/korea-emd-topo.json').then((r) => r.json()).then(setEmdTopo).catch(() => {});
    }
  }, [selectedSgg, emdTopo]);

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

  // 줌 리셋 on 시도/시군구 변경
  useEffect(() => { setZoom(1); }, [selectedSido, selectedSgg]);

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
    let feats = fc.features.filter((f: any) => String(f.properties.code ?? '').startsWith(prov));
    // 시군구 선택 시 해당 시군구만 (대도시 구 분리 대비 startsWith 매칭)
    if (selectedSgg) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const only = feats.filter((f: any) => f.properties.name === selectedSgg);
      if (only.length) feats = only;
    }
    const subset = { type: 'FeatureCollection', features: feats };
    if (subset.features.length === 0) return [];
    const proj = geoMercator().fitSize([W - 20, H - 20], subset as never);
    const pg = geoPath(proj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return subset.features.map((f: any) => {
      const c = pg.centroid(f);
      return { name: f.properties.name as string, d: pg(f) ?? '', cx: c[0], cy: c[1] };
    });
  }, [municipalitiesGeo, selectedSido, selectedSgg]);

  // 읍면동(EMD) 경로 + 위치 핀 — 선택 시군구만 (EMD code = 시군구 5자리 + 2)
  const emd = useMemo((): { paths: { name: string; d: string; cx: number; cy: number; i: number }[]; pins: { x: number; y: number; label: string; color: string; i: number }[] } => {
    const empty = { paths: [], pins: [] };
    if (!selectedSido || !selectedSgg || !emdTopo) return empty;
    const mObj = Object.keys(municipalitiesGeo.objects)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mfc = feature(municipalitiesGeo as any, (municipalitiesGeo as any).objects[mObj]) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sggFeat = mfc.features.find((f: any) => f.properties.name === selectedSgg);
    const sggCode = sggFeat ? String(sggFeat.properties.code ?? '') : '';
    if (!sggCode) return empty;
    const eObj = Object.keys(emdTopo.objects)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const efc = feature(emdTopo as any, (emdTopo as any).objects[eObj]) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feats = efc.features.filter((f: any) => String(f.properties.code ?? '').startsWith(sggCode));
    if (feats.length === 0) return empty;
    const subset = { type: 'FeatureCollection', features: feats };
    const proj = geoMercator().fitSize([W - 16, H - 16], subset as never);
    const pg = geoPath(proj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paths = feats.map((f: any, i: number) => {
      const c = pg.centroid(f);
      return { name: f.properties.name as string, d: pg(f) ?? '', cx: c[0], cy: c[1], i };
    });
    // 위치 핀 투영 (lng,lat → x,y)
    const pins = (points ?? []).map((p, i) => {
      const xy = proj([p.lng, p.lat]);
      return xy ? { x: xy[0], y: xy[1], label: p.label, color: p.color, i } : null;
    }).filter((p): p is { x: number; y: number; label: string; color: string; i: number } => p != null);
    return { paths, pins };
  }, [emdTopo, municipalitiesGeo, selectedSido, selectedSgg, points]);

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
        <button onClick={() => (selectedSgg ? onSelectSgg(null) : onBack())}
          className="absolute left-1 top-1 z-10 px-2.5 py-1 rounded bg-gray-800/90 border border-gray-700 text-gray-200 text-xs hover:bg-gray-700">
          {selectedSgg ? `← ${selectedSido}` : '← 전국'}
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
          ) : selectedSgg && emd.paths.length > 0 ? (
            // 3단계: 선택 시군구의 읍면동 경계 + 위치 핀
            <>
              {emd.paths.map((m) => (
                <g key={`emd-${m.i}`} className="cursor-default">
                  <path d={m.d} fill="#1e40af" stroke="#93c5fd" strokeWidth={0.4}
                    className="transition-colors hover:brightness-125" />
                  <text x={m.cx} y={m.cy} textAnchor="middle" dominantBaseline="middle"
                    className="pointer-events-none fill-white/70" style={{ fontSize: 8 }}>{m.name}</text>
                </g>
              ))}
              {emd.pins.map((p) => (
                <circle key={`pin-${p.i}`} cx={p.x} cy={p.y} r={2.2}
                  fill={p.color} stroke="#fff" strokeWidth={0.5}>
                  <title>{p.label}</title>
                </circle>
              ))}
            </>
          ) : (
            // 2단계: 선택 시도의 시군구 (시군구 미선택 시 클릭 가능)
            muniPaths.map((m: { name: string; d: string; cx: number; cy: number }, i: number) => (
              <g key={i} onClick={() => !selectedSgg && onSelectSgg(m.name)}
                className={selectedSgg ? 'cursor-default' : 'cursor-pointer'}>
                <path d={m.d} fill={selectedSgg ? '#2563eb' : '#1e3a5f'} stroke="#60a5fa" strokeWidth={0.5}
                  className="transition-colors hover:brightness-125" />
                <text x={m.cx} y={m.cy} textAnchor="middle" dominantBaseline="middle"
                  className="pointer-events-none fill-white" style={{ fontSize: selectedSgg ? 10 : 7 }}>{m.name}</text>
              </g>
            ))
          )}
        </svg>
      </div>
    </div>
  );
}
