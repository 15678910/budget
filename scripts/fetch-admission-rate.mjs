#!/usr/bin/env node
/**
 * 대학 진학률 수집 — 한국교육개발원_시도 시군구별 졸업자 진학자 진학률
 * data.go.kr 15053808 (api.odcloud.kr 자동변환 REST API)
 * 연도별 엔드포인트(uddi)에서 시군구별(229) 수집 → 시도(17) 가중집계.
 *
 * 산출물:
 *   src/lib/data/admission-rate.ts — 시도별 진학률 (연도별, 임베드)
 *   public/data/admission-sgg-2025.json — 시군구별 최신연도 (지연로딩)
 *
 * 사용법: ODCLOUD_KEY='<decoding key>' node scripts/fetch-admission-rate.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.ODCLOUD_KEY;
if (!KEY) { console.error('ODCLOUD_KEY 필요'); process.exit(1); }
const BASE = 'https://api.odcloud.kr/api/15053808/v1';

// 연도 → uddi (Swagger에서 확인)
const YEAR_UDDI = {
  2022: 'e5cc9904-c8cd-4204-a80a-a7fef1e9a261',
  2023: 'c412a0a9-8f4a-4fe1-8a85-8f58f22d2579',
  2024: '51d04adc-24ae-46aa-b7cd-9f36e850b6ed',
  2025: '541f777f-0c40-4731-9d5b-894ad56db32a',
};
const LATEST = 2025;

const num = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;

async function fetchYear(uddi) {
  const url = new URL(`${BASE}/uddi:${uddi}`);
  url.searchParams.set('serviceKey', KEY);
  url.searchParams.set('page', '1');
  url.searchParams.set('perPage', '500');
  url.searchParams.set('returnType', 'JSON');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return j.data || [];
}

(async () => {
  const sggByYear = {}; // year → [{시도,시군구,졸업자,진학자,진학률}]
  for (const [year, uddi] of Object.entries(YEAR_UDDI)) {
    const rows = await fetchYear(uddi);
    sggByYear[year] = rows.map((r) => ({
      sido: r.시도, sgg: r.시군구,
      grads: num(r.졸업자), advanced: num(r.진학자), rate: num(r.진학률),
    }));
    process.stderr.write(`${year}: ${rows.length}개 시군구\n`);
  }

  // 시도별 가중집계 (진학률 = Σ진학자/Σ졸업자×100)
  const sidoSeries = {}; // sido → { year → rate }
  for (const [year, rows] of Object.entries(sggByYear)) {
    const bySido = {};
    for (const r of rows) {
      const a = bySido[r.sido] ?? (bySido[r.sido] = { grads: 0, advanced: 0 });
      a.grads += r.grads; a.advanced += r.advanced;
    }
    for (const [sido, v] of Object.entries(bySido)) {
      (sidoSeries[sido] ?? (sidoSeries[sido] = {}))[year] = v.grads > 0 ? +(v.advanced / v.grads * 100).toFixed(1) : 0;
    }
  }

  const years = Object.keys(YEAR_UDDI).map(Number).sort();
  const sidoAgg = Object.entries(sidoSeries).map(([sido, series]) => ({
    sido,
    latest: series[LATEST] ?? 0,
    series: years.map((y) => ({ year: y, rate: series[y] ?? 0 })),
  })).sort((a, b) => b.latest - a.latest);

  // 전국 가중평균 (최신)
  const latestRows = sggByYear[LATEST];
  const natGrads = latestRows.reduce((s, r) => s + r.grads, 0);
  const natAdv = latestRows.reduce((s, r) => s + r.advanced, 0);
  const national = natGrads > 0 ? +(natAdv / natGrads * 100).toFixed(1) : 0;

  const ts = `// 대학 진학률 (시도별) — 자동생성 (scripts/fetch-admission-rate.mjs)
// 출처: 한국교육개발원 교육통계 "시도 시군구별 졸업자 진학자 진학률"
//   (공공데이터포털 15053808 / api.odcloud.kr). 시군구 가중집계.
// 진학률 = 진학자/졸업자×100. 수동편집 금지.
export interface AdmissionSido { sido: string; latest: number; series: { year: number; rate: number }[] }
export const ADMISSION_YEARS = ${JSON.stringify(years)};
export const ADMISSION_LATEST_YEAR = ${LATEST};
export const ADMISSION_NATIONAL_LATEST = ${national};
export const ADMISSION_SIDO: AdmissionSido[] = ${JSON.stringify(sidoAgg, null, 1)};
`;
  writeFileSync('src/lib/data/admission-rate.ts', ts);

  // 시군구별 최신연도 (지연로딩)
  mkdirSync('public/data', { recursive: true });
  const sggLatest = sggByYear[LATEST].map((r) => ({ sido: r.sido, sgg: r.sgg, rate: r.rate, grads: r.grads }))
    .sort((a, b) => b.rate - a.rate);
  writeFileSync(`public/data/admission-sgg-${LATEST}.json`, JSON.stringify({ year: LATEST, list: sggLatest }));

  console.log(`\n✅ 생성 완료 (전국 ${national}%, ${LATEST})`);
  console.log('[시도별 진학률 순위]');
  sidoAgg.forEach((s, i) => console.log(`  ${(i+1).toString().padStart(2)}. ${s.sido.padEnd(4)} ${s.latest}%`));
})();
