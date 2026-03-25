/**
 * 공공사업 표준단가 참조 테이블
 *
 * 출처:
 * - 국회예산정책처(NABO) 비용추계 사례집
 * - KDI 공공투자관리센터 예비타당성조사 지침
 * - 국토교통부 건설공사 표준시장단가 (2025년 상반기)
 * - 기반시설 표준시설비용 고시 (2024년)
 * - 보건복지부 지역거점공공병원 운영 현황
 *
 * 단위: 억원 (unless specified otherwise)
 * 기준연도: 2024-2025
 */

// ─── Policy Category Detection ───────────────────────────────────────────────

export type PolicyCategory =
  | 'hospital' | 'infrastructure' | 'education' | 'housing'
  | 'bank' | 'digitalCurrency' | 'ai' | 'welfare'
  | 'environment' | 'tourism' | 'culture' | 'labor' | 'general';

interface CategoryKeywords {
  category: PolicyCategory;
  keywords: RegExp;
  priority: number; // higher = checked first
}

const CATEGORY_RULES: CategoryKeywords[] = [
  { category: 'hospital', keywords: /병원|의료|보건|진료|의원|클리닉|응급|공공의료|건강검진|치과|한의원|재활|정신건강|감염병/, priority: 10 },
  { category: 'bank', keywords: /공공은행|지방은행|서민금융|마을은행|금고|신협|마이크로크레딧|소액대출/, priority: 9 },
  { category: 'digitalCurrency', keywords: /지역화폐|블록체인|디지털화폐|가상화폐|토큰|CBDC|상품권|페이/, priority: 9 },
  { category: 'ai', keywords: /AI|인공지능|디지털|스마트시티|빅데이터|자율주행|로봇|데이터|IoT|클라우드/, priority: 8 },
  { category: 'infrastructure', keywords: /도로|교통|철도|버스|인프라|교량|터널|지하철|트램|항만|공항|상하수도|전기|통신|광통신/, priority: 7 },
  { category: 'education', keywords: /교육|학교|어린이|보육|유치원|대학|도서관|평생교육|학원|학생|장학|방과후|학습|연구|과학관/, priority: 7 },
  { category: 'housing', keywords: /주택|아파트|주거|건설|임대|분양|재개발|재건축|뉴타운|행복주택|국민임대|전세|월세/, priority: 7 },
  { category: 'welfare', keywords: /복지|돌봄|요양|노인|장애|기초생활|아동|수당|국민연금|보험|급식|무상|출산|양육|육아|다문화|한부모|취약계층|저소득|사회보장|복지센터|돌봄센터/, priority: 6 },
  { category: 'environment', keywords: /환경|탄소|신재생|태양광|풍력|폐기물|하수|정수|공원|녹지|생태|기후|미세먼지|오염|재활용|에너지/, priority: 6 },
  { category: 'tourism', keywords: /관광|특구|축제|문화관광|테마파크|리조트|호텔|펜션|숙박|여행/, priority: 5 },
  { category: 'culture', keywords: /문화|예술|공연|박물관|미술관|체육|스포츠|경기장|도서관|극장|영화|음악|전시/, priority: 5 },
  { category: 'labor', keywords: /노동|근로|파업|임금|고용|해고|산재|노조|노동조합|최저임금|비정규|하청|원청|플랫폼노동|중대재해|일자리|실업|취업/, priority: 7 },
];

export function detectPolicyCategory(policyText: string): PolicyCategory {
  const sorted = [...CATEGORY_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    if (rule.keywords.test(policyText)) {
      return rule.category;
    }
  }
  return 'general';
}

/**
 * Detect multiple categories for compound policies
 * e.g., "블록체인 기반 지역화폐 + 공공은행" → ['digitalCurrency', 'bank']
 */
export function detectMultipleCategories(policyText: string): PolicyCategory[] {
  const categories: PolicyCategory[] = [];
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.test(policyText)) {
      categories.push(rule.category);
    }
  }
  return categories.length > 0 ? categories : ['general'];
}

// ─── Standard Unit Costs ─────────────────────────────────────────────────────

export interface StandardCostProfile {
  category: PolicyCategory;
  label: string;

  // Cost estimation parameters
  costModel: 'population' | 'budget' | 'fixed' | 'unit';

  // For 'population' model: cost = baseCost + (population / popDivisor) * popMultiplier
  // For 'budget' model: cost = budget * budgetRatio
  // For 'fixed' model: cost = baseCost
  // For 'unit' model: cost = unitCost * estimatedUnits(population)
  baseCost: number; // 억원, minimum cost
  budgetRatio?: number; // fraction of total budget
  popDivisor?: number;
  popMultiplier?: number;
  unitCost?: number; // per-unit cost
  unitLabel?: string; // e.g., "1병상당", "1km당"
  unitEstimator?: (population: number) => number; // estimate units from population

