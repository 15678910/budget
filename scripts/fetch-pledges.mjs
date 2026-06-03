#!/usr/bin/env node
/**
 * 선거 공약 수집 — 중앙선관위 (apis.data.go.kr/9760000)
 *  1) 후보: PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire (huboid)
 *  2) 공약: ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire?cnddtId=huboid
 *     → 후보당 1행, prmsTitle1~5 + prmmCont1~5 + prmsOrd1~5 (분야 필드 없음)
 * 기본: 2026 제9회 지방선거 교육감(sgId=20260603, sgTypecode=11)
 * 산출물: public/data/pledges-<sgId>-<type>.json (PledgeDataset)
 *
 * 사용: DATAGOKR_API_KEY=<Encoding키> node scripts/fetch-pledges.mjs [sgTypecode]
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.DATAGOKR_API_KEY;
if (!KEY) { console.error('DATAGOKR_API_KEY 필요'); process.exit(1); }
const SG_ID = process.env.SG_ID || '20260603';
const SG_TYPE = process.argv[2] || '11';
const TYPE_NM = { '11': '교육감', '3': '시도지사', '4': '구시군의장' }[SG_TYPE] || SG_TYPE;
const HOST = 'http://apis.data.go.kr/9760000';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseItems(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const o = {};
    for (const f of m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) o[f[1]] = f[2].trim();
    return o;
  });
  return { items, result: (xml.match(/<resultCode>([^<]+)/) || [])[1], total: Number((xml.match(/<totalCount>(\d+)/) || [])[1] || 0) };
}

async function get(url, attempts = 6) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const txt = await (await fetch(url)).text();
      if (txt.includes('Forbidden')) { console.error('Forbidden — 활용신청/전파 미완료'); process.exit(2); }
      const p = parseItems(txt);
      if (p.result && p.result.startsWith('INFO-0')) return p;
    } catch { /* retry */ }
    await sleep(1200);
  }
  return null;
}

(async () => {
  // 1) 후보 목록 (페이지당 100 제한 → 페이지네이션)
  const cands = [];
  for (let page = 1; page <= 30; page++) {
    const cand = await get(`${HOST}/PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire?serviceKey=${KEY}&pageNo=${page}&numOfRows=100&sgId=${SG_ID}&sgTypecode=${SG_TYPE}`);
    if (!cand || cand.items.length === 0) break;
    cands.push(...cand.items.filter((c) => c.huboid));
    if (cands.length >= cand.total || cand.items.length < 100) break;
    await sleep(120);
  }
  if (cands.length === 0) { console.error('후보 0명'); process.exit(3); }
  console.error(`후보 ${cands.length}명 · 공약 수집…`);

  // 2) 후보별 공약
  const candidates = [];
  for (const c of cands) {
    const pr = await get(`${HOST}/ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire?serviceKey=${KEY}&pageNo=1&numOfRows=1&sgId=${SG_ID}&sgTypecode=${SG_TYPE}&cnddtId=${c.huboid}`, 4);
    const row = pr?.items?.[0] || {};
    const pledges = [];
    for (let i = 1; i <= 10; i++) {
      const title = row[`prmsTitle${i}`];
      if (!title) continue;
      pledges.push({ ord: Number(row[`prmsOrd${i}`]) || i, realm: '', title, content: row[`prmmCont${i}`] || '' });
    }
    candidates.push({
      cnddtId: c.huboid, name: c.name || row.krName || '', party: c.jdName || '무소속',
      sido: c.sdName || c.sggName || row.sidoName || '', sgg: c.sggName || '', pledges,
    });
    process.stderr.write(`\r${candidates.length}/${cands.length} (${c.name} 공약 ${pledges.length})   `);
    await sleep(150);
  }
  process.stderr.write('\n');
  candidates.sort((a, b) => a.sido.localeCompare(b.sido, 'ko') || a.name.localeCompare(b.name, 'ko'));

  mkdirSync('public/data', { recursive: true });
  const out = `public/data/pledges-${SG_ID}-${SG_TYPE}.json`;
  writeFileSync(out, JSON.stringify({ sgId: SG_ID, sgTypecode: SG_TYPE, sgName: `${TYPE_NM}선거`, collectedAt: '', candidates }));
  const withP = candidates.filter((c) => c.pledges.length > 0).length;
  console.log(`✅ ${TYPE_NM} 후보 ${candidates.length}명 (공약보유 ${withP}) → ${out}`);
  candidates.slice(0, 6).forEach((c) => console.log(`  ${c.sido} ${c.name} — 공약 ${c.pledges.length}`));
})();
