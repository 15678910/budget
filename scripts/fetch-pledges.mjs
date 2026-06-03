#!/usr/bin/env node
/**
 * 선거 공약 수집 — 중앙선관위 선거공약정보 API
 *   getCnddtElecPrmsInfoInqire (apis.data.go.kr/9760000)
 * 기본: 2026 제9회 지방선거 교육감(sgId=20260603, sgTypecode=11)
 * 산출물: public/data/pledges-<sgId>-<type>.json (PledgeDataset)
 *
 * 사용: DATAGOKR_API_KEY=<Encoding키> node scripts/fetch-pledges.mjs [sgTypecode]
 * ※ DATAGOKR_API_KEY는 Encoding 키 → raw 사용(이중 인코딩 금지)
 * ※ 선거공약 데이터셋(15040587) 활용신청·전파 완료 후 동작(미완료 시 Forbidden)
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.DATAGOKR_API_KEY;
if (!KEY) { console.error('DATAGOKR_API_KEY 필요'); process.exit(1); }
const SG_ID = process.env.SG_ID || '20260603';
const SG_TYPE = process.argv[2] || '11'; // 11=교육감
const TYPE_NM = { '11': '교육감', '3': '시도지사', '4': '구시군의장' }[SG_TYPE] || SG_TYPE;
const BASE = 'http://apis.data.go.kr/9760000/ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire';
const PAGE = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 느슨한 XML 파서 (item 단위)
function parseItems(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const o = {};
    for (const f of m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) o[f[1]] = f[2].trim();
    return o;
  });
  const total = Number((xml.match(/<totalCount>(\d+)/) || [])[1] || 0);
  const result = (xml.match(/<resultCode>([^<]+)/) || [])[1];
  return { items, total, result };
}

(async () => {
  const all = [];
  for (let page = 1; page <= 30; page++) {
    let parsed = null;
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const url = `${BASE}?serviceKey=${KEY}&pageNo=${page}&numOfRows=${PAGE}&sgId=${SG_ID}&sgTypecode=${SG_TYPE}`;
        const res = await fetch(url);
        const txt = await res.text();
        if (txt.includes('Forbidden')) { console.error('Forbidden — 선거공약 데이터셋 활용신청/전파 미완료'); process.exit(2); }
        parsed = parseItems(txt);
        if (parsed.result && parsed.result.startsWith('INFO-0')) break;
        await sleep(1500);
      } catch { await sleep(1500); }
    }
    if (!parsed || parsed.items.length === 0) break;
    all.push(...parsed.items);
    process.stderr.write(`\r페이지 ${page} · 공약 누적 ${all.length}   `);
    if (all.length >= parsed.total || parsed.items.length < PAGE) break;
    await sleep(150);
  }
  process.stderr.write('\n');

  if (all.length === 0) { console.error('공약 0건 — 응답 필드 확인 필요'); process.exit(3); }

  // 후보별 그룹핑 (cnddtId)
  const byCand = {};
  for (const r of all) {
    const id = r.cnddtId || `${r.krName}-${r.sidoName}`;
    const c = byCand[id] ?? (byCand[id] = {
      cnddtId: id, name: r.krName || '', party: r.jdName || '무소속',
      sido: r.sidoName || '', sgg: r.sggName || '', pledges: [],
    });
    c.pledges.push({
      ord: Number(r.prmsOrd) || c.pledges.length + 1,
      realm: r.prmsRealmName || '', title: r.prmsTitle || '', content: r.prmsCont || '',
    });
  }
  const candidates = Object.values(byCand).map((c) => ({ ...c, pledges: c.pledges.sort((a, b) => a.ord - b.ord) }));
  candidates.sort((a, b) => a.sido.localeCompare(b.sido, 'ko') || a.name.localeCompare(b.name, 'ko'));

  mkdirSync('public/data', { recursive: true });
  const out = `public/data/pledges-${SG_ID}-${SG_TYPE}.json`;
  writeFileSync(out, JSON.stringify({ sgId: SG_ID, sgTypecode: SG_TYPE, sgName: `${TYPE_NM}선거`, collectedAt: '', candidates }));
  console.log(`✅ ${TYPE_NM} 후보 ${candidates.length}명 · 공약 ${all.length}건 → ${out}`);
  candidates.slice(0, 5).forEach((c) => console.log(`  ${c.sido} ${c.name}(${c.party}) — 공약 ${c.pledges.length}`));
  // 필드 검증 힌트
  console.log('\n[원시 필드 샘플]', JSON.stringify(all[0]).slice(0, 300));
})();
