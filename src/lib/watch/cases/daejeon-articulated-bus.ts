import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 1 — 대전 전기 굴절버스 3대」 */

/**
 * 조달경제신문 같은 기사(2026-09-16)의 세 대목.
 * 인용 두 문장은 원문에서 이어지지 않으므로 「…」로 잇지 않고 따로 싣는다
 * (근거 문서의 인용도 두 개의 따옴표로 나뉘어 있다).
 */
const JODAL_CONTRACT_DATE: CaseSource = {
  title: '대전 전기 굴절버스 계약 시점 보도',
  publisher: '조달경제신문',
  date: '2026-09-16',
  url: 'https://www.jodaleconomy.com/news/articleView.html?idxno=3180',
  quote: '계약은 2025년 7월10일 체결',
};

const JODAL_CONTRACT_METHOD: CaseSource = {
  title: '대전 전기 굴절버스 계약방법 변경 보도',
  publisher: '조달경제신문',
  date: '2026-09-16',
  url: 'https://www.jodaleconomy.com/news/articleView.html?idxno=3180',
  quote: '계약방법도 ‘일반경쟁’에서 ‘수의계약’으로 바뀌었다',
};

/** 같은 기사의 총사업비 대목. 근거 문서에 직접 인용이 없어 따옴표를 붙이지 않는다 */
const JODAL_TOTAL_COST: CaseSource = {
  title: '기반시설 포함 총사업비 185억원 보도',
  publisher: '조달경제신문',
  date: '2026-09-16',
  url: 'https://www.jodaleconomy.com/news/articleView.html?idxno=3180',
};

const ASIATODAY: CaseSource = {
  title: '납품기한 연장 경위 보도',
  publisher: '아시아투데이',
  date: '2026-08-11',
  url: 'https://www.asiatoday.co.kr/kn/view.php?key=20260811010003527',
  quote: '당초 지난해 말까지 차량을 공급받을 예정… 기한을 세 차례 연장',
};

const SBS: CaseSource = {
  title: '선금 지급과 안전검사 부적합 사유 보도',
  publisher: 'SBS',
  date: '2026-09-08',
  url: 'https://news.sbs.co.kr/news/endPage.do?news_id=N1008636478',
  quote: '전체 대금의 80%인 73억 원을 선금으로 지급',
};

const SBS_WEIGHT: CaseSource = {
  title: '총중량 54톤·도로법 제한 기준 초과 보도',
  publisher: 'SBS',
  date: '2026-09-08',
  url: 'https://news.sbs.co.kr/news/endPage.do?news_id=N1008636478',
  quote: '차량 총중량이 54톤으로 추산돼 도로법상 제한 기준인 40톤을 초과… 길이 제한만 풀렸을 뿐, 하중 특례는 빠져 있었다',
};

const CHUNGNAM: CaseSource = {
  title: '시의원이 밝힌 계약금 지급 비율',
  publisher: '충남일보',
  date: '2026-07-23',
  url: 'https://www.chungnamilbo.co.kr/news/articleView.html?idxno=900270',
  quote: '계약금 지급 비율은 전체의 78.9% 수준',
};

const JBNEWS: CaseSource = {
  title: '최종기한 인도 실적 보도',
  publisher: '중부매일',
  date: '2026-08-05',
  url: 'https://www.jbnews.com/news/articleView.html?idxno=1508892',
};

const OHMYNEWS: CaseSource = {
  title: '수입대행사 재무 상태와 차량구매계약 금액 보도',
  publisher: '오마이뉴스',
  date: '2026-09-08',
  url: 'https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003265561',
  quote: '유동부채가 유동자산보다 686억 원이나 더 많은 심각한 유동성 위기',
};

