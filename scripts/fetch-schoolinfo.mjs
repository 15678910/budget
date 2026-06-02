#!/usr/bin/env node
/**
 * 학교알리미(schoolinfo.go.kr) OpenAPI — 전국 학교별 예산세출 수집
 *
 * API: GET https://www.schoolinfo.go.kr/openApi.do
 *   apiKey, apiType=27(학교회계 예·결산서), depthNo=10, depthNo2=02(예산세출),
 *   pbanYr(공시년도), schulKndCode(02초/03중/04고), sidoCode, sggCode
 *   → 2026.1.1 이후 발급 키는 sggCode 필수.
 *
 * 응답 레코드 핵심 필드:
 *   SCHUL_CODE/SCHUL_NM         학교
 *   ATPT_OFCDC_ORG_NM/CODE      시도교육청
 *   JU_ORG_NM/JU_ORG_CODE       관할 교육지원청  ← roll-up 키
 *   AMT1~AMT8                   세출 항목별 금액(원)
 *   YESAN_PER_HEAD              학생 1인당 예산(원)
 *
 * 학생수 = Σ(AMT) / YESAN_PER_HEAD (역산, 학생API와 일치 검증됨)
 *
 * 산출물: scripts/output/schoolinfo-budget-<year>.json
 *   { schools:[...], byDistrict:[...], byMetro:[...], meta:{...} }
 *
 * 사용법: SCHOOLINFO_API_KEY=<key> node scripts/fetch-schoolinfo.mjs [year]
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const KEY = process.env.SCHOOLINFO_API_KEY;
if (!KEY) { console.error('SCHOOLINFO_API_KEY 환경변수 필요'); process.exit(1); }
const YEAR = process.argv[2] || '2024';
const BASE = 'https://www.schoolinfo.go.kr/openApi.do';
const SCHUL_KINDS = ['02', '03', '04']; // 초/중/고
const GAP_MS = 250;                      // 호출 간격 (rate limit 보호)
const CACHE = `scripts/output/schoolinfo-raw-${YEAR}.json`;

// ── 전국 시도(sidoCode) → 시군구(sggCode) 표준 행정구역 코드 ──
const REGIONS = {
  '11': ['11110','11140','11170','11200','11215','11230','11260','11290','11305','11320','11350','11380','11410','11440','11470','11500','11530','11545','11560','11590','11620','11650','11680','11710','11740'],
  '26': ['26110','26140','26170','26200','26230','26260','26290','26320','26350','26380','26410','26440','26470','26500','26530','26710'],
  '27': ['27110','27140','27170','27200','27230','27260','27290','27710','27720'],
  '28': ['28110','28140','28177','28185','28200','28237','28245','28260','28710','28720'],
  '29': ['29110','29140','29155','29170','29200'],
  '30': ['30110','30140','30170','30200','30230'],
  '31': ['31110','31140','31170','31200','31710'],
  '36': ['36110'],
  '41': ['41110','41130','41150','41170','41190','41210','41220','41250','41270','41280','41290','41310','41360','41370','41390','41410','41430','41450','41460','41480','41500','41550','41570','41590','41610','41630','41650','41670','41800','41820','41830'],
  '51': ['51110','51130','51150','51170','51190','51210','51230','51720','51730','51750','51760','51770','51780','51790','51800','51810','51820','51830'],
  '43': ['43110','43130','43150','43720','43730','43740','43745','43750','43760','43770','43800'],
  '44': ['44130','44150','44180','44200','44210','44230','44250','44270','44710','44760','44770','44790','44800','44810','44825'],
  '52': ['52110','52130','52140','52180','52190','52210','52710','52720','52730','52740','52750','52770','52790','52800'],
  '46': ['46110','46130','46150','46170','46230','46710','46720','46730','46770','46780','46790','46800','46810','46820','46830','46840','46860','46870','46880','46890','46900','46910'],
  '47': ['47110','47130','47150','47170','47190','47210','47230','47250','47280','47290','47720','47730','47750','47760','47770','47820','47830','47840','47850','47900','47920','47930','47940'],
  '48': ['48120','48170','48220','48240','48250','48270','48310','48330','48720','48730','48740','48820','48840','48850','48860','48870','48880','48890'],
  '50': ['50110','50130'],
};
// sido 약칭
const SIDO_NM = { '11':'서울','26':'부산','27':'대구','28':'인천','29':'광주','30':'대전','31':'울산','36':'세종','41':'경기','51':'강원','43':'충북','44':'충남','52':'전북','46':'전남','47':'경북','48':'경남','50':'제주' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(sidoCode, sggCode, schulKndCode) {
  const url = `${BASE}?apiKey=${KEY}&apiType=27&depthNo=10&depthNo2=02&pbanYr=${YEAR}&schulKndCode=${schulKndCode}&sidoCode=${sidoCode}&sggCode=${sggCode}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const j = await res.json();
    if (j.resultCode !== 'success' || !Array.isArray(j.list)) return [];
    return j.list;
  } catch {
    return [];
  }
}

function sumAmt(r) {
  let s = 0;
  for (let i = 1; i <= 8; i++) s += Number(r[`AMT${i}`]) || 0;
  return s;
}

(async () => {
  mkdirSync('scripts/output', { recursive: true });

  // 캐시 재사용 (재실행 시 빠른 빌드)
  let rawSchools = [];
  if (existsSync(CACHE)) {
    rawSchools = JSON.parse(readFileSync(CACHE, 'utf8'));
    console.error(`캐시 사용: ${CACHE} (${rawSchools.length}교)`);
  } else {
    const sidos = Object.keys(REGIONS);
    let calls = 0;
    for (const sido of sidos) {
      for (const sgg of REGIONS[sido]) {
        for (const knd of SCHUL_KINDS) {
          const list = await fetchOne(sido, sgg, knd);
          calls++;
          for (const r of list) {
            const budget = sumAmt(r);
            const perHead = Number(r.YESAN_PER_HEAD) || 0;
            const students = perHead > 0 ? Math.round(budget / perHead) : 0;
            rawSchools.push({
              schulCode: r.SCHUL_CODE,
              name: r.SCHUL_NM,
              kind: r.SCHUL_CRSE_SC_VALUE_NM || knd,
              metroOffice: r.ATPT_OFCDC_ORG_NM,
              metroOfficeCode: r.ATPT_OFCDC_ORG_CODE,
              districtOffice: r.JU_ORG_NM,
              districtOfficeCode: r.JU_ORG_CODE,
              sido: SIDO_NM[sido],
              sggCode: sgg,
              budget,
              perHead,
              students,
            });
          }
          await sleep(GAP_MS);
        }
        process.stderr.write(`\r수집중... ${SIDO_NM[sido]} ${sgg}  (${calls}콜, ${rawSchools.length}교)   `);
      }
    }
    process.stderr.write('\n');
    writeFileSync(CACHE, JSON.stringify(rawSchools));
    console.error(`원본 캐시 저장: ${CACHE}`);
  }

  // ── roll-up: 교육지원청 / 시도교육청 ──
  const byDistrict = {};
  const byMetro = {};
  for (const s of rawSchools) {
    if (!s.districtOfficeCode) continue;
    const d = byDistrict[s.districtOfficeCode] ?? (byDistrict[s.districtOfficeCode] = {
      code: s.districtOfficeCode, name: s.districtOffice, metroOffice: s.metroOffice,
      sido: s.sido, budget: 0, students: 0, schoolCount: 0,
    });
    d.budget += s.budget; d.students += s.students; d.schoolCount++;

    const m = byMetro[s.metroOfficeCode] ?? (byMetro[s.metroOfficeCode] = {
      code: s.metroOfficeCode, name: s.metroOffice, budget: 0, students: 0, schoolCount: 0, districtCount: 0,
    });
    m.budget += s.budget; m.students += s.students; m.schoolCount++;
  }
  // 시도별 교육지원청 수 집계
  const distByMetro = {};
  for (const d of Object.values(byDistrict)) {
    distByMetro[d.metroOffice] = (distByMetro[d.metroOffice] || 0) + 1;
  }

  const districts = Object.values(byDistrict)
    .map((d) => ({ ...d, perStudent: d.students > 0 ? d.budget / d.students : 0 }))
    .sort((a, b) => b.perStudent - a.perStudent);
  const metros = Object.values(byMetro)
    .map((m) => ({ ...m, districtCount: distByMetro[m.name] || 0, perStudent: m.students > 0 ? m.budget / m.students : 0 }))
    .sort((a, b) => b.budget - a.budget);

  const out = {
    meta: {
      source: 'schoolinfo.go.kr openApi apiType=27 depthNo2=02 (학교회계 예산세출)',
      year: YEAR,
      fetchedAt: new Date().toISOString(),
      schoolCount: rawSchools.length,
      districtCount: districts.length,
      metroCount: metros.length,
      note: '예산 = 학교회계 세출 합(AMT1~8). 인건비 등 교육청 직접집행분 제외. perStudent=YESAN_PER_HEAD 기반.',
    },
    metros,
    districts,
    schools: rawSchools,
  };
  writeFileSync(`scripts/output/schoolinfo-budget-${YEAR}.json`, JSON.stringify(out, null, 1));

  // 요약 출력
  console.log(`\n=== 수집 완료 (${YEAR}) ===`);
  console.log(`학교 ${rawSchools.length}교 · 교육지원청 ${districts.length}곳 · 시도교육청 ${metros.length}곳`);
  console.log(`\n[시도교육청 학교회계 세출 합계]`);
  metros.forEach((m) => console.log(`  ${m.name.padEnd(16)} ${(m.budget/1e12).toFixed(2)}조 · ${m.schoolCount}교 · 1인당 ${Math.round(m.perStudent/1e4)}만원`));
  console.log(`\n[교육지원청 1인당 예산 Top5 / Bottom5]`);
  districts.slice(0,5).forEach((d)=>console.log(`  ↑ ${d.name.padEnd(22)} 1인당 ${Math.round(d.perStudent/1e4)}만원 (${d.schoolCount}교)`));
  districts.slice(-5).forEach((d)=>console.log(`  ↓ ${d.name.padEnd(22)} 1인당 ${Math.round(d.perStudent/1e4)}만원 (${d.schoolCount}교)`));
  console.log(`\n저장: scripts/output/schoolinfo-budget-${YEAR}.json`);
})();
