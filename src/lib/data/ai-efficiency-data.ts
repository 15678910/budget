// ============================================================
// 정부부처 AI 효율화 시뮬레이터 데이터
// 5개 핵심 부처: 국세청·조달청·보건복지부·건보공단·국토교통부
// 출처: 각 부처 연보, OECD, 정부 공식 통계 (2025~2026 기준)
// ============================================================

// ─── Types ───

/** 7개 시뮬레이터 부처 식별자 */
export type DepartmentId = 'nts' | 'pps' | 'mohw' | 'nhis' | 'molit' | 'moe' | 'court';

/** 슬라이더 설정 인터페이스 */
export interface SliderConfig {
  /** 슬라이더 레이블 (한글) */
  label: string;
  /** 단위 (%, 배, 조원 등) */
  unit: string;
  /** 최솟값 */
  min: number;
  /** 최댓값 */
  max: number;
  /** 기본값 (현재 수준) */
  defaultValue: number;
  /** 이동 단계 */
  step: number;
  /** 슬라이더 설명 (툴팁) */
  description: string;
}

/** 부처 공통 기반 인터페이스 */
export interface DepartmentBaseData {
  /** 부처명 (한글) */
  name: string;
  /** 부처명 (영문 약칭) */
  nameEn: string;
  /** Tailwind 강조 텍스트 색상 */
  accentColor: string;
  /** Tailwind 테두리 색상 */
  borderColor: string;
  /** Tailwind 배경 색상 */
  bgColor: string;
}

// ─── 국세청 (NTS) ───

/**
 * 국세청 AI 세무조사 효율화 기반 데이터
 * - 탈세 탐지율 향상 및 세무조사 인력 자동화에 집중
 */
export const NTS_DATA = {
  name: '국세청',
  nameEn: 'National Tax Service',
  accentColor: 'text-blue-400',
  borderColor: 'border-blue-900/50',
  bgColor: 'bg-blue-950/30',
  nationalTaxRevenue: 382,    // 조원 - 2026 국세 수입 (국세청 세입예산)
  taxGap: 27.5,               // 조원 - 탈세 추정액 (GDP 대비 약 1% 적용)
  auditStaff: 4800,           // 명 - 세무조사 전담 인력
  auditCoverage: 1.2,         // % - 현재 전체 납세자 중 조사 대상 비율
  currentDetectionRate: 65,   // % - 현재 AI 도입 전 탈세 탐지율
} as const;

/** 국세청 시뮬레이터 슬라이더 설정 */
export const NTS_SLIDERS: SliderConfig[] = [
  {
    label: 'AI 탈세 탐지율',
    unit: '%',
    min: 65,
    max: 95,
    defaultValue: 65,
    step: 1,
    description: 'AI 도입 후 탈세 혐의자 탐지 정확도. 현재 65% → AI 고도화 시 최대 95% 가능',
  },
  {
    label: '자동화 처리 비율',
    unit: '%',
    min: 0,
    max: 80,
    defaultValue: 20,
    step: 5,
    description: '세무조사 사전 선별·자료 수집 단계의 AI 자동화 비율',
  },
  {
    label: '조사 대상 확대율',
    unit: '배',
    min: 1,
    max: 5,
    defaultValue: 1,
    step: 0.5,
    description: 'AI 보조로 동일 인력이 처리할 수 있는 조사 건수 배수',
  },
];

/** 국세청 데이터 출처 */
export const NTS_SOURCES = [
  '국세통계연보 2025',
  'OECD Tax Gap Estimation (GDP 대비 약 1%)',
  '국세청 세무조사 운영 현황 보고서',
];

/** 국세청 시뮬레이터 주요 가정 */
export const NTS_ASSUMPTIONS = [
  'AI 탐지율 향상분 × 탈세 추정액 = 추가 세수 회수 가능액으로 계산',
  '자동화 처리로 절감되는 인건비는 연 6,000만원/인 기준 적용',
  'AI 시스템 구축 및 유지비(초기 1,200억, 연 운영 300억)는 별도 비용으로 포함',
  '탈세 추정액(27.5조원)은 OECD 방법론 기준이며 실제 회수 가능액은 50~70% 수준',
];

// ─── 조달청 (PPS) ───

/**
 * 조달청 AI 공공조달 최적화 기반 데이터
 * - 입찰 담합 탐지 및 조달 프로세스 효율화에 집중
 */