  // Operating cost ratio (annual operating / initial cost)
  operatingRatio: number;

  // Fiscal impact
  independenceChangeBase: number; // base %p change
  independenceAdjustment: (independence: number) => number; // adjust by current independence

  // Time horizon
  timeframe: string;
  breakEvenYears: number; // years to break even (0 = no break-even expected)

  // Feasibility determination
  feasibilityThresholds: {
    high: number; // independence > this → '상'
    low: number;  // independence < this → '하'
  };

  // Cost breakdown template
  costBreakdown: Array<{
    category: string;
    ratio: number; // fraction of initial cost
    note: string;
    noteDetail: string; // more specific note with unit costs
  }>;

  // Reference benchmarks
  benchmarks: {
    description: string;
    source: string;
    url?: string;
  }[];
}

// ─── Standard Cost Profiles ──────────────────────────────────────────────────

const STANDARD_COSTS: Record<PolicyCategory, StandardCostProfile> = {
  hospital: {
    category: 'hospital',
    label: '공공병원/의료시설',
    costModel: 'unit',
    baseCost: 400,
    unitCost: 1.5, // 1병상당 1.5억원
    unitLabel: '1병상당 약 1.5억원',
    unitEstimator: (pop) => {
      // WHO 권장: 인구 1,000명당 4.7병상, 공공의료 비중 30%
      // 실제 한국 공공병원 규모: 인구 30만 이하 → 150-200병상, 30만+ → 200-400병상
      if (pop < 100000) return 100;
      if (pop < 300000) return 200;
      if (pop < 500000) return 300;
      return 400;
    },
    operatingRatio: 0.15, // 연간 운영비 = 건설비의 15% (의료인건비 중심)
    independenceChangeBase: -2.5,
    independenceAdjustment: (indep) => indep < 25 ? -1.0 : indep > 50 ? 0.5 : 0,
    timeframe: '장기 (5-10년)',
    breakEvenYears: 8, // 대부분 공공병원은 구조적 적자
    feasibilityThresholds: { high: 50, low: 25 },
    costBreakdown: [
      { category: '병원 건물 신축', ratio: 0.42, note: '설계·시공비', noteDetail: '3.3㎡당 약 750-900만원, 연면적 약 15,000-30,000㎡ 기준' },
      { category: '의료장비 도입', ratio: 0.28, note: '필수 의료장비', noteDetail: 'MRI(30-50억), CT(15-25억), 수술실(20-30억), 기타 장비' },
      { category: '의료인력 초기비용', ratio: 0.12, note: '채용·교육', noteDetail: '전문의 연봉 1.5-2.5억, 간호사 4,000-5,500만, 의료기사 3,500-4,500만' },
      { category: '부지 매입', ratio: 0.12, note: '토지비', noteDetail: '지방 3.3㎡당 50-300만원, 도시 3.3㎡당 300-1,500만원' },
      { category: '인허가/설계', ratio: 0.06, note: '행정비용', noteDetail: '건축인허가, 의료기관 개설허가, 환경영향평가' },
    ],
    benchmarks: [
      { description: '진주의료원(300병상) 신축 약 1,200억원 (2023)', source: 'NABO 비용추계', url: 'https://www.nabo.go.kr' },
      { description: '지방의료원 평균 연간 적자 약 100-200억원', source: '보건복지부 지역거점병원 현황', url: 'https://rhs.mohw.go.kr/' },
      { description: '공공병원 1병상당 건축비 1.2-1.8억원', source: 'KDI 예비타당성조사', url: 'https://pimac.kdi.re.kr' },
    ],
  },

  infrastructure: {
    category: 'infrastructure',
    label: '도로/교통 인프라',
    costModel: 'budget',
    baseCost: 300,
    budgetRatio: 0.05,
    operatingRatio: 0.03, // 도로 유지보수비 = 건설비의 3%/년
    independenceChangeBase: -1.8,
    independenceAdjustment: (indep) => indep < 30 ? -0.5 : 0,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 0, // 인프라는 직접 수익 없음
    feasibilityThresholds: { high: 40, low: 20 },
    costBreakdown: [
      { category: '토목/건설 공사', ratio: 0.50, note: '본공사', noteDetail: '일반도로 km당 100-200억, 고속도로 km당 300-500억, 교량 m당 500-1,500만' },
      { category: '용지 보상', ratio: 0.22, note: '토지매입', noteDetail: '농지 3.3㎡당 15-50만, 대지 3.3㎡당 100-500만 (지역별 차이 큼)' },
      { category: '설계/감리', ratio: 0.12, note: '기술용역', noteDetail: '기본설계 공사비의 4-6%, 실시설계 3-5%, 감리 3-4%' },
      { category: '부대시설', ratio: 0.10, note: '안전/조경', noteDetail: '방음벽, 가로등, 배수시설, 조경, 표지판' },
      { category: '인허가/환경평가', ratio: 0.06, note: '행정비용', noteDetail: '환경영향평가(2-5억), 교통영향평가(1-3억), 인허가' },
    ],
    benchmarks: [
      { description: '국도 4차로 km당 약 200-350억원', source: '국토교통부 도로업무편람', url: 'https://www.molit.go.kr' },
      { description: '시군도 2차로 km당 약 50-100억원', source: '기반시설 표준시설비용 고시 2024', url: 'https://www.law.go.kr' },
      { description: '도시철도(경전철) km당 약 500-800억원', source: 'KDI 예비타당성조사', url: 'https://pimac.kdi.re.kr' },
    ],
  },

  education: {
    category: 'education',
    label: '교육시설/프로그램',
    costModel: 'budget',
    baseCost: 100,
    budgetRatio: 0.02,
    operatingRatio: 0.20, // 교육은 인건비 비중 높아 운영비 높음
    independenceChangeBase: -0.8,
    independenceAdjustment: (indep) => indep > 40 ? 0.3 : -0.2,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 0,
    feasibilityThresholds: { high: 35, low: 15 },
    costBreakdown: [
      { category: '교육시설 건립/리모델링', ratio: 0.38, note: '건축비', noteDetail: '학교 신축 3.3㎡당 600-800만원, 리모델링 200-400만원' },
      { category: '교육 프로그램 개발', ratio: 0.22, note: '커리큘럼', noteDetail: '교재 개발, 전문가 자문, 온라인 콘텐츠 제작' },
      { category: '교원/강사 채용', ratio: 0.22, note: '인력비', noteDetail: '교원 연봉 4,000-7,000만, 강사 시간당 5-15만' },
      { category: '장비/기자재', ratio: 0.12, note: 'IT·실험', noteDetail: 'PC 1대 100-200만, 과학실험 기자재, 체육시설' },
      { category: '기타 부대비용', ratio: 0.06, note: '운영준비', noteDetail: '통학버스, 급식시설, 홍보, 예비비' },
    ],
    benchmarks: [
      { description: '초등학교 신설(24학급) 약 250-350억원', source: '교육부 학교시설 기준', url: 'https://www.moe.go.kr' },
      { description: '공립유치원 1개원 약 30-50억원', source: 'NABO 비용추계', url: 'https://www.nabo.go.kr' },
      { description: '평생학습관 약 80-150억원', source: '기반시설 표준시설비용 2024', url: 'https://www.law.go.kr' },
    ],
  },

  housing: {
    category: 'housing',
    label: '주택/주거',
    costModel: 'population',
    baseCost: 500,
    popDivisor: 10000,
    popMultiplier: 50,
    operatingRatio: 0.02,
    independenceChangeBase: 1.2, // 분양수입으로 회수 가능
    independenceAdjustment: (indep) => indep < 30 ? -0.5 : 0.3,
    timeframe: '장기 (5-10년)',
    breakEvenYears: 5,
    feasibilityThresholds: { high: 40, low: 20 },
    costBreakdown: [
      { category: '건축 공사', ratio: 0.48, note: '시공비', noteDetail: '아파트 3.3㎡당 600-900만원, 연립 500-700만원' },
      { category: '부지 매입/조성', ratio: 0.25, note: '택지비', noteDetail: '택지 조성비 3.3㎡당 200-600만원 (지역별 편차)' },
      { category: '기반시설', ratio: 0.12, note: '인프라', noteDetail: '도로, 상하수도, 전기, 통신, 가스 인입' },
      { category: '설계/인허가', ratio: 0.10, note: '기술비', noteDetail: '건축설계 공사비의 5-7%, 감리 3-4%' },
      { category: '기타 부대비용', ratio: 0.05, note: '분양준비', noteDetail: '분양 홍보, 모델하우스, 입주지원' },
    ],
    benchmarks: [
      { description: '공공임대 1호당 약 1.5-2.5억원 (수도권)', source: 'LH 공공주택 사업', url: 'https://www.lh.or.kr' },
      { description: '행복주택 1호당 약 1.2-1.8억원', source: '국토교통부', url: 'https://www.molit.go.kr' },
      { description: '도시재생 뉴딜사업 약 100-250억원/구역', source: 'KDI 예비타당성조사', url: 'https://pimac.kdi.re.kr' },
    ],
  },

  bank: {
    category: 'bank',
    label: '공공은행/지방금융',
    costModel: 'fixed',
    baseCost: 500, // 은행법 최소자본금 250억 + 시스템 + 점포
    operatingRatio: 0.06,
    independenceChangeBase: 2.0, // 장기적으로 수익 가능
    independenceAdjustment: (indep) => indep < 30 ? -0.5 : 0.5,
    timeframe: '장기 (5-10년)',
    breakEvenYears: 7,
    feasibilityThresholds: { high: 45, low: 25 },
    costBreakdown: [
      { category: '자본금 출자', ratio: 0.50, note: '법정자본금', noteDetail: '은행법 제8조 기준 최소 250억원, 실질 필요자본 500억원 이상' },
      { category: '코어뱅킹 시스템', ratio: 0.20, note: '전산시스템', noteDetail: '코어뱅킹(50-100억), 인터넷뱅킹(20-30억), 보안시스템(10-20억)' },
      { category: '점포/사무실', ratio: 0.13, note: '영업망', noteDetail: '본점(20-30억), 지점 1개소당 5-10억, 초기 5-10개 지점' },
      { category: '전문인력 채용', ratio: 0.12, note: '금융인력', noteDetail: '은행원 연봉 5,000-8,000만, 리스크관리 전문가, IT인력' },
      { category: '인허가/법률', ratio: 0.05, note: '설립인가', noteDetail: '금융위 예비인가(6-12개월), 본인가, 법률자문, 감사체계' },
    ],
    benchmarks: [
      { description: '독일 슈파카세(지역저축은행) 모델: 자본금 약 300-500억원', source: '국회입법조사처', url: 'https://www.nars.go.kr' },
      { description: '인터넷전문은행 설립비 약 500-1,000억원', source: '금융위원회 인가 사례', url: 'https://www.fsc.go.kr' },
      { description: '새마을금고/신협 1개소 평균 자산 약 300억원', source: '금융감독원', url: 'https://www.fss.or.kr' },
    ],
  },

  digitalCurrency: {
    category: 'digitalCurrency',
    label: '지역화폐/블록체인',
    costModel: 'population',
    baseCost: 30,
    popDivisor: 100000,
    popMultiplier: 20,
    operatingRatio: 0.25, // 캐시백/인센티브 + 시스템 운영
    independenceChangeBase: 0.5,
    independenceAdjustment: (indep) => indep > 40 ? 0.3 : 0,
    timeframe: '단기 (1-2년)',
    breakEvenYears: 3,
    feasibilityThresholds: { high: 30, low: 10 },
    costBreakdown: [
      { category: '플랫폼 개발/구축', ratio: 0.35, note: '시스템개발', noteDetail: '블록체인 노드 구축(10-20억), 모바일앱(5-10억), 결제시스템 연동(5-8억)' },
      { category: '보안/인증 체계', ratio: 0.20, note: '보안시스템', noteDetail: '암호화 모듈, KYC/AML 시스템, 개인정보보호(ISMS 인증)' },
      { category: '가맹점 모집/교육', ratio: 0.18, note: '가맹점망', noteDetail: '가맹점 단말기(대당 30-50만), 교육비, 초기 인센티브' },
      { category: '홍보/마케팅', ratio: 0.15, note: '시민홍보', noteDetail: '런칭 캠페인, 초기 충전 인센티브(5-10%), 캐시백 재원' },
      { category: '운영/법률비용', ratio: 0.12, note: '행정', noteDetail: '전자금융업 등록, 법률자문, 감사, 운영인력' },
    ],
    benchmarks: [
      { description: '경기도 지역화폐(2019-) 연간 발행액 약 3조원, 운영비 약 1,500억원', source: '경기도', url: 'https://www.gg.go.kr' },
      { description: '인천e음 플랫폼 개발비 약 30억원', source: '인천광역시', url: 'https://www.incheon.go.kr' },
      { description: '지역사랑상품권 캐시백 비율 5-10%', source: '행정안전부', url: 'https://www.mois.go.kr' },
    ],
  },

  ai: {
    category: 'ai',
    label: 'AI/디지털 전환',
    costModel: 'budget',
    baseCost: 30,
    budgetRatio: 0.004,
    operatingRatio: 0.30, // 클라우드/인건비 높음
    independenceChangeBase: 0.3,
    independenceAdjustment: (indep) => indep > 35 ? 0.2 : 0,
    timeframe: '단기 (1-2년)',
    breakEvenYears: 3,
    feasibilityThresholds: { high: 30, low: 15 },
    costBreakdown: [
      { category: 'AI 시스템 개발', ratio: 0.35, note: '핵심개발', noteDetail: 'AI 모델 개발/학습(10-30억), 데이터 수집·정제(5-10억)' },
      { category: '클라우드/인프라', ratio: 0.25, note: 'IT인프라', noteDetail: '클라우드 서버(AWS/NCloud), GPU 서버, 데이터센터 이용' },
      { category: '전문인력', ratio: 0.20, note: 'AI인력', noteDetail: 'AI 엔지니어 연봉 6,000만-1.2억, 데이터 사이언티스트' },
      { category: '시범운영/검증', ratio: 0.12, note: '파일럿', noteDetail: '시범서비스 운영, 성능 테스트, 시민 피드백 반영' },
      { category: '보안/법률', ratio: 0.08, note: '컴플라이언스', noteDetail: '개인정보 영향평가, AI 윤리 가이드라인, 보안인증' },
    ],
    benchmarks: [
      { description: '세종시 스마트시티 AI 플랫폼 약 200억원', source: '국토교통부', url: 'https://www.molit.go.kr' },
      { description: '지자체 AI 챗봇 구축비 약 3-10억원', source: '행정안전부 디지털정부', url: 'https://www.mois.go.kr' },
      { description: '스마트시티 통합플랫폼 약 50-100억원', source: 'KDI 예비타당성조사', url: 'https://pimac.kdi.re.kr' },
    ],
  },

  welfare: {
    category: 'welfare',
    label: '복지/돌봄',
    costModel: 'population',
    baseCost: 100,
    popDivisor: 50000,
    popMultiplier: 30,
    operatingRatio: 0.35, // 인건비 중심으로 운영비 비중 높음
    independenceChangeBase: -1.0,
    independenceAdjustment: (indep) => indep < 25 ? -0.5 : 0,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 0, // 복지는 수익사업이 아님
    feasibilityThresholds: { high: 35, low: 15 },
    costBreakdown: [
      { category: '복지시설 구축/개보수', ratio: 0.32, note: '시설비', noteDetail: '종합복지관(100-200억), 돌봄센터(20-50억), 요양시설 1인당 3,000-5,000만' },
      { category: '복지급여/지원금 재원', ratio: 0.30, note: '급여재원', noteDetail: '수급자 월 30-60만원, 바우처, 긴급복지' },
      { category: '전문인력 채용', ratio: 0.22, note: '복지인력', noteDetail: '사회복지사 연봉 3,000-4,500만, 요양보호사 2,400-3,000만' },
      { category: '관리시스템', ratio: 0.10, note: '전산', noteDetail: '사례관리시스템, 수급자 DB, 모니터링 플랫폼' },
      { category: '기타 부대비용', ratio: 0.06, note: '부대', noteDetail: '홍보, 주민교육, 자원봉사자 관리, 예비비' },
    ],
    benchmarks: [
      { description: '종합사회복지관 1개소 건립비 약 100-200억원', source: '보건복지부', url: 'https://www.mohw.go.kr' },
      { description: '노인돌봄종합서비스 1인당 월 약 40-80만원', source: 'NABO 비용추계', url: 'https://www.nabo.go.kr' },
      { description: '지역아동센터 1개소 연간 운영비 약 1-2억원', source: '아동복지법 시행규칙', url: 'https://www.law.go.kr' },
    ],
  },

  environment: {
    category: 'environment',
    label: '환경/에너지',
    costModel: 'budget',
    baseCost: 150,
    budgetRatio: 0.025,
    operatingRatio: 0.08,
    independenceChangeBase: -0.5,
    independenceAdjustment: (indep) => indep > 40 ? 0.3 : -0.2,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 10,
    feasibilityThresholds: { high: 40, low: 20 },
    costBreakdown: [
      { category: '설비/시설 구축', ratio: 0.45, note: '주요설비', noteDetail: '태양광 1MW당 15-20억, 하수처리장 약 200-500억' },
      { category: '부지/토목', ratio: 0.20, note: '부지조성', noteDetail: '부지매입, 토목공사, 접근도로' },
      { category: '설계/인허가', ratio: 0.15, note: '기술용역', noteDetail: '환경영향평가(3-8억), 기본·실시설계' },
      { category: '계측/모니터링', ratio: 0.10, note: '관리시스템', noteDetail: '환경모니터링, 원격제어, IoT 센서' },
      { category: '기타 부대비용', ratio: 0.10, note: '부대', noteDetail: '주민보상, 홍보, 예비비' },
    ],
    benchmarks: [
      { description: '태양광 발전소 1MW당 약 15-20억원', source: '한국에너지공단', url: 'https://www.knrec.or.kr' },
      { description: '하수처리장 1만톤/일 약 200-400억원', source: '환경부 하수도정비기본계획', url: 'https://www.me.go.kr' },
      { description: '생활폐기물 소각시설 100톤/일 약 300-500억원', source: '환경부', url: 'https://www.me.go.kr' },
    ],
  },

  tourism: {
    category: 'tourism',
    label: '관광/특구',
    costModel: 'budget',
    baseCost: 200,
    budgetRatio: 0.03,
    operatingRatio: 0.10,
    independenceChangeBase: 1.5,
    independenceAdjustment: (indep) => indep > 40 ? 0.5 : 0,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 5,
    feasibilityThresholds: { high: 40, low: 20 },
    costBreakdown: [
      { category: '관광시설 조성', ratio: 0.45, note: '핵심시설', noteDetail: '테마파크/관광단지 조성, 숙박시설, 편의시설' },
      { category: '인프라 정비', ratio: 0.20, note: '기반시설', noteDetail: '접근도로, 주차장, 안내시설, 공중화장실' },
      { category: '마케팅/홍보', ratio: 0.15, note: '관광마케팅', noteDetail: '국내외 홍보, 축제 기획, 여행사 연계' },
      { category: '콘텐츠 개발', ratio: 0.12, note: '관광콘텐츠', noteDetail: '체험 프로그램, 문화관광 해설, 디지털 콘텐츠' },
      { category: '인허가/기타', ratio: 0.08, note: '행정비용', noteDetail: '특구 지정, 환경영향평가, 예비비' },
    ],
    benchmarks: [
      { description: '관광특구 조성사업 약 200-1,000억원', source: '문화체육관광부', url: 'https://www.mcst.go.kr' },
      { description: '지역축제 1회 평균 약 5-30억원', source: '한국관광공사', url: 'https://kto.visitkorea.or.kr' },
      { description: '관광단지 조성 3.3㎡당 약 50-200만원', source: '관광진흥법 시행규칙', url: 'https://www.law.go.kr' },
    ],
  },

  culture: {
    category: 'culture',
    label: '문화/체육',
    costModel: 'population',
    baseCost: 100,
    popDivisor: 50000,
    popMultiplier: 25,
    operatingRatio: 0.12,
    independenceChangeBase: -0.5,
    independenceAdjustment: (indep) => indep > 35 ? 0.2 : -0.2,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 0,
    feasibilityThresholds: { high: 35, low: 15 },
    costBreakdown: [
      { category: '시설 건립', ratio: 0.50, note: '건축비', noteDetail: '공연장(200-500억), 박물관(100-300억), 체육관(50-200억)' },
      { category: '전시/장비', ratio: 0.18, note: '내부장비', noteDetail: '음향·조명(10-30억), 전시 기획(5-20억), 체육장비' },
      { category: '설계/감리', ratio: 0.12, note: '기술용역', noteDetail: '건축설계(공사비의 5-8%), 감리' },
      { category: '운영 준비', ratio: 0.12, note: '개관준비', noteDetail: '전문인력 채용, 프로그램 기획, 시운영' },
      { category: '기타 부대비용', ratio: 0.08, note: '부대', noteDetail: '부지 조성, 주차장, 조경, 예비비' },
    ],
    benchmarks: [
      { description: '복합문화센터 약 200-500억원', source: '문화체육관광부', url: 'https://www.mcst.go.kr' },
      { description: '공공도서관 1관 약 50-150억원', source: '도서관법 시행기준', url: 'https://www.law.go.kr' },
      { description: '체육관(다목적) 약 100-300억원', source: '국민체육진흥공단', url: 'https://www.kspo.or.kr' },
    ],
  },

  labor: {
    category: 'labor',
    label: '노동/고용 법제',
    costModel: 'population',
    baseCost: 50,
    popDivisor: 100000,
    popMultiplier: 15,
    operatingRatio: 0.40, // 인력 중심 사업
    independenceChangeBase: -0.3,
    independenceAdjustment: (indep) => indep > 40 ? 0.2 : -0.2,
    timeframe: '중기 (2-4년)',
    breakEvenYears: 0,
    feasibilityThresholds: { high: 40, low: 20 },
    costBreakdown: [
      { category: '노동행정 시스템 구축', ratio: 0.25, note: '행정인프라', noteDetail: '노동권익센터 설치, 상담시스템, 분쟁조정기구 운영비' },
      { category: '사업장 지도·감독 인력', ratio: 0.30, note: '감독인력', noteDetail: '근로감독관 증원, 교육비, 장비(연봉 4,500-6,000만)' },
      { category: '노동자 지원 프로그램', ratio: 0.25, note: '지원사업', noteDetail: '직업훈련, 전직지원, 법률상담, 심리상담 프로그램' },
      { category: '기업 지원·전환 비용', ratio: 0.12, note: '기업지원', noteDetail: '중소기업 법 준수 컨설팅, 안전설비 보조금' },
      { category: '홍보·교육', ratio: 0.08, note: '홍보', noteDetail: '법안 홍보, 노사 교육, 가이드라인 배포' },
    ],
    benchmarks: [
      { description: '중대재해처벌법 시행(2022) - 기업 안전투자 평균 30% 증가', source: '고용노동부', url: 'https://www.moel.go.kr' },
      { description: '최저임금 인상(2018-2019) - 소상공인 인건비 부담 15% 증가, 저임금 노동자 소득 12% 개선', source: '최저임금위원회', url: 'https://www.minimumwage.go.kr' },
      { description: '비정규직법(2007) - 정규직 전환율 증가, 기업 인건비 약 8% 상승', source: '한국노동연구원', url: 'https://www.kli.re.kr' },
    ],
  },

  general: {
    category: 'general',
    label: '일반 정책',
    costModel: 'budget',
    baseCost: 100,
    budgetRatio: 0.03,
    operatingRatio: 0.10,
    independenceChangeBase: -1.0,
    independenceAdjustment: (indep) => indep < 25 ? -0.5 : indep > 45 ? 0.3 : 0,
    timeframe: '중기 (3-5년)',
    breakEvenYears: 5,
    feasibilityThresholds: { high: 40, low: 20 },
    costBreakdown: [
      { category: '시설/인프라 구축', ratio: 0.40, note: '주요시설', noteDetail: '사업 유형에 따라 상이' },
      { category: '장비/시스템 도입', ratio: 0.20, note: '장비', noteDetail: '필수 장비 및 IT 시스템' },
      { category: '인력 채용/교육', ratio: 0.18, note: '인력', noteDetail: '전문인력 및 행정인력' },
      { category: '운영 준비', ratio: 0.12, note: '시운영', noteDetail: '시범운영, 홍보, 교육' },
      { category: '기타 부대비용', ratio: 0.10, note: '부대', noteDetail: '설계, 인허가, 예비비' },
    ],
    benchmarks: [
      { description: '일반 공공사업 평균 사업비 약 100-500억원', source: 'KDI 공공투자관리센터', url: 'https://pimac.kdi.re.kr' },
    ],
  },
};

