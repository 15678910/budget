#!/usr/bin/env node
/**
 * 학교 상세(학생수·학급수·교원수) 수집 — apiType=09(학년별·학급별 학생수)
 * 초·중·고 전국, 관할 교육지원청(JU_ORG)별 그룹.
 * 산출물: public/data/education-schools-detail-2024.json
 *   { byDistrict: { <JU_ORG_CODE>: [{n,k,s,c,t}] }, districts: [{code,name,sido,schools,students,teachers}] }
 *   n=학교명 k=학교급 s=학생수 c=학급수 t=교원수
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.SCHOOLINFO_API_KEY;
if (!KEY) { console.error('SCHOOLINFO_API_KEY 필요'); process.exit(1); }
const BASE = 'https://www.schoolinfo.go.kr/openApi.do';
const YEAR = '2024';
const KINDS = { '02': '초', '03': '중', '04': '고' };
const GAP = 200;
const REGIONS = JSON.parse(readFileSync('scripts/_regions.json', 'utf8'));
const SIDO_NM = { '11':'서울','26':'부산','27':'대구','28':'인천','29':'광주','30':'대전','31':'울산','36':'세종','41':'경기','51':'강원','43':'충북','44':'충남','52':'전북','46':'전남','47':'경북','48':'경남','50':'제주' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const n = (v) => Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;

(async () => {
  const byDistrict = {};
  const distMeta = {}; // code → {name, sido}
  let total = 0;
  for (const sido of Object.keys(REGIONS)) {
    for (const sgg of REGIONS[sido]) {
      for (const knd of Object.keys(KINDS)) {
        try {
          const res = await fetch(`${BASE}?apiKey=${KEY}&apiType=09&pbanYr=${YEAR}&schulKndCode=${knd}&sidoCode=${sido}&sggCode=${sgg}`);
          if (res.ok) {
            const j = await res.json();
            if (j.resultCode === 'success') {
              for (const r of j.list || []) {
                // 교육지원청명(JU_ORG_NM)으로 그룹핑 — 일부 학교가 본청 코드(…0001)를
                // 공유해 코드 기준 그룹핑 시 오라벨되는 문제 방지.
                const key = (r.JU_ORG_NM || '').trim();
                if (!key) continue;
                (byDistrict[key] ?? (byDistrict[key] = [])).push({
                  n: r.SCHUL_NM, k: KINDS[knd],
                  s: n(r.COL_S_SUM), c: n(r.COL_C_SUM), t: n(r.TEACH_CNT),
                });
                if (!distMeta[key]) distMeta[key] = { name: key, sido: SIDO_NM[sido] };
                total++;
              }
            }
          }
        } catch { /* skip */ }
        await sleep(GAP);
      }
      process.stderr.write(`\r${SIDO_NM[sido]} ${sgg} · 누적 ${total}교   `);
    }
  }
  process.stderr.write('\n');

  // 학교 정렬(학교급→학생수) + 교육지원청 집계 (key = 교육지원청명)
  const districts = [];
  for (const [key, schools] of Object.entries(byDistrict)) {
    const order = { 초: 0, 중: 1, 고: 2 };
    schools.sort((a, b) => (order[a.k] - order[b.k]) || (b.s - a.s));
    districts.push({
      code: key, name: distMeta[key].name, sido: distMeta[key].sido,
      schools: schools.length,
      students: schools.reduce((x, s) => x + s.s, 0),
      teachers: schools.reduce((x, s) => x + s.t, 0),
      classes: schools.reduce((x, s) => x + s.c, 0),
    });
  }
  districts.sort((a, b) => b.students - a.students);

  // 시도 집계
  const byMetro = {};
  for (const d of districts) {
    const m = byMetro[d.sido] ?? (byMetro[d.sido] = { sido: d.sido, districts: 0, schools: 0, students: 0, teachers: 0 });
    m.districts++; m.schools += d.schools; m.students += d.students; m.teachers += d.teachers;
  }

  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/education-schools-detail-2024.json',
    JSON.stringify({ year: YEAR, byDistrict, districts, metros: Object.values(byMetro) }));

  console.log(`✅ 학교 ${total}교 · 교육지원청 ${districts.length} · 시도 ${Object.keys(byMetro).length}`);
  console.log('[시도별]');
  Object.values(byMetro).sort((a,b)=>b.students-a.students).forEach(m=>
    console.log(`  ${m.sido.padEnd(4)} ${m.schools}교 · 학생 ${(m.students/10000).toFixed(1)}만 · 교원 ${(m.teachers/10000).toFixed(1)}만`));
})();