export const PPS_DATA = {
  name: '조달청',
  nameEn: 'Public Procurement Service',
  accentColor: 'text-emerald-400',
  borderColor: 'border-emerald-900/50',
  bgColor: 'bg-emerald-950/30',
  procurementMarket: 180,     // 조원 - 나라장터 기준 공공조달 시장 규모
  avgBidRate: 85,             // % - 평균 낙찰률 (예정가 대비)
  collusionCases: 75,         // 건/년 - 연간 담합 적발 건수 (공정위 협조)
  processTime: 45,            // 일 - 평균 조달 소요일 (공고~계약체결)
  currentWasteRate: 8,        // % - 비효율 및 과다지출 추정률
} as const;

/** 조달청 시뮬레이터 슬라이더 설정 */
export const PPS_SLIDERS: SliderConfig[] = [
  {
    label: '담합 탐지율',
    unit: '%',
    min: 40,
    max: 95,
    defaultValue: 40,
    step: 5,
    description: 'AI 패턴 분석 기반 담합·부정낙찰 탐지 정확도',
  },
  {
    label: '프로세스 단축률',
    unit: '%',
    min: 0,
    max: 60,
    defaultValue: 10,
    step: 5,
    description: '자동화 서류 검토·적정가 산정으로 조달 소요일 단축 비율',
  },
  {
    label: '비효율 절감률',
    unit: '%',
    min: 0,
    max: 50,
    defaultValue: 8,
    step: 2,
    description: 'AI 적정가 분석으로 예산 낭비 및 과다 지출 절감 비율',
  },
];

/** 조달청 데이터 출처 */
export const PPS_SOURCES = [
  '나라장터 공공조달 통계연보 2025',
  '공정거래위원회 입찰 담합 적발 현황',
  '조달청 디지털 조달 혁신 계획 (2024~2027)',
];

/** 조달청 시뮬레이터 주요 가정 */
export const PPS_ASSUMPTIONS = [
  '담합 탐지율 향상 시 조달시장의 최대 3% 비용 절감 효과 추정',
  '프로세스 단축 1일당 약 500억원 규모의 자금 회전 효과 적용',
  'AI 적정가 산정 도입 시 현행 낙찰률 85%에서 80%로 하향 가능',
  '비효율 절감은 전체 조달 시장 180조원 기준으로 환산',
];

// ─── 보건복지부 (MOHW) ───

/**
 * 보건복지부 AI 복지행정 효율화 기반 데이터
 * - 복지 사각지대 발굴 및 부정수급 탐지에 집중
 */
export const MOHW_DATA = {
  name: '보건복지부',
  nameEn: 'Ministry of Health and Welfare',
  accentColor: 'text-rose-400',
  borderColor: 'border-rose-900/50',
  bgColor: 'bg-rose-950/30',
  welfareRecipients: 240,     // 만명 - 기초생활수급자 (2025년 기준)
  blindSpotHouseholds: 93,    // 만가구 - 복지 사각지대 추정 가구
  welfareBudget: 110,         // 조원 - 보건복지 총 예산 (2026년)
  fraudAmount: 0.8,           // 조원 - 부정수급 추정 규모 (연간)
  counselingCases: 500,       // 만건/년 - 복지 상담 및 민원 건수
} as const;

/** 보건복지부 시뮬레이터 슬라이더 설정 */
export const MOHW_SLIDERS: SliderConfig[] = [
  {
    label: '사각지대 발굴률',
    unit: '%',
    min: 10,
    max: 80,
    defaultValue: 10,
    step: 5,
    description: 'AI 빅데이터 분석으로 복지 사각지대 가구를 발굴하는 비율',
  },
  {
    label: '부정수급 탐지율',
    unit: '%',
    min: 30,
    max: 90,
    defaultValue: 30,
    step: 5,
    description: '소득·재산·자격 이상 여부 AI 교차 검증으로 부정수급 차단율',
  },
  {
    label: '상담 자동화율',
    unit: '%',
    min: 0,
    max: 70,
    defaultValue: 15,
    step: 5,
    description: 'AI 챗봇·ARS를 통한 반복 민원 자동 처리 비율',
  },
];

/** 보건복지부 데이터 출처 */
export const MOHW_SOURCES = [
  '보건복지부 기초생활보장 수급자 현황 2025',
  '한국보건사회연구원 복지 사각지대 실태조사',
  '감사원 부정수급 적발 현황 및 개선 권고 (2024)',
];

