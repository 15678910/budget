/**
 * 시도교육청별 세입·세출 (2024 회계연도 결산, 교육비특별회계, 단위 억원)
 *
 * 출처: 지방교육재정알리미 교육청별 재정도표 (eduinfo.go.kr), 2026-09-08 수집.
 * 결산 기준 수치다.
 *
 * 주의 — 이전수입(transferEok)에는 교부금 외에 국고보조금과 지방자치단체
 * 전입금이 함께 들어 있다. 따라서 이 값으로 안분한 감소액은 교부금 배분액의
 * 근사치일 뿐, 정확한 교부금 배분액이 아니다.
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
}

export const REGIONS: readonly RegionFinance[] = [
  { name: '서울', revenueEok: 130087, transferEok: 109647, spendingEok: 119935, payrollEok: 72391 },
  { name: '부산', revenueEok: 57905, transferEok: 50194, spendingEok: 54108, payrollEok: 29684 },
  { name: '대구', revenueEok: 44241, transferEok: 38407, spendingEok: 42483, payrollEok: 25276 },
  { name: '인천', revenueEok: 55146, transferEok: 45377, spendingEok: 53122, payrollEok: 30311 },
  { name: '광주', revenueEok: 29980, transferEok: 25475, spendingEok: 28553, payrollEok: 16838 },
  { name: '대전', revenueEok: 28434, transferEok: 24509, spendingEok: 28104, payrollEok: 16075 },
  { name: '울산', revenueEok: 23482, transferEok: 20314, spendingEok: 22614, payrollEok: 13103 },
  { name: '세종', revenueEok: 11893, transferEok: 9451, spendingEok: 11251, payrollEok: 6490 },
  { name: '경기', revenueEok: 241816, transferEok: 203470, spendingEok: 225782, payrollEok: 130908 },
  { name: '강원', revenueEok: 41196, transferEok: 35674, spendingEok: 39846, payrollEok: 21416 },
  { name: '충북', revenueEok: 38086, transferEok: 32659, spendingEok: 36346, payrollEok: 19852 },
  { name: '충남', revenueEok: 51843, transferEok: 43804, spendingEok: 50185, payrollEok: 26642 },
  { name: '전북', revenueEok: 48313, transferEok: 40219, spendingEok: 46174, payrollEok: 24888 },
  { name: '전남', revenueEok: 52572, transferEok: 43637, spendingEok: 50441, payrollEok: 26235 },
  { name: '경북', revenueEok: 61606, transferEok: 52061, spendingEok: 58920, payrollEok: 30831 },
  { name: '경남', revenueEok: 75888, transferEok: 62090, spendingEok: 70729, payrollEok: 40020 },
  { name: '제주', revenueEok: 16686, transferEok: 13679, spendingEok: 15936, payrollEok: 8364 },
];
