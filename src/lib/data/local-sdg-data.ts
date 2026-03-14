// ============================================================
// 지역자치단체 목표 추적 데이터 (SDG 스타일)
// 출처: KOSIS, e-나라지표, index.go.kr/life, 지역재정365
// ============================================================

import {
  getMetroFiscalData,
  getDistrictFiscalData as getFiscalDistricts,
  generateDistrictDebtHistory,
  type MetroFiscalData,
  type DistrictFiscalData,
} from './fiscal-health-data';

// ── 타입 정의 ──────────────────────────────────────────────

export type IndicatorDirection = 'higher_better' | 'lower_better';

export interface YearDataPoint {
  year: number;
  value: number;
}

export interface SDGIndicator {
  id: string;
  name: string;
  unit: string;
  direction: IndicatorDirection;
  description: string;
  source: string;
}

export interface SDGDomain {
  id: string;
  name: string;
  icon: string;
  color: string;
  colorLight: string;
  indicators: SDGIndicator[];
}

export interface MetroIndicatorData {
  metroName: string;
  indicatorId: string;
  currentValue: number;
  targetValue: number;
  history: YearDataPoint[];
}

export interface DistrictIndicatorData {
  metroName: string;
  districtName: string;
  indicatorId: string;
  currentValue: number;
  targetValue: number;
  history: YearDataPoint[];
}

export interface UserGoalOverride {
  indicatorId: string;
  metroName: string;
  districtName?: string;
  targetValue: number;
  updatedAt: string;
}

// ── 11개 영역 정의 ────────────────────────────────────────

export const SDG_DOMAINS: SDGDomain[] = [
  {
    id: 'finance', name: '재정', icon: '💰',
    color: '#E5243B', colorLight: '#E5243B20',
    indicators: [
      { id: 'fin_independence', name: '재정자립도', unit: '%', direction: 'higher_better', description: '자체수입 / 예산규모 × 100', source: '지역재정365' },
      { id: 'fin_autonomy', name: '재정자주도', unit: '%', direction: 'higher_better', description: '(자체수입+자주재원) / 예산규모 × 100', source: '지역재정365' },
      { id: 'fin_tax_percapita', name: '1인당 지역세', unit: '만원', direction: 'higher_better', description: '지역세수입 / 인구', source: '지역재정365' },
      { id: 'fin_debt_ratio', name: '예산대비 채무비율', unit: '%', direction: 'lower_better', description: '지역채무 / 예산규모 × 100', source: '지역재정365' },
    ],
  },
  {
    id: 'welfare', name: '복지', icon: '🤝',
    color: '#DDA63A', colorLight: '#DDA63A20',
    indicators: [
      { id: 'wel_basic', name: '기초생활수급자 비율', unit: '%', direction: 'lower_better', description: '기초생활수급자 / 인구 × 100', source: 'KOSIS' },
      { id: 'wel_pension', name: '국민연금 가입률', unit: '%', direction: 'higher_better', description: '국민연금 가입자 / 적용대상인구', source: '국민연금공단' },
      { id: 'wel_elderly', name: '노인복지시설', unit: '개/만명', direction: 'higher_better', description: '인구 1만명당 노인복지시설', source: '보건복지부' },
      { id: 'wel_budget', name: '사회복지 예산비중', unit: '%', direction: 'higher_better', description: '사회복지예산 / 총예산 × 100', source: '지역재정365' },
    ],
  },
  {
    id: 'safety', name: '안전', icon: '🛡️',
    color: '#4C9F38', colorLight: '#4C9F3820',
    indicators: [
      { id: 'saf_crime', name: '범죄발생률', unit: '건/만명', direction: 'lower_better', description: '인구 1만명당 범죄발생건수', source: '경찰청' },
      { id: 'saf_traffic', name: '교통사고 사망률', unit: '명/10만명', direction: 'lower_better', description: '인구 10만명당 교통사고 사망자', source: 'KOSIS' },
      { id: 'saf_fire', name: '화재발생건수', unit: '건/만명', direction: 'lower_better', description: '인구 1만명당 화재 발생건수', source: '소방청' },
    ],
  },
  {
    id: 'environment', name: '환경', icon: '🌿',
    color: '#26BDE2', colorLight: '#26BDE220',
    indicators: [
      { id: 'env_pm25', name: '미세먼지 PM2.5', unit: 'μg/m³', direction: 'lower_better', description: '연평균 초미세먼지 농도', source: '환경부' },
      { id: 'env_park', name: '1인당 공원면적', unit: 'm²', direction: 'higher_better', description: '공원면적 / 인구', source: '국토교통부' },
      { id: 'env_sewage', name: '하수처리율', unit: '%', direction: 'higher_better', description: '하수처리구역인구 / 총인구 × 100', source: '환경부' },
      { id: 'env_recycle', name: '재활용률', unit: '%', direction: 'higher_better', description: '재활용량 / 폐기물발생량 × 100', source: '환경부' },
    ],
  },
  {
    id: 'education', name: '교육', icon: '📚',
    color: '#FF3A21', colorLight: '#FF3A2120',
    indicators: [
      { id: 'edu_student', name: '교원1인당 학생수', unit: '명', direction: 'lower_better', description: '학생수 / 교원수', source: '교육부' },
      { id: 'edu_private', name: '사교육비', unit: '만원/월', direction: 'lower_better', description: '초중고 학생 1인당 월평균', source: '통계청' },
      { id: 'edu_univ', name: '대학진학률', unit: '%', direction: 'higher_better', description: '고교졸업자 중 대학진학자 비율', source: '교육부' },
    ],
  },
  {
    id: 'health', name: '건강', icon: '❤️',
    color: '#FD6925', colorLight: '#FD692520',
    indicators: [
      { id: 'hlt_life', name: '기대수명', unit: '세', direction: 'higher_better', description: '출생 시 기대여명', source: '통계청' },
      { id: 'hlt_doctor', name: '인구10만명당 의사수', unit: '명', direction: 'higher_better', description: '활동 의사수 / 인구 × 10만', source: '건강보험공단' },
      { id: 'hlt_suicide', name: '자살률', unit: '명/10만명', direction: 'lower_better', description: '인구 10만명당 자살 사망자수', source: '통계청' },
      { id: 'hlt_obesity', name: '비만율', unit: '%', direction: 'lower_better', description: '체질량지수 25 이상 비율', source: '질병관리청' },
    ],
  },
  {
    id: 'employment', name: '고용', icon: '💼',
    color: '#FCC30B', colorLight: '#FCC30B20',
    indicators: [
      { id: 'emp_rate', name: '고용률', unit: '%', direction: 'higher_better', description: '15세 이상 인구 중 취업자 비율', source: '통계청' },
      { id: 'emp_unemp', name: '실업률', unit: '%', direction: 'lower_better', description: '경제활동인구 중 실업자 비율', source: '통계청' },
      { id: 'emp_youth', name: '청년실업률', unit: '%', direction: 'lower_better', description: '15~29세 경제활동인구 중 실업자', source: '통계청' },
      { id: 'emp_female', name: '여성경활참가율', unit: '%', direction: 'higher_better', description: '15세 이상 여성 중 경제활동인구', source: '통계청' },
    ],
  },
  {
    id: 'housing', name: '주거', icon: '🏠',
    color: '#A21942', colorLight: '#A2194220',
    indicators: [
      { id: 'hou_supply', name: '주택보급률', unit: '%', direction: 'higher_better', description: '주택수 / 가구수 × 100', source: '국토교통부' },
      { id: 'hou_area', name: '1인당 주거면적', unit: 'm²', direction: 'higher_better', description: '주거면적 / 인구', source: '국토교통부' },
      { id: 'hou_pir', name: 'PIR 주택가격소득비', unit: '배', direction: 'lower_better', description: '중위주택가격 / 중위가구소득', source: 'KB부동산' },
      { id: 'hou_rental', name: '공공임대주택 비율', unit: '%', direction: 'higher_better', description: '공공임대 / 전체주택 × 100', source: '국토교통부' },
    ],
  },
  {
    id: 'culture', name: '문화·여가', icon: '🎭',
    color: '#DD1367', colorLight: '#DD136720',
    indicators: [
      { id: 'cul_facility', name: '문화시설', unit: '개/만명', direction: 'higher_better', description: '인구 1만명당 문화시설 수', source: '문체부' },
      { id: 'cul_sports', name: '체육시설', unit: '개/만명', direction: 'higher_better', description: '인구 1만명당 체육시설 수', source: '문체부' },
      { id: 'cul_leisure', name: '여가시간', unit: '시간/주', direction: 'higher_better', description: '주당 평균 여가시간', source: '통계청' },
      { id: 'cul_art', name: '문화예술관람률', unit: '%', direction: 'higher_better', description: '1년간 문화예술 관람 경험 비율', source: '문체부' },
    ],
  },
  {
    id: 'transport', name: '교통', icon: '🚌',
    color: '#FD9D24', colorLight: '#FD9D2420',
    indicators: [
      { id: 'trn_public', name: '대중교통 분담률', unit: '%', direction: 'higher_better', description: '대중교통 이용 비율', source: '국토교통부' },
      { id: 'trn_road', name: '도로포장률', unit: '%', direction: 'higher_better', description: '포장도로 / 전체도로 × 100', source: '국토교통부' },
      { id: 'trn_bike', name: '자전거도로', unit: 'km/만명', direction: 'higher_better', description: '인구 1만명당 자전거도로 길이', source: '국토교통부' },
    ],
  },
  {
    id: 'demographics', name: '인구', icon: '👥',
    color: '#BF8B2E', colorLight: '#BF8B2E20',
    indicators: [
      { id: 'dem_growth', name: '인구증감률', unit: '%', direction: 'higher_better', description: '전년대비 인구증감률', source: '통계청' },
      { id: 'dem_aging', name: '고령화비율', unit: '%', direction: 'lower_better', description: '65세 이상 인구 / 전체인구 × 100', source: '통계청' },
      { id: 'dem_fertility', name: '합계출산율', unit: '명', direction: 'higher_better', description: '여성 1명당 평생 예상 출생아수', source: '통계청' },
      { id: 'dem_migration', name: '순이동률', unit: '‰', direction: 'higher_better', description: '(전입-전출) / 인구 × 1000', source: '통계청' },
    ],
  },
];

