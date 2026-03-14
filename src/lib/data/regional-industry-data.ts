// ============================================================
// 지역 산업 경쟁력 데이터 & 시뮬레이션 엔진
// 출처: KOSIS, 산업통상자원부, 각 광역시도 전략산업 보고서 (2024-2025)
// ============================================================

// ── 타입 정의 ──────────────────────────────────────────────

export interface Industry {
  id: string;
  name: string;
  icon: string;
  category: 'existing' | 'recommended';
  description: string;
}

export interface IndustryImpact {
  grdpGrowthPct: number;
  employmentDelta: number;
  youthEmployDelta: number;
  populationDelta: number;
  fiscalRevenuePct: number;
  investmentEok: number;
  jobCreation: number;
}

export interface MetroIndustryProfile {
  metroName: string;
  grdp: number;
  population: number;
  employmentRate: number;
  youthUnemployment: number;
  fiscalIndependence: number;
  strengths: string[];
  resources: string[];
  industries: { industry: Industry; impact: IndustryImpact }[];
}

export interface MergerScenario {
  id: string;
  name: string;
  metros: string[];
  budgetSupportEok: number;
  years: number;
  status: string;
  specialBenefits: string[];
}

export interface SimulationYearResult {
  year: number;
  grdp: number;
  population: number;
  employmentRate: number;
  youthUnemployment: number;
  fiscalIndependence: number;
  totalInvestment: number;
  totalJobs: number;
  mergerBonus: number;
}

// ── 17개 광역시도 산업 프로필 ─────────────────────────────

