#!/usr/bin/env node
/**
 * schoolinfo-budget-<year>.json (원본 수집) → 앱용 파생 데이터 2종 생성
 *   1) src/lib/data/education-districts.ts  — 시도(17)+교육지원청(183) 집계 (임베드)
 *   2) public/data/education-schools-<year>.json — 학교 슬림 목록 (교육지원청별, 지연로딩)
 *
 * 처리:
 *   - 시도(metro) 집계는 학교 physical `sido` 기준 재롤업 (국립 A000000001 분산 정리 → 17개)
 *   - 교육지원청(district)은 districtOfficeCode 기준
 *   - perStudent = budget/students
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const YEAR = process.argv[2] || '2024';
const raw = JSON.parse(readFileSync(`scripts/output/schoolinfo-budget-${YEAR}.json`, 'utf8'));
const schools = raw.schools;

const SIDO_TO_OFFICE = {
  서울: '서울특별시교육청', 부산: '부산광역시교육청', 대구: '대구광역시교육청', 인천: '인천광역시교육청',
  광주: '광주광역시교육청', 대전: '대전광역시교육청', 울산: '울산광역시교육청', 세종: '세종특별자치시교육청',
  경기: '경기도교육청', 강원: '강원특별자치도교육청', 충북: '충청북도교육청', 충남: '충청남도교육청',
  전북: '전북특별자치도교육청', 전남: '전라남도교육청', 경북: '경상북도교육청', 경남: '경상남도교육청', 제주: '제주특별자치도교육청',
};

// ── 시도 집계 (physical sido 기준) ──
const metroMap = {};
for (const s of schools) {
  const office = SIDO_TO_OFFICE[s.sido];
  if (!office) continue;
  const m = metroMap[office] ?? (metroMap[office] = { name: office, sido: s.sido, schoolBudget: 0, students: 0, schoolCount: 0, districts: new Set() });
  m.schoolBudget += s.budget;
  m.students += s.students;
  m.schoolCount++;
  if (s.districtOfficeCode) m.districts.add(s.districtOfficeCode);
}

// ── 교육지원청 집계 ──
const distMap = {};
for (const s of schools) {
  if (!s.districtOfficeCode) continue;
  const office = SIDO_TO_OFFICE[s.sido] ?? s.metroOffice;
  const d = distMap[s.districtOfficeCode] ?? (distMap[s.districtOfficeCode] = {
    code: s.districtOfficeCode, name: s.districtOffice, metroOffice: office, sido: s.sido,
    schoolBudget: 0, students: 0, schoolCount: 0,
  });
  d.schoolBudget += s.budget;
  d.students += s.students;
  d.schoolCount++;
}

const metros = Object.values(metroMap).map((m) => ({
  name: m.name, sido: m.sido,
  schoolBudget: Math.round(m.schoolBudget),
  students: m.students,
  schoolCount: m.schoolCount,
  districtCount: m.districts.size,
  perStudent: m.students > 0 ? Math.round(m.schoolBudget / m.students) : 0,
})).sort((a, b) => b.schoolBudget - a.schoolBudget);

const districts = Object.values(distMap).map((d) => ({
  code: d.code, name: d.name, metroOffice: d.metroOffice, sido: d.sido,
  schoolBudget: Math.round(d.schoolBudget),
  students: d.students,
  schoolCount: d.schoolCount,
  perStudent: d.students > 0 ? Math.round(d.schoolBudget / d.students) : 0,
})).sort((a, b) => b.perStudent - a.perStudent);

// ── TS 파일 생성 ──
const ts = `// ============================================================
// 전국 교육청 학교회계(세출) 집계 — 자동생성 (scripts/build-education-data.mjs)
// 원본: 학교알리미 OpenAPI apiType=27 depthNo2=02 (${YEAR} 예산세출)
//   schoolBudget = 학교회계 세출 합(원). 인건비 등 교육청 직접집행분 제외.
//   학교 ${schools.length}교 집계. 학교 상세는 /data/education-schools-${YEAR}.json 지연로딩.
// ⚠️ 수동 편집 금지 — 재생성: node scripts/build-education-data.mjs ${YEAR}
// ============================================================

export interface DistrictAgg {
  code: string; name: string; metroOffice: string; sido: string;
  schoolBudget: number; students: number; schoolCount: number; perStudent: number;
}
export interface MetroAgg {
  name: string; sido: string;
  schoolBudget: number; students: number; schoolCount: number; districtCount: number; perStudent: number;
}

export const SCHOOL_BUDGET_YEAR = '${YEAR}';
export const SCHOOL_TOTAL_COUNT = ${schools.length};

export const METRO_SCHOOL_AGG: MetroAgg[] = ${JSON.stringify(metros, null, 1)};

export const DISTRICT_SCHOOL_AGG: DistrictAgg[] = ${JSON.stringify(districts, null, 1)};
`;
writeFileSync('src/lib/data/education-districts.ts', ts);

// ── 학교 슬림 목록 (교육지원청 코드별 그룹, 지연로딩) ──
const byDist = {};
for (const s of schools) {
  if (!s.districtOfficeCode) continue;
  (byDist[s.districtOfficeCode] ?? (byDist[s.districtOfficeCode] = [])).push({
    n: s.name, k: s.kind, b: Math.round(s.budget), s: s.students, p: Math.round(s.perHead),
  });
}
for (const code of Object.keys(byDist)) byDist[code].sort((a, b) => b.p - a.p);
mkdirSync('public/data', { recursive: true });
writeFileSync(`public/data/education-schools-${YEAR}.json`, JSON.stringify({ year: YEAR, byDistrict: byDist }));

console.log(`✅ 생성 완료`);
console.log(`  src/lib/data/education-districts.ts — 시도 ${metros.length}, 교육지원청 ${districts.length}`);
console.log(`  public/data/education-schools-${YEAR}.json — 학교 ${schools.length}교 (교육지원청별)`);
console.log(`\n[시도 학교회계 세출 합계]`);
metros.forEach((m) => console.log(`  ${m.name.padEnd(16)} ${(m.schoolBudget/1e12).toFixed(2)}조 · ${m.schoolCount}교 · ${m.districtCount}개 교육지원청 · 1인당 ${Math.round(m.perStudent/1e4)}만원`));