// ─── Cost Calculation Functions ──────────────────────────────────────────────

export interface CostEstimation {
  initialCost: number; // 억원
  annualOperatingCost: number; // 억원
  independenceChange: number; // %p
  feasibility: '상' | '중' | '하';
  timeframe: string;
  breakEvenYears: number;
  costItems: Array<{ category: string; amount: string; note: string }>;
  benchmarks: Array<{ description: string; source: string; url?: string }>;
  methodology: string; // 산출 방법 설명
}

export function calculateStandardCost(
  category: PolicyCategory,
  regionData: {
    population: number;
    budget: number;
    independence: number;
  },
): CostEstimation {
  const profile = STANDARD_COSTS[category];
  const { population, budget, independence } = regionData;

  // Calculate initial cost based on model
  let initialCost: number;
  let methodology: string;

  switch (profile.costModel) {
    case 'unit': {
      const units = profile.unitEstimator?.(population) ?? 100;
      const unitCost = profile.unitCost ?? 1;
      initialCost = Math.max(profile.baseCost, Math.round(units * unitCost));
      methodology = `${profile.unitLabel} 기준, ${units}단위 × ${unitCost}억원 = ${initialCost}억원 (최소 ${profile.baseCost}억원)`;
      break;
    }
    case 'population': {
      const popFactor = (population / (profile.popDivisor ?? 100000)) * (profile.popMultiplier ?? 10);
      initialCost = Math.max(profile.baseCost, Math.round(profile.baseCost + popFactor));
      methodology = `인구 비례 산출: 기본 ${profile.baseCost}억 + 인구 가중(${Math.round(popFactor)}억) = ${initialCost}억원`;
      break;
    }
    case 'budget': {
      const budgetBased = Math.round(budget * (profile.budgetRatio ?? 0.03));
      initialCost = Math.max(profile.baseCost, budgetBased);
      methodology = `예산 비례 산출: 예산 ${budget.toLocaleString()}억 × ${((profile.budgetRatio ?? 0.03) * 100).toFixed(1)}% = ${initialCost}억원 (최소 ${profile.baseCost}억원)`;
      break;
    }
    case 'fixed':
    default: {
      initialCost = profile.baseCost;
      methodology = `표준단가 기준 고정비: ${initialCost}억원`;
      break;
    }
  }

  // Annual operating cost
  const annualOperatingCost = Math.round(initialCost * profile.operatingRatio);

  // Independence change with adjustment
  const independenceChange = Number(
    (profile.independenceChangeBase + profile.independenceAdjustment(independence)).toFixed(1)
  );

  // Feasibility
  let feasibility: '상' | '중' | '하' = '중';
  if (independence > profile.feasibilityThresholds.high) feasibility = '상';
  else if (independence < profile.feasibilityThresholds.low) feasibility = '하';

  // Cost items with calculated amounts
  const costItems = profile.costBreakdown.map((item) => ({
    category: item.category,
    amount: `${Math.round(initialCost * item.ratio).toLocaleString()}억원`,
    note: `${item.noteDetail} (${(item.ratio * 100).toFixed(0)}%)`,
  }));

  return {
    initialCost,
    annualOperatingCost,
    independenceChange,
    feasibility,
    timeframe: profile.timeframe,
    breakEvenYears: profile.breakEvenYears,
    costItems,
    benchmarks: profile.benchmarks,
    methodology,
  };
}

