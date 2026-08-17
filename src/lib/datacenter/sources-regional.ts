/**
 * 지역 영향 관련 출처 상수 (설계문서 §4.4)
 *
 * sources.ts와 분리한 이유는 파일 하나가 지나치게 길어지는 것을 막기 위함이며,
 * 검증 테스트는 두 파일을 같은 규칙으로 순회한다.
 */

import type { Figure, FigureRange } from './types';

// ─── 전력 ─────────────────────────────────────────────────────────────────────

/**
 * 18.4GW를 원전 10여 기로 환산한 발표치.
 * 이 도구는 이 비율(1기 ≈ 1.84GW)을 그대로 써서 임의의 용량을 원전 기수로 바꾼다.
 */
export const NUCLEAR_EQUIVALENT: Figure = {
  value: 1.84,
  unit: 'GW/기',
  label: '원전 1기 상당 용량 (18.4GW ≈ 10여 기 역산)',
  kind: 'derived',
  source: '정부 발표치에서 역산',
  date: '2025-06',
};

/** 데이터센터 이용률 — 발전소와 달리 연중 거의 일정하게 돌아간다. */
export const LOAD_FACTOR: Figure = {
  value: 0.9,
  unit: '비율',
  label: '데이터센터 연간 이용률',
  kind: 'estimated',
  source: '이 도구의 가정',
  date: '2026-08',
};

/** 수도권 집중도 — 전력 계통 부담이 특정 지역에 몰리는 구조를 보여준다. */
export const CAPITAL_CONCENTRATION = {
  datacenters: {
    value: 0.6,
    unit: '비율',
    label: '수도권 데이터센터 집중도',
    kind: 'announced',
    source: '정부 통계',
    date: '2024-12',
  } as Figure,
  powerDemand: {
    value: 0.7,
    unit: '비율',
    label: '수도권 전력수요 집중도',
    kind: 'announced',
    source: '정부 통계',
    date: '2024-12',
  } as Figure,
};

// ─── 용수 ─────────────────────────────────────────────────────────────────────

/**
 * 발표된 클러스터 단위 용수 수요. 해당 클러스터의 정확한 용량이 공개되지 않아
 * 1GW당 원단위로 환산하지 않는다 — 맥락 수치로만 제시한다.
 */
export const WATER_CONTEXT: readonly Figure[] = [
  {
    value: 1_500_000,
    unit: '톤/일',
    label: '용인 클러스터 용수 수요',
    kind: 'announced',
    source: '정부·지자체 발표',
    date: '2025-06',
  },
  {
    value: 650_000,
    unit: '톤/일',
    label: '서남권 용수 수요',
    kind: 'announced',
    source: '정부·지자체 발표',
    date: '2025-06',
  },
  {
    value: 368_000,
    unit: '톤/일',
    label: '영산강·섬진강 장래 물부족 전망량',
    kind: 'announced',
    source: '환경부',
    date: '2025-01',
    note: '데이터센터 수요를 더하기 전의 기존 전망치다',
  },
];

/** 전남 남서부의 섬진강 의존도 — 용수 갈등의 구조적 배경이다. */
export const SEOMJIN_DEPENDENCE: Figure = {
  value: 0.7,
  unit: '비율',
  label: '전남 남서부 섬진강 수계 의존도',
  kind: 'announced',
  source: '환경부',
  date: '2025-01',
};

/** 수랭식 용수 원단위 [추정]. 냉각 방식 비교의 기준값이다. */
export const WATER_INTENSITY: Figure = {
  value: 20_000,
  unit: '톤/일/GW',
  label: '수랭식 1GW 용수 원단위',
  kind: 'estimated',
  source: '이 도구의 가정',
  date: '2026-08',
  note: '국내 시설별 실측 원단위가 공개되지 않아 가정값을 쓴다. 결과 해석 시 이 점을 감안해야 한다',
};

/**
 * 공랭식 전환 시 전력 증가율 [추정].
 * SK 울산이 공랭식 무용수를 표방하므로, 용수를 0으로 만드는 대신 무엇을 더 쓰는지 함께 보여준다.
 */
export const AIR_COOLING_POWER_PENALTY: Figure = {
  value: 0.1,
  unit: '비율',
  label: '공랭식 전환 시 전력 증가율',
  kind: 'estimated',
  source: '이 도구의 가정',
  date: '2026-08',
};

// ─── 탄소 ─────────────────────────────────────────────────────────────────────

/** 2035년까지 누적 추가 탄소 배출 추산치 (18.4GW 기준) */
export const CUMULATIVE_CARBON_2035: Figure = {
  value: 85_000_000,
  unit: '톤CO2',
  label: '2035년까지 누적 추가 탄소 배출 (18.4GW)',
  kind: 'measured',
  source: '환경단체 추산',
  date: '2025-08',
  note: '연간 국가 감축목표의 약 10%에 해당한다',
};

/** 전력 1MWh당 배출계수 */
export const GRID_EMISSION_FACTOR: Figure = {
  value: 0.4594,
  unit: '톤CO2/MWh',
  label: '국가 전력 배출계수',
  kind: 'measured',
  source: '국가 온실가스 통계',
  date: '2024-12',
};

