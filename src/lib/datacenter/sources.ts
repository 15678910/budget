/**
 * 출처가 확인된 상수와 그 메타데이터 (설계문서 §3.3, §4.3)
 *
 * 이 파일에 없는 숫자는 계산에 쓰지 않는다. 출처 없는 값이 계산에 섞이면
 * 이 도구는 교육 자료가 아니라 선전 도구가 된다.
 */

import type { Figure, FigureRange } from './types';

// ─── 고용 벤치마크 (설계문서 §4.3) ────────────────────────────────────────────

/**
 * 상시 고용 벤치마크. 시설 규모가 제각각이므로 100MW 기준으로 정규화한 값만 모은다.
 * 정규화가 불가능한 출처(PwC의 시설당 50~300명 등)는 참고 항목에 따로 둔다.
 */
export const PERMANENT_PER_100MW: readonly FigureRange[] = [
  {
    low: 30,
    high: 50,
    unit: '명/100MW',
    label: '국내 하이퍼스케일 상시 고용',
    kind: 'measured',
    source: '국내 데이터센터 운영 실태',
    date: '2024-01',
  },
  {
    low: 20,
    high: 30,
    unit: '명/100MW',
    label: '자동화 하이퍼스케일 상시 고용',
    kind: 'measured',
    source: '자동화 설비 운영 사례',
    date: '2024-01',
    note: '무인화 수준이 높을수록 인력이 줄어든다',
  },
  {
    low: 100,
    high: 200,
    unit: '명/100MW',
    label: '해외 100MW 캠퍼스 상시 고용',
    kind: 'measured',
    source: '해외 데이터센터 캠퍼스',
    date: '2024-01',
    note: '캠퍼스형은 부대시설 인력이 포함돼 국내 단독시설보다 높게 잡힌다',
  },
];

/** 건설 고용 벤치마크. 건설 인력은 공사 기간에만 존재하는 일시적 일자리다. */
export const CONSTRUCTION_PER_100MW: readonly FigureRange[] = [
  {
    low: 100,
    high: 100,
    unit: '명/100MW',
    label: 'SK 울산 1GW 건설 인력',
    kind: 'announced',
    source: 'SK',
    date: '2025-06',
    note: '1GW에 1,000여 명 발표를 100MW로 환산한 값',
  },
  {
    low: 850,
    high: 850,
    unit: '명/100MW',
    label: '해외 100MW 캠퍼스 건설 인력',
    kind: 'measured',
    source: '해외 데이터센터 캠퍼스',
    date: '2024-01',
    note: '18개월 공사 기준',
  },
];

/** SK 울산이 발표한 상시 근무인력. 발표 고용효과를 검증하는 기준선이다. */
export const ULSAN_PERMANENT: Figure = {
  value: 140,
  unit: '명',
  label: 'SK 울산 1GW 상시 근무인력',
  kind: 'announced',
  source: 'SK',
  date: '2025-06',
};

/** SK 울산이 발표한 고용창출 효과. 이 도구가 검증 대상으로 삼는 수치다. */
export const ULSAN_CLAIMED_EFFECT: Figure = {
  value: 78000,
  unit: '명',
  label: 'SK 울산 발표 고용창출 효과',
  kind: 'announced',
  source: 'SK',
  date: '2025-06',
  note: '간접·유발 효과를 포함한 것으로 보이나 산출 근거는 공개되지 않았다',
};

/**
 * 산업연관표 취업유발계수의 통상 범위.
 * 발표된 고용효과가 이 범위로 설명되는지 판단하는 잣대다.
 */
export const INDUCED_MULTIPLIER: FigureRange = {
  low: 2,
  high: 3,
  unit: '배',
  label: '취업유발계수 통상 범위 (직접고용 대비)',
  kind: 'measured',
  source: '산업연관표',
  date: '2024-01',
};

/** 미 버지니아주 실측 — 투자액 대비 일자리 밀도 */
export const VIRGINIA_INVESTMENT_PER_JOB: Figure = {
  value: 5.4e7,
  unit: 'USD/명',
  label: '투자 5,400만 달러당 상시 일자리 1명',
  kind: 'measured',
  source: '미국 버지니아주',
  date: '2024-01',
};

/** 인건비 교차검증에 쓰는 1인당 인건비 (설계문서 §2.3) */
export const ANNUAL_WAGE_USD: Figure = {
  value: 1.5e5,
  unit: 'USD/명',
  label: '데이터센터 인력 1인당 연 인건비',
  kind: 'estimated',
  source: '이 도구의 가정',
  date: '2026-08',
};

/** 인건비 역산과 대조할 실측 벤치마크 (국내 하이퍼스케일 30~50명/100MW) */
export const CROSSCHECK_BENCHMARK = PERMANENT_PER_100MW[0];

/** 모든 Figure를 한곳에 모아 검증 테스트가 순회할 수 있게 한다. */
export const ALL_FIGURES: readonly (Figure | FigureRange)[] = [
  ...PERMANENT_PER_100MW,
  ...CONSTRUCTION_PER_100MW,
  ULSAN_PERMANENT,
  ULSAN_CLAIMED_EFFECT,
  INDUCED_MULTIPLIER,
  VIRGINIA_INVESTMENT_PER_JOB,
  ANNUAL_WAGE_USD,
];
