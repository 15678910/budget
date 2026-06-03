#!/usr/bin/env node
/**
 * 유치원 기본현황 수집 — 유치원알리미 OpenAPI (basicInfo2.do)
 * 원아수(ppcnt3/4/5/mix/sh) + 학급수(clcnt3/4/5/mix/sh)를 유치원별로 집계,
 * 기존 학교 데이터와 동일하게 교육지원청(school-detail district)별로 묶는다.
 * 산출물: public/data/kindergarten-2024.json
 *   { year, byDistrict: { <교육지원청명>: [{n,s,c,est,sgg,la,lo}] }, total }
 *     n=유치원명 s=원아수 c=학급수 est=설립유형 sgg=시군구 la=위도 lo=경도
 */
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.KINDERINFO_API_KEY;
if (!KEY) { console.error('KINDERINFO_API_KEY 필요'); process.exit(1); }
const BASE = 'https://e-childschoolinfo.moe.go.kr/api/notice/basicInfo2.do';
const GAP = 150;
const PAGE = 100;
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
  // sggName → 교육지원청명 (학교 데이터의 district명과 일치시키기 위함)
  const school = JSON.parse(readFileSync('public/data/education-schools-detail-2024.json', 'utf8'));
  const sggToDistrict = {};
  for (const d of school.districts) {
    if (!d.name.includes('지원청')) continue;
    for (const g of d.sggs || []) sggToDistrict[g] = d.name;
  }

  const byDistrict = {};
  let total = 0, unmapped = 0;
  for (const sido of Object.keys(REGIONS)) {
    for (const sgg of REGIONS[sido]) {
      const sggName = SGG_NAME[sgg];
      for (let page = 1; page <= 20; page++) {
        let list = [];
        try {
          const res = await fetch(`${BASE}?key=${KEY}&sidoCode=${sido}&sggCode=${sgg}&pageCnt=${PAGE}&currentPage=${page}`);
          if (res.ok) {
            const j = await res.json();
            if (j.status === 'SUCCESS') list = j.kinderInfo || [];
          }
        } catch { /* skip */ }
        if (list.length === 0) break;
        for (const r of list) {
          // 교육지원청명: 학교 district명 우선, 없으면 subofficeedu
          const target = sggToDistrict[sggName] || (r.subofficeedu || '').trim();
          if (!sggToDistrict[sggName]) unmapped++;
          const students = n(r.ppcnt3) + n(r.ppcnt4) + n(r.ppcnt5) + n(r.mixppcnt) + n(r.shppcnt);
          const classes = n(r.clcnt3) + n(r.clcnt4) + n(r.clcnt5) + n(r.mixclcnt) + n(r.shclcnt);
          const la = parseFloat(r.lttdcdnt), lo = parseFloat(r.lngtcdnt);
          (byDistrict[target] ?? (byDistrict[target] = [])).push({
            n: r.kindername, s: students, c: classes, est: r.establish || '',
            sgg: sggName || '',
            la: Number.isFinite(la) ? +la.toFixed(6) : null,
            lo: Number.isFinite(lo) ? +lo.toFixed(6) : null,
          });
          total++;
        }
        if (list.length < PAGE) break;
        await sleep(GAP);
      }
      await sleep(GAP);
    }
    process.stderr.write(`\r${SIDO_NM[sido]} 완료 · 유치원 누적 ${total}   `);
  }
  process.stderr.write('\n');

  // 유치원 정렬(원아수 내림차순)
  for (const k of Object.keys(byDistrict)) byDistrict[k].sort((a, b) => b.s - a.s);

  writeFileSync('public/data/kindergarten-2024.json', JSON.stringify({ year: '2024', byDistrict, total }));
  console.log(`✅ 유치원 ${total}곳 · 교육지원청 ${Object.keys(byDistrict).length} (미매핑 ${unmapped})`);

  const inje = Object.keys(byDistrict).find((k) => k.includes('인제'));
  if (inje) {
    const arr = byDistrict[inje];
    console.log(`[검증] ${inje}: 유치원 ${arr.length}곳, 원아 ${arr.reduce((x, s) => x + s.s, 0)}명`);
    console.log('  예:', arr.slice(0, 5).map((s) => `${s.n}(${s.s})`).join(', '));
  }
})();