// ─── 부지 ─────────────────────────────────────────────────────────────────────

/** 1GW당 필요 부지. 정부 최소치와 해남 실사례가 범위의 양 끝이다. */
export const LAND_PER_GW: FigureRange = {
  low: 300_000,
  high: 400_000,
  unit: '평/GW',
  label: '1GW당 필요 부지',
  kind: 'announced',
  source: '정부 최소치 30만 평 / 해남 3GW=120만 평 실사례',
  date: '2025-06',
};

/** 농지 전용 비율 [추정]. 입지에 따라 크게 달라지므로 파라미터로 노출한다. */
export const FARMLAND_RATIO_DEFAULT = 0.5;

// ─── 생활환경 ─────────────────────────────────────────────────────────────────

export const NOISE_LEVEL: Figure = {
  value: 97,
  unit: 'dB',
  label: '데이터센터 인근 측정 소음',
  kind: 'measured',
  source: '주민 측정',
  date: '2024-06',
  note: '지하철 소음(80dB)보다 높은 수준이다',
};

export const TEMPERATURE_RISE: FigureRange = {
  low: 2,
  high: 9.11,
  unit: '℃',
  label: '주변 온도 상승 (평균~최대)',
  kind: 'measured',
  source: '열섬 측정 연구',
  date: '2024-06',
};

/** 시설 1개 기준 연간 건강피해 비용 */
export const HEALTH_COST_PER_SITE: FigureRange = {
  low: 3.0e7,
  high: 9.9e7,
  unit: 'USD/년',
  label: '연간 건강피해 비용 (시설 1개)',
  kind: 'measured',
  source: '미국 보건영향 연구',
  date: '2024-01',
};

export const PREMATURE_DEATHS_PER_SITE: FigureRange = {
  low: 3.4,
  high: 6.5,
  unit: '명/년',
  label: '연간 조기사망 추정 (시설 1개)',
  kind: 'measured',
  source: '미국 보건영향 연구',
  date: '2024-01',
};

// ─── 송전 ─────────────────────────────────────────────────────────────────────

/** 11차 송변전설비계획의 실측 지연 비율 */
export const GRID_DELAY_RATE: Figure = {
  value: 0.56,
  unit: '비율',
  label: '11차 송변전계획 변전설비 지연 비율 (25개 중 14개)',
  kind: 'measured',
  source: '11차 장기 송변전설비계획 점검',
  date: '2025-06',
  note: '전체 54개 사업 기준으로는 30% 이상이 지연됐다',
};

/** 지연된 사업의 통상 지연 기간 [추정] */
export const TYPICAL_DELAY_YEARS: Figure = {
  value: 2,
  unit: '년',
  label: '송전 사업 통상 지연 기간',
  kind: 'estimated',
  source: '이 도구의 가정',
  date: '2026-08',
};

/** 동해안~수도권 HVDC 지연에 따른 연간 손실 추산 */
export const HVDC_DELAY_COST: Figure = {
  value: 3.0e11,
  unit: 'KRW/년',
  label: '동해안~수도권 HVDC 지연 손실',
  kind: 'estimated',
  source: '전력계통 분석',
  date: '2025-06',
};

// ─── 부동산 (양방향 증거) ─────────────────────────────────────────────────────

/**
 * 가격 영향에 관한 실증 연구 결과.
 * 통념과 반대 방향의 증거이며, 균형 잡힌 도구가 되려면 반드시 포함해야 한다 (설계문서 §2.6).
 */
export const PROPERTY_PRICE_EVIDENCE: Figure = {
  value: 0,
  unit: '방향',
  label: '데이터센터 인근 주택가격 하락 근거',
  kind: 'measured',
  source: '미국 실증 연구 2건',
  date: '2024-01',
  note: '하락 근거가 확인되지 않았고, 버지니아에서는 오히려 더 높게 거래됐다',
};

/** 주민이 실제 비용으로 지목하는 항목 — 가격과 생활환경의 비대칭을 그대로 보여준다. */
export const RESIDENT_CONCERNS: readonly string[] = [
  '소음 (측정 97dB)',
  '송전선로 경관·건강 우려',
  '전기요금 인상',
];

export const ALL_REGIONAL_FIGURES: readonly (Figure | FigureRange)[] = [
  NUCLEAR_EQUIVALENT,
  LOAD_FACTOR,
  CAPITAL_CONCENTRATION.datacenters,
  CAPITAL_CONCENTRATION.powerDemand,
  ...WATER_CONTEXT,
  SEOMJIN_DEPENDENCE,
  WATER_INTENSITY,
  AIR_COOLING_POWER_PENALTY,
  CUMULATIVE_CARBON_2035,
  GRID_EMISSION_FACTOR,
  LAND_PER_GW,
  NOISE_LEVEL,
  TEMPERATURE_RISE,
  HEALTH_COST_PER_SITE,
  PREMATURE_DEATHS_PER_SITE,
  GRID_DELAY_RATE,
  TYPICAL_DELAY_YEARS,
  HVDC_DELAY_COST,
  PROPERTY_PRICE_EVIDENCE,
];
