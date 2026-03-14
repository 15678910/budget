// ============================================================
// 공공부문 AI 활동 데이터 및 SDG 영향 분석
// 출처: 각 부처 AI 도입 현황, UN SDG 공식 색상
// ============================================================

// ─── Types ───

export type AIActivityType =
  | '도구/솔루션'
  | '교육/훈련'
  | '기술지원'
  | '연구'
  | '정책지원'
  | '인식제고'
  | '인프라';

export type AIActivityStatus = '도입완료' | '시범운영' | '확산중' | '계획중';

export interface AIActivity {
  id: string;
  department: string;
  departmentShort: string;
  title: string;
  description: string;
  annualSavings: number;     // 조원
  sdgGoals: number[];
  activityType: AIActivityType;
  status: AIActivityStatus;
  /** 지자체(광역·자치구)에서 적용 가능한 활동 여부 */
  localApplicable: boolean;
}

export interface SDGGoal {
  number: number;
  name: string;
  color: string;
}

// ─── SDG Definitions ───

export const SDG_GOALS: SDGGoal[] = [
  { number: 1,  name: '빈곤퇴치',       color: '#E5243B' },
  { number: 3,  name: '건강과 복지',     color: '#4C9F38' },
  { number: 4,  name: '양질의 교육',     color: '#C5192D' },
  { number: 8,  name: '양질의 일자리',   color: '#A21942' },
  { number: 9,  name: '산업혁신',        color: '#FD6925' },
  { number: 10, name: '불평등 감소',     color: '#DD1367' },
  { number: 11, name: '지속가능한 도시', color: '#FD9D24' },
  { number: 12, name: '책임있는 소비',   color: '#BF8B2E' },
  { number: 13, name: '기후행동',        color: '#3F7E44' },
  { number: 16, name: '평화, 정의',      color: '#00689D' },
];

export const SDG_COLOR_MAP: Record<number, string> = Object.fromEntries(
  SDG_GOALS.map(g => [g.number, g.color])
);

// ─── AI Activities Data ───

