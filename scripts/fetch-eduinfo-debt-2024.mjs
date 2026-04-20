#!/usr/bin/env node
/**
 * 교육청 실질 채무(= 민간투자사업 BTL 잔액) 2024 수집
 *
 * 배경:
 *   - eduinfo `opclLoEduDebt`(지방채/교육채 잔액) 은 2022년부터 전 교육청 잔액 0원.
 *     2020~2022 교부금 급증으로 대부분 조기상환 완료.
 *   - 실질적인 장기 채무 부담은 **BTL(민간투자사업) 원리금 상환**.
 *     → `opclPriInvstBizBTL` 에서 `FNOW_REMDR` (현재 잔여 원금) 필드가 정확한 지표.
 *
 * 산출물: scripts/output/education-debt-2024.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const API_KEY = process.env.EDUINFO_API_KEY || 'VVPBU1000084820260420113531CBLHC';
const BASE = 'http://openapi.eduinfo.go.kr/openApi.do';

const METRO_TO_OFFICE = {
  서울: '서울특별시교육청', 부산: '부산광역시교육청', 대구: '대구광역시교육청',
  인천: '인천광역시교육청', 광주: '광주광역시교육청', 대전: '대전광역시교육청',
  울산: '울산광역시교육청', 세종: '세종특별자치시교육청', 경기: '경기도교육청',
  강원: '강원특별자치도교육청', 충북: '충청북도교육청', 충남: '충청남도교육청',
  전북: '전북특별자치도교육청', 전남: '전라남도교육청', 경북: '경상북도교육청',
  경남: '경상남도교육청', 제주: '제주특별자치도교육청',
};

(async () => {
  // --- BTL 잔액 (2024) ---
  const btlUrl = `${BASE}?requestType=opclPriInvstBizBTL&key=${API_KEY}&type=json&pIndex=1&pSize=500`;
  const btlRes = await fetch(btlUrl);
  const btlJson = await btlRes.json();
  if (btlJson.RESULT?.CODE !== 'INFO') throw new Error('BTL API error: ' + btlJson.RESULT?.MESSAGE);

  const btlByMetro = {};
  for (const r of btlJson.RESULT_LIST || []) {
    if (r.FSCL_Y === '2024') {
      btlByMetro[r.SD_EDU_OFFC_DIV_NM] = {
        balance: r.FNOW_REMDR,         // 잔여 원금
        annualRepay: r.REPAY_AMT_M1,   // 당해연도 상환액
        newSchools: r.DRV_SCHL_CNT_NESTB,
        rebuilds: r.DRV_SCHL_CNT_CERT_REBUIL,
      };
    }
  }

  // --- 지방교육채 잔액 (참고, 대부분 0) ---
  const loDebtRes = await fetch(`${BASE}?requestType=opclLoEduDebt&key=${API_KEY}&type=json&pIndex=1&pSize=500`);
  const loDebtJson = await loDebtRes.json();
  const loByMetro = {};
  for (const r of loDebtJson.RESULT_LIST || []) {
    if (r.YMQ === '2024' && r.ITEM_CD2?.trim().startsWith('지방채 기말잔액')) {
      loByMetro[r.ITEM_CD1] = r.AMT;
    }
  }

  const out = {
    source: 'eduinfo.go.kr opclPriInvstBizBTL + opclLoEduDebt',
    fiscalYear: 2024,
    fetchedAt: new Date().toISOString(),
    notes: [
      '지방교육채(공식 지방채)는 2022년부터 전 교육청 잔액 0원 — 조기상환 완료.',
      'BTL(민간투자사업) 원리금 상환이 교육청의 실질 장기 채무.',
      'BTL 잔액은 학교 신·증축을 민간자본으로 수행 후 장기 임차료로 상환하는 구조.',
    ],
    offices: [],
  };

  for (const [short, office] of Object.entries(METRO_TO_OFFICE)) {
    const btl = btlByMetro[short] || { balance: 0, annualRepay: 0 };
    const lo = loByMetro[short] || 0;
    out.offices.push({
      office,
      metro: short,
      btlBalance: btl.balance,
      btlAnnualRepay: btl.annualRepay,
      loEduDebtBalance: lo,
      totalEffectiveDebt: btl.balance + lo,
      btlBalanceTrillion: +(btl.balance / 1e12).toFixed(3),
    });
  }

  // 전남광주통합특별시교육청 합산 row
  const gw = btlByMetro['광주'] || { balance: 0, annualRepay: 0 };
  const jn = btlByMetro['전남'] || { balance: 0, annualRepay: 0 };
  out.offices.push({
    office: '전남광주통합특별시교육청',
    metro: '전남광주통합',
    btlBalance: gw.balance + jn.balance,
    btlAnnualRepay: gw.annualRepay + jn.annualRepay,
    loEduDebtBalance: (loByMetro['광주'] || 0) + (loByMetro['전남'] || 0),
    totalEffectiveDebt: gw.balance + jn.balance + (loByMetro['광주'] || 0) + (loByMetro['전남'] || 0),
    btlBalanceTrillion: +((gw.balance + jn.balance) / 1e12).toFixed(3),
    note: '광주 + 전남 단순합',
  });

  mkdirSync('scripts/output', { recursive: true });
  writeFileSync('scripts/output/education-debt-2024.json', JSON.stringify(out, null, 2));

  console.log('\n=== 2024 교육청 실질 채무 (BTL 잔액 기준) ===');
  out.offices
    .filter((o) => o.office.endsWith('교육청'))
    .sort((a, b) => b.btlBalance - a.btlBalance)
    .forEach((o) =>
      console.log(
        `  ${o.office.padEnd(22)}  BTL 잔액 ${o.btlBalanceTrillion.toString().padStart(5)}조  연상환액 ${(o.btlAnnualRepay / 1e8).toFixed(0).padStart(4)}억`
      ),
    );

  const total = out.offices
    .filter((o) => o.office !== '전남광주통합특별시교육청')
    .reduce((s, o) => s + o.btlBalance, 0);
  console.log(`\n전국 BTL 잔액 합계: ${(total / 1e12).toFixed(2)}조원`);
  console.log('\n저장: scripts/output/education-debt-2024.json');
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
