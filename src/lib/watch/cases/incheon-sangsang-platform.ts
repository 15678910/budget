import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 2 — 인천 상상플랫폼」 */

const NEWSIS: CaseSource = {
  title: '상상플랫폼 총사업비와 재공모 보도',
  publisher: '뉴시스',
  date: '2025-12-29',
  url: 'https://www.newsis.com/view/NISX20251229_0003458014',
  quote: '반쪽 운영',
};

const KYEONGIN: CaseSource = {
  title: '개관 이후 임대사업자 계약 해지 경위 보도',
  publisher: '경인일보',
  date: '2025-02-24',
  url: 'https://www.kyeongin.com/article/1730473',
};

export const INCHEON_SANGSANG_PLATFORM: WatchCase = {
  slug: 'incheon-sangsang-platform',
  gov: { level: 'metro', code: '28', name: '인천광역시' },
  title: '상상플랫폼 조성·운영',
  amountEok: 1003,
  amountNote: '총사업비 1,003억원(국비 126억, 시비 877억)',
  summary:
    '인천 상상플랫폼은 총사업비 1,003억원(국비 126억, 시비 877억)으로 조성돼 2024년 7월 개관했다. 2025년 2월 LG헬로비전과 월미하이랜드가 잇따라 계약 해지 의사를 밝혔고 LG헬로비전은 2025년 7월 27일 철수했다. 인천관광공사는 최장 20년 조건으로 신규 파트너를 재공모하고 있다.',
  timeline: [
    { date: '2024-07-01', label: '개관(2024년 7월)', source: KYEONGIN },
    { date: '2025-02-17', label: 'LG헬로비전 계약 해지 의사 표명', source: KYEONGIN },
    { date: '2025-02-24', label: '월미하이랜드 계약 해지 통보', source: KYEONGIN },
    { date: '2025-07-27', label: 'LG헬로비전 철수', source: KYEONGIN },
  ],
  claims: [
    {
      statement: '상상플랫폼에 877억원이 투입됐다.',
      verdict: 'partial',
      finding:
        '총사업비는 1,003억원(국비 126억원, 시비 877억원)이고 877억원은 시비 몫이다. “877억원 = 총사업비”는 부정확하다.',
      sources: [NEWSIS],
    },
    {
      statement: '개관 1년 만에 임대사업자가 철수하고 공실이 생겼다.',
      verdict: 'confirmed',
      finding:
        '2024년 7월 개관 뒤 LG헬로비전이 2025년 2월 17일, 월미하이랜드가 2025년 2월 24일 계약 해지 의사를 밝혔고 LG헬로비전은 2025년 7월 27일 철수했다.',
      sources: [KYEONGIN],
    },
    {
      statement: '현재도 시설이 정상 운영되지 않고 있다.',
      verdict: 'confirmed',
      finding: '인천관광공사가 “반쪽 운영” 중이며 최장 20년 조건으로 신규 파트너를 재공모한다고 보도됐다.',
      sources: [NEWSIS],
    },
  ],
  procedures: [
    { key: 'investment-review', status: 'unknown', note: '확인 자료 없음' },
    { key: 'feasibility-study', status: 'unknown', note: '확인 자료 없음' },
    { key: 'council-approval', status: 'unknown', note: '확인 자료 없음' },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  tags: [],
  status: '반쪽 운영·신규 파트너 재공모(2025-12 보도 기준)',
  verifiedAt: '2026-09-23',
};