/**
 * Calculate combined cost for compound policies (e.g., blockchain + public bank)
 */
export function calculateCompoundCost(
  categories: PolicyCategory[],
  regionData: { population: number; budget: number; independence: number },
): CostEstimation {
  if (categories.length <= 1) {
    return calculateStandardCost(categories[0] ?? 'general', regionData);
  }

  const estimates = categories.map((cat) => calculateStandardCost(cat, regionData));

  // Combine: sum costs with 15% synergy discount for overlapping infrastructure
  const synergyFactor = 0.85; // 15% discount for combined implementation
  const totalInitial = Math.round(
    estimates.reduce((sum, e) => sum + e.initialCost, 0) * synergyFactor
  );
  const totalAnnual = Math.round(
    estimates.reduce((sum, e) => sum + e.annualOperatingCost, 0) * synergyFactor
  );

  // Weighted independence change
  const avgIndependenceChange = Number(
    (estimates.reduce((sum, e) => sum + e.independenceChange, 0) / estimates.length).toFixed(1)
  );

  // Most conservative feasibility
  const feasibilities = estimates.map((e) => e.feasibility);
  const feasibility: '상' | '중' | '하' = feasibilities.includes('하')
    ? '하'
    : feasibilities.includes('중')
    ? '중'
    : '상';

  // Combine cost items
  const allItems: Array<{ category: string; amount: string; note: string }> = [];
  estimates.forEach((est, idx) => {
    const profile = STANDARD_COSTS[categories[idx]];
    allItems.push({
      category: `[${profile.label}]`,
      amount: `소계 ${est.initialCost.toLocaleString()}억원`,
      note: est.methodology,
    });
    est.costItems.slice(0, 3).forEach((item) => allItems.push(item)); // top 3 items per category
  });

  // Add synergy discount line
  const discount = Math.round(
    estimates.reduce((sum, e) => sum + e.initialCost, 0) * (1 - synergyFactor)
  );
  allItems.push({
    category: '복합사업 시너지 할인',
    amount: `-${discount.toLocaleString()}억원`,
    note: '공통 인프라, 인력, 시스템 통합에 따른 15% 비용 절감',
  });

  // Combine benchmarks
  const allBenchmarks = estimates.flatMap((e) => e.benchmarks);

  return {
    initialCost: totalInitial,
    annualOperatingCost: totalAnnual,
    independenceChange: avgIndependenceChange,
    feasibility,
    timeframe: '장기 (5-10년)', // compound always long-term
    breakEvenYears: Math.max(...estimates.map((e) => e.breakEvenYears)),
    costItems: allItems,
    benchmarks: allBenchmarks.slice(0, 6), // max 6 benchmarks
    methodology: `복합정책 산출: ${categories.map((c) => STANDARD_COSTS[c].label).join(' + ')} (시너지 할인 15% 적용)`,
  };
}

// ─── Exported Helpers ────────────────────────────────────────────────────────

export function getStandardCostProfile(category: PolicyCategory): StandardCostProfile {
  return STANDARD_COSTS[category];
}

export function getAllCategories(): PolicyCategory[] {
  return Object.keys(STANDARD_COSTS) as PolicyCategory[];
}