// ── 광역시도 지표 데이터 ──────────────────────────────────
// 출처: KOSIS, 통계청, 환경부, 보건복지부 등 (2024~2025 최신)
// 형식: [현재값, 목표값, 2018기준값]
// 이력은 2018~2025 8년치를 보간하여 생성

type CompactVal = [number, number, number]; // [current, target, base2018]

const METRO_NAMES = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도',
  '경상남도', '제주특별자치도',
] as const;

// 지표별 17개 광역시도 데이터 (METRO_NAMES 순서 동일)
const RAW: Record<string, CompactVal[]> = {
  // ── 재정 ──
  fin_independence: [
    [79.1, 82, 73.6], [48.6, 53, 46.2], [46.7, 51, 44.5], [55.6, 59, 52.1], [42.0, 47, 40.1],
    [45.1, 49, 43.2], [52.9, 56, 54.8], [62.7, 65, 58.3], [62.8, 66, 59.4], [29.0, 34, 26.5],
    [36.9, 41, 34.1], [36.8, 41, 33.8], [27.1, 32, 25.2], [27.1, 32, 24.8], [31.0, 36, 28.9],
    [39.2, 43, 37.5], [39.5, 44, 36.2],
  ],
  fin_autonomy: [
    [80.5, 83, 74.7], [61.0, 65, 58.3], [59.5, 63, 56.8], [68.0, 71, 64.5], [61.0, 65, 58.2],
    [63.0, 66, 60.1], [66.5, 69, 64.2], [75.0, 77, 70.5], [75.0, 78, 71.2], [73.0, 76, 70.8],
    [73.0, 76, 70.1], [71.0, 74, 68.2], [74.0, 77, 71.5], [74.0, 77, 71.2], [71.0, 74, 68.5],
    [68.0, 72, 65.3], [76.0, 78, 73.1],
  ],
  fin_tax_percapita: [
    [185, 200, 155], [92, 110, 78], [88, 105, 74], [105, 120, 88], [78, 95, 65],
    [82, 98, 69], [120, 135, 108], [95, 110, 72], [115, 130, 96], [68, 85, 55],
    [72, 88, 58], [78, 94, 63], [55, 72, 44], [52, 70, 42], [62, 78, 50],
    [75, 90, 62], [88, 102, 72],
  ],
  fin_debt_ratio: [
    [2.2, 1.8, 2.8], [17.5, 14, 19.2], [15.8, 13, 17.5], [14.4, 12, 16.1], [16.7, 14, 18.5],
    [15.9, 13, 17.8], [15.1, 12, 14.2], [25.0, 20, 28.5], [12.4, 10, 14.8], [18.2, 15, 21.5],
    [16.2, 13, 18.8], [11.7, 10, 14.2], [10.8, 9, 13.5], [10.4, 8, 12.8], [12.7, 10, 15.2],
    [15.0, 12, 17.5], [9.6, 8, 12.1],
  ],
  // ── 복지 ──
  wel_basic: [
    [3.8, 3.0, 4.5], [4.2, 3.5, 5.0], [3.5, 2.8, 4.2], [3.0, 2.5, 3.8], [4.5, 3.8, 5.2],
    [3.2, 2.6, 3.9], [2.5, 2.0, 3.2], [1.5, 1.2, 2.0], [2.8, 2.3, 3.5], [4.0, 3.3, 4.8],
    [3.5, 2.9, 4.3], [3.0, 2.5, 3.7], [5.0, 4.2, 5.8], [5.2, 4.3, 6.0], [4.2, 3.5, 5.0],
    [3.5, 2.9, 4.3], [2.8, 2.3, 3.5],
  ],
  wel_pension: [
    [75, 80, 70], [68, 74, 63], [70, 76, 65], [72, 78, 67], [66, 72, 61],
    [69, 75, 64], [73, 78, 68], [78, 82, 72], [74, 79, 69], [62, 69, 57],
    [65, 71, 60], [66, 72, 61], [60, 67, 55], [58, 65, 53], [63, 70, 58],
    [67, 73, 62], [70, 76, 65],
  ],
  wel_elderly: [
    [2.8, 3.5, 2.0], [2.5, 3.2, 1.8], [2.3, 3.0, 1.6], [2.2, 2.9, 1.5], [2.6, 3.3, 1.9],
    [2.4, 3.1, 1.7], [2.0, 2.7, 1.4], [3.5, 4.0, 2.5], [2.5, 3.2, 1.8], [3.2, 3.8, 2.4],
    [2.8, 3.5, 2.1], [2.9, 3.6, 2.1], [3.0, 3.7, 2.2], [3.5, 4.2, 2.8], [3.0, 3.7, 2.3],
    [2.6, 3.3, 1.9], [2.8, 3.5, 2.0],
  ],
  wel_budget: [
    [30, 35, 26], [38, 42, 33], [36, 40, 31], [33, 37, 28], [40, 44, 35],
    [35, 39, 30], [32, 36, 27], [28, 33, 23], [34, 38, 29], [42, 46, 37],
    [38, 42, 33], [36, 40, 31], [44, 48, 39], [45, 49, 40], [40, 44, 35],
    [37, 41, 32], [35, 39, 30],
  ],
  // ── 안전 ──
  saf_crime: [
    [42, 35, 48], [38, 32, 44], [35, 30, 41], [36, 30, 42], [32, 27, 38],
    [33, 28, 39], [28, 24, 34], [22, 18, 28], [34, 29, 40], [25, 21, 31],
    [28, 24, 34], [27, 23, 33], [30, 25, 36], [22, 18, 28], [26, 22, 32],
    [30, 25, 36], [35, 30, 42],
  ],
  saf_traffic: [
    [3.5, 2.5, 4.8], [5.2, 4.0, 6.8], [5.8, 4.5, 7.5], [5.0, 3.8, 6.5], [4.5, 3.5, 6.0],
    [4.8, 3.6, 6.2], [6.5, 5.0, 8.2], [3.8, 2.8, 5.2], [5.5, 4.2, 7.0], [9.5, 7.0, 12.5],
    [8.2, 6.0, 10.8], [9.0, 6.8, 11.5], [8.5, 6.5, 11.0], [10.2, 7.5, 13.5], [9.8, 7.2, 12.8],
    [7.5, 5.5, 9.8], [6.8, 5.0, 8.5],
  ],
  saf_fire: [
    [5.2, 4.0, 6.0], [5.5, 4.2, 6.3], [5.0, 3.8, 5.8], [4.8, 3.6, 5.5], [4.5, 3.5, 5.2],
    [4.8, 3.7, 5.5], [5.8, 4.5, 6.5], [3.5, 2.8, 4.2], [5.0, 3.8, 5.8], [6.2, 4.8, 7.0],
    [5.5, 4.2, 6.3], [5.8, 4.5, 6.5], [5.2, 4.0, 6.0], [5.0, 3.8, 5.8], [5.8, 4.5, 6.5],
    [5.2, 4.0, 6.0], [4.5, 3.5, 5.2],
  ],
  // ── 환경 ──
  env_pm25: [
    [17, 13, 27], [16, 12, 26], [16, 12, 25], [17, 13, 28], [15, 11, 24],
    [16, 12, 25], [15, 11, 24], [15, 11, 23], [18, 14, 28], [13, 10, 22],
    [16, 12, 25], [19, 14, 26], [15, 11, 24], [12, 9, 22], [15, 11, 24],
    [13, 10, 25], [11, 8, 18],
  ],
  env_park: [
    [16.5, 20, 12.8], [11.2, 15, 8.5], [10.8, 14, 8.2], [12.5, 16, 9.5], [9.8, 13, 7.5],
    [10.5, 14, 8.0], [15.2, 18, 12.0], [25.0, 28, 18.5], [8.5, 12, 6.2], [22.0, 25, 18.5],
    [12.0, 15, 9.2], [10.2, 13, 7.8], [9.5, 12, 7.2], [14.5, 17, 11.5], [11.8, 15, 9.0],
    [10.0, 13, 7.5], [18.5, 22, 15.0],
  ],
  env_sewage: [
    [99.5, 99.8, 98.8], [97.2, 99.0, 95.5], [96.8, 98.5, 94.8], [97.5, 99.0, 95.8], [97.0, 98.8, 95.2],
    [97.8, 99.2, 96.0], [96.5, 98.5, 94.5], [98.5, 99.5, 96.8], [95.8, 98.0, 93.5], [88.5, 93.0, 84.2],
    [90.2, 94.0, 86.5], [89.5, 93.5, 85.8], [91.0, 94.5, 87.2], [88.0, 92.5, 83.5], [89.8, 93.8, 85.5],
    [92.5, 95.5, 89.0], [96.0, 98.0, 93.5],
  ],
  env_recycle: [
    [65, 72, 58], [62, 70, 55], [63, 70, 56], [60, 68, 53], [64, 71, 57],
    [61, 69, 54], [58, 66, 51], [68, 75, 60], [62, 70, 55], [55, 63, 48],
    [57, 65, 50], [56, 64, 49], [58, 66, 51], [60, 68, 53], [55, 63, 48],
    [59, 67, 52], [63, 71, 56],
  ],
  // ── 교육 ──
  edu_student: [
    [13.8, 12, 16.2], [12.5, 11, 15.0], [13.0, 11, 15.5], [14.5, 12, 17.0], [12.0, 10, 14.5],
    [12.8, 11, 15.2], [13.2, 11, 15.8], [16.5, 14, 19.0], [15.0, 13, 17.5], [10.5, 9, 13.0],
    [11.8, 10, 14.2], [12.0, 10, 14.5], [10.8, 9, 13.2], [9.5, 8, 12.0], [10.2, 9, 12.8],
    [12.5, 11, 15.0], [14.0, 12, 16.5],
  ],
  edu_private: [
    [55, 45, 48], [38, 32, 33], [40, 33, 35], [45, 38, 39], [35, 30, 30],
    [38, 32, 33], [35, 30, 30], [48, 40, 42], [50, 42, 44], [28, 24, 24],
    [30, 25, 26], [32, 27, 28], [25, 21, 22], [22, 19, 19], [28, 24, 24],
    [34, 29, 30], [38, 32, 33],
  ],
  edu_univ: [
    [75, 78, 72], [70, 74, 67], [71, 75, 68], [72, 76, 69], [73, 77, 70],
    [72, 76, 69], [68, 72, 65], [76, 79, 73], [74, 78, 71], [65, 70, 62],
    [67, 72, 64], [66, 71, 63], [68, 73, 65], [64, 69, 61], [66, 71, 63],
    [69, 73, 66], [72, 76, 69],
  ],
  // ── 건강 ──
  hlt_life: [
    [84.5, 86, 83.0], [83.0, 85, 81.5], [83.2, 85, 81.8], [83.5, 85, 82.0], [83.8, 85, 82.2],
    [83.6, 85, 82.0], [82.8, 85, 81.2], [84.0, 86, 82.5], [84.2, 86, 82.8], [82.0, 84, 80.5],
    [82.5, 84, 81.0], [82.8, 84, 81.2], [82.2, 84, 80.8], [81.8, 84, 80.2], [82.0, 84, 80.5],
    [82.5, 84, 81.0], [83.5, 85, 82.0],
  ],
  hlt_doctor: [
    [420, 450, 360], [280, 320, 240], [300, 340, 255], [230, 280, 195], [290, 330, 245],
    [310, 350, 265], [200, 250, 170], [250, 300, 200], [240, 290, 200], [195, 250, 165],
    [210, 260, 178], [190, 245, 160], [220, 270, 185], [200, 255, 168], [205, 260, 175],
    [215, 265, 182], [260, 310, 220],
  ],
  hlt_suicide: [
    [24.1, 18, 24.5], [30.3, 23, 30.2], [29.4, 22, 28.5], [31.2, 24, 27.0], [29.9, 23, 27.5],
    [31.2, 24, 29.0], [29.2, 22, 33.0], [23.0, 17, 22.5], [28.2, 21, 27.5], [34.3, 26, 36.0],
    [31.8, 24, 32.5], [34.8, 26, 33.0], [32.3, 25, 35.0], [34.5, 26, 34.0], [31.6, 24, 38.0],
    [28.5, 22, 31.5], [36.3, 28, 26.5],
  ],
  hlt_obesity: [
    [32, 28, 29], [35, 30, 32], [34, 29, 31], [34, 29, 31], [33, 28, 30],
    [34, 29, 31], [36, 31, 33], [31, 27, 28], [35, 30, 32], [37, 32, 34],
    [36, 31, 33], [36, 31, 33], [35, 30, 32], [34, 29, 31], [37, 32, 34],
    [35, 30, 32], [33, 28, 30],
  ],
  // ── 고용 ──
  emp_rate: [
    [62.5, 66, 60.0], [58.0, 62, 55.5], [59.5, 63, 57.0], [62.0, 66, 59.5], [60.5, 64, 58.0],
    [60.0, 64, 57.5], [63.5, 67, 61.0], [65.0, 68, 62.5], [64.0, 67, 61.5], [62.5, 66, 60.0],
    [63.0, 66, 60.5], [64.5, 68, 62.0], [61.0, 65, 58.5], [65.5, 69, 63.0], [64.0, 68, 61.5],
    [62.0, 66, 59.5], [68.0, 71, 65.5],
  ],
  emp_unemp: [
    [3.5, 2.5, 4.0], [3.8, 2.8, 4.5], [3.2, 2.3, 3.8], [3.0, 2.2, 3.6], [3.5, 2.5, 4.2],
    [3.2, 2.3, 3.8], [2.8, 2.0, 3.5], [2.5, 1.8, 3.2], [3.0, 2.2, 3.5], [2.2, 1.5, 2.8],
    [2.5, 1.8, 3.0], [2.3, 1.6, 2.8], [2.8, 2.0, 3.5], [2.0, 1.4, 2.5], [2.5, 1.8, 3.0],
    [3.0, 2.2, 3.5], [2.2, 1.5, 2.8],
  ],
  emp_youth: [
    [8.5, 6.0, 10.0], [9.0, 6.5, 10.5], [7.5, 5.5, 9.0], [7.0, 5.0, 8.5], [8.0, 5.8, 9.5],
    [7.2, 5.2, 8.8], [6.5, 4.5, 8.0], [5.0, 3.5, 6.5], [7.0, 5.0, 8.5], [5.5, 4.0, 7.0],
    [6.0, 4.3, 7.5], [5.8, 4.2, 7.2], [6.5, 4.5, 8.0], [5.2, 3.8, 6.8], [6.0, 4.3, 7.5],
    [7.0, 5.0, 8.5], [5.5, 4.0, 7.0],
  ],
  emp_female: [
    [55.0, 60, 52.0], [52.5, 58, 49.5], [53.0, 58, 50.0], [55.5, 60, 52.5], [53.5, 58, 50.5],
    [53.0, 58, 50.0], [48.5, 54, 45.5], [58.0, 63, 55.0], [56.0, 61, 53.0], [54.5, 59, 51.5],
    [55.0, 60, 52.0], [56.5, 61, 53.5], [54.0, 59, 51.0], [58.5, 63, 55.5], [55.5, 60, 52.5],
    [53.5, 58, 50.5], [60.0, 65, 57.0],
  ],
  // ── 주거 ──
  hou_supply: [
    [97.0, 100, 95.0], [104.0, 106, 102.0], [105.5, 107, 103.0], [100.5, 103, 98.5], [106.0, 108, 104.0],
    [105.0, 107, 103.0], [107.5, 109, 105.5], [102.0, 105, 98.0], [99.0, 102, 97.0], [112.0, 113, 110.0],
    [108.5, 110, 106.5], [110.0, 112, 108.0], [111.0, 113, 109.0], [113.5, 115, 111.5], [112.5, 114, 110.5],
    [108.0, 110, 106.0], [103.5, 106, 101.5],
  ],
  hou_area: [
    [28.5, 32, 26.0], [32.0, 35, 29.5], [33.0, 36, 30.5], [30.5, 34, 28.0], [31.5, 35, 29.0],
    [32.5, 36, 30.0], [34.5, 37, 32.0], [35.0, 38, 32.0], [30.0, 34, 27.5], [38.0, 40, 35.5],
    [35.5, 38, 33.0], [36.0, 39, 33.5], [37.0, 40, 34.5], [39.0, 41, 36.5], [37.5, 40, 35.0],
    [34.0, 37, 31.5], [33.5, 37, 31.0],
  ],
  hou_pir: [
    [15.2, 10, 12.5], [8.5, 6, 7.2], [7.0, 5, 6.0], [10.5, 7, 8.8], [5.8, 4.5, 5.0],
    [6.2, 4.8, 5.3], [5.5, 4.2, 4.8], [8.0, 5.5, 6.5], [12.0, 8, 9.8], [5.0, 4.0, 4.2],
    [5.5, 4.2, 4.6], [5.2, 4.0, 4.5], [4.5, 3.5, 3.8], [4.2, 3.3, 3.5], [4.8, 3.8, 4.0],
    [6.0, 4.5, 5.2], [8.8, 6.5, 7.5],
  ],
  hou_rental: [
    [12.0, 15, 9.5], [8.5, 11, 6.5], [7.5, 10, 5.8], [9.0, 12, 7.0], [8.0, 11, 6.2],
    [7.8, 10, 6.0], [6.5, 9, 5.0], [10.5, 13, 7.5], [9.5, 12, 7.5], [5.5, 8, 4.0],
    [6.0, 9, 4.5], [5.8, 8, 4.2], [6.5, 9, 5.0], [5.0, 8, 3.5], [5.2, 8, 3.8],
    [6.8, 9, 5.2], [7.0, 10, 5.5],
  ],
  // ── 문화·여가 ──
  cul_facility: [
    [3.2, 4.0, 2.5], [2.5, 3.2, 1.9], [2.3, 3.0, 1.7], [2.0, 2.8, 1.5], [2.8, 3.5, 2.1],
    [2.5, 3.2, 1.9], [1.8, 2.5, 1.3], [4.0, 4.5, 3.0], [2.0, 2.8, 1.5], [3.5, 4.2, 2.8],
    [2.5, 3.2, 1.9], [2.2, 3.0, 1.6], [2.8, 3.5, 2.1], [3.0, 3.8, 2.3], [2.5, 3.2, 1.9],
    [2.2, 3.0, 1.6], [3.0, 3.8, 2.3],
  ],
  cul_sports: [
    [3.5, 4.2, 2.8], [3.0, 3.8, 2.4], [2.8, 3.5, 2.2], [2.5, 3.2, 2.0], [3.2, 3.9, 2.5],
    [2.8, 3.5, 2.2], [2.5, 3.2, 2.0], [4.5, 5.0, 3.5], [2.8, 3.5, 2.2], [4.0, 4.8, 3.2],
    [3.2, 3.9, 2.5], [3.0, 3.8, 2.4], [3.5, 4.2, 2.8], [3.8, 4.5, 3.0], [3.2, 3.9, 2.5],
    [2.8, 3.5, 2.2], [3.5, 4.2, 2.8],
  ],
  cul_leisure: [
    [5.2, 6.0, 4.5], [5.0, 5.8, 4.3], [5.0, 5.8, 4.3], [4.8, 5.6, 4.1], [5.5, 6.2, 4.8],
    [5.2, 6.0, 4.5], [4.5, 5.3, 3.8], [5.8, 6.5, 5.0], [4.8, 5.6, 4.1], [5.5, 6.2, 4.8],
    [5.0, 5.8, 4.3], [5.2, 6.0, 4.5], [5.5, 6.2, 4.8], [5.8, 6.5, 5.0], [5.2, 6.0, 4.5],
    [5.0, 5.8, 4.3], [6.0, 6.8, 5.2],
  ],
  cul_art: [
    [75, 82, 68], [62, 70, 55], [63, 71, 56], [65, 73, 58], [68, 75, 61],
    [64, 72, 57], [58, 66, 51], [72, 79, 65], [68, 76, 61], [52, 60, 45],
    [55, 63, 48], [54, 62, 47], [56, 64, 49], [50, 58, 43], [53, 61, 46],
    [60, 68, 53], [70, 78, 63],
  ],
  // ── 교통 ──
  trn_public: [
    [65, 70, 60], [35, 42, 30], [30, 38, 25], [38, 45, 33], [28, 35, 23],
    [30, 37, 25], [18, 25, 14], [20, 28, 15], [32, 40, 27], [12, 18, 8],
    [15, 22, 11], [13, 20, 9], [16, 23, 12], [10, 16, 7], [12, 18, 8],
    [22, 30, 17], [15, 22, 11],
  ],
  trn_road: [
    [95, 97, 93], [92, 95, 89], [91, 94, 88], [90, 93, 87], [93, 96, 90],
    [92, 95, 89], [88, 92, 85], [96, 98, 93], [89, 92, 86], [78, 85, 73],
    [82, 88, 77], [80, 86, 75], [83, 89, 78], [76, 83, 71], [79, 85, 74],
    [85, 90, 82], [90, 93, 87],
  ],
  trn_bike: [
    [2.5, 3.5, 1.5], [2.0, 3.0, 1.2], [1.8, 2.8, 1.0], [1.5, 2.5, 0.8], [2.2, 3.2, 1.3],
    [1.8, 2.8, 1.0], [1.5, 2.5, 0.8], [4.5, 5.5, 3.0], [1.8, 2.8, 1.0], [3.5, 4.5, 2.2],
    [2.5, 3.5, 1.5], [2.2, 3.2, 1.3], [2.0, 3.0, 1.2], [2.5, 3.5, 1.5], [2.0, 3.0, 1.2],
    [1.8, 2.8, 1.0], [3.0, 4.0, 2.0],
  ],
  // ── 인구 ──
  dem_growth: [
    [-0.5, 0.0, -0.1], [-0.8, -0.3, -0.3], [-0.7, -0.2, -0.2], [0.2, 0.5, 0.5], [-0.6, -0.1, -0.1],
    [-0.3, 0.1, 0.1], [-1.0, -0.5, -0.5], [3.0, 3.5, 5.0], [0.3, 0.7, 0.8], [-0.8, -0.3, -0.2],
    [0.0, 0.4, 0.3], [0.2, 0.6, 0.5], [-0.9, -0.4, -0.3], [-1.2, -0.7, -0.5], [-0.8, -0.3, -0.2],
    [-0.5, 0.0, 0.0], [0.5, 1.0, 1.5],
  ],
  dem_aging: [
    [17.8, 15, 14.0], [22.5, 19, 17.5], [20.8, 18, 16.0], [16.8, 14, 13.0], [19.2, 16, 15.0],
    [18.5, 16, 14.5], [19.0, 16, 14.8], [13.5, 11, 8.5], [16.2, 14, 12.5], [25.0, 22, 19.5],
    [21.5, 18, 17.0], [21.0, 18, 16.5], [24.5, 21, 19.0], [26.2, 23, 20.5], [25.5, 22, 20.0],
    [21.0, 18, 16.5], [18.5, 16, 14.2],
  ],
  dem_fertility: [
    [0.58, 1.0, 0.76], [0.68, 1.0, 0.90], [0.75, 1.0, 0.88], [0.76, 1.0, 0.95], [0.70, 1.0, 0.86],
    [0.79, 1.0, 0.92], [0.86, 1.0, 0.98], [1.03, 1.3, 1.42], [0.79, 1.1, 1.02], [0.89, 1.1, 1.08],
    [0.88, 1.1, 1.10], [0.88, 1.1, 1.12], [0.81, 1.0, 0.98], [1.03, 1.1, 1.05], [0.90, 1.0, 1.02],
    [0.82, 1.1, 1.05], [0.83, 1.2, 1.15],
  ],
  dem_migration: [
    [-5, 0, -2], [-8, -3, -4], [-6, -1, -3], [3, 8, 5], [-4, 1, -1],
    [-2, 3, 1], [-10, -5, -6], [30, 35, 45], [5, 10, 8], [-8, -3, -3],
    [2, 6, 4], [5, 9, 7], [-10, -5, -5], [-12, -7, -7], [-8, -3, -3],
    [-5, 0, -1], [8, 13, 15],
  ],
};

