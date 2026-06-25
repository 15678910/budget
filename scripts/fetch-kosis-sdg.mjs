#!/usr/bin/env node
/**
 * KOSIS 시도별 SDG 대표 지표 수집 — 통계청 KOSIS OpenAPI
 * 산출물: public/data/sdg-sido.json
 *   { collectedAt, goals: { <goalNum>: {
 *       label, source, year(최신연도), unit, higherBetter,
 *       bySido: { <시도약칭>: 최신연도값 },                    // 기존 호환 보존
 *       seriesBySido: { <시도약칭>: { <연도>: 값, ... } },     // 다년 실측 시계열(보간 아님)
 *   } } }
 * 사용: KOSIS_API_KEY=<키> node scripts/fetch-kosis-sdg.mjs
 * ※ 지표 추가 시 INDICATORS에 {goal,orgId,tblId,itmId,...} 한 줄 추가(사전 API 검증 통과분만).
 * ※ newEstPrdCnt=10 → 최근 10년 시계열. 시도별 각 연도(PRD_DE) 행을 파싱.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.KOSIS_API_KEY;
if (!KEY) { console.error('KOSIS_API_KEY 필요'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 시도 정식명 → 약칭 (지도 키 매칭). '계/전국' 등 합계는 제외.
const FULL_TO_SHORT = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주',
};

// 목표별 대표 지표 (KOSIS 통계표) — 검증된 것만
const INDICATORS = [
  { goal: 8, orgId: '101', tblId: 'DT_1DA7004S', itmId: 'T100', label: '15-64세 고용률', unit: '%', higherBetter: true, source: '통계청 경제활동인구조사' },
  { goal: 9, orgId: '101', tblId: 'DT_1C96', itmId: 'T1', label: '1인당 지역내총생산(GRDP)', unit: '천원', higherBetter: true, source: '통계청 지역소득' },
];

async function fetchIndicator(ind) {
  const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&orgId=${ind.orgId}&tblId=${ind.tblId}&objL1=ALL&itmId=${ind.itmId}&prdSe=Y&newEstPrdCnt=10&format=json&jsonVD=Y`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) }); // 10s 타임아웃 (무한 대기 방지)
  const j = await res.json();
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 120));
  const rows = j.filter((r) => r.ITM_ID === ind.itmId);

  // 시도별 연도→값 시계열 누적. PRD_DE=연도(YYYY), C1_NM=시도, DT=값.
  const seriesBySido = {}; // { short: { year: value } }
  let latestYear = '';
  for (const r of rows) {
    const short = FULL_TO_SHORT[(r.C1_NM || '').trim()];
    if (!short) continue; // 계/전국/미매칭 제외
    const yr = String(r.PRD_DE || '').trim();
    if (!/^\d{4}$/.test(yr)) continue; // 연도(YYYY)만 허용
    const v = Number(String(r.DT).replace(/[^0-9.\-]/g, ''));
    if (!Number.isFinite(v)) continue;
    (seriesBySido[short] ||= {})[yr] = v;
    if (yr > latestYear) latestYear = yr;
  }

  // bySido = 각 시도의 최신연도 단일값(기존 소비처 호환). 시도별로 자기 최신연도를 사용.
  const bySido = {};
  for (const [short, series] of Object.entries(seriesBySido)) {
    const years = Object.keys(series).sort();
    const last = years[years.length - 1];
    if (last != null) bySido[short] = series[last];
  }

  return {
    label: ind.label, source: ind.source, year: latestYear,
    unit: ind.unit, higherBetter: ind.higherBetter, bySido, seriesBySido,
  };
}

(async () => {
  const goals = {};
  for (const ind of INDICATORS) {
    try {
      const data = await fetchIndicator(ind);
      const n = Object.keys(data.bySido).length;
      if (n >= 10) { goals[ind.goal] = data; console.log(`✅ Goal ${ind.goal} ${ind.label}: ${n}개 시도 (${data.year})`); }
      else console.error(`⚠️ Goal ${ind.goal}: 시도 ${n}개뿐 — 스킵`);
    } catch (e) { console.error(`❌ Goal ${ind.goal} ${ind.label}: ${e.message}`); }
    await sleep(1500);
  }
  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/sdg-sido.json', JSON.stringify({ collectedAt: new Date().toISOString(), goals }));
  console.log(`\n저장: public/data/sdg-sido.json (목표 ${Object.keys(goals).length}개)`);
  // 검증 출력 — 최신 상위 3 + 시계열 연도범위
  for (const [g, d] of Object.entries(goals)) {
    const top = Object.entries(d.bySido).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const allYears = new Set();
    for (const series of Object.values(d.seriesBySido ?? {})) {
      for (const yr of Object.keys(series)) allYears.add(yr);
    }
    const ys = [...allYears].sort();
    const seoul = d.seriesBySido?.['서울'] ? Object.keys(d.seriesBySido['서울']).length : 0;
    console.log(`  Goal ${g}: ${top.map(([s, v]) => `${s} ${v}${d.unit}`).join(', ')} … ` +
      `[시계열 ${ys[0] ?? '?'}~${ys[ys.length - 1] ?? '?'} · 서울 ${seoul}개연도]`);
  }
})();
