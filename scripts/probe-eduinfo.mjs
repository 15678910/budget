#!/usr/bin/env node
/**
 * eduinfo.go.kr API 목록에서 예산/결산/통합재정 관련 infId → requestType 매핑 추출
 * 이후 2024/2025/2026 데이터 호출 가능 여부를 검증한다.
 */
import { writeFileSync } from 'node:fs';

const API_KEY = process.env.EDUINFO_API_KEY || 'VVPBU1000084820260420113531CBLHC';
const BASE = 'https://www.eduinfo.go.kr';
const API_BASE = 'http://openapi.eduinfo.go.kr/openApi.do';

// infId, 이름 수집 — openInfScolCateAll.do 응답에서 수집한 예산/결산/통합재정 관련 목록
const TARGETS = [
  ['23VE9AHS1W5HI7RDW6Q58975670', '예산관리 (사업별 세출)'],
  ['EXMV163WFFQ2EZ52IKDG7052701', '예산관리 (다른 분류)'],
  ['C592MKNW4WLP94745NRU5097256', '예산관리 (다른 분류)'],
  ['Z0EE7WXGYSFPZVSUOAC112692694', '예산관리 (다른 분류)'],
  ['6GN383LA5256K46UZ5065108555', '결산관리'],
  ['J31S536942LT580YCI967064275', '결산관리'],
  ['NELZ9OQ6TOHSD44LECLT8986403', '결산관리'],
  ['E2IAOB50W7JONRQ02LVN12687817', '결산관리'],
  ['1TS9N04Q16D29SK7109Q5753525', '통합재정통계'],
  ['4MBKIJ5NI46Z4OV1VK053793178', '통합재정통계'],
  ['5Z7TBWJ1H36F313PL4435768120', '지역통합재정통계'],
  ['X11UJ06H28482HIK86J03805958', '지역통합재정통계'],
  ['78PD71936S5QT9LS9Q757394229', '통합재정수지'],
  ['7IW46939NR8Q186BOSOK5426766', '통합재정수지'],
  ['I320T6WM7NO9493NLZLQ5667193', '성인지 결산'],
  ['Z6DZO42520LB2G568QAL5729037', '성인지 예산'],
  ['1CWFMVZGQJA8H7VQBD9D7929529', '예산 집행비율'],
  ['73N7VG2XD7ZSQP3RIADD7932210', '예산 조기집행비율'],
];

async function fetchRequestType(infId, label) {
  const body = new URLSearchParams({ infId, srvCd: 'A' }).toString();
  const res = await fetch(`${BASE}/portal/service/openInfColViewPopUp.do`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body,
  });
  if (!res.ok) return { infId, label, ok: false, error: `HTTP ${res.status}` };
  const json = await res.json();
  const apiRes = json?.apiRes || null;
  const requestType = apiRes ? apiRes.match(/requestType=([A-Za-z0-9_]+)/)?.[1] : null;
  const infNm = json?.infNm || label;
  return { infId, label: infNm, apiRes, requestType, reqCount: json?.apiList?.length || 0 };
}

async function testYear(requestType, ymq) {
  const url = `${API_BASE}?requestType=${requestType}&key=${API_KEY}&type=json&pIndex=1&pSize=3&YMQ=${ymq}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ymq, ok: false, error: `HTTP ${res.status}` };
    const text = await res.text();
    // Response may be { opbdBudgMagN: [{head:[{TOTAL_CNT:..}]}, {row:[...]}] } etc.
    try {
      const j = JSON.parse(text);
      // Format A (flat):     { TOTAL_CNT, RESULT, RESULT_LIST }
      // Format B (nested):   { <opName>: [{head:[{TOTAL_CNT},{RESULT}]}, {row:[...]}] }
      let totalCnt, resultCode, message, sampleRow;
      if (j.TOTAL_CNT !== undefined || j.RESULT) {
        totalCnt = j.TOTAL_CNT;
        resultCode = j.RESULT?.CODE;
        message = j.RESULT?.MESSAGE;
        sampleRow = j.RESULT_LIST?.[0];
      } else {
        const rootKey = Object.keys(j)[0];
        const rows = j[rootKey];
        const head = rows?.[0]?.head;
        totalCnt = head?.find((h) => h.TOTAL_CNT !== undefined)?.TOTAL_CNT;
        const rslt = head?.find((h) => h.RESULT)?.RESULT;
        resultCode = rslt?.CODE;
        message = rslt?.MESSAGE;
        sampleRow = rows?.[1]?.row?.[0];
      }
      return { ymq, ok: true, totalCnt, resultCode, message, sampleKeys: sampleRow ? Object.keys(sampleRow).slice(0, 12) : [] };
    } catch {
      return { ymq, ok: false, body: text.slice(0, 200) };
    }
  } catch (e) {
    return { ymq, ok: false, error: e.message };
  }
}

(async () => {
  const report = [];
  for (const [infId, label] of TARGETS) {
    process.stderr.write(`[${infId}] ${label}... `);
    const meta = await fetchRequestType(infId, label);
    if (!meta.requestType) {
      process.stderr.write('NO requestType\n');
      report.push({ ...meta, years: [] });
      continue;
    }
    const years = [];
    for (const ymq of ['2024', '2025', '2026']) {
      const r = await testYear(meta.requestType, ymq);
      years.push(r);
    }
    const r24 = years.find((y) => y.ymq === '2024');
    const r25 = years.find((y) => y.ymq === '2025');
    const r26 = years.find((y) => y.ymq === '2026');
    process.stderr.write(`${meta.requestType} → 2024:${r24?.totalCnt ?? 'X'} 2025:${r25?.totalCnt ?? 'X'} 2026:${r26?.totalCnt ?? 'X'}\n`);
    report.push({ ...meta, years });
  }
  writeFileSync('eduinfo_api_probe.json', JSON.stringify(report, null, 2));
  console.log('\n=== SUMMARY ===');
  for (const r of report) {
    const y26 = r.years.find((y) => y.ymq === '2026');
    const y25 = r.years.find((y) => y.ymq === '2025');
    const y24 = r.years.find((y) => y.ymq === '2024');
    console.log(`${r.label} (${r.requestType || 'N/A'}): 2024=${y24?.totalCnt ?? 'X'} 2025=${y25?.totalCnt ?? 'X'} 2026=${y26?.totalCnt ?? 'X'}`);
  }
})();