const METRO_INDUSTRY_PROFILES: MetroIndustryProfile[] = [
  // ── 서울특별시 ──
  {
    metroName: '서울특별시',
    grdp: 468, population: 9_410_000, employmentRate: 62.3, youthUnemployment: 7.2, fiscalIndependence: 79.1,
    strengths: ['글로벌 스타트업 생태계 세계 8위', 'AI 집적 인프라', '금융 중심지'],
    resources: ['고급 인력 풀', '벤처 투자 자본', 'R&D 인프라'],
    industries: [
      { industry: { id: 'seoul_ai_fintech', name: 'AI·핀테크', icon: '🤖', category: 'existing', description: 'AI 기반 핀테크 및 디지털금융 생태계' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.15, youthEmployDelta: 0.25, populationDelta: 0.05, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 12000 } },
      { industry: { id: 'seoul_bio', name: '바이오헬스', icon: '🧬', category: 'existing', description: '바이오의약·디지털헬스케어 산업' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.1, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 6000 } },
      { industry: { id: 'seoul_finance', name: '금융서비스', icon: '💳', category: 'existing', description: '글로벌 금융 허브 및 자산운용' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.8, investmentEok: 5000, jobCreation: 4000 } },
      { industry: { id: 'seoul_content', name: '콘텐츠·미디어', icon: '🎬', category: 'existing', description: 'K-콘텐츠·OTT·게임 등 디지털 콘텐츠' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.1, youthEmployDelta: 0.2, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 3000, jobCreation: 8000 } },
      { industry: { id: 'seoul_quantum', name: '양자컴퓨팅', icon: '⚛️', category: 'recommended', description: '양자컴퓨팅 연구·상용화 플랫폼' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 12000, jobCreation: 3000 } },
      { industry: { id: 'seoul_space', name: '우주항공스타트업', icon: '🚀', category: 'recommended', description: '뉴스페이스 스타트업 생태계' }, impact: { grdpGrowthPct: 0.2, employmentDelta: 0.03, youthEmployDelta: 0.08, populationDelta: 0.01, fiscalRevenuePct: 0.15, investmentEok: 5000, jobCreation: 2000 } },
    ],
  },
  // ── 경기도 ──
  {
    metroName: '경기도',
    grdp: 280, population: 13_640_000, employmentRate: 63.1, youthUnemployment: 6.8, fiscalIndependence: 62.8,
    strengths: ['세계 최대 반도체 클러스터', '600조원 민간투자', '팹리스 생태계'],
    resources: ['삼성·SK하이닉스 생산기지', '판교 테크노밸리', '수도권 물류망'],
    industries: [
      { industry: { id: 'gyeonggi_semi', name: '반도체', icon: '🔬', category: 'existing', description: '세계 최대 반도체 생산 메가클러스터' }, impact: { grdpGrowthPct: 1.5, employmentDelta: 0.2, youthEmployDelta: 0.3, populationDelta: 0.08, fiscalRevenuePct: 1.2, investmentEok: 50000, jobCreation: 25000 } },
      { industry: { id: 'gyeonggi_electronics', name: '전자부품', icon: '📱', category: 'existing', description: '디스플레이·전자부품 제조' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.1, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 8000, jobCreation: 10000 } },
      { industry: { id: 'gyeonggi_medical', name: '의료·정밀기기', icon: '🏥', category: 'existing', description: '의료기기 및 정밀 계측 산업' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.08, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 5000 } },
      { industry: { id: 'gyeonggi_fabless', name: '팹리스설계', icon: '💎', category: 'recommended', description: '시스템 반도체 설계(Fabless) 생태계' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.12, youthEmployDelta: 0.25, populationDelta: 0.05, fiscalRevenuePct: 0.7, investmentEok: 20000, jobCreation: 8000 } },
      { industry: { id: 'gyeonggi_ai_chip', name: 'AI반도체', icon: '🧠', category: 'recommended', description: 'AI 전용 반도체 설계·생산' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.1, youthEmployDelta: 0.2, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 6000 } },
      { industry: { id: 'gyeonggi_power_semi', name: '전력반도체', icon: '⚡', category: 'recommended', description: 'SiC/GaN 전력반도체 제조' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 10000, jobCreation: 4000 } },
    ],
  },
  // ── 인천광역시 ──
  {
    metroName: '인천광역시',
    grdp: 55, population: 2_980_000, employmentRate: 61.5, youthUnemployment: 7.8, fiscalIndependence: 55.6,
    strengths: ['바이오의약품 생산 세계 3위', '인천공항 항공물류 허브', '송도 경제자유구역'],
    resources: ['삼성바이오로직스·셀트리온', '인천공항·항만', '경제자유구역 인프라'],
    industries: [
      { industry: { id: 'incheon_bio', name: '바이오의약품', icon: '💊', category: 'existing', description: '송도 바이오 메가클러스터 (연 116만L)' }, impact: { grdpGrowthPct: 1.2, employmentDelta: 0.15, youthEmployDelta: 0.2, populationDelta: 0.05, fiscalRevenuePct: 0.8, investmentEok: 25000, jobCreation: 13000 } },
      { industry: { id: 'incheon_air_logistics', name: '항공물류', icon: '✈️', category: 'existing', description: '인천공항 중심 글로벌 물류 허브' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 8000, jobCreation: 8000 } },
      { industry: { id: 'incheon_auto', name: '자동차부품', icon: '🚗', category: 'existing', description: '자동차 부품 제조 클러스터' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.08, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 3000, jobCreation: 5000 } },
      { industry: { id: 'incheon_biolab', name: 'K-바이오랩허브', icon: '🔬', category: 'recommended', description: '보스턴급 바이오 R&D 허브 구축' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.18, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 7000 } },
      { industry: { id: 'incheon_uam', name: 'UAM도심항공', icon: '🛸', category: 'recommended', description: '도심항공교통(UAM) 실증·상용화' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.12, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 8000, jobCreation: 3000 } },
      { industry: { id: 'incheon_robot', name: '로봇산업', icon: '🤖', category: 'recommended', description: '물류·서비스 로봇 제조' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 6000, jobCreation: 4000 } },
    ],
  },
  // ── 부산광역시 ──
  {
    metroName: '부산광역시',
    grdp: 60, population: 3_350_000, employmentRate: 59.8, youthUnemployment: 8.5, fiscalIndependence: 48.6,
    strengths: ['세계 7위 컨테이너 항만', '북항 재개발', '해양금융 클러스터'],
    resources: ['글로벌 항만 인프라', '진해 경제자유구역', '해양수산 R&D'],
    industries: [
      { industry: { id: 'busan_port', name: '항만물류', icon: '🚢', category: 'existing', description: '세계 7위 컨테이너 항만 물류' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.12, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.6, investmentEok: 10000, jobCreation: 10000 } },
      { industry: { id: 'busan_marine_fin', name: '해양금융', icon: '💰', category: 'existing', description: '해양금융 및 해운보험 클러스터' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.5, investmentEok: 3000, jobCreation: 3000 } },
      { industry: { id: 'busan_tourism', name: '관광·MICE', icon: '🏖️', category: 'existing', description: '해양관광·국제회의 산업' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 8000 } },
      { industry: { id: 'busan_smart_port', name: '스마트항만', icon: '🏗️', category: 'recommended', description: '자동화·디지털트윈 항만 고도화' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 12000, jobCreation: 5000 } },
      { industry: { id: 'busan_digital_logistics', name: '디지털물류', icon: '📦', category: 'recommended', description: '물류 플랫폼·자동화 기술' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 6000 } },
      { industry: { id: 'busan_marine_bio', name: '해양바이오', icon: '🌊', category: 'recommended', description: '해양생물자원 활용 바이오산업' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 3000 } },
    ],
  },
  // ── 울산광역시 ──
  {
    metroName: '울산광역시',
    grdp: 72, population: 1_110_000, employmentRate: 60.5, youthUnemployment: 8.0, fiscalIndependence: 52.9,
    strengths: ['전국 수소 생산 50%', '현대차 수소연료전지', '석유화학 단지'],
    resources: ['수소 전용 배관망 188km', '현대중공업', '석유화학 인프라'],
    industries: [
      { industry: { id: 'ulsan_hydrogen', name: '수소에너지', icon: '💧', category: 'existing', description: '전국 수소 생산 50%, 수소 도시' }, impact: { grdpGrowthPct: 1.0, employmentDelta: 0.15, youthEmployDelta: 0.2, populationDelta: 0.05, fiscalRevenuePct: 0.8, investmentEok: 20000, jobCreation: 8000 } },
      { industry: { id: 'ulsan_auto', name: '자동차', icon: '🚘', category: 'existing', description: '현대자동차 울산공장' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.12, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.7, investmentEok: 15000, jobCreation: 12000 } },
      { industry: { id: 'ulsan_petrochem', name: '석유화학', icon: '🏭', category: 'existing', description: '울산 석유화학 산업단지' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.6, investmentEok: 5000, jobCreation: 5000 } },
      { industry: { id: 'ulsan_shipbuilding', name: '조선해양', icon: '⚓', category: 'existing', description: '현대중공업 조선해양 클러스터' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 8000, jobCreation: 7000 } },
      { industry: { id: 'ulsan_green_h2', name: '그린수소', icon: '🌱', category: 'recommended', description: '재생에너지 연계 그린수소 생산' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.1, youthEmployDelta: 0.18, populationDelta: 0.04, fiscalRevenuePct: 0.5, investmentEok: 15000, jobCreation: 5000 } },
      { industry: { id: 'ulsan_ammonia_ship', name: '암모니아추진선', icon: '🚢', category: 'recommended', description: '암모니아 추진 선박 건조·실증' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 8000, jobCreation: 3000 } },
      { industry: { id: 'ulsan_pem', name: 'PEM수전해', icon: '⚗️', category: 'recommended', description: 'PEM 수전해 장치 생산' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 10000, jobCreation: 2000 } },
    ],
  },
  // ── 경상남도 ──
  {
    metroName: '경상남도',
    grdp: 65, population: 3_280_000, employmentRate: 60.2, youthUnemployment: 8.2, fiscalIndependence: 39.2,
    strengths: ['방산 해외수주 전국 87%', '함정 MRO 클러스터', '항공우주 거점'],
    resources: ['방위산업 집적지', '조선해양 인프라', 'K-방산 수출 네트워크'],
    industries: [
      { industry: { id: 'gyeongnam_defense', name: '방위산업', icon: '🛡️', category: 'existing', description: '방산 해외수주 전국 87% 핵심 거점' }, impact: { grdpGrowthPct: 1.2, employmentDelta: 0.15, youthEmployDelta: 0.2, populationDelta: 0.05, fiscalRevenuePct: 0.8, investmentEok: 30000, jobCreation: 15000 } },
      { industry: { id: 'gyeongnam_shipyard', name: '조선해양MRO', icon: '⚓', category: 'existing', description: '함정·상선 MRO 클러스터' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 8000 } },
      { industry: { id: 'gyeongnam_aerospace', name: '항공우주', icon: '✈️', category: 'existing', description: '사천 항공우주 산업 클러스터' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 10000, jobCreation: 5000 } },
      { industry: { id: 'gyeongnam_kdefense', name: 'K-방산수출고도화', icon: '🎯', category: 'recommended', description: 'K-방산 수출 체계 고도화' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.18, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 6000 } },
      { industry: { id: 'gyeongnam_rocket', name: '우주발사체', icon: '🚀', category: 'recommended', description: '우주발사체·위성 제조' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.05, youthEmployDelta: 0.12, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 12000, jobCreation: 3000 } },
    ],
  },
  // ── 대구광역시 ──
  {
    metroName: '대구광역시',
    grdp: 55, population: 2_380_000, employmentRate: 59.5, youthUnemployment: 9.0, fiscalIndependence: 46.7,
    strengths: ['섬유·패션 산업 클러스터', '의료기기 허브', 'AI·로봇 거점'],
    resources: ['경북대·DGIST 연구인력', '의료기기 인허가 인프라', '섬유산업 전환 기반'],
    industries: [
      { industry: { id: 'daegu_textile', name: '섬유·패션', icon: '👗', category: 'existing', description: '섬유산업에서 스마트패션으로 전환' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.08, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 5000 } },
      { industry: { id: 'daegu_meddevice', name: '의료기기', icon: '🩺', category: 'existing', description: '의료기기 인허가·생산 허브' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 5000, jobCreation: 4000 } },
      { industry: { id: 'daegu_ai_robot', name: 'AI·로봇', icon: '🤖', category: 'existing', description: 'AI·로봇 R&D 및 제조 거점' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.1, youthEmployDelta: 0.18, populationDelta: 0.04, fiscalRevenuePct: 0.5, investmentEok: 8000, jobCreation: 6000 } },
      { industry: { id: 'daegu_smart_robot', name: '지능형로봇', icon: '🦾', category: 'recommended', description: '산업용·서비스용 지능형 로봇' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.1, youthEmployDelta: 0.2, populationDelta: 0.04, fiscalRevenuePct: 0.5, investmentEok: 12000, jobCreation: 5000 } },
      { industry: { id: 'daegu_mobility', name: '미래모빌리티', icon: '🚗', category: 'recommended', description: '자율주행·전기차 모빌리티' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 10000, jobCreation: 4000 } },
      { industry: { id: 'daegu_digital_health', name: '디지털헬스케어', icon: '💻', category: 'recommended', description: '원격의료·디지털 헬스케어 플랫폼' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.12, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 6000, jobCreation: 3000 } },
    ],
  },
  // ── 경상북도 ──
  {
    metroName: '경상북도',
    grdp: 110, population: 2_570_000, employmentRate: 61.0, youthUnemployment: 7.5, fiscalIndependence: 31.0,
    strengths: ['이차전지 양극재 세계 1위 (포항)', '반도체 구미 클러스터', 'POSCO 철강'],
    resources: ['에코프로·POSCO Future M', '구미 반도체 단지', '분산에너지 특구'],
    industries: [
      { industry: { id: 'gyeongbuk_battery', name: '이차전지', icon: '🔋', category: 'existing', description: '포항 이차전지 양극재 세계 1위' }, impact: { grdpGrowthPct: 1.3, employmentDelta: 0.15, youthEmployDelta: 0.2, populationDelta: 0.05, fiscalRevenuePct: 0.9, investmentEok: 35000, jobCreation: 15000 } },
      { industry: { id: 'gyeongbuk_semi', name: '반도체소부장', icon: '🔬', category: 'existing', description: '구미 반도체 소재·부품·장비' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.15, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 8000 } },
      { industry: { id: 'gyeongbuk_steel', name: '철강', icon: '⚙️', category: 'existing', description: 'POSCO 포항 철강 단지' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.08, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.5, investmentEok: 5000, jobCreation: 5000 } },
      { industry: { id: 'gyeongbuk_defense', name: '방위산업', icon: '🛡️', category: 'existing', description: '구미 방위산업혁신클러스터' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 5000 } },
      { industry: { id: 'gyeongbuk_sic', name: 'SiC전력반도체', icon: '⚡', category: 'recommended', description: '8인치 SiC 전력반도체 클러스터' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 12000, jobCreation: 4000 } },
      { industry: { id: 'gyeongbuk_dist_energy', name: '분산에너지', icon: '🌍', category: 'recommended', description: '포항 그린암모니아 분산에너지 특구' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 8000, jobCreation: 3000 } },
    ],
  },
  // ── 대전광역시 ──
  {
    metroName: '대전광역시',
    grdp: 45, population: 1_450_000, employmentRate: 60.8, youthUnemployment: 8.3, fiscalIndependence: 45.1,
    strengths: ['대덕연구개발특구', '우주항공·국방 R&D', '4대 바이오클러스터'],
    resources: ['KAIST·ETRI·국방과학연구소', '과학기술 인력 집적', '양자·우주 연구 인프라'],
    industries: [
      { industry: { id: 'daejeon_rd', name: '과학기술R&D', icon: '🔭', category: 'existing', description: '대덕연구개발특구 중심 R&D' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 4000 } },
      { industry: { id: 'daejeon_space', name: '우주항공', icon: '🛰️', category: 'existing', description: '우주항공 연구·개발·실증' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 10000, jobCreation: 4000 } },
      { industry: { id: 'daejeon_defense_tech', name: '국방기술', icon: '🎖️', category: 'existing', description: '국방과학연구소 중심 국방 R&D' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 3000 } },
      { industry: { id: 'daejeon_semi_city', name: '반도체융합도시', icon: '💎', category: 'recommended', description: '반도체 설계·소재·장비 융합도시' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.1, youthEmployDelta: 0.18, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 6000 } },
      { industry: { id: 'daejeon_quantum', name: '양자암호통신', icon: '🔐', category: 'recommended', description: '양자암호통신 네트워크 구축' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.04, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 8000, jobCreation: 2000 } },
      { industry: { id: 'daejeon_bio', name: '바이오헬스', icon: '🧬', category: 'recommended', description: '대덕 바이오 클러스터 확장' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 6000, jobCreation: 4000 } },
    ],
  },
  // ── 세종특별자치시 ──
  {
    metroName: '세종특별자치시',
    grdp: 15, population: 390_000, employmentRate: 62.0, youthUnemployment: 6.5, fiscalIndependence: 62.7,
    strengths: ['행정 중심 복합도시', '자율주행 시범도시', '스마트시티 테스트베드'],
    resources: ['정부 기관 집중', '신도시 인프라', 'BRT 대중교통'],
    industries: [
      { industry: { id: 'sejong_admin', name: '행정서비스', icon: '🏛️', category: 'existing', description: '행정중심복합도시 기반 공공서비스' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.05, populationDelta: 0.08, fiscalRevenuePct: 0.2, investmentEok: 1000, jobCreation: 2000 } },
      { industry: { id: 'sejong_autonomous', name: '자율주행', icon: '🚙', category: 'existing', description: '자율주행 시범도시 모빌리티' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 3000, jobCreation: 2000 } },
      { industry: { id: 'sejong_smart_city', name: '스마트시티', icon: '🌃', category: 'recommended', description: '스마트시티 테스트베드 도시혁신' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.05, fiscalRevenuePct: 0.4, investmentEok: 5000, jobCreation: 3000 } },
      { industry: { id: 'sejong_digital_twin', name: '디지털트윈', icon: '🖥️', category: 'recommended', description: '도시 디지털트윈 플랫폼' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 4000, jobCreation: 2000 } },
      { industry: { id: 'sejong_public_data', name: '공공데이터산업', icon: '📊', category: 'recommended', description: '공공데이터 개방·활용 산업' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 2000 } },
    ],
  },
  // ── 충청남도 ──
  {
    metroName: '충청남도',
    grdp: 75, population: 2_130_000, employmentRate: 62.5, youthUnemployment: 7.0, fiscalIndependence: 36.8,
    strengths: ['삼성디스플레이 아산캠퍼스', '석유화학·철강 단지', '이차전지 거점'],
    resources: ['초격차 디스플레이 생산라인', '서해안 산업벨트', '당진 철강'],
    industries: [
      { industry: { id: 'chungnam_display', name: '디스플레이', icon: '📺', category: 'existing', description: '삼성디스플레이 아산 초격차 디스플레이' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.6, investmentEok: 15000, jobCreation: 8000 } },
      { industry: { id: 'chungnam_petrochem', name: '석유화학', icon: '🏭', category: 'existing', description: '서해안 석유화학 단지' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.08, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.4, investmentEok: 3000, jobCreation: 5000 } },
      { industry: { id: 'chungnam_steel', name: '철강', icon: '⚙️', category: 'existing', description: '당진 철강 단지' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.06, youthEmployDelta: 0.06, populationDelta: 0.01, fiscalRevenuePct: 0.3, investmentEok: 2000, jobCreation: 3000 } },
      { industry: { id: 'chungnam_ultra_display', name: '초격차디스플레이', icon: '🖥️', category: 'recommended', description: '차세대 초격차 디스플레이 양산' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 12000, jobCreation: 5000 } },
      { industry: { id: 'chungnam_h2', name: '탄소중립수소', icon: '💧', category: 'recommended', description: '탄소중립 수소 생산·유통' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 10000, jobCreation: 4000 } },
      { industry: { id: 'chungnam_eco_mobility', name: '친환경모빌리티', icon: '🚗', category: 'recommended', description: '친환경 전기·수소 모빌리티' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 3000 } },
    ],
  },
  // ── 충청북도 ──
  {
    metroName: '충청북도',
    grdp: 42, population: 1_600_000, employmentRate: 63.5, youthUnemployment: 6.5, fiscalIndependence: 36.9,
    strengths: ['오송 바이오 국가클러스터', '반도체 소재', '성장률 전국 1위'],
    resources: ['오송 바이오 집적단지', '반도체 소재기업', '중부내륙 물류'],
    industries: [
      { industry: { id: 'chungbuk_bio', name: '바이오의약품', icon: '💊', category: 'existing', description: '오송 바이오 국가클러스터' }, impact: { grdpGrowthPct: 1.0, employmentDelta: 0.12, youthEmployDelta: 0.18, populationDelta: 0.05, fiscalRevenuePct: 0.7, investmentEok: 15000, jobCreation: 8000 } },
      { industry: { id: 'chungbuk_semi_mat', name: '반도체소재', icon: '🔬', category: 'existing', description: '반도체 소재 제조·공급' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 8000, jobCreation: 5000 } },
      { industry: { id: 'chungbuk_cosmetics', name: '화장품·뷰티', icon: '💄', category: 'existing', description: '화장품 OEM·ODM 및 뷰티 산업' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.06, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 4000 } },
      { industry: { id: 'chungbuk_bio_expand', name: '바이오의약품생산확대', icon: '🧪', category: 'recommended', description: '오송 바이오 생산능력 확대' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.15, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 12000, jobCreation: 6000 } },
      { industry: { id: 'chungbuk_kbeauty', name: '화장품글로벌화', icon: '🌏', category: 'recommended', description: 'K-뷰티 글로벌 수출 확대' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 3000, jobCreation: 3000 } },
    ],
  },
  // ── 광주광역시 ──
  {
    metroName: '광주광역시',
    grdp: 40, population: 1_430_000, employmentRate: 59.0, youthUnemployment: 9.5, fiscalIndependence: 42.0,
    strengths: ['AI 집적단지', '광주글로벌모터스', '광(光)산업 거점'],
    resources: ['AI 인프라·데이터센터', '광주과기원(GIST)', '광산업 클러스터'],
    industries: [
      { industry: { id: 'gwangju_ai', name: 'AI산업', icon: '🤖', category: 'existing', description: 'AI 집적단지 기반 인공지능 산업' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.1, youthEmployDelta: 0.2, populationDelta: 0.04, fiscalRevenuePct: 0.5, investmentEok: 8000, jobCreation: 6000 } },
      { industry: { id: 'gwangju_auto', name: '자동차', icon: '🚘', category: 'existing', description: '광주글로벌모터스 자동차 생산' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 5000, jobCreation: 8000 } },
      { industry: { id: 'gwangju_photonics', name: '광산업', icon: '💡', category: 'existing', description: '광(光)기술 산업 클러스터' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 3000, jobCreation: 3000 } },
      { industry: { id: 'gwangju_hyperai', name: '초거대AI', icon: '🧠', category: 'recommended', description: '초거대 AI 모델 개발·서비스' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.18, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 10000, jobCreation: 4000 } },
      { industry: { id: 'gwangju_humanoid', name: '휴머노이드로봇', icon: '🦾', category: 'recommended', description: '휴머노이드 로봇 개발·상용화' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.06, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 8000, jobCreation: 3000 } },
      { industry: { id: 'gwangju_quantum_optics', name: '양자광학', icon: '⚛️', category: 'recommended', description: '양자 광학 기술 연구·사업화' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.04, youthEmployDelta: 0.08, populationDelta: 0.01, fiscalRevenuePct: 0.2, investmentEok: 5000, jobCreation: 1500 } },
    ],
  },
  // ── 전라남도 ──
  {
    metroName: '전라남도',
    grdp: 55, population: 1_810_000, employmentRate: 60.5, youthUnemployment: 8.0, fiscalIndependence: 27.1,
    strengths: ['전국 최대 재생에너지 잠재력', '여수 석유화학(부생수소 33%)', 'POSCO 광양 철강'],
    resources: ['해상풍력 최적 입지', '태양광 일조량', '광양항'],
    industries: [
      { industry: { id: 'jeonnam_renewable', name: '재생에너지', icon: '☀️', category: 'existing', description: '전국 최대 재생에너지 발전' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.5, investmentEok: 15000, jobCreation: 10000 } },
      { industry: { id: 'jeonnam_petrochem', name: '석유화학', icon: '🏭', category: 'existing', description: '여수 석유화학 (부생수소 33%)' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.06, populationDelta: 0.01, fiscalRevenuePct: 0.4, investmentEok: 3000, jobCreation: 4000 } },
      { industry: { id: 'jeonnam_steel', name: '철강', icon: '⚙️', category: 'existing', description: 'POSCO 광양 철강 단지' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.06, youthEmployDelta: 0.06, populationDelta: 0.01, fiscalRevenuePct: 0.3, investmentEok: 2000, jobCreation: 3000 } },
      { industry: { id: 'jeonnam_ai_dc', name: 'AI데이터센터', icon: '🖥️', category: 'recommended', description: 'AI 학습·추론 전용 데이터센터' }, impact: { grdpGrowthPct: 0.7, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.04, fiscalRevenuePct: 0.5, investmentEok: 20000, jobCreation: 5000 } },
      { industry: { id: 'jeonnam_green_h2', name: '그린수소', icon: '🌱', category: 'recommended', description: '재생에너지 연계 그린수소' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 12000, jobCreation: 4000 } },
      { industry: { id: 'jeonnam_offshore', name: '해상풍력기자재', icon: '🌊', category: 'recommended', description: '해상풍력 기자재 제조·설치' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.1, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 6000 } },
    ],
  },
  // ── 전북특별자치도 ──
  {
    metroName: '전북특별자치도',
    grdp: 30, population: 1_770_000, employmentRate: 60.0, youthUnemployment: 8.8, fiscalIndependence: 27.1,
    strengths: ['새만금 현대차 9조 투자 확정', '이차전지 특화단지', '농생명 거점'],
    resources: ['새만금 산업단지', '농업 바이오 자원', '탄소소재 연구'],
    industries: [
      { industry: { id: 'jeonbuk_battery', name: '이차전지', icon: '🔋', category: 'existing', description: '새만금 이차전지 특화단지' }, impact: { grdpGrowthPct: 0.8, employmentDelta: 0.1, youthEmployDelta: 0.15, populationDelta: 0.04, fiscalRevenuePct: 0.6, investmentEok: 12000, jobCreation: 8000 } },
      { industry: { id: 'jeonbuk_agri', name: '농생명', icon: '🌾', category: 'existing', description: '농업 바이오·농생명 산업' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.06, youthEmployDelta: 0.06, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 5000 } },
      { industry: { id: 'jeonbuk_carbon', name: '탄소소재', icon: '⬛', category: 'existing', description: '탄소소재 연구·제조' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 3000 } },
      { industry: { id: 'jeonbuk_ai_dc', name: 'AI데이터센터', icon: '🖥️', category: 'recommended', description: '새만금 AI 데이터센터 유치' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.08, youthEmployDelta: 0.15, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 15000, jobCreation: 4000 } },
      { industry: { id: 'jeonbuk_green_h2', name: '그린수소', icon: '🌱', category: 'recommended', description: '재생에너지 연계 그린수소' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 8000, jobCreation: 3000 } },
      { industry: { id: 'jeonbuk_smart_agri', name: '스마트농업', icon: '🚜', category: 'recommended', description: 'ICT 기반 스마트팜·정밀농업' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 3000, jobCreation: 3000 } },
    ],
  },
  // ── 강원특별자치도 ──
  {
    metroName: '강원특별자치도',
    grdp: 28, population: 1_530_000, employmentRate: 60.2, youthUnemployment: 7.8, fiscalIndependence: 29.0,
    strengths: ['연구개발특구 6호', '춘천·홍천 바이오 특화단지', '청정 자연환경'],
    resources: ['바이오헬스 R&D', '관광 인프라', '천연물 자원'],
    industries: [
      { industry: { id: 'gangwon_tourism', name: '관광', icon: '🏔️', category: 'existing', description: '청정 자연환경 기반 관광' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.08, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 8000 } },
      { industry: { id: 'gangwon_bio', name: '바이오헬스', icon: '🧬', category: 'existing', description: '춘천·홍천 바이오 특화단지' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.06, youthEmployDelta: 0.1, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 3000 } },
      { industry: { id: 'gangwon_meddev', name: '의료기기원주', icon: '🩺', category: 'existing', description: '원주 의료기기 클러스터' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.06, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 3000, jobCreation: 3000 } },
      { industry: { id: 'gangwon_semi_mat', name: '반도체소재', icon: '🔬', category: 'recommended', description: '반도체 소재 제조기업 유치' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.06, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 3000 } },
      { industry: { id: 'gangwon_climate', name: '기후테크', icon: '🌡️', category: 'recommended', description: '기후변화 대응 기술 연구' }, impact: { grdpGrowthPct: 0.4, employmentDelta: 0.05, youthEmployDelta: 0.1, populationDelta: 0.02, fiscalRevenuePct: 0.3, investmentEok: 5000, jobCreation: 2500 } },
      { industry: { id: 'gangwon_med_tour', name: '의료관광', icon: '🏥', category: 'recommended', description: '청정 환경 연계 의료관광' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.06, youthEmployDelta: 0.08, populationDelta: 0.03, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 4000 } },
    ],
  },
  // ── 제주특별자치도 ──
  {
    metroName: '제주특별자치도',
    grdp: 12, population: 680_000, employmentRate: 62.8, youthUnemployment: 6.0, fiscalIndependence: 39.5,
    strengths: ['관광 산업 핵심', '재생에너지 비중 전국 1위(20%)', 'CFI 2035'],
    resources: ['유네스코 세계자연유산', '풍력·태양광 자원', '청정 이미지'],
    industries: [
      { industry: { id: 'jeju_tourism', name: '관광', icon: '🏝️', category: 'existing', description: '유네스코 세계자연유산 관광' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.1, youthEmployDelta: 0.1, populationDelta: 0.03, fiscalRevenuePct: 0.3, investmentEok: 3000, jobCreation: 10000 } },
      { industry: { id: 'jeju_renewable', name: '재생에너지', icon: '☀️', category: 'existing', description: '재생에너지 비중 전국 1위(20%)' }, impact: { grdpGrowthPct: 0.6, employmentDelta: 0.06, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.4, investmentEok: 5000, jobCreation: 3000 } },
      { industry: { id: 'jeju_green_dc', name: '그린데이터센터', icon: '🖥️', category: 'recommended', description: '재생에너지 기반 그린 데이터센터' }, impact: { grdpGrowthPct: 0.5, employmentDelta: 0.06, youthEmployDelta: 0.12, populationDelta: 0.03, fiscalRevenuePct: 0.4, investmentEok: 8000, jobCreation: 2500 } },
      { industry: { id: 'jeju_carbon_neutral', name: '탄소중립기술', icon: '🌿', category: 'recommended', description: 'CFI 2035 탄소중립 기술' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.04, youthEmployDelta: 0.08, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 4000, jobCreation: 1500 } },
      { industry: { id: 'jeju_smart_farm', name: '스마트팜', icon: '🌱', category: 'recommended', description: '제주 특산물 스마트팜' }, impact: { grdpGrowthPct: 0.3, employmentDelta: 0.05, youthEmployDelta: 0.06, populationDelta: 0.02, fiscalRevenuePct: 0.2, investmentEok: 2000, jobCreation: 2000 } },
    ],
  },
];

