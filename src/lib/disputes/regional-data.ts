/**
 * 시도교육청별 세입·세출 (2024 회계연도 결산, 교육비특별회계, 단위 억원)
 *
 * 출처: 지방교육재정알리미 교육청별 재정도표 (eduinfo.go.kr), 2026-09-08 수집.
 * 결산 기준 수치다.
 *
 * 주의 — 이전수입(transferEok)에는 교부금 외에 국고보조금과 지방자치단체
 * 전입금이 함께 들어 있다. 따라서 이 값으로 안분한 감소액은 교부금 배분액의
 * 근사치일 뿐, 정확한 교부금 배분액이 아니다.
 *
 * ---
 *
 * 시도별 학생 수 (2024·2025, 단위 명)
 *
 * 출처: 교육부·한국교육개발원 「2025년 교육기본통계」 별첨 표 3
 * 「시도별 유·초·중등 학생 수」, 2025-08-29 발표. 기준일 2025-04-01.
 * HWPX 첨부파일을 파싱해 얻은 수치이며, 파싱 합계(2025년 5,684,745명 ·
 * 2024년 5,551,250명— 유·초·중등 전체)가 보도자료 총계와 정확히 일치해
 * 검증됐다. 다만 이 파일에 담는 studentsFY2024/2025는 초·중·고 합계만이며
 * 유치원·기타는 제외한 수치다 (전체 유·초·중등 수치와는 다르다).
 *
 * 주의 — 재정 수치(위 REGIONS 필드)는 2024 회계연도 결산이고, 학생 수는
 * 2025-04-01 기준이다. 두 출처의 기준연도가 다르므로 같은 해 데이터로
 * 오인하지 말 것.
 */

export interface RegionFinance {
  name: string;
  /** 세입계 (억원) */
  revenueEok: number;
  /** 이전수입 (억원). 교부금 + 국고보조금 + 지자체 전입금 */
  transferEok: number;
  /** 세출계 (억원) */
  spendingEok: number;
  /** 인건비 (억원) */
  payrollEok: number;
  /** 2024년 초·중·고 학생 수 (명). 유치원·기타 제외 */
  studentsFY2024: number;
  /** 2025년 초·중·고 학생 수 (명). 유치원·기타 제외 */
  studentsFY2025: number;
  /** 2024→2025 학생 수 변화율 (소수. -0.03 = 3% 감소) */
  studentChangeRate: number;
}

export const REGIONS: readonly RegionFinance[] = [
  { name: '서울', revenueEok: 130087, transferEok: 109647, spendingEok: 119935, payrollEok: 72391, studentsFY2024: 766206, studentsFY2025: 743216, studentChangeRate: -0.0300 },
  { name: '부산', revenueEok: 57905, transferEok: 50194, spendingEok: 54108, payrollEok: 29684, studentsFY2024: 293544, studentsFY2025: 287707, studentChangeRate: -0.0199 },
  { name: '대구', revenueEok: 44241, transferEok: 38407, spendingEok: 42483, payrollEok: 25276, studentsFY2024: 237973, studentsFY2025: 233775, studentChangeRate: -0.0176 },
  { name: '인천', revenueEok: 55146, transferEok: 45377, spendingEok: 53122, payrollEok: 30311, studentsFY2024: 306136, studentsFY2025: 302545, studentChangeRate: -0.0117 },
  { name: '광주', revenueEok: 29980, transferEok: 25475, spendingEok: 28553, payrollEok: 16838, studentsFY2024: 162736, studentsFY2025: 157661, studentChangeRate: -0.0312 },
  { name: '대전', revenueEok: 28434, transferEok: 24509, spendingEok: 28104, payrollEok: 16075, studentsFY2024: 149590, studentsFY2025: 145458, studentChangeRate: -0.0276 },
  { name: '울산', revenueEok: 23482, transferEok: 20314, spendingEok: 22614, payrollEok: 13103, studentsFY2024: 126110, studentsFY2025: 123000, studentChangeRate: -0.0247 },
  { name: '세종', revenueEok: 11893, transferEok: 9451, spendingEok: 11251, payrollEok: 6490, studentsFY2024: 61673, studentsFY2025: 61932, studentChangeRate: 0.0042 },
  { name: '경기', revenueEok: 241816, transferEok: 203470, spendingEok: 225782, payrollEok: 130908, studentsFY2024: 1467041, studentsFY2025: 1439840, studentChangeRate: -0.0185 },
  { name: '강원', revenueEok: 41196, transferEok: 35674, spendingEok: 39846, payrollEok: 21416, studentsFY2024: 139174, studentsFY2025: 135243, studentChangeRate: -0.0282 },
  { name: '충북', revenueEok: 38086, transferEok: 32659, spendingEok: 36346, payrollEok: 19852, studentsFY2024: 160890, studentsFY2025: 157730, studentChangeRate: -0.0196 },
  { name: '충남', revenueEok: 51843, transferEok: 43804, spendingEok: 50185, payrollEok: 26642, studentsFY2024: 231450, studentsFY2025: 226902, studentChangeRate: -0.0197 },
  { name: '전북', revenueEok: 48313, transferEok: 40219, spendingEok: 46174, payrollEok: 24888, studentsFY2024: 178795, studentsFY2025: 172763, studentChangeRate: -0.0337 },
  { name: '전남', revenueEok: 52572, transferEok: 43637, spendingEok: 50441, payrollEok: 26235, studentsFY2024: 174336, studentsFY2025: 169379, studentChangeRate: -0.0284 },
  { name: '경북', revenueEok: 61606, transferEok: 52061, spendingEok: 58920, payrollEok: 30831, studentsFY2024: 243809, studentsFY2025: 237042, studentChangeRate: -0.0278 },
  { name: '경남', revenueEok: 75888, transferEok: 62090, spendingEok: 70729, payrollEok: 40020, studentsFY2024: 355074, studentsFY2025: 345412, studentChangeRate: -0.0272 },
  { name: '제주', revenueEok: 16686, transferEok: 13679, spendingEok: 15936, payrollEok: 8364, studentsFY2024: 77643, studentsFY2025: 75705, studentChangeRate: -0.0250 },
];
