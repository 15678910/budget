// ============================================================
// 학교알리미 공시항목 카탈로그 — 의원 셀프조회 포털용
// ─────────────────────────────────────────────────────────────
// 매년 반복되는 정형 자료요구를 의원·시민이 직접 조회하도록 하는 항목 정의.
// fieldLabels: 검증된 필드만 한글 라벨. 미검증 필드는 원자료 코드 그대로 표시.
// 공식 정의는 각 항목 sourceUrl(학교알리미) 참조.
// ============================================================

export interface DisclosureItem {
  apiType: string;          // 학교알리미 apiType 코드
  name: string;             // 항목명
  category: string;         // 묶음
  desc: string;             // 이 항목이 답하는 자료요구
  depthNo?: string;         // 예결산 등 depth 필요 항목
  depthNo2?: string;
  fieldLabels: Record<string, string>; // 필드코드 → 한글 (검증된 것만)
  primaryCols: string[];    // 표에 우선 표시할 컬럼(코드)
}

// 공통 식별 필드 (모든 항목 공유)
export const COMMON_LABELS: Record<string, string> = {
  SCHUL_NM: '학교명',
  ATPT_OFCDC_ORG_NM: '시도교육청',
  JU_ORG_NM: '교육지원청',
  ADRCD_NM: '소재지',
  FOND_SC_CODE: '설립',
  SCHUL_CRSE_SC_VALUE_NM: '학교급',
};