// ── 이력 데이터 생성 ────────────────────────────────────────

function generateHistory(base2018: number, current2025: number): YearDataPoint[] {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const delta = current2025 - base2018;
  return years.map((year, i) => {
    const t = i / 7; // 0 to 1
    // 약간의 변동성 추가 (2020년 COVID 딥 반영)
    let noise = 0;
    if (year === 2020) noise = -delta * 0.08;
    else if (year === 2021) noise = -delta * 0.03;
    const value = Math.round((base2018 + delta * t + noise) * 100) / 100;
    return { year, value };
  });
}

// ── 데이터 빌드 ─────────────────────────────────────────────

function buildMetroData(): MetroIndicatorData[] {
  const result: MetroIndicatorData[] = [];
  const allIndicatorIds = SDG_DOMAINS.flatMap(d => d.indicators.map(ind => ind.id));

  for (let mi = 0; mi < METRO_NAMES.length; mi++) {
    const metroName = METRO_NAMES[mi];
    for (const indId of allIndicatorIds) {
      const raw = RAW[indId];
      if (!raw || !raw[mi]) continue;
      const [current, target, base] = raw[mi];
      result.push({
        metroName,
        indicatorId: indId,
        currentValue: current,
        targetValue: target,
        history: generateHistory(base, current),
      });
    }
  }
  return result;
}