export const DAEJEON_ARTICULATED_BUS: WatchCase = {
  slug: 'daejeon-articulated-bus',
  gov: { level: 'metro', code: '30', name: '대전광역시' },
  title: '전기 굴절버스 3대 도입',
  amountEok: 94,
  amountNote: '차량구매계약 94억원(1차 27억 7,200만 + 2차 64억 6,800만, 시비·지방채). 기반시설 포함 총사업비 185억원',
  summary:
    '대전시는 2025년 7월 10일 전기 굴절버스 3대의 차량구매계약을 수의계약으로 체결했다. 당초 납품기한은 2025년 말이었고 기한은 세 차례 연장됐다. 2026년 7월 31일 최종기한에도 정식 인도가 완료된 차량은 없었다.',
  timeline: [
    { date: '2025-07-10', label: '차량구매계약 체결(계약방법 일반경쟁 → 수의계약)', source: JODAL_CONTRACT_METHOD },
    // 원자료 표기가 "2025년 말"이라 일(day)을 지어내지 않고 월 단위로 둔다
    { date: '2025-12', label: '당초 납품기한 — 문서 표기는 “2025년 말”(연말 기한)', source: ASIATODAY },
    { date: '2026-07-31', label: '세 차례 연장된 최종기한 — 정식 인도 완료 차량 0대', source: JBNEWS },
  ],
  claims: [
    {
      statement: '납품기한 7개월의 단일 업체 계약이었다.',
      verdict: 'partial',
      finding:
        '계약은 2025년 7월 10일 체결됐고 계약방법은 일반경쟁에서 수의계약으로 바뀌었다. 당초 납품기한은 2025년 말로 약 5.5개월이며, “7개월”의 근거 문서는 확인되지 않았다.',
      sources: [JODAL_CONTRACT_DATE, JODAL_CONTRACT_METHOD, ASIATODAY],
    },
    {
      statement: '납품 전에 대금의 80%(약 72억원)를 선지급했다.',
      verdict: 'confirmed',
      finding:
        '전체 대금의 80%인 73억 원이 선금으로 지급됐다고 보도됐다. 시의원 구본환은 계약금 지급 비율이 전체의 78.9% 수준(1차 약 27억 + 2차 약 45억 = 72억 9,200만원)이라고 밝혔다.',
      sources: [SBS, CHUNGNAM],
    },
    {
      statement: '안전검사 부적합 사유는 비상망치 미설치와 표시장치였다.',
      verdict: 'refuted',
      finding:
        '보도된 사유는 차량 총중량이 54톤으로 추산돼 도로법상 제한 기준인 40톤을 초과한다는 것이며, 길이 제한만 풀렸을 뿐 하중 특례는 빠져 있었다. 비상망치·표시장치를 사유로 적은 문서는 확인되지 않았다.',
      sources: [SBS_WEIGHT],
    },
    {
      statement: '운행 불가 상태가 지속되고 있다.',
      verdict: 'confirmed',
      finding: '7월 31일 최종기한에도 정식 인도가 완료된 차량은 0대였다.',
      sources: [JBNEWS],
    },
    {
      statement: '나머지 2대의 납품이 지연되고 업체가 경영난을 겪고 있다.',
      verdict: 'confirmed',
      finding: '수입대행사는 유동부채가 유동자산보다 686억 원 많은 유동성 위기 상태로 보도됐다.',
      sources: [OHMYNEWS],
    },
    {
      statement: '총사업비와 재원은 차량구매비 94억원(시비·지방채), 기반시설 포함 185억원이다.',
      verdict: 'confirmed',
      finding:
        '차량구매계약은 1차 27억 7,200만원 + 2차 64억 6,800만원 = 94억원(시비, 지방채)이고, 기반시설을 포함한 총사업비는 185억원이다.',
      sources: [OHMYNEWS, JODAL_TOTAL_COST],
    },
    {
      statement: '선거를 의식한 일정이었다.',
      verdict: 'unverified',
      finding:
        '계약 2025-07-10, 당초 납품기한 2025년 말(선거 전), 최종 연장 기한 2026-07-31(선거 후)은 사실이다. 의도를 보여주는 1차 문서는 확인되지 않았다.',
      sources: [JODAL_CONTRACT_DATE, ASIATODAY],
    },
  ],
  procedures: [
    { key: 'investment-review', status: 'unknown', note: '확인 자료 없음' },
    { key: 'feasibility-study', status: 'unknown', note: '확인 자료 없음' },
    { key: 'council-approval', status: 'unknown', note: '확인 자료 없음' },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  tags: [],
  status: '운행 불가·납품 지연 지속(2026-09 기준)',
  verifiedAt: '2026-09-23',
};