/** 보건복지부 시뮬레이터 주요 가정 */
export const MOHW_ASSUMPTIONS = [
  '복지 사각지대 93만 가구에 월 평균 80만원 지원 시 연 약 8.9조원 추가 소요 추정',
  '부정수급 0.8조원 중 AI 탐지율 적용분만 실질 절감으로 계산',
  '상담 자동화 절감액은 복지 담당 공무원 3만명 × 연 6,000만원 인건비 기준',
  'AI 시스템 구축비(800억)와 개인정보 보호 관련 추가 비용 반영',
];

// ─── 국민건강보험공단 (NHIS) ───

/**
 * 국민건강보험공단 AI 의료비 심사 효율화 기반 데이터
 * - 부당 청구 탐지 및 심사 자동화에 집중
 */
export const NHIS_DATA = {
  name: '국민건강보험공단',
  nameEn: 'National Health Insurance Service',
  accentColor: 'text-green-400',
  borderColor: 'border-green-900/50',
  bgColor: 'bg-green-950/30',
  totalHealthSpending: 100,   // 조원 - 건강보험 총 지출 (2025년)
  fraudEstimate: 2.5,         // 조원 - 부당청구 추정 규모 (총 지출의 약 2.5%)
  annualReviewCases: 16,      // 억건 - 연간 건강보험 심사 청구 건수
  reviewStaff: 3200,          // 명 - 건강보험심사평가원 심사 인력
  currentErrorRate: 3.5,      // % - 현재 청구 오류·부당 청구 추정률
} as const;

/** 건보공단 시뮬레이터 슬라이더 설정 */
export const NHIS_SLIDERS: SliderConfig[] = [
  {
    label: '부당청구 탐지율',
    unit: '%',
    min: 40,
    max: 92,
    defaultValue: 40,
    step: 2,
    description: 'AI 패턴 분석으로 의료기관 부당·허위 청구를 탐지하는 비율',
  },
  {
    label: '자동 심사 처리율',
    unit: '%',
    min: 10,
    max: 85,
    defaultValue: 25,
    step: 5,
    description: '표준화 청구 건에 대한 AI 자동 승인·반려 처리 비율',
  },
  {
    label: '오류 청구 감소율',
    unit: '%',
    min: 0,
    max: 70,
    defaultValue: 10,
    step: 5,
    description: 'AI 사전 검증 고지로 의료기관의 청구 오류 스스로 감소 비율',
  },
];

/** 건보공단 데이터 출처 */
export const NHIS_SOURCES = [
  '건강보험심사평가원 진료비 심사 통계 2025',
  '국민건강보험공단 재정 현황 연보 2025',
  '감사원 건강보험 부당청구 관리 실태 점검 (2023)',
];

/** 건보공단 시뮬레이터 주요 가정 */
export const NHIS_ASSUMPTIONS = [
  '부당청구 추정 2.5조원에 탐지율을 적용해 환수 가능 금액 계산',
  '자동 심사 처리율 향상 시 심사 인력 3,200명 기준 인건비 절감 환산',
  '오류 청구 감소분은 재심사·처리 행정비용(건당 약 2만원) 절감으로 계산',
  '실제 환수율은 탐지액의 60~75% 수준으로 보수적 추정',
];

// ─── 국토교통부 (MOLIT) ───

/**
 * 국토교통부 AI 교통·인프라 효율화 기반 데이터
 * - 교통 혼잡비용 절감 및 스마트시티 확산에 집중
 */
export const MOLIT_DATA = {
  name: '국토교통부',
  nameEn: 'Ministry of Land, Infrastructure and Transport',
  accentColor: 'text-amber-400',
  borderColor: 'border-amber-900/50',
  bgColor: 'bg-amber-950/30',
  congestionCost: 67,         // 조원 - 연간 교통 혼잡비용 (한국교통연구원)
  publicTransitRate: 40,      // % - 전국 대중교통 이용률
  infraMaintenanceCost: 15,   // 조원 - 도로·교량 등 인프라 유지보수 예산
  smartCityCurrent: 8,        // 개 - 현재 스마트시티 지정 도시 수
  totalCities: 75,            // 개 - 전국 시 단위 이상 도시 수
} as const;

