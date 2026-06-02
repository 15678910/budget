// ============================================================
// 전국 교육청 예산 데이터 & 정합성 분석 엔진
// ─────────────────────────────────────────────────────────────
// 계층 구조: 시도교육청(17) → 교육지원청(~176) → 학교(~12,000)
//
// budget2026  : eduinfo `opbdIntFiSta` (통합재정통계 — 예산공시) 2026 세입총계(조원)
//               scripts/fetch-eduinfo-2026.mjs 로 수집. 17개 합계 ≈ 100.98조.
// debt        : eduinfo `opclPriInvstBizBTL` 2024 BTL(민간투자) 잔액(조원).
//               공식 지방교육채는 2022년부터 전 교육청 0원 → BTL이 실질 채무.
// students    : 2024 교육기본통계(KESS) 초·중·고 재학생수 추정(명). 학교알리미 API로 갱신 예정.
//
// ⚠️ 교육지원청·학교 계층 데이터는 학교알리미 OpenAPI(data.go.kr 15098092) 인증키
//    발급 후 채워진다. eduinfo는 시도 단위까지만 제공(확인 완료).
//    아래 districtOffices / schools 필드는 Phase 2 확장용 자리.
// ============================================================

export type EduRegionGroup = '수도권' | '충청권' | '호남권' | '영남권' | '강원제주';

/** 학교 단위 예산 (Phase 2 — 학교알리미 roll-up) */
export interface SchoolBudget {
  id: string;
  name: string;
  level: '초' | '중' | '고' | '특수' | '기타';
  budget: number;   // 학교회계 세출예산 (원)
  students: number; // 재학생수 (명)
}

/** 교육지원청 단위 예산 (Phase 2 — 학교알리미 관할 학교 roll-up) */
export interface DistrictEducationBudget {
  id: string;
  name: string;       // 예: 서울특별시강남서초교육지원청
  metro: string;      // 소속 시도교육청
  budget: number;     // 관할 학교 예산 합 + 교육지원청 운영비 (원)
  students: number;   // 관할 학생수 (명)
  schoolCount: number;
  schools?: SchoolBudget[];
}

/** 시도교육청 단위 예산 */
export interface MetroEducationBudget {
  id: string;
  name: string;         // 교육청명
  metro: string;        // 관할 시도
  region: EduRegionGroup;
  budget2026: number;   // 2026 세입총계 (조원)
  students: number;     // 학생수 (명)
  debt: number;         // BTL 잔액 (조원)
  districtOffices?: DistrictEducationBudget[]; // Phase 2
}

// ── 17개 시도교육청 (eduinfo 2026 실데이터) ──────────────────
export const METRO_EDUCATION_BUDGETS: MetroEducationBudget[] = [
  { id: 'seoul',    name: '서울특별시교육청',     metro: '서울특별시',       region: '수도권',   budget2026: 12.23, students: 800_000,   debt: 0.35 },
  { id: 'busan',    name: '부산광역시교육청',     metro: '부산광역시',       region: '영남권',   budget2026: 6.62,  students: 285_000,   debt: 0.10 },
  { id: 'daegu',    name: '대구광역시교육청',     metro: '대구광역시',       region: '영남권',   budget2026: 4.71,  students: 205_000,   debt: 0.16 },
  { id: 'incheon',  name: '인천광역시교육청',     metro: '인천광역시',       region: '수도권',   budget2026: 5.33,  students: 300_000,   debt: 0.18 },
  { id: 'gwangju',  name: '광주광역시교육청',     metro: '광주광역시',       region: '호남권',   budget2026: 2.99,  students: 175_000,   debt: 0.058 },
  { id: 'daejeon',  name: '대전광역시교육청',     metro: '대전광역시',       region: '충청권',   budget2026: 3.06,  students: 170_000,   debt: 0.10 },
  { id: 'ulsan',    name: '울산광역시교육청',     metro: '울산광역시',       region: '영남권',   budget2026: 2.38,  students: 130_000,   debt: 0.055 },
  { id: 'sejong',   name: '세종특별자치시교육청', metro: '세종특별자치시',   region: '충청권',   budget2026: 1.43,  students: 80_000,    debt: 0.057 },
  { id: 'gyeonggi', name: '경기도교육청',         metro: '경기도',           region: '수도권',   budget2026: 23.41, students: 1_540_000, debt: 1.28 },
  { id: 'gangwon',  name: '강원특별자치도교육청', metro: '강원특별자치도',   region: '강원제주', budget2026: 5.41,  students: 145_000,   debt: 0.027 },
  { id: 'chungbuk', name: '충청북도교육청',       metro: '충청북도',         region: '충청권',   budget2026: 4.13,  students: 165_000,   debt: 0.05 },
  { id: 'chungnam', name: '충청남도교육청',       metro: '충청남도',         region: '충청권',   budget2026: 4.86,  students: 245_000,   debt: 0.059 },
  { id: 'jeonbuk',  name: '전북특별자치도교육청', metro: '전북특별자치도',   region: '호남권',   budget2026: 4.77,  students: 175_000,   debt: 0.067 },
  { id: 'jeonnam',  name: '전라남도교육청',       metro: '전라남도',         region: '호남권',   budget2026: 4.52,  students: 185_000,   debt: 0.025 },
  { id: 'gyeongbuk',name: '경상북도교육청',       metro: '경상북도',         region: '영남권',   budget2026: 6.41,  students: 235_000,   debt: 0.166 },
  { id: 'gyeongnam',name: '경상남도교육청',       metro: '경상남도',         region: '영남권',   budget2026: 6.97,  students: 350_000,   debt: 0.216 },
  { id: 'jeju',     name: '제주특별자치도교육청', metro: '제주특별자치도',   region: '강원제주', budget2026: 1.74,  students: 90_000,    debt: 0.00 },
];

