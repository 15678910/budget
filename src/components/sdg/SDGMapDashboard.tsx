'use client';

import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { SDG_GOALS, getGoalIndicator, SIDO_FULL_TO_SHORT, type SDGIndicator } from '@/lib/sdg/goals';
import { buildRegionSeries, regionMultiYearTrend } from '@/lib/sdg/multiyear-build';
import { MultiYearTrendBadge } from './MultiYearTrendBadge';

interface KosisData { goals: Record<string, SDGIndicator> }
const W = 360, H = 440;

// hex → rgba (농도용)
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SDGMapDashboard({ geoData, kosis, initialGoal }: { geoData: any; kosis: KosisData; initialGoal?: number }) {
  // 지표 = KOSIS 수집분 우선, 없으면 코드 내장(진학률 등)
  const indicatorFor = (num: number): SDGIndicator | null => kosis?.goals?.[String(num)] ?? getGoalIndicator(num);
  const [goalNum, setGoalNum] = useState(initialGoal ?? 4); // 기본: 데이터 보유 goal
  const goal = SDG_GOALS.find((g) => g.num === goalNum)!;
  const indicator = useMemo(() => indicatorFor(goalNum), [goalNum]); // eslint-disable-line react-hooks/exhaustive-deps

  // 시도 경로 + 값 매핑 (토포 데이터 손상/누락 시 빈 배열로 안전 degrade)
  const provinces = useMemo(() => {
    if (!geoData?.objects || typeof geoData.objects !== 'object') return [];
    const objName = Object.keys(geoData.objects)[0];
    if (!objName) return [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = feature(geoData as any, (geoData as any).objects[objName]) as any;
      const proj = geoMercator().fitSize([W, H], fc);
      const pg = geoPath(proj);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fc.features.map((f: any) => {
        const full = f.properties.name as string;
        const short = SIDO_FULL_TO_SHORT[full] ?? full;
        const c = pg.centroid(f);
        return { full, short, d: pg(f) ?? '', cx: c[0], cy: c[1], value: indicator?.bySido[short] ?? null };
      });
    } catch {
      return [];
    }
  }, [geoData, indicator]);

  const { min, max } = useMemo(() => {
    const vals = provinces.map((p: { value: number | null }) => p.value).filter((v: number | null): v is number => v != null);
    return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 0, max: 1 };
  }, [provinces]);

  function fillFor(value: number | null): string {
    if (value == null) return '#1f2937'; // 데이터 없음
    const t = max > min ? (value - min) / (max - min) : 0.5;
    // higherBetter면 값↑ = 진함(좋음). 아니면 반전.
    const intensity = indicator?.higherBetter ? t : 1 - t;
    return hexA(goal.color, 0.2 + intensity * 0.75);
  }

  const ranked = useMemo(
    () => provinces.filter((p: { value: number | null }) => p.value != null)
      .sort((a: { value: number }, b: { value: number }) => (indicator?.higherBetter ? b.value - a.value : a.value - b.value)),
    [provinces, indicator],
  );

  // 실측 다년(KOSIS) 추세 — seriesBySido 보유 goal(8·9)만. 전국(시도수 광역 평균) 시계열 회귀.
  // 보간 아님: 실측 연도점만 사용. 미보유 goal은 null → 기존 2점(B) 추세 유지.
  const multiYear = useMemo(() => {
    const series = indicator?.seriesBySido;
    if (!series || !indicator) return null;
    const { national, byRegion } = buildRegionSeries(series);
    if (national.length < 3) return null;
    const regionCount = Object.keys(byRegion).length;
    return { ...regionMultiYearTrend(national, goalNum, indicator.higherBetter), regionCount };
  }, [indicator, goalNum]);

  return (
    <div className="space-y-5 text-gray-200">
      {/* 헤더 — SDG 휠 로고(17색) + 제목 */}
      <div className="flex items-center gap-4">
        {/* SDG 컬러 휠 (17개 공식색 conic-gradient 도넛) */}
        <div className="relative shrink-0 rounded-full" style={{
          width: 72, height: 72,
          background: `conic-gradient(${SDG_GOALS.map((g, i) => `${g.color} ${(i * 360 / 17).toFixed(2)}deg ${((i + 1) * 360 / 17).toFixed(2)}deg`).join(', ')})`,
        }}>
          <div className="absolute inset-[26%] rounded-full bg-gray-950 flex items-center justify-center">
            <span className="text-[9px] font-extrabold text-white leading-none text-center">SDGs</span>
          </div>
        </div>
        <div className="space-y-1">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500">SUSTAINABLE DEVELOPMENT GOALS</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-50">지속가능발전목표(SDGs) 지역 지도</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            UN SDGs는 2030년까지 달성할 <strong className="text-gray-300">17개 목표</strong>입니다. 목표를 선택하면 시도별 대표 지표로 지도를 색칠합니다.
          </p>
        </div>
      </div>

      {/* 중립·지표해석 고지 */}
      <div className="border-l-2 border-amber-500/60 bg-amber-950/20 rounded-r-md py-2.5 px-3.5 text-[13px] text-amber-100/85 leading-relaxed">
        <strong className="text-amber-300">⚖ 지표 해석 고지</strong> — 한국 지역 단위 공식 &apos;SDG 종합점수&apos;는 미공개입니다.
        본 지도는 goal별 <strong>대표 지표(출처 명시)</strong>로 시각화하며, 지표값을 곧 SDG 달성도로 단정하지 않습니다.
        데이터 미보유 goal은 <strong>&apos;데이터 준비중&apos;</strong>(KOSIS 수집 예정)으로 표기합니다.
        <br />
        <span className="text-amber-200/70">
          추세 표기 구분 — <strong>실측 다년(KOSIS)</strong>=선형회귀(보간 아님, goal 8·9) ·
          그 외는 <strong>2점 개략</strong>(2018→최신, SDSN CR). 모두 속도 신호일 뿐 <strong>인과 아님</strong>.
        </span>
      </div>

      {/* 17 Goal 선택 그리드 — UN 공식 픽토그램(CC0) */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {SDG_GOALS.map((g) => {
          const hasData = indicatorFor(g.num) != null;
          const active = g.num === goalNum;
          return (
            <button key={g.num} onClick={() => setGoalNum(g.num)}
              title={`SDG ${g.num} ${g.name}${hasData ? '' : ' (데이터 준비중)'}`}
              className={`flex flex-col aspect-square rounded-md overflow-hidden transition-all text-left ${active ? 'brightness-105 z-10' : 'hover:brightness-110'}`}
              style={{ background: g.color }}>
              {/* 상단: 번호 + 한글 (픽토그램과 분리 → 겹침/잘림 없음) */}
              <div className="flex items-start gap-1.5 px-2 pt-2 pb-0.5 text-white leading-none">
                <span className="font-extrabold text-xl md:text-2xl leading-none shrink-0">{g.num}</span>
                <span className={`font-bold leading-[1.15] text-[15px] md:text-xl ${g.num === 12 ? 'whitespace-nowrap' : 'break-keep'}`}>{g.num === 12 ? <>책임있는<br />소비·생산</> : g.name}</span>
              </div>
              {/* 하단: 공식 픽토그램(크롭본) — 자체 영역에만 표시 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sdg/sdg-${g.num}-pic.svg?v=12`} alt={g.name} className="flex-1 min-h-0 w-full object-contain pb-2 px-2" />
            </button>
          );
        })}
        {/* SDG 공식 로고 셀 — UN 엠블럼(세계지도) + SUSTAINABLE DEVELOPMENT GOALS */}
        <div className="flex flex-col items-center justify-center gap-1 aspect-square rounded-md bg-white px-1.5 py-2 text-center overflow-hidden">
          {/* UN 엠블럼(글로브+월계수) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sdg/un-emblem.svg?v=1" alt="UN" className="h-[26%] w-auto" />
          <span className="font-extrabold leading-[1.04] tracking-tight text-[11px] md:text-[15px]" style={{ color: '#5B92E5' }}>
            SUSTAINABLE<br />DEVELOPMENT
          </span>
          <div className="flex items-center justify-center gap-[1px] font-extrabold leading-none text-lg md:text-2xl" style={{ color: '#5B92E5' }}>
            <span>G</span>
            {/* 컬러 휠 = 'O' 자리 (17색 솔리드) */}
            <span className="inline-block rounded-full shrink-0 w-[0.9em] h-[0.9em]" style={{
              background: `conic-gradient(${SDG_GOALS.map((g, i) => `${g.color} ${(i * 360 / 17).toFixed(2)}deg ${((i + 1) * 360 / 17).toFixed(2)}deg`).join(', ')})`,
            }} />
            <span>ALS</span>
          </div>
        </div>
      </div>

      {/* 선택 goal 헤더 */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="px-2 py-1 rounded text-white font-bold text-sm" style={{ background: goal.color }}>SDG {goal.num}</span>
        <span className="text-lg font-semibold text-gray-100">{goal.name}</span>
        {indicator
          ? <span className="text-xs text-gray-400">지표: <strong className="text-gray-200">{indicator.label}</strong> · {indicator.year} · 출처 {indicator.source}</span>
          : <span className="text-xs text-amber-300/80">데이터 준비중 — KOSIS 수집 예정(Phase C)</span>}
      </div>

      {/* 실측 다년(KOSIS) 추세 — 보유 goal(8·9)만 표시. 나머지는 매트릭스/프로파일의 2점(B) 추세 유지. */}
      {multiYear && indicator && (
        <MultiYearTrendBadge
          mt={multiYear}
          unit={indicator.unit}
          higherBetter={indicator.higherBetter}
          scopeLabel={`전국(${multiYear.regionCount}광역 평균)`}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 지도 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          {indicator ? (
            <>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
                {provinces.map((p: { full: string; short: string; d: string; cx: number; cy: number; value: number | null }) => (
                  <g key={p.full}>
                    <path d={p.d} fill={fillFor(p.value)} stroke="#0f172a" strokeWidth={0.6} className="transition-colors hover:brightness-125">
                      <title>{p.short}: {p.value != null ? `${p.value}${indicator.unit}` : '데이터 없음'}</title>
                    </path>
                    <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none fill-white" style={{ fontSize: 8 }}>{p.short}</text>
                  </g>
                ))}
              </svg>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                <span>낮음</span>
                <div className="flex-1 mx-2 h-2 rounded" style={{ background: `linear-gradient(90deg, ${hexA(goal.color, 0.2)}, ${hexA(goal.color, 0.95)})` }} />
                <span>높음 ({indicator.higherBetter ? '좋음' : '주의'})</span>
              </div>
            </>
          ) : (
            <div className="h-[420px] flex flex-col items-center justify-center text-center gap-2">
              <span className="text-4xl opacity-40">🗺️</span>
              <p className="text-sm text-gray-400">이 목표의 시도별 지표는 <strong className="text-gray-300">준비중</strong>입니다.</p>
              <p className="text-xs text-gray-600">KOSIS OpenAPI 연동(Phase C) 후 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* 순위 */}
        <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">시도 순위 {indicator && <span className="text-gray-500">({indicator.label})</span>}</h3>
          {indicator ? (
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {ranked.map((p: { short: string; value: number }, i: number) => {
                const t = max > min ? (p.value - min) / (max - min) : 0.5;
                return (
                  <div key={p.short} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-200 w-12 shrink-0">{p.short}</span>
                    <div className="flex-1 bg-gray-800 rounded h-4 overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.max(4, t * 100)}%`, background: goal.color }} />
                    </div>
                    <span className="font-mono text-sm text-gray-200 w-16 text-right tabular-nums">{p.value}{indicator.unit}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-10 text-center">데이터 준비중</p>
          )}
          {indicator && (
            <p className="text-[11px] text-gray-600 mt-3 border-t border-gray-800 pt-2">
              해석방향: {indicator.higherBetter ? '높을수록 양호' : '낮을수록 양호'} · 출처 {indicator.source}({indicator.year}).
              ※ 대표 지표이며 SDG 종합 달성도와 다를 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