export const DISCLOSURE_ITEMS: DisclosureItem[] = [
  {
    apiType: '09', name: '학년별·학급별 학생수', category: '학생·교원',
    desc: '학생수·학급수·교원수 (매년 의회 단골 요구자료)',
    fieldLabels: {
      COL_S_SUM: '학생수(계)', COL_C_SUM: '학급수(계)', TEACH_CNT: '교원수', TEACH_CAL: '교원1인당학생수',
      COL_SUM: '전체 학급당학생',
      // COL_S{n}=n학년 학생수 (초 1~6 / 중·고 1~3), S7=특수학급, S8=기타
      COL_S1: '1학년 학생', COL_S2: '2학년 학생', COL_S3: '3학년 학생',
      COL_S4: '4학년 학생', COL_S5: '5학년 학생', COL_S6: '6학년 학생',
      COL_S7: '특수학급 학생', COL_S8: '기타 학생',
      // COL_C{n}=n학년 학급수
      COL_C1: '1학년 학급', COL_C2: '2학년 학급', COL_C3: '3학년 학급',
      COL_C4: '4학년 학급', COL_C5: '5학년 학급', COL_C6: '6학년 학급',
      COL_C7: '특수학급', COL_C8: '기타 학급',
      // COL_{n}=n학년 학급당 학생수 (학생÷학급)
      COL_1: '1학년 학급당', COL_2: '2학년 학급당', COL_3: '3학년 학급당',
      COL_4: '4학년 학급당', COL_5: '5학년 학급당', COL_6: '6학년 학급당',
      COL_7: '특수 학급당', COL_8: '기타 학급당',
    },
    primaryCols: ['SCHUL_NM', 'ADRCD_NM', 'COL_S_SUM', 'COL_C_SUM', 'TEACH_CNT', 'TEACH_CAL'],
  },
  {
    apiType: '62', name: '학교 현황', category: '학생·교원',
    desc: '학교 기본현황 (설립·소재지·연락)',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM', 'FOND_SC_CODE'],
  },
  {
    apiType: '10', name: '전·출입 및 학업중단 학생수', category: '학생·교원',
    desc: '전입·전출·학업중단(중도탈락) 학생 현황',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM'],
  },
  {
    apiType: '08', name: '수업일수 및 수업시수', category: '교육과정',
    desc: '수업일수·연간 수업시수 (수업시간 관련 요구자료)',
    fieldLabels: {
      COL_1: '1학년 수업일수', COL_2: '2학년 수업일수', COL_3: '3학년 수업일수',
      COL_4: '4학년 수업일수', COL_5: '5학년 수업일수', COL_6: '6학년 수업일수',
      WEEK_TOT_ITRT_HR_FGR: '연간 총 수업시수', ITRT_TCR_TOT_FGR: '편성 교과(군) 수',
    },
    primaryCols: ['SCHUL_NM', 'ADRCD_NM', 'COL_1', 'WEEK_TOT_ITRT_HR_FGR'],
  },
  {
    apiType: '04', name: '자유학기제 운영', category: '교육과정',
    desc: '자유학기제 운영 현황 (중학교)',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM'],
  },
  {
    apiType: '90', name: '학생 체력증진(PAPS)', category: '체육·건강',
    desc: '학생건강체력평가(PAPS) 등급분포 (체육활동 관련 요구자료)',
    fieldLabels: {
      GRADE: '학년', SXDS_CODE: '성별',
      PER_1: '1등급 비율(%)', PER_2: '2등급 비율(%)', PER_3: '3등급 비율(%)',
      PER_4: '4등급 비율(%)', PER_5: '5등급 비율(%)', BDFAT_BMI_NMVL: 'BMI 평균',
    },
    primaryCols: ['SCHUL_NM', 'GRADE', 'SXDS_CODE', 'PER_1', 'PER_2', 'PER_3', 'PER_4', 'PER_5'],
  },
  {
    apiType: '94', name: '학교폭력 예방교육 실적', category: '안전·생활',
    desc: '학교폭력 예방교육 실시 시간·참여 인원 (※ 발생·심의 건수는 비공개)',
    fieldLabels: {
      SEM_SC_NM: '학기', TOT_AVG_TM: '평균 교육시간', FRL_CURR_ITRT_TM: '정규교육과정 이수시간',
      PTPT_NMPR_FGR1: '학생 참여인원', PTPT_NMPR_PER1: '학생 참여율(%)',
    },
    primaryCols: ['SCHUL_NM', 'SEM_SC_NM', 'TOT_AVG_TM', 'PTPT_NMPR_FGR1'],
  },
  {
    apiType: '43', name: '안전교육 계획 및 실시', category: '안전·생활',
    desc: '학생 안전교육 계획·실시 현황',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM'],
  },
  {
    apiType: '44', name: '시설안전 점검 현황', category: '안전·생활',
    desc: '학교 시설 안전점검 결과',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM'],
  },
  {
    apiType: '34', name: '급식 실시 현황', category: '급식·보건',
    desc: '급식 운영 현황 (급식 관련 요구자료)',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM'],
  },
  {
    apiType: '38', name: '보건관리 현황', category: '급식·보건',
    desc: '보건실·보건교사 등 보건관리 현황',
    fieldLabels: {},
    primaryCols: ['SCHUL_NM', 'ADRCD_NM'],
  },
  {
    apiType: '56', name: '동아리 활동 현황', category: '교육활동',
    desc: '창의적체험활동·동아리 운영 (체험학습 관련)',
    fieldLabels: {
      CREAT_EXPER_ACT_STDNT_FGR: '창의체험 참여학생', CCCLU_ACT_BDG_SPORT_AMT: '동아리 지원예산(원)',
    },
    primaryCols: ['SCHUL_NM', 'ADRCD_NM', 'CREAT_EXPER_ACT_STDNT_FGR'],
  },
  {
    apiType: '59', name: '방과후학교 운영', category: '교육활동',
    desc: '방과후학교·돌봄 운영 및 지원 현황',
    fieldLabels: {
      ASL_PTPT_STDNT_FGR: '방과후 참여학생', ECC_PM_PTPT_STDNT_FGR: '돌봄 참여학생',
    },
    primaryCols: ['SCHUL_NM', 'ADRCD_NM', 'ASL_PTPT_STDNT_FGR', 'ECC_PM_PTPT_STDNT_FGR'],
  },
  {
    apiType: '27', name: '학교회계 예·결산', category: '재정', depthNo: '10', depthNo2: '02',
    desc: '학교회계 세출 예산 (1인당 예산 포함)',
    fieldLabels: { YESAN_PER_HEAD: '학생1인당 예산(원)' },
    primaryCols: ['SCHUL_NM', 'ADRCD_NM', 'YESAN_PER_HEAD'],
  },
];

// 비공개·미제공 항목 (정직하게 안내)
export const UNAVAILABLE_ITEMS: { name: string; reason: string }[] = [
  { name: '교권침해 발생·심의 건수', reason: '학교알리미 미공시. 교육부가 시도별 연1회 발표하나 학교별 비공개' },
  { name: '학부모 민원 건수', reason: '개인정보·민감정보로 비공개' },
  { name: '학생인권 침해 건수', reason: '비공개' },
  { name: '학교별 학업성취도(학력)', reason: '서열화 방지를 위해 학교별 비공개 (시도별 국가수준 학업성취도는 별도 공개)' },
  { name: '학교폭력 발생·심의 건수', reason: '학교별 비공개 (예방교육 실적만 공개)' },
];

export const SCHOOL_KINDS = [
  { code: '02', name: '초등학교' },
  { code: '03', name: '중학교' },
  { code: '04', name: '고등학교' },
];

export const DISCLOSURE_YEAR = '2024';