export const AI_ACTIVITIES: AIActivity[] = [
  {
    id: 'nts-tax-audit',
    department: '국세청',
    departmentShort: '국세청',
    title: 'AI 세무조사 자동화',
    description: '빅데이터·AI 기반 탈세 혐의 자동 탐지 및 세무조사 대상 선정. 과세 사각지대 해소와 세수 확보 효율화.',
    annualSavings: 2.1,
    sdgGoals: [16],
    activityType: '도구/솔루션',
    status: '확산중',
    localApplicable: false, // 국세 = 중앙정부 소관
  },
  {
    id: 'nhis-review',
    department: '국민건강보험공단',
    departmentShort: '건보공단',
    title: 'AI 의료비 심사',
    description: '의료비 청구 내역의 AI 자동 심사로 부당 청구 탐지 정확도 향상. 심사 인력 업무 부담 경감.',
    annualSavings: 0.8,
    sdgGoals: [3],
    activityType: '도구/솔루션',
    status: '시범운영',
    localApplicable: false, // 건보 심사 = 중앙기관 소관
  },
  {
    id: 'molit-urban',
    department: '국토교통부',
    departmentShort: '국토부',
    title: 'AI 도시계획·교통최적화',
    description: '도시 인프라 수요 예측 및 교통 흐름 최적화. 스마트시티 데이터 기반 도시계획 의사결정 지원.',
    annualSavings: 1.5,
    sdgGoals: [11],
    activityType: '기술지원',
    status: '시범운영',
    localApplicable: true, // 지자체 교통·도시계획 업무
  },
  {
    id: 'moel-matching',
    department: '고용노동부',
    departmentShort: '고용부',
    title: 'AI 일자리 매칭',
    description: '구직자 역량과 채용 공고의 AI 기반 정밀 매칭. 취업 소요 기간 단축 및 직무 적합도 향상.',
    annualSavings: 0.5,
    sdgGoals: [8],
    activityType: '도구/솔루션',
    status: '도입완료',
    localApplicable: true, // 지자체 고용센터·일자리 사업
  },
  {
    id: 'me-environment',
    department: '환경부',
    departmentShort: '환경부',
    title: 'AI 환경 모니터링',
    description: '대기·수질·토양 오염원 실시간 AI 감시. 이상 징후 조기 경보 및 환경 규제 집행 효율화.',
    annualSavings: 0.3,
    sdgGoals: [13],
    activityType: '인프라',
    status: '시범운영',
    localApplicable: true, // 지자체 환경 관리 업무
  },
  {
    id: 'moe-learning',
    department: '교육부',
    departmentShort: '교육부',
    title: 'AI 맞춤학습 지원',
    description: '학생별 학습 수준 진단 및 개인 맞춤형 학습 콘텐츠 추천. 교육 격차 해소 및 교사 업무 경감.',
    annualSavings: 0.7,
    sdgGoals: [4],
    activityType: '기술지원',
    status: '계획중',
    localApplicable: true, // 지방교육청 소관
  },
  {
    id: 'mohw-welfare',
    department: '보건복지부',
    departmentShort: '복지부',
    title: 'AI 복지상담·사각지대 발굴',
    description: '복지 수급 사각지대 자동 탐지 및 맞춤 복지 서비스 안내. 상담 챗봇으로 민원 처리 효율화.',
    annualSavings: 0.6,
    sdgGoals: [1, 3],
    activityType: '도구/솔루션',
    status: '시범운영',
    localApplicable: true, // 지자체 복지 업무 (읍면동 복지센터)
  },
  {
    id: 'court-legal',
    department: '법원·법무부',
    departmentShort: '법원',
    title: 'AI 법률문서 분석',
    description: '판례·법률 문서 AI 분석으로 재판 준비 시간 단축. 유사 판례 자동 검색 및 법률 서비스 접근성 향상.',
    annualSavings: 0.4,
    sdgGoals: [16],
    activityType: '연구',
    status: '시범운영',
    localApplicable: false, // 사법부 = 중앙 소관
  },
  {
    id: 'kipo-patent',
    department: '특허청',
    departmentShort: '특허청',
    title: 'AI 특허심사 자동화',
    description: '선행기술 자동 검색 및 특허 유사도 분석. 심사 기간 단축과 심사 품질 일관성 확보.',
    annualSavings: 0.2,
    sdgGoals: [9],
    activityType: '도구/솔루션',
    status: '도입완료',
    localApplicable: false, // 특허 = 중앙기관 소관
  },
  {
    id: 'npa-crime',
    department: '경찰청',
    departmentShort: '경찰청',
    title: 'AI 범죄예방 분석',
    description: '범죄 발생 패턴 분석 및 위험 지역 예측. 순찰 최적화와 112 신고 분류 자동화.',
    annualSavings: 0.3,
    sdgGoals: [16],
    activityType: '도구/솔루션',
    status: '시범운영',
    localApplicable: true, // 지방 경찰 치안 업무
  },
  {
    id: 'pps-procurement',
    department: '조달청',
    departmentShort: '조달청',
    title: 'AI 공공조달 최적화',
    description: '입찰 적정가 자동 산정 및 담합 탐지. 조달 프로세스 자동화로 비용 절감 및 투명성 강화.',
    annualSavings: 1.2,
    sdgGoals: [12],
    activityType: '도구/솔루션',
    status: '확산중',
    localApplicable: true, // 지자체 조달 업무
  },
  {
    id: 'kcs-customs',
    department: '관세청',
    departmentShort: '관세청',
    title: 'AI 통관 자동화',
    description: '수출입 통관 서류 자동 검증 및 위험 화물 선별. 통관 시간 단축과 밀수 탐지 정확도 향상.',
    annualSavings: 0.4,
    sdgGoals: [8],
    activityType: '도구/솔루션',
    status: '도입완료',
    localApplicable: false, // 관세 = 중앙기관 소관
  },
];

// ─── Constants ───

const PUBLIC_SECTOR_TOTAL = 1500; // 조원

// ─── Helper Functions ───

/** 활동 데이터 반환 */
export function getAIActivities(): AIActivity[] {
  return [...AI_ACTIVITIES];
}

/** 지자체 적용 가능 활동만 반환 */
export function getLocalApplicableActivities(): AIActivity[] {
  return AI_ACTIVITIES.filter(a => a.localApplicable);
}

