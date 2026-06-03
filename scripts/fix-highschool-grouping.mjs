#!/usr/bin/env node
/**
 * 고등학교 그룹핑 수정 — 고(knd=04)는 도교육청 직속이라 JU_ORG_NM이 본청으로 나옴.
 * 시군구(sggCode→sggName)를 기준으로 관할 교육지원청에 재배치한다.
 * 기존 public/data/education-schools-detail-2024.json의 초·중은 유지, 고만 교체.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.SCHOOLINFO_API_KEY;
if (!KEY) { console.error('SCHOOLINFO_API_KEY 필요'); process.exit(1); }
const BASE = 'https://www.schoolinfo.go.kr/openApi.do';
const YEAR = '2024';
const GAP = 150;
const REGIONS = JSON.parse(readFileSync('scripts/_regions.json', 'utf8'));
const SIDO_NM = { '11':'서울','26':'부산','27':'대구','28':'인천','29':'광주','30':'대전','31':'울산','36':'세종','41':'경기','51':'강원','43':'충북','44':'충남','52':'전북','46':'전남','47':'경북','48':'경남','50':'제주' };
const SGG_NAME = (() => {
  const ts = readFileSync('src/lib/data/schoolinfo-regions.ts', 'utf8');
  const arr = JSON.parse(ts.match(/SCHOOLINFO_REGIONS[^=]*=\s*(\[[\s\S]*\]);/)[1]);
  const m = {};
  for (const s of arr) for (const g of s.sgg) m[g.code] = g.name;
  return m;
})();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const n = (v) => Number(String(v ?? '').replace(/[^0-9.]/g, '')) || 0;

(async () => {
  const data = JSON.parse(readFileSync('public/data/education-schools-detail-2024.json', 'utf8'));

  // sggName → 교육지원청명 (지원청만)
  const sggToDistrict = {};
  for (const d of data.districts) {
    if (!d.name.includes('지원청')) continue;
    for (const g of d.sggs || []) sggToDistrict[g] = d.name;
  }

  // 기존 고 제거 (초·중만 남김)
  for (const k of Object.keys(data.byDistrict)) {
    data.byDistrict[k] = data.byDistrict[k].filter((s) => s.k !== '고');
  }

  // 고 재수집 → 시군구 기준 배치
  let total = 0, unmapped = 0;
  for (const sido of Object.keys(REGIONS)) {
    for (const sgg of REGIONS[sido]) {
      try {
        const res = await fetch(`${BASE}?apiKey=${KEY}&apiType=09&pbanYr=${YEAR}&schulKndCode=04&sidoCode=${sido}&sggCode=${sgg}`);
        if (res.ok) {
          const j = await res.json();
          if (j.resultCode === 'success') {
            const sggName = SGG_NAME[sgg];
            for (const r of j.list || []) {
              const target = sggToDistrict[sggName] || (r.JU_ORG_NM || '').trim();
              if (!sggToDistrict[sggName]) unmapped++;
              (data.byDistrict[target] ?? (data.byDistrict[target] = [])).push({
                n: r.SCHUL_NM, k: '고', s: n(r.COL_S_SUM), c: n(r.COL_C_SUM), t: n(r.TEACH_CNT),
              });
              total++;
            }
          }
        }
      } catch { /* skip */ }
      await sleep(GAP);
    }
    process.stderr.write(`\r${SIDO_NM[sido]} 완료 · 고 누적 ${total}   `);
  }
  process.stderr.write('\n');

  // 각 byDistrict 정렬 + districts 통계 재계산 (메타데이터 보존)
  const metaByName = {};
  for (const d of data.districts) metaByName[d.name] = d;
  const order = { 초: 0, 중: 1, 고: 2 };
  const districts = [];
  for (const [key, schools] of Object.entries(data.byDistrict)) {
    schools.sort((a, b) => (order[a.k] - order[b.k]) || (b.s - a.s));
    const meta = metaByName[key] || { name: key, sido: '', sggs: [] };
    districts.push({
      code: meta.code ?? key, name: key, sido: meta.sido ?? '',
      sggs: meta.sggs ?? [],
      schools: schools.length,
      students: schools.reduce((x, s) => x + s.s, 0),
      teachers: schools.reduce((x, s) => x + s.t, 0),
      classes: schools.reduce((x, s) => x + s.c, 0),
    });
  }
  districts.sort((a, b) => b.students - a.students);
  data.districts = districts;

  // 시도 집계 재계산 (지원청+본청 모두 포함)
  const byMetro = {};
  for (const d of districts) {
    if (!d.sido) continue;
    const m = byMetro[d.sido] ?? (byMetro[d.sido] = { sido: d.sido, districts: 0, schools: 0, students: 0, teachers: 0 });
    m.districts++; m.schools += d.schools; m.students += d.students; m.teachers += d.teachers;
  }
  data.metros = Object.values(byMetro);

  writeFileSync('public/data/education-schools-detail-2024.json', JSON.stringify(data));
  console.log(`✅ 고 ${total}교 재배치 (시군구 미매핑 ${unmapped}교는 본청 유지)`);

  // 검증: 인제
  const inje = data.districts.find((d) => d.name.includes('인제'));
  if (inje) {
    const arr = data.byDistrict[inje.name];
    console.log(`[검증] ${inje.name}: 초${arr.filter(s=>s.k==='초').length} 중${arr.filter(s=>s.k==='중').length} 고${arr.filter(s=>s.k==='고').length}`);
    console.log('  고:', arr.filter(s=>s.k==='고').map(s=>s.n).join(', '));
  }
})();
