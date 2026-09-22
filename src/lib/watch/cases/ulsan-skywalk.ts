import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 6 — 울산 태화루 스카이워크(73억)」 */

const KHAN: CaseSource = {
  title: '태화루 스카이워크 역사경관 논란 보도',
  publisher: '경향신문',
  date: '2023-09-20',
  url: 'https://www.khan.co.kr/article/202309201604001',
};

const NATE: CaseSource = {
  title: '개방 100일 방문객 집계 보도',
  publisher: '네이트뉴스',
  date: '2026-04-06',
  url: 'https://m.news.nate.com/view/20260406n36823',
};

export const ULSAN_SKYWALK: WatchCase = {
  slug: 'ulsan-skywalk',
  gov: { level: 'metro', code: '31', name: '울산광역시' },
  title: '태화루 스카이워크',
  amountEok: 73,
  amountNote: '사업비 73억원',
  summary:
    '태화루 스카이워크는 사업비 73억원 규모의 울산시 사업이다. 2025년 12월 24일 개방했다. 개장 100일 기준 방문객은 약 9만 5천 명으로 보도됐다.',
  timeline: [{ date: '2025-12-24', label: '개방', source: NATE }],
  claims: [
    {
      statement: '전문가 협의 없이 추진됐다.',
      verdict: 'partial',
      finding: '2023년 9월 보도에서 역사경관과 관련한 논란이 확인된다. 협의 절차의 이행 여부를 보여주는 문서는 확인되지 않았다.',
      sources: [KHAN],
    },
    {
      statement: '개장 후 방문객이 거의 없다.',
      verdict: 'refuted',
      finding: '2025년 12월 24일 개방 후 개장 100일 동안 방문객이 약 9만 5천 명이라고 보도됐다.',
      sources: [NATE],
    },
  ],
  procedures: [
    { key: 'investment-review', status: 'unknown', note: '확인 자료 없음' },
    { key: 'feasibility-study', status: 'unknown', note: '확인 자료 없음' },
    { key: 'council-approval', status: 'unknown', note: '확인 자료 없음' },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  tags: [],
  status: '개방 운영 중(2026-04 보도 기준)',
  verifiedAt: '2026-09-23',
};