/** 고유 부처 목록 */
export function getUniqueDepartments(): string[] {
  return [...new Set(AI_ACTIVITIES.map(a => a.departmentShort))].sort();
}

/** 활동에 사용된 고유 SDG 번호 */
export function getUniqueSDGNumbers(): number[] {
  return [...new Set(AI_ACTIVITIES.flatMap(a => a.sdgGoals))].sort((a, b) => a - b);
}

/** 고유 활동 유형 */
export function getUniqueActivityTypes(): AIActivityType[] {
  return [...new Set(AI_ACTIVITIES.map(a => a.activityType))];
}

/** 선택된 활동의 총 절감액 (조원) */
export function calculateTotalSavings(selectedIds: string[]): number {
  const idSet = new Set(selectedIds);
  return AI_ACTIVITIES
    .filter(a => idSet.has(a.id))
    .reduce((sum, a) => sum + a.annualSavings, 0);
}

/** 총 절감액 → 효율화율(%) 변환 */
export function savingsToEfficiencyRate(totalSavings: number): number {
  return (totalSavings / PUBLIC_SECTOR_TOTAL) * 100;
}

/** SDG 번호 → 색상 */
export function getSDGColor(sdgNumber: number): string {
  return SDG_COLOR_MAP[sdgNumber] ?? '#6b7280';
}

/** SDG 번호 → 이름 */
export function getSDGName(sdgNumber: number): string {
  return SDG_GOALS.find(g => g.number === sdgNumber)?.name ?? `SDG ${sdgNumber}`;
}

// ─── SDG Impact Calculation ───

/** 월 기본소득(만원) → SDG별 영향 점수 (0~100) */
export function calculateSDGImpactScore(sdgNumber: number, monthlyIncome: number): number {
  const income = Math.max(0, monthlyIncome);
  let score = 0;
  switch (sdgNumber) {
    case 1:  score = income * 3;       break; // 빈곤퇴치: 가장 민감
    case 3:  score = 20 + income * 1.5; break; // 건강복지
    case 4:  score = 15 + income * 1.2; break; // 양질교육
    case 8:  score = 10 + income * 0.8; break; // 경제성장
    case 9:  score = 5 + income * 0.6;  break; // 산업혁신
    case 10: score = income * 2.5;      break; // 불평등감소: 매우 민감
    case 16: score = 10 + income * 1.0; break; // 평화정의
    default: score = income * 0.5;
  }
  return Math.min(100, Math.round(score));
}

/** SDG별 영향 설명 생성 */
export function getSDGImpactDescription(sdgNumber: number, monthlyIncome: number): string {
  const income = Math.round(monthlyIncome);
  if (income <= 0) return '기본소득 없음';
  switch (sdgNumber) {
    case 1:  return `월 ${income}만원으로 기초생활 안정, 빈곤층 소득 보전 효과`;
    case 3:  return `의료비 부담 경감, 예방 의료 접근성 향상`;
    case 4:  return `교육비 부담 완화, 평생학습 기회 확대`;
    case 8:  return `소비 진작을 통한 내수 경제 활성화`;
    case 9:  return `AI 기술 도입 확산, 디지털 전환 가속`;
    case 10: return `소득 하위계층 생활수준 향상, 격차 완화`;
    case 16: return `공공 서비스 디지털화, 행정 투명성 강화`;
    default: return `SDG ${sdgNumber} 관련 간접 영향`;
  }
}

// ─── Summary Statistics ───

/** 기초생활수급 탈출 가구 수 (만 가구) */
export function calculatePovertyEscapeHouseholds(monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  // 약 200만 기초생활수급 가구 중 소득 보전 비율
  const ratio = Math.min(1, monthlyIncome / 160);
  return Math.round(200 * ratio);
}

/** 지니계수 개선폭 (포인트) */
export function calculateGiniImprovement(monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  // 만원당 약 0.0003포인트 개선, 최대 3포인트
  return Math.min(3, parseFloat((monthlyIncome * 0.0003).toFixed(3)));
}

/** 1인당 연간 교육비 부담 경감액 (만원) */
export function calculateEducationBurdenRelief(monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  // 연 기본소득의 35%가 교육비에 활용된다고 가정
  return Math.round(monthlyIncome * 12 * 0.35);
}