// ── 시도 통합 시나리오 ────────────────────────────────────

const MERGER_SCENARIOS: MergerScenario[] = [
  {
    id: 'gwangju-jeonnam', name: '전남광주통합특별시',
    metros: ['광주광역시', '전라남도'], budgetSupportEok: 50000, years: 4,
    status: '확정 (2026.7 출범)',
    specialBenefits: ['서울시급 법적 지위', 'AI·자동차·재생에너지 규제특례', '공공기관 2차 이전 우선권', '글로벌미래특구 지정'],
  },
  {
    id: 'daegu-gyeongbuk', name: '대구경북통합특별시',
    metros: ['대구광역시', '경상북도'], budgetSupportEok: 50000, years: 4,
    status: '국회 심의 중',
    specialBenefits: ['391개 특례 조문', 'AI반도체 전략거점', '글로벌미래특구 9개', '기회발전특구 우선 지정'],
  },
  {
    id: 'busan-gyeongnam', name: '부산경남통합특별시',
    metros: ['부산광역시', '경상남도'], budgetSupportEok: 50000, years: 4,
    status: '추진 중 (여론조사 완료)',
    specialBenefits: ['해양산업 메가벨트', '방산·항만 통합 클러스터', '동남권 메가시티'],
  },
  {
    id: 'daejeon-chungnam', name: '충남대전통합특별시',
    metros: ['대전광역시', '충청남도', '세종특별자치시'], budgetSupportEok: 50000, years: 4,
    status: '보류',
    specialBenefits: ['경제과학수도 비전', '대덕특구 확장', '충청권 메가시티'],
  },
];

