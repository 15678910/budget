#!/usr/bin/env node
/**
 * 고교 유형별 비교용 — apiType=62(학교현황, schulKndCode=04) 전국 수집
 * HS_KND_SC_NM(일반/특수목적/특성화/자율고) + 학생수(COL_FGR_SUM) 추출,
 * 기존 학교회계 예산(schoolinfo-raw-2024.json의 고교분)과 schulCode로 조인.
 * 산출물: src/lib/data/highschool-types.ts (유형×시도 집계, 임베드)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.SCHOOLINFO_API_KEY;
if (!KEY) { console.error('SCHOOLINFO_API_KEY 필요'); process.exit(1); }
const BASE = 'https://www.schoolinfo.go.kr/openApi.do';
const GAP = 200;

// 지역 코드 (build-schoolinfo-regions.mjs와 동일, 구분리 대도시 포함)
const REGIONS = JSON.parse(readFileSync('scripts/_regions.json', 'utf8'));
const SIDO_NM = { '11':'서울','26':'부산','27':'대구','28':'인천','29':'광주','30':'대전','31':'울산','36':'세종','41':'경기','51':'강원','43':'충북','44':'충남','52':'전북','46':'전남','47':'경북','48':'경남','50':'제주' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 고교 예산 맵 (schulCode → budget)
const rawBudget = existsSync('scripts/output/schoolinfo-raw-2024.json')
  ? JSON.parse(readFileSync('scripts/output/schoolinfo-raw-2024.json', 'utf8'))
  : [];
const budgetByCode = {};
for (const s of rawBudget) if (s.kind === '고') budgetByCode[s.schulCode] = s.budget;

// "437(0)" → 437 (괄호 앞 정수만), "1,234" → 1234
function parseNum(v) {
  const s = String(v ?? '').split('(')[0].replace(/[^0-9.]/g, '');
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

(async () => {
  const schools = [];
  for (const sido of Object.keys(REGIONS)) {
    for (const sgg of REGIONS[sido]) {
      try {
        const url = `${BASE}?apiKey=${KEY}&apiType=62&pbanYr=2024&schulKndCode=04&sidoCode=${sido}&sggCode=${sgg}`;
        const res = await fetch(url);
        if (res.ok) {
          const j = await res.json();
          if (j.resultCode === 'success') {
            for (const r of j.list || []) {
              schools.push({
                code: r.SCHUL_CODE, name: r.SCHUL_NM, sido: SIDO_NM[sido],
                type: r.HS_KND_SC_NM || '기타',
                students: parseNum(r.COL_FGR_SUM),
                budget: budgetByCode[r.SCHUL_CODE] || 0,
              });
            }
          }
        }
      } catch { /* skip */ }
      await sleep(GAP);
    }
    process.stderr.write(`\r${SIDO_NM[sido]} 수집… 누적 ${schools.length}교   `);
  }
  process.stderr.write('\n');

  // 유형 정규화 (일반/특목/특성화/자율/기타)
  const norm = (t) => t.includes('일반') ? '일반고' : t.includes('특수목적') ? '특목고' : t.includes('특성화') ? '특성화고' : t.includes('자율') ? '자율고' : '기타';

  // 유형 전국 집계
  const byType = {};
  // 유형×시도 집계
  const byTypeSido = {};
  for (const s of schools) {
    const t = norm(s.type);
    const a = byType[t] ?? (byType[t] = { type: t, schools: 0, students: 0, budget: 0 });
    a.schools++; a.students += s.students; a.budget += s.budget;
    const key = t + '|' + s.sido;
    const b = byTypeSido[key] ?? (byTypeSido[key] = { type: t, sido: s.sido, schools: 0, students: 0, budget: 0 });
    b.schools++; b.students += s.students; b.budget += s.budget;
  }
  const typeAgg = Object.values(byType).map((x) => ({ ...x, perStudent: x.students > 0 ? Math.round(x.budget / x.students) : 0 }))
    .sort((a, b) => b.students - a.students);
  const typeSidoAgg = Object.values(byTypeSido).map((x) => ({ ...x, perStudent: x.students > 0 ? Math.round(x.budget / x.students) : 0 }));

  const ts = `// 고교 유형별 집계 — 자동생성 (scripts/fetch-highschool-types.mjs)
// 출처: 학교알리미 apiType=62(학교현황) HS_KND_SC_NM + 학교회계 예산(27) 조인. 2024.
// 유형: 일반고/특목고(과학·외고·국제 등)/특성화고/자율고. 영재학교는 미포함(별도법).
// budget = 학교회계 세출 합(원, 인건비 제외). 수동편집 금지.
export interface HsTypeAgg { type: string; schools: number; students: number; budget: number; perStudent: number }
export interface HsTypeSidoAgg extends HsTypeAgg { sido: string }
export const HS_TYPE_TOTAL = ${schools.length};
export const HS_TYPE_AGG: HsTypeAgg[] = ${JSON.stringify(typeAgg, null, 1)};
export const HS_TYPE_SIDO_AGG: HsTypeSidoAgg[] = ${JSON.stringify(typeSidoAgg, null, 1)};
`;
  writeFileSync('src/lib/data/highschool-types.ts', ts);
  console.log(`\n✅ src/lib/data/highschool-types.ts — 고교 ${schools.length}교`);
  console.log('[유형별 전국]');
  typeAgg.forEach((t) => console.log(`  ${t.type.padEnd(8)} ${t.schools}교 · ${t.students.toLocaleString()}명 · 1인당 ${Math.round(t.perStudent/1e4)}만원`));
})();
