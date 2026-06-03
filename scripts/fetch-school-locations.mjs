#!/usr/bin/env node
/**
 * 전국 초중등학교 위치(좌표) 수집 — data.go.kr 전국초중등학교위치표준데이터
 *   tn_pubr_public_elesch_mskul_lc_api (행정안전부, 위도/경도 포함)
 * 산출물: public/data/school-locations.json
 *   { bySgg: { <시군구명>: [{n,k,la,lo}] }, total }
 *     n=학교명 k=학교급(초/중/고) la=위도 lo=경도
 * ※ DATAGOKR_API_KEY는 Encoding 키 → raw 그대로 사용(이중 인코딩 금지)
 */
import { writeFileSync } from 'node:fs';

const KEY = process.env.DATAGOKR_API_KEY;
if (!KEY) { console.error('DATAGOKR_API_KEY 필요'); process.exit(1); }
const BASE = 'https://api.data.go.kr/openapi/tn_pubr_public_elesch_mskul_lc_api';
const PAGE = 1000;
const KIND = { '초등학교': '초', '중학교': '중', '고등학교': '고' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 도로명/지번 주소에서 시군구(두 번째 토큰) 추출 — 인제군/수원시/서초구 등
function parseSgg(addr) {
  if (!addr) return '';
  const t = String(addr).trim().split(/\s+/);
  return t[1] || '';
}

(async () => {
  // 키 전파 지연 대비: resultCode!=00 이면 재시도
  async function fetchPage(page) {
    for (let attempt = 1; attempt <= 8; attempt++) {
      try {
        const url = `${BASE}?serviceKey=${KEY}&pageNo=${page}&numOfRows=${PAGE}&type=json`;
        const res = await fetch(url);
        const j = await res.json();
        if (j.response?.header?.resultCode === '00') {
          const it = j.response.body.items;
          return Array.isArray(it) ? it : (it?.item ? (Array.isArray(it.item) ? it.item : [it.item]) : []);
        }
        await sleep(1500);
      } catch { await sleep(1500); }
    }
    return null; // 8회 실패
  }

  const bySgg = {};
  let total = 0;
  for (let page = 1; page <= 20; page++) {
    const items = await fetchPage(page);
    if (items === null) { console.error(`\n페이지 ${page} 8회 재시도 실패(키 전파 대기 필요)`); break; }
    if (items.length === 0) break;
    for (const r of items) {
      const k = KIND[r.schoolSe] || '';
      if (!k) continue;
      const la = parseFloat(r.latitude), lo = parseFloat(r.longitude);
      const sgg = parseSgg(r.rdnmadr || r.lnmadr);
      if (!sgg) continue;
      (bySgg[sgg] ?? (bySgg[sgg] = [])).push({
        n: r.schoolNm, k,
        la: Number.isFinite(la) ? +la.toFixed(6) : null,
        lo: Number.isFinite(lo) ? +lo.toFixed(6) : null,
      });
      total++;
    }
    process.stderr.write(`\r페이지 ${page} · 누적 ${total}교   `);
    if (items.length < PAGE) break;
    await sleep(120);
  }
  process.stderr.write('\n');

  for (const k of Object.keys(bySgg)) bySgg[k].sort((a, b) => (a.k.localeCompare(b.k)) || a.n.localeCompare(b.n, 'ko'));

  writeFileSync('public/data/school-locations.json', JSON.stringify({ bySgg, total }));
  console.log(`✅ 학교 위치 ${total}교 · 시군구 ${Object.keys(bySgg).length}`);
  const inje = bySgg['인제군'] || [];
  console.log(`[검증] 인제군: ${inje.length}교`, inje.slice(0, 5).map((s) => `${s.n}(${s.k})`).join(', '));
  const coords = inje.filter((s) => s.la && s.lo).length;
  console.log(`  좌표보유: ${coords}/${inje.length}`);
})();
