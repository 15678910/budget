import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 4 — 부산 낙동강 횡단 교량(대저·엄궁·장낙)」 */

const KOOKJE: CaseSource = {
  title: '현상변경 허가 보류·보완설계 재협의와 사업비 보도',
  publisher: '국제신문',
  date: '2025-04-02',
  url: 'https://www.kookje.co.kr/news2011/asp/newsbody.asp?code=0300&key=20250402.22003000409',
};

const SEOUL: CaseSource = {
  title: '부산시 간부 공동저자 논문 게재 불가 판정 보도',
  publisher: '서울신문',
  date: '2022-10-12',
  url: 'https://www.seoul.co.kr/news/society/enviroment/2022/10/12/20221012500192',
};

export const BUSAN_NAKDONG_BRIDGES: WatchCase = {
  slug: 'busan-nakdong-bridges',
  gov: { level: 'metro', code: '26', name: '부산광역시' },
  title: '낙동강 횡단 교량(대저·엄궁·장낙대교)',
  amountEok: null,
  amountNote: '대저대교 약 3,956억원 + 엄궁대교 약 3,450억원, 장낙대교 사업비 미확인',
  summary:
    '대저·엄궁·장낙대교는 낙동강을 건너는 부산시 교량 사업이다. 보도된 사업비는 대저대교 약 3,956억원, 엄궁대교 약 3,450억원이고 장낙대교 사업비는 확인되지 않았다. 국가유산청(당시 문화재청)이 현상변경 허가를 보류한 뒤 보완설계로 재협의가 진행됐다.',
  timeline: [
    { date: '2022-10-12', label: '논문 2편 게재 불가 판정 보도(판정 일자 미확인)', source: SEOUL },
    { date: '2025-04-02', label: '현상변경 허가 보류 후 보완설계 재협의 보도', source: KOOKJE },
  ],
  claims: [
    {
      statement: '철새도래지(문화재보호구역)에 미치는 영향을 둘러싼 논란이 있다.',
      verdict: 'confirmed',
      finding: '국가유산청(당시 문화재청)이 현상변경 허가를 보류한 뒤 보완설계로 재협의가 진행됐다.',
      sources: [KOOKJE],
    },
    {
      statement: '부산시 간부가 공동저자인 논문이 환경영향평가 근거로 쓰였고 학회가 게재를 취소했다.',
      verdict: 'partial',
      finding:
        '이근희 당시 환경물정책실장이 제1저자인 논문 2편은 한국조류학회·한국환경생태학회에서 게재 불가 판정을 받았다(게재 후 취소가 아니다). 이 논문은 장낙대교 환경영향평가에 “미등록 논문”으로 인용됐다. 판정 일자는 확인되지 않았다.',
      sources: [SEOUL],
    },
    {
      statement: '세 교량의 사업비가 총 7,000억원 규모다.',
      verdict: 'partial',
      finding: '보도된 사업비는 대저대교 약 3,956억원, 엄궁대교 약 3,450억원이며 장낙대교 사업비는 확인되지 않았다.',
      sources: [KOOKJE],
    },
  ],
  procedures: [
    { key: 'investment-review', status: 'unknown', note: '확인 자료 없음' },
    { key: 'feasibility-study', status: 'unknown', note: '확인 자료 없음' },
    { key: 'council-approval', status: 'unknown', note: '확인 자료 없음' },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  // evidence-integrity의 근거: 게재 불가 판정을 받은 논문이 환경영향평가에 인용됐다는 부분확인 주장.
  tags: ['evidence-integrity'],
  status: '보완설계 재협의(2025-04 보도 기준)',
  verifiedAt: '2026-09-23',
};
