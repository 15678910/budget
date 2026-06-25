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
 * ※ 지표 추가 시 INDICATORS에 한 줄 추가(사전 API 검증 통과분만 — 부록 A).
 * ※ newEstPrdCnt=10 → 최근 10년 시계열. 시도별 각 연도(PRD_DE) 행을 파싱.
 *
 * 파서 일반화: 각 지표는 유연한 파서 설정을 갖는다(아래 INDICATORS 주석).
 *   - objL1 / objL2(옵션): KOSIS 분류 차원. URL에 포함.
 *   - sidoField: 시도 추출 필드.
 *       'C1_NM'/'C2_NM' → 시도 정식명 → FULL_TO_SHORT 매핑(없으면 스킵: 계/전국 제외).
 *       'C1_CODE4'      → C1 코드 끝 4자리로 시도 매핑(CODE4_TO_SHORT, 합계 0001~0003 제외).
 *   - filter(옵션): row=>bool. 통과 행만 채택(차원 선택용).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const KEY = process.env.KOSIS_API_KEY;
if (!KEY) { console.error('KOSIS_API_KEY 필요'); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 시도 정식명 → 약칭 (지도 키 매칭). '계/전국' 등 합계는 매핑 없음 → 스킵.
const FULL_TO_SHORT = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주',
  제주도: '제주', // goal3 사망원인통계: C2_NM='제주도'(C2=39)로 제공됨 — 신구 명칭 모두 매핑.
};

// 유효 시도 약칭 집합 — 일부 표(예: 신재생 orgId337)는 C2_NM이 이미 약칭("서울")으로 옴.
//   FULL_TO_SHORT 매핑 실패 시 값 자체가 약칭이면 채택. '전국/계' 등 합계는 비포함 → 스킵.
const SHORT_SET = new Set(Object.values(FULL_TO_SHORT));

// C1 코드 끝 4자리 → 시도 약칭 (주택보급률 DT_MLTM_2100용).
// 0001~0003 = 전국/수도권/지방 등 합계 → 매핑 없음(스킵). 0004=서울 … 0020=제주.
const CODE4_TO_SHORT = {
  '0004': '서울', '0005': '부산', '0006': '대구', '0007': '인천',
  '0008': '광주', '0009': '대전', '0010': '울산', '0011': '세종',
  '0012': '경기', '0013': '강원', '0014': '충북', '0015': '충남',
  '0016': '전북', '0017': '전남', '0018': '경북', '0019': '경남',
  '0020': '제주',
};

// 목표별 대표 지표 (KOSIS 통계표) — 부록 A(2026-06-25 실 API 검증)만.
// goals 객체 키 = goal 번호(단일). 동일 goal 중복 금지(덮어쓰기 회피).
// 실업률(goal8 DT_1DA7004S T80)은 고용률(goal8)과 키 충돌 → 제외(고용률 우선 유지).
const INDICATORS = [
  // 기존 2개 — 유지
  {
    goal: 8, orgId: '101', tblId: 'DT_1DA7004S', itmId: 'T100',
    objL1: 'ALL', sidoField: 'C1_NM',
    label: '15-64세 고용률', unit: '%', higherBetter: true, source: '통계청 경제활동인구조사',
  },
  {
    goal: 9, orgId: '101', tblId: 'DT_1C96', itmId: 'T1',
    objL1: 'ALL', sidoField: 'C1_NM',
    label: '1인당 지역내총생산(GRDP)', unit: '천원', higherBetter: true, source: '통계청 지역소득',
  },
  // 신규 5 — 부록 A (실업률 제외: goal8 키 충돌)
  {
    goal: 3, orgId: '101', tblId: 'DT_1YL21121E', itmId: 'T4',
    objL1: '0', objL2: 'ALL', sidoField: 'C2_NM', filter: (r) => r.C2 !== '00',
    label: '자살률(인구 10만명당)', unit: '명(10만명당)', higherBetter: false, source: '통계청 사망원인통계',
  },
  {
    goal: 5, orgId: '101', tblId: 'DT_1DA7014S', itmId: 'T60',
    objL1: 'ALL', objL2: 'ALL', sidoField: 'C1_NM', filter: (r) => r.C2 === '3',
    label: '여성 경제활동참가율', unit: '%', higherBetter: true, source: '통계청 경제활동인구조사',
  },
  {
    goal: 7, orgId: '337', tblId: 'TX_33701_A004', itmId: '16337AAB0',
    objL1: 'ALL', objL2: 'ALL', sidoField: 'C2_NM', filter: (r) => r.C1 === '15337AA800',
    label: '신재생에너지 생산량', unit: 'toe', higherBetter: true, source: '한국에너지공단 신재생에너지 보급통계',
  },
  {
    goal: 11, orgId: '116', tblId: 'DT_MLTM_2100', itmId: '13103871096T6',
    objL1: 'ALL', sidoField: 'C1_CODE4',
    label: '주택보급률(다가구 포함)', unit: '%', higherBetter: true, source: '국토교통부 주택보급률',
  },
];