/** 국토교통부 시뮬레이터 슬라이더 설정 */
export const MOLIT_SLIDERS: SliderConfig[] = [
  {
    label: '교통 혼잡비용 절감률',
    unit: '%',
    min: 0,
    max: 30,
    defaultValue: 5,
    step: 1,
    description: 'AI 신호 최적화·수요 예측으로 연간 교통 혼잡비용 절감 비율',
  },
  {
    label: '대중교통 이용률 증가',
    unit: '%p',
    min: 0,
    max: 20,
    defaultValue: 2,
    step: 1,
    description: 'AI 수요 예측 기반 노선 최적화로 대중교통 이용률 상승 포인트',
  },
  {
    label: '스마트시티 확산 수',
    unit: '개',
    min: 8,
    max: 75,
    defaultValue: 8,
    step: 1,
    description: 'AI 도시 플랫폼 도입 도시 수 (현재 8개 → 최대 75개)',
  },
  {
    label: '인프라 유지보수 효율화',
    unit: '%',
    min: 0,
    max: 40,
    defaultValue: 5,
    step: 5,
    description: 'AI 예측 정비로 도로·교량 유지보수 비용 절감 비율',
  },
];

/** 국토교통부 데이터 출처 */
export const MOLIT_SOURCES = [
  '한국교통연구원 교통 혼잡비용 추정 연구 2024',
  '국토교통부 스마트시티 추진 현황 및 계획 (2025)',
  '한국도로공사 도로 유지관리 비용 분석 보고서',
];

/** 국토교통부 시뮬레이터 주요 가정 */
export const MOLIT_ASSUMPTIONS = [
  '혼잡비용 절감은 한국교통연구원 67조원 기준에 AI 최적화 효율을 곱해 산출',
  '대중교통 이용률 1%p 증가당 교통 혼잡비용 약 0.5조원 절감 효과 추정',
  '스마트시티 1개 추가 구축 시 평균 행정·교통 효율화로 약 200억원 절감 가정',
  '인프라 유지보수 효율화는 AI 예측 정비 도입 후 긴급 보수 비용 감소분 기준',
];

// ─── 교육부 (MOE) ───

/**
 * 교육부 AI 맞춤학습 지원 기반 데이터
 * - 학생별 맞춤학습, 교사 행정업무 자동화, 기초학력 향상에 집중
 */
export const MOE_DATA = {
  name: '교육부',
  nameEn: 'Ministry of Education',
  accentColor: 'text-violet-400',
  borderColor: 'border-violet-900/50',
  bgColor: 'bg-violet-950/30',
  totalStudents: 530,           // 만명 - 초중고 학생 수 (2025 교육통계연보)
  totalTeachers: 45,            // 만명 - 교원 수
  educationBudget: 96,          // 조원 - 교육예산 (지방교육재정교부금 포함, 2026)
  privateTutoringCost: 27.1,    // 조원 - 사교육비 총 규모 (2024 통계청)
  underperformingRate: 9.2,     // % - 기초학력 미달률 (중학교 수학, 국가수준 학업성취도 평가)
  teacherAdminRatio: 40,        // % - 교사 전체 업무시간 중 행정업무 비율
} as const;

/** 교육부 시뮬레이터 슬라이더 설정 */
export const MOE_SLIDERS: SliderConfig[] = [
  {
    label: 'AI 맞춤학습 적용률',
    unit: '%',
    min: 10,
    max: 90,
    defaultValue: 10,
    step: 5,
    description: '학교에서 AI 디지털교과서 기반 개인화 학습을 적용하는 비율',
  },
  {
    label: '교사 행정 자동화율',
    unit: '%',
    min: 10,
    max: 70,
    defaultValue: 15,
    step: 5,
    description: '성적처리·출결관리·생활기록부 등 행정업무의 AI 자동화 비율',
  },
  {
    label: '기초학력 미달 감소율',
    unit: '%',
    min: 0,
    max: 60,
    defaultValue: 0,
    step: 5,
    description: 'AI 보충학습으로 기초학력 미달 학생 비율 감소',
  },
];

/** 교육부 데이터 출처 */
export const MOE_SOURCES = [
  '교육부 교육통계연보 2025',
  '통계청 사교육비 조사 2024 (총 27.1조원)',
  '국가수준 학업성취도 평가 결과 (기초학력 미달률 9.2%)',
  '교육부 AI 디지털교과서 도입 계획 (2025~2028)',
];

