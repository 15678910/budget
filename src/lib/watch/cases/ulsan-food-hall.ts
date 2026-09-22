import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 7 — 울산 세계음식문화관(26.5억)」 */

const DAUM: CaseSource = {
  title: '총사업비 26억 5천만원과 의회 의결 생략 보도(원출처 확인 필요)',
  publisher: '다음뉴스',
  date: '2026-04-01',
  url: 'https://v.daum.net/v/20260401165946279',
  quote: '순수 건물비가 20억 원 미만',
};

const AUDIT_REQUEST: CaseSource = {
  title: '울산시민연대 감사원 공익감사 청구 보도',
  publisher: '다음뉴스',
  date: '2026-04-06',
  url: 'https://v.daum.net/v/20260406170524441',
};

export const ULSAN_FOOD_HALL: WatchCase = {
  slug: 'ulsan-food-hall',
  gov: { level: 'metro', code: '31', name: '울산광역시' },
  title: '세계음식문화관 조성',
  amountEok: 26.5,
  amountNote: '총사업비 26억 5천만원(공사비+감리비+부대비+위탁운영비)',
  summary:
    '세계음식문화관의 총사업비는 공사비·감리비·부대비·위탁운영비를 합해 26억 5천만원이다. 순수 건물비가 20억원 미만이라는 이유로 공유재산 관리계획과 의회 의결이 생략됐다. 울산시민연대는 2026년 4월 6일 감사원에 공익감사를 청구했다.',
  timeline: [
    { date: '2026-04-01', label: '총사업비 26억 5천만원·의회 의결 생략 보도', source: DAUM },
    { date: '2026-04-06', label: '울산시민연대 감사원 공익감사 청구', source: AUDIT_REQUEST },
  ],
  claims: [
    {
      statement: '취득가를 20억원 미만으로 산정해 의회 의결을 회피했다.',
      verdict: 'confirmed',
      finding:
        '총사업비는 26억 5천만원(공사비+감리비+부대비+위탁운영비)인데 “순수 건물비가 20억 원 미만”이라며 공유재산 관리계획과 의회 의결이 생략됐다. 울산시민연대는 2026년 4월 6일 감사원에 공익감사를 청구했다. 조례의 기준 금액 조문은 대조하지 못했다.',
      sources: [DAUM, AUDIT_REQUEST],
    },
  ],
  procedures: [
    { key: 'investment-review', status: 'unknown', note: '확인 자료 없음' },
    { key: 'feasibility-study', status: 'unknown', note: '확인 자료 없음' },
    {
      key: 'council-approval',
      status: 'not-done',
      note: '총사업비 26억 5천만원이지만 “순수 건물비가 20억 원 미만”이라며 공유재산 관리계획 수립과 의회 의결을 생략했다. 조례의 기준 금액 조문은 대조하지 못했다.',
      source: DAUM,
    },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  // procedural-evasion의 근거: 의회 의결 생략이라는 확인된 주장.
  tags: ['procedural-evasion'],
  status: '감사원 공익감사 청구(2026-04-06)',
  verifiedAt: '2026-09-23',
};
