/**
 * 글로벌 벤치마크 도시 데이터베이스
 *
 * 전 세계 도시 중 재정 운용, 정책 혁신, 주민 삶의 질 측면에서
 * 모범적인 도시들의 데이터와 성공 정책을 정리합니다.
 *
 * 매칭 기준: 인구 규모, 재정자립도, 산업구조, 도시 유형
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BenchmarkCity {
  name: string;
  country: string;
  population: number; // 만 명
  gdpPerCapita: number; // USD
  fiscalIndependence: number; // % (자체수입 비율)
  cityType: CityType;
  industryProfile: IndustryProfile[];
  strengths: string[];
  successPolicies: PolicyBenchmark[];
  fiscalStrategy: string;
  qualityOfLifeRank: number; // 글로벌 순위 (대략)
  source: string;
}

export interface PolicyBenchmark {
  name: string;
  category: PolicyRecommendationCategory;
  description: string;
  implementation: string;
  cost: string; // 대략적 비용
  timeline: string;
  impact: string;
  applicability: ApplicabilityLevel;
  koreanContext: string; // 한국 적용 시 고려사항
}

export type CityType =
  | 'megacity' // 1000만+
  | 'large' // 300-1000만
  | 'medium' // 50-300만
  | 'small' // 10-50만
  | 'rural'; // 10만 이하

export type IndustryProfile =
  | 'tech' | 'finance' | 'manufacturing' | 'tourism'
  | 'agriculture' | 'education' | 'healthcare' | 'logistics'
  | 'energy' | 'creative' | 'government' | 'environment';

export type PolicyRecommendationCategory =
  | 'fiscal' | 'digital' | 'welfare' | 'infrastructure'
  | 'economic' | 'environment' | 'governance' | 'culture';

export type ApplicabilityLevel = 'high' | 'medium' | 'low';

// ─── Benchmark Cities ────────────────────────────────────────────────────────

const BENCHMARK_CITIES: BenchmarkCity[] = [
  // ── Nordic / European Models ──
  {
    name: '헬싱키',
    country: '핀란드',
    population: 66,
    gdpPerCapita: 58000,
    fiscalIndependence: 52,
    cityType: 'medium',
    industryProfile: ['tech', 'education', 'creative', 'government'],
    strengths: ['디지털 정부', '교육 혁신', '스타트업 생태계', '투명한 재정'],
    successPolicies: [
      {
        name: '디지털 트윈 도시 플랫폼',
        category: 'digital',
        description: '도시 전체의 3D 디지털 트윈을 구축하여 정책 시뮬레이션과 시민 참여에 활용',
        implementation: '오픈 데이터 플랫폼 기반, 시민 참여형 도시계획 의사결정',
        cost: '초기 50억원, 연간 10억원 운영',
        timeline: '2-3년 구축, 지속 운영',
        impact: '도시계획 의사결정 시간 40% 단축, 시민 참여율 3배 증가',
        applicability: 'high',
        koreanContext: '스마트시티 사업과 연계 가능. 한국의 높은 IT 인프라가 강점',
      },
      {
        name: '현상 기반 학습(PBL) 교육개혁',
        category: 'welfare',
        description: '과목 간 경계를 허물고 실생활 현상 중심의 통합 교육과정 도입',
        implementation: '교사 재교육, 커리큘럼 개편, 학교 자율권 확대',
        cost: '학교당 5-10억원 (리모델링+교사교육)',
        timeline: '3-5년 단계적 도입',
        impact: 'PISA 성적 세계 최상위 유지, 학생 만족도 대폭 상승',
        applicability: 'medium',
        koreanContext: '입시 중심 교육과의 충돌 가능. 혁신학교 모델과 연계 검토',
      },
    ],
    fiscalStrategy: '높은 지방세 자주재원 + 중앙정부 교부금 균형. 투명한 예산 공개로 시민 신뢰 확보',
    qualityOfLifeRank: 8,
    source: 'Helsinki Smart City Report 2024',
  },
  {
    name: '코펜하겐',
    country: '덴마크',
    population: 80,
    gdpPerCapita: 65000,
    fiscalIndependence: 55,
    cityType: 'medium',
    industryProfile: ['creative', 'tech', 'logistics', 'environment'],
    strengths: ['탄소중립', '자전거 교통', '삶의 질', '그린 인프라'],
    successPolicies: [
      {
        name: '탄소중립 2025 프로젝트',
        category: 'environment',
        description: '세계 최초 탄소중립 수도 목표. 풍력발전, 지역난방, 자전거 인프라 통합',
        implementation: '풍력발전소 투자, 자전거 고속도로, 건물 에너지 효율화',
        cost: '10년간 약 3조원 (중앙+지방+민간)',
        timeline: '2012-2025 단계적',
        impact: '탄소배출 80% 감축, 그린 일자리 3만개 창출',
        applicability: 'medium',
        koreanContext: '탄소중립 국가 목표와 일치. 풍력보다 태양광 중심으로 적용',
      },
      {
        name: '슈퍼킬런(Superkilen) 다문화 공원',
        category: 'culture',
        description: '60개국 문화를 반영한 공공 공원. 주민 참여 설계, 사회통합 랜드마크',
        implementation: '주민 참여 워크숍, 다문화 요소 통합 설계',
        cost: '약 100억원',
        timeline: '3년 설계+시공',
        impact: '지역 상권 활성화 30%, 관광객 연 50만명',
        applicability: 'high',
        koreanContext: '다문화 지역이나 인구감소 지역의 명소화에 적합',
      },
    ],
    fiscalStrategy: '높은 소득세 기반 자주재원 + 그린본드 발행으로 환경 투자 재원 조달',
    qualityOfLifeRank: 3,
    source: 'Copenhagen Solutions Lab 2024',
  },
  {
    name: '취리히',
    country: '스위스',
    population: 43,
    gdpPerCapita: 92000,
    fiscalIndependence: 68,
    cityType: 'small',
    industryProfile: ['finance', 'tech', 'education', 'healthcare'],
    strengths: ['재정 건전성', '직접민주주의', '대중교통', '금융 허브'],
    successPolicies: [
      {
        name: '주민투표 기반 예산 편성',
        category: 'governance',
        description: '일정 금액 이상 사업은 주민투표로 결정. 재정 민주주의 실현',
        implementation: '연 4회 주민투표, 온라인 투표 병행, 예산안 시민 설명회',
        cost: '투표 1회당 약 5억원',
        timeline: '즉시 도입 가능',
        impact: '세금 낭비 대폭 감소, 시민 신뢰도 90% 이상',
        applicability: 'medium',
        koreanContext: '주민참여예산제 확대 형태로 도입 가능. 법적 구속력 부여 필요',
      },
      {
        name: '공공은행(칸토날방크) 모델',
        category: 'fiscal',
        description: '주정부 소유 공공은행이 지역 중소기업 대출, 주민 금융서비스 제공',
        implementation: '주정부 100% 출자, 독립 경영, 수익 지역사회 환원',
        cost: '초기 자본금 500-1000억원',
        timeline: '설립 2-3년, 안정화 5년',
        impact: '중소기업 대출 이자율 시중 대비 1-2%p 낮음, 연간 수백억 수익을 지역에 환원',
        applicability: 'high',
        koreanContext: '공공은행법 제정 필요. 새마을금고/신협 확대 모델로 우선 적용 가능',
      },
    ],
    fiscalStrategy: '칸토날방크(공공은행) 수익 + 높은 자체 세수. 재정흑자 유지 원칙',
    qualityOfLifeRank: 1,
    source: 'Mercer Quality of Living Survey 2024',
  },

  // ── Asian Models ──
  {
    name: '싱가포르',
    country: '싱가포르',
    population: 564,
    gdpPerCapita: 72000,
    fiscalIndependence: 95,
    cityType: 'large',
    industryProfile: ['finance', 'tech', 'logistics', 'manufacturing'],
    strengths: ['스마트시티', '효율적 정부', '주택정책', '교육'],
    successPolicies: [
      {
        name: 'HDB 공공주택 시스템',
        category: 'welfare',
        description: '인구의 80%가 거주하는 공공주택. 소유권 제공, 다양한 평형대',
        implementation: '국가 토지 확보, HDB(주택개발청) 직접 건설, 보조금 지원',
        cost: '1호당 약 2-4억원 (보조금 포함)',
        timeline: '지속적 공급 (연 2만호)',
        impact: '주거 안정률 90%, 자가보유율 세계 최고',
        applicability: 'medium',
        koreanContext: 'LH/SH 공공주택과 유사하나 규모와 품질 차별화 필요',
      },
      {
        name: 'Smart Nation 플랫폼',
        category: 'digital',
        description: '국가 차원 디지털 ID, 전자정부, 데이터 기반 정책 결정',
        implementation: 'SingPass(디지털ID), MyInfo(개인정보 일원화), 센서 네트워크',
        cost: '연간 약 5000억원 (국가 IT 예산)',
        timeline: '2014년 시작, 지속 확장',
        impact: '정부 서비스 디지털화 99%, 행정 비용 30% 절감',
        applicability: 'high',
        koreanContext: '한국의 전자정부 수준이 높아 확장 적용 용이. 마이데이터와 연계',
      },
    ],
    fiscalStrategy: '국부펀드(GIC, 테마섹) 투자 수익 + 저세율 기업 유치. 정부 운영 효율화',
    qualityOfLifeRank: 12,
    source: 'Singapore Smart Nation Report 2024',
  },
  {
    name: '도쿄 세타가야구',
    country: '일본',
    population: 92,
    gdpPerCapita: 48000,
    fiscalIndependence: 58,
    cityType: 'medium',
    industryProfile: ['creative', 'education', 'healthcare', 'government'],
    strengths: ['주민자치', '복지 네트워크', '안전', '지역화폐'],
    successPolicies: [
      {
        name: '세타가야 지역화폐(Setaco)',
        category: 'economic',
        description: '블록체인 기반 지역화폐로 지역 상권 활성화와 커뮤니티 참여 촉진',
        implementation: '모바일앱, 가맹점 네트워크, 지역 봉사활동 연계',
        cost: '개발비 약 20억원, 연간 운영비 5억원',
        timeline: '1년 구축, 2년 안정화',
        impact: '지역 소비 15% 증가, 봉사활동 참여 2배',
        applicability: 'high',
        koreanContext: '한국 지역화폐 제도와 직접 연계 가능. 블록체인 전환 시범사업 적합',
      },
      {
        name: '마을 만들기 조례',
        category: 'governance',
        description: '주민이 직접 마을 계획을 수립하고 예산을 배분하는 주민자치 모델',
        implementation: '마을회의, 주민 위원회, 소규모 예산 자치 배분',
        cost: '지구당 약 3-5억원/년',
        timeline: '1-2년 도입',
        impact: '주민 만족도 25% 상승, 민원 40% 감소',
        applicability: 'high',
        koreanContext: '읍면동 주민자치회와 연계. 주민참여예산제 확대 적용',
      },
    ],
    fiscalStrategy: '특별구세 + 도교부금. 주민참여 예산 편성으로 효율성 확보',
    qualityOfLifeRank: 18,
    source: 'Setagaya Ward Administrative Report 2024',
  },

  // ── Americas / Oceania ──
  {
    name: '메데인',
    country: '콜롬비아',
    population: 250,
    gdpPerCapita: 12000,
    fiscalIndependence: 35,
    cityType: 'medium',
    industryProfile: ['manufacturing', 'tech', 'tourism', 'creative'],
    strengths: ['도시재생', '사회혁신', '교통혁신', '교육투자'],
    successPolicies: [
      {
        name: '케이블카 대중교통 (메트로케이블)',
        category: 'infrastructure',
        description: '산간 빈민가를 도심과 연결하는 케이블카 대중교통. 사회통합의 상징',
        implementation: '기존 지하철과 환승 연계, 빈곤 지역 우선 노선',
        cost: 'km당 약 300-500억원',
        timeline: '노선당 2-3년',
        impact: '통근시간 70% 단축, 주변 지역 범죄율 50% 감소',
        applicability: 'medium',
        koreanContext: '산간 도시(강원, 경남 등)에 적합. 관광+교통 이중 효과',
      },
      {
        name: '도서관공원 프로젝트',
        category: 'culture',
        description: '빈곤 지역에 세계적 건축가가 설계한 대형 도서관+공원 복합시설',
        implementation: '낙후 지역 우선 배치, 교육+문화+커뮤니티 통합 공간',
        cost: '1개소 약 200-300억원',
        timeline: '3-4년 설계+시공',
        impact: '주변 지역 부동산 가치 30% 상승, 교육 접근성 대폭 개선',
        applicability: 'high',
        koreanContext: '인구감소 지역의 랜드마크+교육거점으로 활용 가능',
      },
    ],
    fiscalStrategy: '혁신적 재원 조달(도시개발 부담금) + 국제기구 협력. 투자 대비 효과 극대화',
    qualityOfLifeRank: 85,
    source: 'UN-Habitat Best Practice 2023, Medellín Model Report',
  },
  {
    name: '멜버른',
    country: '호주',
    population: 510,
    gdpPerCapita: 55000,
    fiscalIndependence: 45,
    cityType: 'large',
    industryProfile: ['education', 'healthcare', 'creative', 'finance'],
    strengths: ['문화 다양성', '리빙랩', '그린 인프라', '스타트업'],
    successPolicies: [
      {
        name: '20분 네이버후드',
        category: 'infrastructure',
        description: '모든 주민이 도보/자전거 20분 내 필수 서비스에 접근 가능한 도시 구조',
        implementation: '동네별 서비스 갭 분석, 부족 시설 보충, 보행로 정비',
        cost: '구역당 약 100-200억원',
        timeline: '5-10년 장기 계획',
        impact: '자동차 의존도 30% 감소, 지역 상권 활성화',
        applicability: 'high',
        koreanContext: '생활SOC 정책과 직접 연계. 읍면동 단위로 적용 가능',
      },
    ],
    fiscalStrategy: '주정부 교부금 + 카운슬 레이트(재산세). 인프라 투자채권 활용',
    qualityOfLifeRank: 5,
    source: 'Plan Melbourne 2050, EIU Livability Index',
  },
  {
    name: '바르셀로나',
    country: '스페인',
    population: 162,
    gdpPerCapita: 38000,
    fiscalIndependence: 42,
    cityType: 'medium',
    industryProfile: ['tourism', 'tech', 'creative', 'logistics'],
    strengths: ['슈퍼블록', '디지털 민주주의', '사회적 경제', '관광 관리'],
    successPolicies: [
      {
        name: '슈퍼블록(Superblock) 프로젝트',
        category: 'infrastructure',
        description: '3x3 블록 단위로 차량 통행 제한, 보행/자전거/녹지 공간으로 전환',
        implementation: '단계적 확대, 주민 합의 과정, 대중교통 강화 병행',
        cost: '블록당 약 50-80억원',
        timeline: '블록당 1-2년, 전체 10년 계획',
        impact: 'NO2 25% 감소, 보행자 25% 증가, 소매업 매출 증가',
        applicability: 'medium',
        koreanContext: '구도심 재생에 적합. 상인 반발 관리와 대중교통 대안 필요',
      },
      {
        name: 'Decidim 디지털 민주주의 플랫폼',
        category: 'governance',
        description: '오픈소스 시민참여 플랫폼. 예산 편성, 도시계획에 시민 직접 참여',
        implementation: '오픈소스 플랫폼 구축, 시민제안→투표→실행 프로세스',
        cost: '구축 약 10억원, 연간 3억원 운영',
        timeline: '6개월-1년 구축',
        impact: '시민 제안 7만건+, 참여예산 70억원+ 시민 배분',
        applicability: 'high',
        koreanContext: '주민참여예산제 디지털 전환에 즉시 적용 가능',
      },
    ],
    fiscalStrategy: '관광세 + EU 보조금 + 사회적경제 활성화. 디지털 투명성으로 세수 효율화',
    qualityOfLifeRank: 22,
    source: 'Barcelona Digital City Plan, Decidim.org',
  },

  // ── Latin America / Community Banking ──
  {
    name: '포르탈레자 (파우마스 은행)',
    country: '브라질',
    population: 270,
    gdpPerCapita: 8500,
    fiscalIndependence: 25,
    cityType: 'medium',
    industryProfile: ['tourism', 'manufacturing', 'agriculture', 'creative'],
    strengths: ['커뮤니티 공공은행', '사회적 화폐', '마이크로크레딧', '빈곤층 금융포용'],
    successPolicies: [
      {
        name: '파우마스 은행(Banco Palmas) 커뮤니티 뱅킹',
        category: 'fiscal',
        description: '주민이 설립·운영하는 커뮤니티 개발은행. 지역화폐 "팔마스(Palmas)" 발행, 무담보 소액대출, 지역 내 소비 순환 촉진. 브라질 전역 100개+ 유사 은행으로 확산',
        implementation: '주민총회로 설립, 지역화폐 발행(브라질 레알과 1:1 교환), 소액대출(무담보, 연 0.5-2%), 지역 가맹점 네트워크',
        cost: '설립비 약 3-5억원, 연간 운영비 약 1-2억원 (주민 출자+정부 보조)',
        timeline: '설립 6개월-1년, 안정화 2-3년',
        impact: '지역 내 소비 93% 유지(외부 유출 방지), 소득 30% 증가, 실업률 대폭 감소. 브라질 중앙은행 공식 인정',
        applicability: 'high',
        koreanContext: '마을기업·사회적경제 조직과 연계 가능. 신협/새마을금고를 커뮤니티뱅크로 전환하는 모델. 지역화폐 발행 주체를 주민조직으로 확대',
      },
      {
        name: 'Moeda Social (사회적 화폐) 시스템',
        category: 'economic',
        description: '지역 내에서만 유통되는 사회적 화폐로 지역경제 순환 촉진. 100개+ 브라질 커뮤니티에서 운영 중. 디지털 전환(e-Palmas 앱)도 완료',
        implementation: '지역화폐 설계(법정화폐와 1:1 교환 보장), 가맹점 할인 인센티브(5-10%), 모바일앱 결제, 소셜미디어 커뮤니티 연계',
        cost: '디지털 플랫폼 약 5-10억원, 초기 유통자금 약 10-30억원',
        timeline: '1-2년 구축, 3년 안정화',
        impact: '지역 내 자금 순환율 90%+, 소상공인 매출 20-40% 증가, 빈곤율 감소',
        applicability: 'high',
        koreanContext: '한국 지역화폐(지역사랑상품권)의 진화 모델. 블록체인 기반 전환 시 투명성 확보. 주민 자치 기반 운영이 핵심 차별점',
      },
      {
        name: '연대 마이크로크레딧 프로그램',
        category: 'welfare',
        description: '5인 연대보증 그룹 기반 무담보 소액대출. 신용이력 없는 빈곤층에게 창업·생계자금 제공',
        implementation: '연대보증 그룹(5인) 구성, 소액대출(50-500만원), 주 1회 그룹 미팅, 점진적 한도 증가',
        cost: '대출 재원 약 10-50억원, 운영비 대출액의 5-8%',
        timeline: '즉시 도입 가능, 1년 내 안정화',
        impact: '상환율 97%, 여성 경제활동 참여 50% 증가, 자영업 창업 성공률 70%',
        applicability: 'high',
        koreanContext: '취약계층 자활사업·마이크로크레딧과 연계. 농촌 고령자·다문화가정 대상 적합. 사회적금융 활성화법과 연동',
      },
    ],
    fiscalStrategy: '커뮤니티 은행 자체 수익 + 연방정부 보조금 + 국제기구(UNDP) 지원. 지역 내 자금 순환으로 세수 기반 확대',
    qualityOfLifeRank: 120,
    source: 'Banco Palmas / Instituto Palmas, UNDP Best Practice, 브라질 중앙은행 커뮤니티뱅크 보고서',
  },
];

// ─── Region-City Matching ────────────────────────────────────────────────────

interface RegionProfile {
  population: number;
  independence: number;
  autonomy: number;
  budget: number;
  cityType: CityType;
}

function classifyCityType(population: number): CityType {
  if (population >= 10000000) return 'megacity';
  if (population >= 3000000) return 'large';
  if (population >= 500000) return 'medium';
  if (population >= 100000) return 'small';
  return 'rural';
}

function calculateSimilarity(region: RegionProfile, city: BenchmarkCity): number {
  // Population similarity (0-30 points)
  const regionPopInMan = region.population / 10000;
  const popRatio = Math.min(regionPopInMan, city.population) / Math.max(regionPopInMan, city.population);
  const popScore = popRatio * 30;

  // City type match (0-25 points)
  const typeScore = region.cityType === city.cityType ? 25 :
    (Math.abs(['rural', 'small', 'medium', 'large', 'megacity'].indexOf(region.cityType) -
    ['rural', 'small', 'medium', 'large', 'megacity'].indexOf(city.cityType)) <= 1 ? 15 : 5);

  // Fiscal independence similarity (0-25 points)
  const indepDiff = Math.abs(region.independence - city.fiscalIndependence);
  const indepScore = Math.max(0, 25 - indepDiff * 0.5);

  // Bonus for applicability (0-20 points)
  const highApplicabilityCount = city.successPolicies.filter(p => p.applicability === 'high').length;
  const applicabilityScore = Math.min(20, highApplicabilityCount * 10);

  return Math.round(popScore + typeScore + indepScore + applicabilityScore);
}

export interface CityMatch {
  city: BenchmarkCity;
  similarityScore: number;
  matchReasons: string[];
  topPolicies: PolicyBenchmark[];
}

export function findMatchingCities(
  regionName: string,
  regionData: { population: number; independence: number; autonomy: number; budget: number },
  topN: number = 3,
): CityMatch[] {
  const regionProfile: RegionProfile = {
    ...regionData,
    cityType: classifyCityType(regionData.population),
  };

  const matches = BENCHMARK_CITIES.map(city => {
    const score = calculateSimilarity(regionProfile, city);

    const reasons: string[] = [];
    const regionPopInMan = regionData.population / 10000;

    if (Math.abs(regionPopInMan - city.population) / Math.max(regionPopInMan, city.population) < 0.5) {
      reasons.push(`인구 규모 유사 (${city.name}: ${city.population}만명)`);
    }
    if (Math.abs(regionData.independence - city.fiscalIndependence) < 15) {
      reasons.push(`재정자립도 유사 (${city.name}: ${city.fiscalIndependence}%)`);
    }
    if (regionProfile.cityType === city.cityType) {
      reasons.push(`도시 유형 일치 (${city.cityType})`);
    }
    if (city.successPolicies.some(p => p.applicability === 'high')) {
      reasons.push('한국 적용성 높은 정책 보유');
    }
    if (reasons.length === 0) {
      reasons.push(`${city.strengths[0]} 분야 벤치마킹 가치`);
    }

    // Sort policies by applicability
    const topPolicies = [...city.successPolicies]
      .sort((a, b) => {
        const order: Record<ApplicabilityLevel, number> = { high: 0, medium: 1, low: 2 };
        return order[a.applicability] - order[b.applicability];
      })
      .slice(0, 2);

    return { city, similarityScore: score, matchReasons: reasons, topPolicies };
  });

  return matches
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topN);
}

// ─── Policy Recommendation Generator ─────────────────────────────────────────

export interface PolicyRecommendation {
  rank: number;
  policyName: string;
  benchmarkCity: string;
  country: string;
  category: PolicyRecommendationCategory;
  description: string;
  estimatedCost: string;
  expectedImpact: string;
  timeline: string;
  applicability: ApplicabilityLevel;
  koreanContext: string;
  implementationSteps: string[];
}

export function generatePolicyRecommendations(
  regionName: string,
  regionData: { population: number; independence: number; autonomy: number; budget: number; debt: number },
  grade: string,
): PolicyRecommendation[] {
  const matches = findMatchingCities(regionName, regionData, 5);
  const recommendations: PolicyRecommendation[] = [];
  let rank = 1;

  // Collect all high-applicability policies first, then medium
  const allPolicies: Array<{ policy: PolicyBenchmark; city: BenchmarkCity; score: number }> = [];

  for (const match of matches) {
    for (const policy of match.city.successPolicies) {
      // Score based on applicability + city match + relevance to region's needs
      let score = match.similarityScore;
      if (policy.applicability === 'high') score += 30;
      else if (policy.applicability === 'medium') score += 15;

      // Boost fiscal policies for low-independence regions
      if (regionData.independence < 30 && policy.category === 'fiscal') score += 20;
      // Boost welfare for low-grade regions
      if (['D', 'F'].includes(grade) && policy.category === 'welfare') score += 15;
      // Boost digital for all (universal benefit)
      if (policy.category === 'digital') score += 10;
      // Boost governance for transparent improvement
      if (policy.category === 'governance') score += 10;

      allPolicies.push({ policy, city: match.city, score });
    }
  }

  // Sort by score, deduplicate by category, take top 5
  allPolicies.sort((a, b) => b.score - a.score);

  const seenCategories = new Set<string>();
  for (const { policy, city } of allPolicies) {
    // Allow max 2 per category
    const catCount = Array.from(seenCategories).filter(c => c === policy.category).length;
    if (catCount >= 2) continue;

    seenCategories.add(policy.category);

    recommendations.push({
      rank: rank++,
      policyName: policy.name,
      benchmarkCity: city.name,
      country: city.country,
      category: policy.category,
      description: policy.description,
      estimatedCost: policy.cost,
      expectedImpact: policy.impact,
      timeline: policy.timeline,
      applicability: policy.applicability,
      koreanContext: policy.koreanContext,
      implementationSteps: [
        `1단계: ${regionName} 현황 분석 및 ${city.name} 사례 심층 조사`,
        `2단계: 주민 공청회 및 이해관계자 의견 수렴`,
        `3단계: ${regionName} 맞춤형 실행계획 수립`,
        '4단계: 시범사업 추진 및 성과 측정',
        '5단계: 성과 기반 전면 확대',
      ],
    });

    if (rank > 5) break;
  }

  return recommendations;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export function getAllBenchmarkCities(): BenchmarkCity[] {
  return BENCHMARK_CITIES;
}

export function getCityByName(name: string): BenchmarkCity | undefined {
  return BENCHMARK_CITIES.find(c => c.name === name);
}

export const CATEGORY_LABELS: Record<PolicyRecommendationCategory, string> = {
  fiscal: '💰 재정 혁신',
  digital: '🔷 디지털 전환',
  welfare: '🏥 복지/교육',
  infrastructure: '🚇 인프라',
  economic: '📈 경제 활성화',
  environment: '🌱 환경/에너지',
  governance: '🏛️ 거버넌스',
  culture: '🎭 문화/도시재생',
};