/** 교육부 시뮬레이터 주요 가정 */
export const MOE_ASSUMPTIONS = [
  'AI 맞춤학습이 사교육 수요의 약 15%를 대체할 수 있다고 가정 (OECD AI in Education 보고서 참조)',
  '교사 행정 자동화 절감은 교원 45만명 × 행정비율 40% × 인건비 6,000만원/인 기준',
  '기초학력 미달 학생 1명당 장기 사회적 비용(생산성 손실) 연 500만원 추정',
  'AI 디지털교과서 구축비(3,000억)와 연간 운영비(500억)는 별도 비용으로 반영',
];

// ─── 법무부 (COURT) ───

/**
 * 법무부 AI 법률문서 분석 기반 데이터
 * - 판례 분석, 문서 자동화, 재판 기간 단축에 집중
 */
export const COURT_DATA = {
  name: '법무부',
  nameEn: 'Ministry of Justice',
  accentColor: 'text-sky-400',
  borderColor: 'border-sky-900/50',
  bgColor: 'bg-sky-950/30',
  annualCases: 680,             // 만건 - 연간 접수 사건 수 (2024 사법연감)
  judges: 3000,                 // 명 - 법관 수
  courtStaff: 17000,            // 명 - 법원 직원 수
  courtBudget: 2.5,             // 조원 - 법원 예산 (2026)
  avgTrialMonths: 8.4,          // 개월 - 1심 민사 평균 재판기간
  pendingCases: 95,             // 만건 - 미결 사건 수
} as const;

/** 법원 시뮬레이터 슬라이더 설정 */
export const COURT_SLIDERS: SliderConfig[] = [
  {
    label: '판례 분석 AI 정확도',
    unit: '%',
    min: 50,
    max: 95,
    defaultValue: 50,
    step: 5,
    description: 'AI 유사 판례 자동 추천 및 법률 쟁점 분석 정확도',
  },
  {
    label: '문서 작성 자동화율',
    unit: '%',
    min: 10,
    max: 70,
    defaultValue: 10,
    step: 5,
    description: '판결문 초안·법률문서·요약서 AI 자동 생성 비율',
  },
  {
    label: '재판 기간 단축률',
    unit: '%',
    min: 0,
    max: 40,
    defaultValue: 5,
    step: 5,
    description: 'AI 지원으로 평균 재판 소요기간 단축 비율',
  },
];

/** 법원 데이터 출처 */
export const COURT_SOURCES = [
  '사법연감 2024 (연간 접수 680만건, 법관 3,000명)',
  '법원행정처 사법부 예산안 2026',
  '대법원 사법정보화 추진 계획 (2024~2028)',
  '법무부 AI 법률서비스 접근성 향상 방안',
];

/** 법원 시뮬레이터 주요 가정 */
export const COURT_ASSUMPTIONS = [
  '판례 분석 정확도 향상분(기본 50% 대비)만큼 법관 연구시간 30% 절감 추정',
  '문서 자동화는 법원 직원 17,000명의 문서작업 비율 25% 기준, 인건비 5,000만원/인',
  '재판기간 1개월 단축당 건당 사회적 비용 약 50만원 절감 (법경제학 연구 참조)',
  'AI 법률 분석 시스템 구축비(500억)와 보안·개인정보 보호 비용 별도 반영',
];

// ─── 통합 참조 맵 ───

/** 부처 ID → 부처명 매핑 */
export const DEPARTMENT_NAME_MAP: Record<DepartmentId, string> = {
  nts:   NTS_DATA.name,
  pps:   PPS_DATA.name,
  mohw:  MOHW_DATA.name,
  nhis:  NHIS_DATA.name,
  molit: MOLIT_DATA.name,
  moe:   MOE_DATA.name,
  court: COURT_DATA.name,
};

/** 부처 ID → 강조색 매핑 */
export const DEPARTMENT_ACCENT_MAP: Record<DepartmentId, string> = {
  nts:   NTS_DATA.accentColor,
  pps:   PPS_DATA.accentColor,
  mohw:  MOHW_DATA.accentColor,
  nhis:  NHIS_DATA.accentColor,
  molit: MOLIT_DATA.accentColor,
  moe:   MOE_DATA.accentColor,
  court: COURT_DATA.accentColor,
};

/** 전체 부처 ID 목록 */
export const ALL_DEPARTMENT_IDS: DepartmentId[] = [
  'nts',
  'pps',
  'mohw',
  'nhis',
  'molit',
  'moe',
  'court',
];