// ============================================================
// 분석 엔진
// ============================================================

/** 학생 1인당 예산 (원/명) */
export function perStudentBudget(o: MetroEducationBudget): number {
  if (o.students <= 0) return 0;
  return (o.budget2026 * 1e12) / o.students;
}

/** 학생 1인당 채무 (원/명) */
export function perStudentDebt(o: MetroEducationBudget): number {
  if (o.students <= 0) return 0;
  return (o.debt * 1e12) / o.students;
}

export interface DistributionStats {
  count: number;
  sum: number;        // 합계
  mean: number;       // 평균
  median: number;     // 중앙값
  min: number;
  max: number;
  stdev: number;      // 표준편차 (모집단)
  cv: number;         // 변동계수 (stdev/mean) — 0에 가까울수록 균등
  gini: number;       // 지니계수 (0=완전평등, 1=완전불평등)
  spread: number;     // 최대/최소 배율
}

/** 값 배열의 분포 통계 */
export function computeDistribution(values: number[]): DistributionStats {
  const n = values.length;
  if (n === 0) {
    return { count: 0, sum: 0, mean: 0, median: 0, min: 0, max: 0, stdev: 0, cv: 0, gini: 0, spread: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
  const min = sorted[0];
  const max = sorted[n - 1];
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdev = Math.sqrt(variance);
  const cv = mean !== 0 ? stdev / mean : 0;
  const spread = min > 0 ? max / min : 0;

  // 지니계수 (정렬값 기준)
  let giniNum = 0;
  for (let i = 0; i < n; i++) {
    giniNum += (2 * (i + 1) - n - 1) * sorted[i];
  }
  const gini = sum > 0 ? giniNum / (n * sum) : 0;

  return { count: n, sum, mean, median, min, max, stdev, cv, gini, spread };
}

export interface OutlierResult {
  office: MetroEducationBudget;
  perStudent: number;
  zScore: number;            // (값-평균)/표준편차
  direction: 'high' | 'low'; // 평균 대비 방향
}

/** 학생 1인당 예산 기준 이상치 탐지 (|z| >= threshold) */
export function detectOutliers(
  offices: MetroEducationBudget[],
  threshold = 1.5,
): OutlierResult[] {
  const values = offices.map(perStudentBudget);
  const { mean, stdev } = computeDistribution(values);
  if (stdev === 0) return [];
  return offices
    .map((office) => {
      const perStudent = perStudentBudget(office);
      const zScore = (perStudent - mean) / stdev;
      return { office, perStudent, zScore, direction: (zScore >= 0 ? 'high' : 'low') as 'high' | 'low' };
    })
    .filter((r) => Math.abs(r.zScore) >= threshold)
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

export interface RankedOffice {
  office: MetroEducationBudget;
  perStudent: number;
  rank: number;
  vsAvgPct: number; // 전국 평균 대비 (%)
}

/** 학생 1인당 예산 순위 (내림차순) + 전국평균 대비 */
export function rankByPerStudent(offices: MetroEducationBudget[]): RankedOffice[] {
  const values = offices.map(perStudentBudget);
  const { mean } = computeDistribution(values);
  return offices
    .map((office) => {
      const perStudent = perStudentBudget(office);
      return {
        office,
        perStudent,
        rank: 0,
        vsAvgPct: mean !== 0 ? ((perStudent - mean) / mean) * 100 : 0,
      };
    })
    .sort((a, b) => b.perStudent - a.perStudent)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/** 전국 합계·평균 요약 */
export interface NationalEduSummary {
  totalBudget: number;     // 조원
  totalStudents: number;   // 명
  totalDebt: number;       // 조원
  avgPerStudent: number;   // 원/명 (총예산/총학생, 가중평균)
  officeCount: number;
}

export function nationalSummary(offices: MetroEducationBudget[]): NationalEduSummary {
  const totalBudget = offices.reduce((s, o) => s + o.budget2026, 0);
  const totalStudents = offices.reduce((s, o) => s + o.students, 0);
  const totalDebt = offices.reduce((s, o) => s + o.debt, 0);
  return {
    totalBudget,
    totalStudents,
    totalDebt,
    avgPerStudent: totalStudents > 0 ? (totalBudget * 1e12) / totalStudents : 0,
    officeCount: offices.length,
  };
}

/** 권역별 집계 */
export interface RegionAggregate {
  region: EduRegionGroup;
  budget: number;      // 조원
  students: number;
  perStudent: number;  // 원/명
  officeCount: number;
}

export function aggregateByRegion(offices: MetroEducationBudget[]): RegionAggregate[] {
  const groups = new Map<EduRegionGroup, MetroEducationBudget[]>();
  for (const o of offices) {
    const arr = groups.get(o.region) ?? [];
    arr.push(o);
    groups.set(o.region, arr);
  }
  const order: EduRegionGroup[] = ['수도권', '충청권', '호남권', '영남권', '강원제주'];
  return order
    .filter((r) => groups.has(r))
    .map((region) => {
      const arr = groups.get(region)!;
      const budget = arr.reduce((s, o) => s + o.budget2026, 0);
      const students = arr.reduce((s, o) => s + o.students, 0);
      return {
        region,
        budget,
        students,
        perStudent: students > 0 ? (budget * 1e12) / students : 0,
        officeCount: arr.length,
      };
    });
}

/** 만원 단위 한글 포맷 (원 → "1,234만원" / "1.2억원") */
export function formatKRW(won: number): string {
  if (won >= 1e8) return `${(won / 1e8).toFixed(2)}억원`;
  if (won >= 1e4) return `${Math.round(won / 1e4).toLocaleString()}만원`;
  return `${Math.round(won).toLocaleString()}원`;
}