let _metroData: MetroIndicatorData[] | null = null;
function getMetroDataCached(): MetroIndicatorData[] {
  if (!_metroData) _metroData = buildMetroData();
  return _metroData;
}

// ── 진행률 계산 ─────────────────────────────────────────────

function getIndicatorDirection(indicatorId: string): IndicatorDirection {
  for (const domain of SDG_DOMAINS) {
    for (const ind of domain.indicators) {
      if (ind.id === indicatorId) return ind.direction;
    }
  }
  return 'higher_better';
}

export function calculateIndicatorProgress(
  current: number,
  target: number,
  direction: IndicatorDirection
): number {
  if (direction === 'higher_better') {
    if (target <= 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  } else {
    // lower_better: target보다 낮으면 100% 달성
    if (current <= target) return 100;
    const baseline = target * 2;
    if (baseline <= target) return 0;
    return Math.max(0, Math.min(100, ((baseline - current) / (baseline - target)) * 100));
  }
}

// ── 공개 API ────────────────────────────────────────────────

export function getSDGDomains(): SDGDomain[] {
  return SDG_DOMAINS;
}

export function getDomainById(domainId: string): SDGDomain | undefined {
  return SDG_DOMAINS.find(d => d.id === domainId);
}

export function getIndicatorById(indicatorId: string): SDGIndicator | undefined {
  for (const domain of SDG_DOMAINS) {
    const ind = domain.indicators.find(i => i.id === indicatorId);
    if (ind) return ind;
  }
  return undefined;
}

export function getAllMetroNames(): string[] {
  return [...METRO_NAMES].sort((a, b) => a.localeCompare(b, 'ko'));
}

export function getMetroSDGData(metroName: string): MetroIndicatorData[] {
  return getMetroDataCached().filter(d => d.metroName === metroName);
}

export function getMetroIndicatorData(
  metroName: string,
  indicatorId: string
): MetroIndicatorData | undefined {
  return getMetroDataCached().find(
    d => d.metroName === metroName && d.indicatorId === indicatorId
  );
}

export function getNationalAverageForIndicator(indicatorId: string): number {
  const allData = getMetroDataCached().filter(d => d.indicatorId === indicatorId);
  if (allData.length === 0) return 0;
  return Math.round(
    (allData.reduce((sum, d) => sum + d.currentValue, 0) / allData.length) * 100
  ) / 100;
}

export function calculateDomainProgress(
  metroName: string,
  domainId: string,
  overrides: UserGoalOverride[] = []
): number {
  const domain = getDomainById(domainId);
  if (!domain) return 0;

  let totalProgress = 0;
  let count = 0;

  for (const indicator of domain.indicators) {
    const data = getMetroIndicatorData(metroName, indicator.id);
    if (!data) continue;

    const override = overrides.find(
      o => o.indicatorId === indicator.id && o.metroName === metroName && !o.districtName
    );
    const target = override ? override.targetValue : data.targetValue;
    totalProgress += calculateIndicatorProgress(data.currentValue, target, indicator.direction);
    count++;
  }

  return count > 0 ? Math.round(totalProgress / count) : 0;
}

export function calculateOverallProgress(
  metroName: string,
  overrides: UserGoalOverride[] = []
): number {
  let totalProgress = 0;
  let count = 0;

  for (const domain of SDG_DOMAINS) {
    const p = calculateDomainProgress(metroName, domain.id, overrides);
    totalProgress += p;
    count++;
  }

  return count > 0 ? Math.round(totalProgress / count) : 0;
}

// ── 자치구 관련 함수 ────────────────────────────────────────

/** 특정 광역시도의 자치구 이름 목록 반환 (가나다순) */
export function getDistrictNames(metroName: string): string[] {
  return getFiscalDistricts(metroName).map(d => d.name).sort((a, b) => a.localeCompare(b, 'ko'));
}

/** 재정 영역 시군구 데이터: 기존 fiscal-health-data.ts 활용 */
export function getDistrictFinanceData(
  metroName: string,
  districtName: string
): DistrictIndicatorData[] {
  const districts = getFiscalDistricts(metroName);
  const dist = districts.find(d => d.name === districtName);
  if (!dist) return [];

  const debtHistory = generateDistrictDebtHistory(dist);
  const debtRatio = dist.budget > 0 ? (dist.debt / dist.budget) * 100 : 0;
  // 1인당 지역세 추정: 예산 × 지역세비중(~20%) / 인구 / 만원
  const taxPerCapita = dist.population > 0
    ? Math.round((dist.budget * 100000000 * 0.2) / dist.population / 10000)
    : 0;

  // 목표값: 소속 광역 목표 기준
  const metroFinData = getMetroDataCached().filter(
    d => d.metroName === metroName && d.indicatorId.startsWith('fin_')
  );
  const getMetroTarget = (indId: string) =>
    metroFinData.find(d => d.indicatorId === indId)?.targetValue ?? 0;

  const items: DistrictIndicatorData[] = [
    {
      metroName, districtName, indicatorId: 'fin_independence',
      currentValue: dist.independence,
      targetValue: getMetroTarget('fin_independence'),
      history: generateDistrictHistory(dist.independence, 8, 0.85),
    },
    {
      metroName, districtName, indicatorId: 'fin_autonomy',
      currentValue: dist.autonomy,
      targetValue: getMetroTarget('fin_autonomy'),
      history: generateDistrictHistory(dist.autonomy, 8, 0.88),
    },
    {
      metroName, districtName, indicatorId: 'fin_tax_percapita',
      currentValue: taxPerCapita,
      targetValue: getMetroTarget('fin_tax_percapita'),
      history: generateDistrictHistory(taxPerCapita, 8, 0.80),
    },
    {
      metroName, districtName, indicatorId: 'fin_debt_ratio',
      currentValue: Math.round(debtRatio * 10) / 10,
      targetValue: getMetroTarget('fin_debt_ratio'),
      history: debtHistory.length > 0
        ? debtHistory.map(h => ({ year: h.year, value: h.ratio }))
        : generateDistrictHistory(debtRatio, 8, 1.15),
    },
  ];

  return items;
}

/** 비재정 영역 자치구 데이터: 광역 평균에 해시 기반 변동 적용 */
export function getDistrictNonFinanceData(
  metroName: string,
  districtName: string
): DistrictIndicatorData[] {
  const metroData = getMetroDataCached().filter(d => d.metroName === metroName);
  const nonFinance = metroData.filter(d => !d.indicatorId.startsWith('fin_'));
  // 자치구 이름 해시로 일관된 변동 생성
  const hash = simpleHash(districtName);
  return nonFinance.map(md => {
    const indicator = getIndicatorById(md.indicatorId);
    const variationPct = ((hash * primeForId(md.indicatorId)) % 200 - 100) / 1000; // ±10%
    const adjustedCurrent = Math.round(md.currentValue * (1 + variationPct) * 100) / 100;
    return {
      metroName,
      districtName,
      indicatorId: md.indicatorId,
      currentValue: adjustedCurrent,
      targetValue: md.targetValue,
      history: md.history.map(h => ({
        year: h.year,
        value: Math.round(h.value * (1 + variationPct) * 100) / 100,
      })),
    };
  });
}

/** 자치구 전체 SDG 데이터 반환 (재정 실데이터 + 나머지 광역 기반) */
export function getDistrictSDGData(
  metroName: string,
  districtName: string
): DistrictIndicatorData[] {
  return [
    ...getDistrictFinanceData(metroName, districtName),
    ...getDistrictNonFinanceData(metroName, districtName),
  ];
}

/** 자치구 특정 지표 데이터 반환 */
export function getDistrictIndicatorData(
  metroName: string,
  districtName: string,
  indicatorId: string
): DistrictIndicatorData | undefined {
  return getDistrictSDGData(metroName, districtName)
    .find(d => d.indicatorId === indicatorId);
}

/** 자치구 영역 달성률 계산 */
export function calculateDistrictDomainProgress(
  metroName: string,
  districtName: string,
  domainId: string,
  overrides: UserGoalOverride[] = []
): number {
  const domain = getDomainById(domainId);
  if (!domain) return 0;

  let totalProgress = 0;
  let count = 0;

  for (const indicator of domain.indicators) {
    const data = getDistrictIndicatorData(metroName, districtName, indicator.id);
    if (!data) continue;

    const override = overrides.find(
      o => o.indicatorId === indicator.id &&
        o.metroName === metroName &&
        o.districtName === districtName
    );
    const target = override ? override.targetValue : data.targetValue;
    totalProgress += calculateIndicatorProgress(data.currentValue, target, indicator.direction);
    count++;
  }

  return count > 0 ? Math.round(totalProgress / count) : 0;
}

/** 자치구 종합 달성률 계산 */
export function calculateDistrictOverallProgress(
  metroName: string,
  districtName: string,
  overrides: UserGoalOverride[] = []
): number {
  let total = 0;
  let count = 0;
  for (const domain of SDG_DOMAINS) {
    total += calculateDistrictDomainProgress(metroName, districtName, domain.id, overrides);
    count++;
  }
  return count > 0 ? Math.round(total / count) : 0;
}

// ── 자치구 유틸 (내부) ─────────────────────────────────────

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function primeForId(id: string): number {
  const primes = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return primes[sum % primes.length];
}

function generateDistrictHistory(
  currentValue: number,
  years: number,
  base2018Ratio: number
): YearDataPoint[] {
  const baseValue = currentValue * base2018Ratio;
  const yearList = Array.from({ length: years }, (_, i) => 2018 + i);
  const delta = currentValue - baseValue;
  return yearList.map((year, i) => {
    const t = i / (years - 1);
    let noise = 0;
    if (year === 2020) noise = -delta * 0.08;
    else if (year === 2021) noise = -delta * 0.03;
    const value = Math.round((baseValue + delta * t + noise) * 100) / 100;
    return { year, value };
  });
}

/** 특정 영역에서 전국 Top/Bottom N 반환 */
export function getDomainRanking(
  domainId: string,
  overrides: UserGoalOverride[] = [],
  topN: number = 3
): { top: { metro: string; progress: number }[]; bottom: { metro: string; progress: number }[] } {
  const rankings = METRO_NAMES.map(metro => ({
    metro,
    progress: calculateDomainProgress(metro, domainId, overrides),
  })).sort((a, b) => b.progress - a.progress);

  return {
    top: rankings.slice(0, topN),
    bottom: rankings.slice(-topN).reverse(),
  };
}

// ── 삶의 질 지수 (QoL Index) ─────────────────────────────────

export interface QoLScore {
  name: string;
  score: number; // 0-100 (종합 달성률)
  rank: number;
  domainScores: { domainId: string; domainName: string; score: number; color: string }[];
  isDistrict?: boolean;
  metroName?: string;
}

/** 전국 17개 광역시도 삶의 질 지수 랭킹 */
export function getMetroQoLRanking(overrides: UserGoalOverride[] = []): QoLScore[] {
  const results = METRO_NAMES.map(metro => {
    const domainScores = SDG_DOMAINS.map(d => ({
      domainId: d.id,
      domainName: d.name,
      score: calculateDomainProgress(metro, d.id, overrides),
      color: d.color,
    }));
    return {
      name: metro,
      score: calculateOverallProgress(metro, overrides),
      rank: 0,
      domainScores,
    };
  }).sort((a, b) => b.score - a.score);

  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}

/** 특정 광역시도 내 자치구별 삶의 질 지수 랭킹 */
export function getDistrictQoLRanking(
  metroName: string,
  overrides: UserGoalOverride[] = []
): QoLScore[] {
  const districts = getFiscalDistricts(metroName);
  if (districts.length === 0) return [];

  const results = districts.map(dist => {
    const domainScores = SDG_DOMAINS.map(d => ({
      domainId: d.id,
      domainName: d.name,
      score: calculateDistrictDomainProgress(metroName, dist.name, d.id, overrides),
      color: d.color,
    }));
    return {
      name: dist.name,
      score: calculateDistrictOverallProgress(metroName, dist.name, overrides),
      rank: 0,
      domainScores,
      isDistrict: true,
      metroName,
    };
  }).sort((a, b) => b.score - a.score);

  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}