// 행에서 시도 약칭 추출. 매핑 불가(합계/전국)면 null.
function sidoOf(r, sidoField) {
  // 정식명 → 약칭 매핑. 실패 시 값 자체가 약칭이면 채택('전국/계' 등은 둘 다 실패 → null).
  const mapName = (raw) => {
    const v = (raw || '').trim();
    return FULL_TO_SHORT[v] ?? (SHORT_SET.has(v) ? v : null);
  };
  if (sidoField === 'C1_NM') return mapName(r.C1_NM);
  if (sidoField === 'C2_NM') return mapName(r.C2_NM);
  if (sidoField === 'C1_CODE4') {
    const code = String(r.C1 || '');
    const tail = code.slice(-4);
    return CODE4_TO_SHORT[tail] ?? null;
  }
  return null;
}

async function fetchIndicator(ind) {
  let url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&orgId=${ind.orgId}&tblId=${ind.tblId}&itmId=${ind.itmId}`
    + `&objL1=${ind.objL1}&prdSe=Y&newEstPrdCnt=10&format=json&jsonVD=Y`;
  if (ind.objL2) url += `&objL2=${ind.objL2}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) }); // 10s 타임아웃 (무한 대기 방지)
  const j = await res.json();
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 120));
  const rows = j.filter((r) => r.ITM_ID === ind.itmId && (!ind.filter || ind.filter(r)));

  // 시도별 연도→값 시계열 누적. PRD_DE=연도(YYYY), DT=값.
  const seriesBySido = {}; // { short: { year: value } }
  let latestYear = '';
  for (const r of rows) {
    const short = sidoOf(r, ind.sidoField);
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

  // ── post-parse sanity: 시도수·연도수 품질 경고 (차단 아님) ──
  const sidoCount = Object.keys(seriesBySido).length;
  const allYrSet = new Set();
  for (const s of Object.values(seriesBySido)) for (const yr of Object.keys(s)) allYrSet.add(yr);
  const yrCount = allYrSet.size;
  if (sidoCount < 15) console.warn(`⚠️ Goal ${ind.goal} sanity: 시도 ${sidoCount}개(<15) — 누락 시도 확인 필요`);
  if (yrCount < 5) console.warn(`⚠️ Goal ${ind.goal} sanity: 연도 ${yrCount}개(<5) — 다년 시계열 부족`);

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
      else console.error(`⚠️ Goal ${ind.goal} ${ind.label}: 시도 ${n}개뿐 — 스킵`);
    } catch (e) { console.error(`❌ Goal ${ind.goal} ${ind.label}: ${e.message}`); }
    await sleep(1500);
  }
  // ── read-merge-preserve: 0건이면 기존 파일 보존, 1건 이상이면 성공분만 갱신 ──
  if (Object.keys(goals).length === 0) {
    console.error('❌ 수집 성공 0건 — 기존 public/data/sdg-sido.json 보존 (덮어쓰기 중단)');
    process.exit(1);
  }
  mkdirSync('public/data', { recursive: true });
  let prevGoals = {};
  try {
    const prev = JSON.parse(readFileSync('public/data/sdg-sido.json', 'utf8'));
    prevGoals = prev.goals ?? {};
  } catch { /* 파일 없음 또는 파싱 실패 — 새로 생성 */ }
  const merged = { ...prevGoals, ...goals }; // 성공 goal만 갱신, 실패 goal은 기존값 보존
  writeFileSync('public/data/sdg-sido.json', JSON.stringify({ collectedAt: new Date().toISOString(), goals: merged }));
  console.log(`\n저장: public/data/sdg-sido.json (이번 수집 ${Object.keys(goals).length}개, 병합 후 총 ${Object.keys(merged).length}개)`);
  // 검증 출력 — 최신 상위 3 + 시계열 연도범위 + 서울값
  for (const [g, d] of Object.entries(goals)) {
    const top = Object.entries(d.bySido).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const allYears = new Set();
    for (const series of Object.values(d.seriesBySido ?? {})) {
      for (const yr of Object.keys(series)) allYears.add(yr);
    }
    const ys = [...allYears].sort();
    const seoulYears = d.seriesBySido?.['서울'] ? Object.keys(d.seriesBySido['서울']).length : 0;
    const seoulLatest = d.bySido?.['서울'];
    console.log(`  Goal ${g}: ${top.map(([s, v]) => `${s} ${v}${d.unit}`).join(', ')} … ` +
      `[시계열 ${ys[0] ?? '?'}~${ys[ys.length - 1] ?? '?'} · 서울 ${seoulYears}개연도 최신 ${seoulLatest ?? '?'}${d.unit}]`);
  }
})();