// ── Accessor 함수 ─────────────────────────────────────────

export function getMetroIndustryProfile(metroName: string): MetroIndustryProfile {
  const p = METRO_INDUSTRY_PROFILES.find(p => p.metroName === metroName);
  if (!p) throw new Error(`Metro not found: ${metroName}`);
  return JSON.parse(JSON.stringify(p));
}

export function getAllIndustryProfiles(): MetroIndustryProfile[] {
  return JSON.parse(JSON.stringify(METRO_INDUSTRY_PROFILES));
}

export function getMergerScenarios(): MergerScenario[] {
  return [...MERGER_SCENARIOS];
}

export function getMergerForMetro(metroName: string): MergerScenario | undefined {
  return MERGER_SCENARIOS.find(s => s.metros.includes(metroName));
}

// ── 시뮬레이션 엔진 ──────────────────────────────────────

export function simulateIndustry(params: {
  metroName: string;
  selectedIndustryIds: string[];
  enableMerger: boolean;
  years: number;
  investmentMultiplier: number;
}): SimulationYearResult[] {
  const { metroName, selectedIndustryIds, enableMerger, years, investmentMultiplier } = params;
  const profile = getMetroIndustryProfile(metroName);
  const merger = enableMerger ? getMergerForMetro(metroName) : undefined;

  let baseGrdp = profile.grdp;
  let basePop = profile.population;
  let baseEmpRate = profile.employmentRate;
  let baseYouthUnemp = profile.youthUnemployment;
  let baseFiscalInd = profile.fiscalIndependence;
  let allIndustries = [...profile.industries];

  // 통합 시 파트너 합산
  if (merger) {
    for (const pName of merger.metros.filter(m => m !== metroName)) {
      try {
        const partner = getMetroIndustryProfile(pName);
        const totalPop = basePop + partner.population;
        baseEmpRate = (baseEmpRate * basePop + partner.employmentRate * partner.population) / totalPop;
        baseYouthUnemp = (baseYouthUnemp * basePop + partner.youthUnemployment * partner.population) / totalPop;
        baseFiscalInd = (baseFiscalInd + partner.fiscalIndependence) / 2;
        baseGrdp += partner.grdp;
        basePop = totalPop;
        allIndustries = [...allIndustries, ...partner.industries];
      } catch { /* skip */ }
    }
  }

  // 선택 산업 수집
  const selected = selectedIndustryIds
    .map(id => allIndustries.find(ind => ind.industry.id === id))
    .filter((x): x is { industry: Industry; impact: IndustryImpact } => !!x);

  const results: SimulationYearResult[] = [];
  let grdp = baseGrdp;
  let pop = basePop;
  let empRate = baseEmpRate;
  let youthUnemp = baseYouthUnemp;
  let fiscalInd = baseFiscalInd;
  let accInvest = 0;
  let accJobs = 0;

  for (let y = 1; y <= years; y++) {
    let yGrdp = 0, yEmp = 0, yYouth = 0, yPop = 0, yFiscal = 0, yInvest = 0, yJobs = 0;

    for (const { industry, impact } of selected) {
      const decay = Math.pow(industry.category === 'recommended' ? 0.92 : 0.96, y - 1);
      const mult = investmentMultiplier * decay;
      yGrdp += impact.grdpGrowthPct * mult;
      yEmp += impact.employmentDelta * mult;
      yYouth += impact.youthEmployDelta * mult;
      if (y > 2) yPop += impact.populationDelta * mult;
      yFiscal += impact.fiscalRevenuePct * mult;
      yInvest += impact.investmentEok * investmentMultiplier;
      yJobs += impact.jobCreation * investmentMultiplier * decay;
    }

    let mergerBonus = 0;
    if (merger) {
      yGrdp += 0.8; yEmp += 0.15; yFiscal += 1.5;
      if (y <= merger.years) mergerBonus = merger.budgetSupportEok;
    }

    grdp *= 1 + yGrdp / 100;
    empRate += yEmp;
    youthUnemp -= yYouth;
    pop *= 1 + yPop / 100;
    fiscalInd += yFiscal;

    empRate = Math.min(empRate, 75);
    youthUnemp = Math.max(youthUnemp, 2);
    fiscalInd = Math.min(fiscalInd, 85);

    accInvest += yInvest + mergerBonus;
    accJobs += Math.round(yJobs);

    results.push({
      year: y,
      grdp: Math.round(grdp * 100) / 100,
      population: Math.round(pop),
      employmentRate: Math.round(empRate * 100) / 100,
      youthUnemployment: Math.round(youthUnemp * 100) / 100,
      fiscalIndependence: Math.round(fiscalInd * 100) / 100,
      totalInvestment: Math.round(accInvest),
      totalJobs: Math.round(accJobs),
      mergerBonus: Math.round(mergerBonus),
    });
  }

  return results;
}
