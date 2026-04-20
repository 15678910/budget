#!/usr/bin/env node
/**
 * eduinfo.go.kr opbdIntFiSta (통합재정통계 — 예산공시) 2026 호출
 * 17개 시·도교육청의 세입총계 / 세출총계 / 통합재정수입·지출 / 보전수입·지출 수집.
 *
 * 사용법:
 *   EDUINFO_API_KEY=<key> node scripts/fetch-eduinfo-2026.mjs
 *
 * 산출물: scripts/output/eduinfo-2026.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const API_KEY = process.env.EDUINFO_API_KEY || 'VVPBU1000084820260420113531CBLHC';
const YEARS = ['2024', '2025', '2026'];
const BASE = 'http://openapi.eduinfo.go.kr/openApi.do';

// 세입총계/세출총계 등 핵심 라인만 추출 (들여쓰기 없는 최상위 항목)
const TOP_LEVEL_ITEMS = [
  '세입총계(A=B+C)',
  '세출총계(F=G+H)',
];

async function fetchYear(ymq) {
  const url = `${BASE}?requestType=opbdIntFiSta&key=${API_KEY}&type=json&pIndex=1&pSize=500&YMQ=${ymq}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for YMQ=${ymq}`);
  const j = await res.json();
  if (j.RESULT?.CODE !== 'INFO') throw new Error(`API error: ${j.RESULT?.MESSAGE}`);
  return j.RESULT_LIST || [];
}

function aggregate(rows) {
  const byMetro = {};
  for (const r of rows) {
    const item = r.ITEM_CD2?.trim() || '';
    if (!TOP_LEVEL_ITEMS.includes(item)) continue;
    const metro = r.ITEM_CD1;
    if (!byMetro[metro]) byMetro[metro] = {};
    if (item.startsWith('세입총계')) byMetro[metro].revenue = r.AMT;
    if (item.startsWith('세출총계')) byMetro[metro].expenditure = r.AMT;
  }
  return byMetro;
}

// eduinfo 약칭 → 공식 교육청명 맵
const METRO_TO_OFFICE = {
  서울: { office: '서울특별시교육청', metro: '서울특별시' },
  부산: { office: '부산광역시교육청', metro: '부산광역시' },
  대구: { office: '대구광역시교육청', metro: '대구광역시' },
  인천: { office: '인천광역시교육청', metro: '인천광역시' },
  광주: { office: '광주광역시교육청', metro: '전남광주통합특별시' },
  대전: { office: '대전광역시교육청', metro: '대전광역시' },
  울산: { office: '울산광역시교육청', metro: '울산광역시' },
  세종: { office: '세종특별자치시교육청', metro: '세종특별자치시' },
  경기: { office: '경기도교육청', metro: '경기도' },
  강원: { office: '강원특별자치도교육청', metro: '강원특별자치도' },
  충북: { office: '충청북도교육청', metro: '충청북도' },
  충남: { office: '충청남도교육청', metro: '충청남도' },
  전북: { office: '전북특별자치도교육청', metro: '전북특별자치도' },
  전남: { office: '전라남도교육청', metro: '전남광주통합특별시' },
  경북: { office: '경상북도교육청', metro: '경상북도' },
  경남: { office: '경상남도교육청', metro: '경상남도' },
  제주: { office: '제주특별자치도교육청', metro: '제주특별자치도' },
};

(async () => {
  const out = { source: 'eduinfo.go.kr opbdIntFiSta', fetchedAt: new Date().toISOString(), years: {} };
  for (const ymq of YEARS) {
    process.stderr.write(`Fetching ${ymq}... `);
    const rows = await fetchYear(ymq);
    const agg = aggregate(rows);
    out.years[ymq] = agg;
    const total = Object.values(agg).reduce((s, v) => s + (v.revenue || 0), 0);
    process.stderr.write(`${Object.keys(agg).length} metros, 세입총계 ${(total / 1e12).toFixed(2)}조원\n`);
  }

  // === 2026 병합 — 전남광주통합특별시 처리 ===
  const merged = [];
  const y2026 = out.years['2026'];
  for (const [shortNm, meta] of Object.entries(METRO_TO_OFFICE)) {
    const d = y2026[shortNm];
    if (!d) continue;
    merged.push({
      office: meta.office,
      metro: meta.metro,
      revenue2026: d.revenue,
      expenditure2026: d.expenditure,
      revenue2024: out.years['2024'][shortNm]?.revenue,
      revenue2025: out.years['2025'][shortNm]?.revenue,
    });
  }

  // 광주 + 전남 합산 row도 추가 (전남광주통합특별시교육청)
  const gw = y2026['광주'];
  const jn = y2026['전남'];
  if (gw && jn) {
    merged.push({
      office: '전남광주통합특별시교육청',
      metro: '전남광주통합특별시',
      revenue2026: gw.revenue + jn.revenue,
      expenditure2026: gw.expenditure + jn.expenditure,
      revenue2024: (out.years['2024']['광주']?.revenue || 0) + (out.years['2024']['전남']?.revenue || 0),
      revenue2025: (out.years['2025']['광주']?.revenue || 0) + (out.years['2025']['전남']?.revenue || 0),
      note: '광주교육청 + 전남교육청 (단순합산, 실제 통합 시 조정 필요)',
    });
  }

  out.educationOffices = merged;

  mkdirSync('scripts/output', { recursive: true });
  writeFileSync('scripts/output/eduinfo-2026.json', JSON.stringify(out, null, 2));

  // === 요약 출력 ===
  console.log('\n=== 2026 교육청 세입총계 (조원) — eduinfo opbdIntFiSta ===');
  console.log(merged
    .filter((m) => m.office.endsWith('교육청'))
    .sort((a, b) => b.revenue2026 - a.revenue2026)
    .map((m) => `  ${m.office.padEnd(22)} ${(m.revenue2026 / 1e12).toFixed(2)}조   (metro: ${m.metro})`)
    .join('\n'));

  const total2024 = Object.values(out.years['2024']).reduce((s, v) => s + (v.revenue || 0), 0);
  const total2025 = Object.values(out.years['2025']).reduce((s, v) => s + (v.revenue || 0), 0);
  const total2026 = Object.values(out.years['2026']).reduce((s, v) => s + (v.revenue || 0), 0);
  console.log('\n=== 전국 합계 추이 (조원) ===');
  console.log(`  2024 결산: ${(total2024 / 1e12).toFixed(2)}조`);
  console.log(`  2025 예산: ${(total2025 / 1e12).toFixed(2)}조  (교육부 발표: 104.9조)`);
  console.log(`  2026 예산: ${(total2026 / 1e12).toFixed(2)}조  (교육부 발표: 106.3조)`);
  console.log('\n저장: scripts/output/eduinfo-2026.json');
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
