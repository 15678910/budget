import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 5 — 부산 퐁피두센터 분관·오페라하우스 공연」 */

const KHAN_AUDIT: CaseSource = {
  title: '퐁피두 분관 비용 추산과 시민단체 공익감사 청구 보도',
  publisher: '경향신문',
  date: '2026-03-02',
  url: 'https://www.khan.co.kr/article/202603021621001/',
  quote: '건립비만 1000억 원이 넘게 들어가고, 매년 120억 원 이상의 운영비와 30억 원의 로열티',
};

const KHAN_AUDIT_REASON: CaseSource = {
  title: '공익감사 청구 사유 보도',
  publisher: '경향신문',
  date: '2026-03-02',
  url: 'https://www.khan.co.kr/article/202603021621001/',
  quote: '지방재정법상 투자심사의무와 타당성 조사 의무 등을 지키지 않았다',
};

const KHAN_DISCLOSURE: CaseSource = {
  title: '선정 경위 공개 여부에 관한 시민단체 주장 보도',
  publisher: '경향신문',
  date: '2026-03-02',
  url: 'https://www.khan.co.kr/article/202603021621001/',
  quote: '왜 퐁피두인지 부산시가 제대로 공개한 적은 한 번도 없다',
};

const SEGYE: CaseSource = {
  title: '오페라하우스 개관 공연 패키지 사업비 보도',
  publisher: '세계일보',
  date: '2026-05-10',
  url: 'https://www.segye.com/newsView/20260510507178',
  quote: '총사업비는 105억~115억 원 규모로 추산',
};

const KHAN_DELIBERATION: CaseSource = {
  title: '숙의과정 진행 보도',
  publisher: '경향신문',
  date: '2026-08-11',
  url: 'https://www.khan.co.kr/article/202608111739001/',
};

export const BUSAN_POMPIDOU_OPERA: WatchCase = {
  slug: 'busan-pompidou-opera',
  gov: { level: 'metro', code: '26', name: '부산광역시' },
  title: '퐁피두센터 분관 유치와 오페라하우스 개관 공연',
  amountEok: 1000,
  amountNote: '건립비 1,000억원 초과 추산, 연간 운영비 120억원 이상과 로열티 30억원. 오페라하우스 개관 공연은 5회 패키지 105억~115억원 추산',
  summary:
    '부산시가 추진하는 퐁피두센터 분관은 건립비 1,000억원 초과, 연간 운영비 120억원 이상, 로열티 30억원으로 추산된다고 보도됐다. 시민단체는 지방재정법상 투자심사 의무와 타당성 조사 의무를 지키지 않았다는 사유로 감사원에 공익감사를 청구했다. 오페라하우스 개관 공연은 라 스칼라 오페라 3회와 콘서트 2회를 묶은 5회 패키지로 총사업비 105억~115억원 규모로 추산된다.',
  timeline: [
    { date: '2026-03-02', label: '시민단체 감사원 공익감사 청구 보도(청구일은 문서에 없음 — 경향신문 보도일)', source: KHAN_AUDIT },
    { date: '2026-05-10', label: '개관 공연 5회 패키지 총사업비 105억~115억원 추산 보도', source: SEGYE },
    { date: '2026-08-11', label: '숙의과정을 거치기로 했다는 보도', source: KHAN_DELIBERATION },
  ],
  claims: [
    {
      statement: '퐁피두 분관에 1,000억원 이상이 들고 협약·심의 과정이 공개되지 않았다.',
      verdict: 'confirmed',
      finding:
        '보도된 추산은 건립비 1,000억원 초과, 연간 운영비 120억원 이상, 로열티 30억원이다. 시민단체는 “왜 퐁피두인지 부산시가 제대로 공개한 적은 한 번도 없다”며 감사원에 공익감사를 청구했다.',
      sources: [KHAN_AUDIT, KHAN_DISCLOSURE],
    },
    {
      statement: '오페라하우스 개관 공연 1회에 115억원을 쓰고 집행 내역을 공개하지 않았다.',
      verdict: 'partial',
      finding:
        '보도된 총사업비는 105억~115억원 규모 추산이고, 라 스칼라 오페라 3회와 콘서트 2회를 묶은 5회 패키지다. 2026년 4월 시의회 예산 심의에서 논란이 있었으며 세부 집행 내역 공개 거부는 확인되지 않았다.',
      sources: [SEGYE, KHAN_DELIBERATION],
    },
  ],
  procedures: [
    {
      key: 'investment-review',
      status: 'disputed',
      note: '시민단체 공익감사 청구 사유: “지방재정법상 투자심사의무와 타당성 조사 의무 등을 지키지 않았다”. 부산시의 이행 여부를 보여주는 문서는 확인되지 않았다.',
      source: KHAN_AUDIT_REASON,
    },
    {
      key: 'feasibility-study',
      status: 'disputed',
      note: '시민단체 공익감사 청구 사유: “지방재정법상 투자심사의무와 타당성 조사 의무 등을 지키지 않았다”. 부산시의 이행 여부를 보여주는 문서는 확인되지 않았다.',
      source: KHAN_AUDIT_REASON,
    },
    { key: 'council-approval', status: 'unknown', note: '확인 자료 없음' },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  // 투자심사·타당성조사 미이행은 주장(disputed) 단계라 절차 편법 태그를 붙이지 않는다.
  tags: [],
  status: '감사원 공익감사 청구(2026-03-02 보도), 숙의과정 진행(2026-08 보도)',
  verifiedAt: '2026-09-23',
};
