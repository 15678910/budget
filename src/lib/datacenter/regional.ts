/**
 * 지역 영향 — 전력·용수·탄소·부지·생활환경·송전 (설계문서 §4.4)
 *
 * 이 레이어는 재무 레이어와 자동으로 결합되지 않는다. 송전 지연이 회수기간에 미치는 영향을
 * 보려면 사용자가 FinanceAssumptions.commissioningDelayYears에 직접 값을 넣어야 한다.
 * 레이어 간 숨은 의존을 만들지 않기 위한 의도적 설계다.
 */

import {
  AIR_COOLING_POWER_PENALTY,
  CUMULATIVE_CARBON_2035,
  GRID_DELAY_RATE,
  GRID_EMISSION_FACTOR,
  HEALTH_COST_PER_SITE,
  LAND_PER_GW,
  LOAD_FACTOR,
  NOISE_LEVEL,
  NUCLEAR_EQUIVALENT,
  PREMATURE_DEATHS_PER_SITE,
  PROPERTY_PRICE_EVIDENCE,
  RESIDENT_CONCERNS,
  TEMPERATURE_RISE,
  TYPICAL_DELAY_YEARS,
  WATER_CONTEXT,
  WATER_INTENSITY,
  FARMLAND_RATIO_DEFAULT,
} from './sources-regional';

/** 냉각 방식. 공랭식은 용수를 0으로 만드는 대신 전력을 늘린다. */
export type Cooling = 'water' | 'air';

/** 1평 = 3.305785㎡ */
const PYEONG_TO_M2 = 3.305785;
/** 축구장 1면 (105m × 68m) */
const FOOTBALL_FIELD_M2 = 7140;
/** 여의도 면적 (윤중로 제방 안쪽 기준) */
const YEOUIDO_KM2 = 2.9;

function assertCapacity(capacityGw: number): void {
  if (!Number.isFinite(capacityGw) || capacityGw <= 0) {
    throw new Error(`용량은 양수여야 합니다: ${capacityGw}`);
  }
}

export interface PowerImpact {
  capacityGw: number;
  /** 원전 기수 환산 */
  nuclearUnits: number;
  /** 연간 전력 소비량 */
  annualTwh: number;
  cooling: Cooling;
  /** 공랭식 선택으로 늘어난 전력 (수랭식 대비) */
  coolingPenaltyTwh: number;
}

export function powerImpact(capacityGw: number, cooling: Cooling = 'water'): PowerImpact {
  assertCapacity(capacityGw);

  const baseTwh = (capacityGw * 8760 * LOAD_FACTOR.value) / 1000;
  const penalty = cooling === 'air' ? baseTwh * AIR_COOLING_POWER_PENALTY.value : 0;

  return {
    capacityGw,
    nuclearUnits: capacityGw / NUCLEAR_EQUIVALENT.value,
    annualTwh: baseTwh + penalty,
    cooling,
    coolingPenaltyTwh: penalty,
  };
}

export interface WaterImpact {
  cooling: Cooling;
  /** 일일 용수 수요. 공랭식은 0이다 */
  dailyTons: number;
  /** 영산강·섬진강 장래 물부족 전망량 대비 비율 */
  shareOfProjectedShortage: number;
  /** 발표된 클러스터 단위 맥락 수치 */
  context: typeof WATER_CONTEXT;
}

/**
 * 공랭식은 용수를 0으로 만든다. 다만 그 대가로 전력이 늘어나므로
 * powerImpact와 함께 읽어야 한다 — 무용수는 공짜가 아니다.
 */
export function waterImpact(capacityGw: number, cooling: Cooling = 'water'): WaterImpact {
  assertCapacity(capacityGw);

  const dailyTons = cooling === 'air' ? 0 : capacityGw * WATER_INTENSITY.value;
  const shortage = WATER_CONTEXT[2].value;

  return {
    cooling,
    dailyTons,
    shareOfProjectedShortage: dailyTons / shortage,
    context: WATER_CONTEXT,
  };
}

export interface CarbonImpact {
  annualTons: number;
  /** 발표된 2035 누적 추산치를 같은 용량으로 환산한 값 */
  cumulative2035Tons: number;
  gridFactor: number;
}

export function carbonImpact(
  capacityGw: number,
  cooling: Cooling = 'water',
  gridFactor: number = GRID_EMISSION_FACTOR.value,
): CarbonImpact {
  assertCapacity(capacityGw);
  if (gridFactor < 0) throw new Error(`배출계수는 음수일 수 없습니다: ${gridFactor}`);

  const twh = powerImpact(capacityGw, cooling).annualTwh;
  // 누적 추산치는 18.4GW 기준이므로 용량 비례로 환산한다 (선형 가정).
  const cumulative = CUMULATIVE_CARBON_2035.value * (capacityGw / 18.4);

  return {
    annualTons: twh * 1e6 * gridFactor,
    cumulative2035Tons: cumulative,
    gridFactor,
  };
}

export interface LandImpact {
  pyeongLow: number;
  pyeongHigh: number;
  km2Low: number;
  km2High: number;
  footballFields: number;
  yeouidoRatio: number;
  /** 농지 전용 면적 (평) — 입지에 따라 달라지므로 비율을 파라미터로 받는다 */
  farmlandPyeong: number;
}

export function landImpact(
  capacityGw: number,
  farmlandRatio: number = FARMLAND_RATIO_DEFAULT,
): LandImpact {
  assertCapacity(capacityGw);
  if (farmlandRatio < 0 || farmlandRatio > 1) {
    throw new Error(`농지 비율은 0~1이어야 합니다: ${farmlandRatio}`);
  }

  const pyeongLow = LAND_PER_GW.low * capacityGw;
  const pyeongHigh = LAND_PER_GW.high * capacityGw;
  const m2High = pyeongHigh * PYEONG_TO_M2;

  return {
    pyeongLow,
    pyeongHigh,
    km2Low: (pyeongLow * PYEONG_TO_M2) / 1e6,
    km2High: m2High / 1e6,
    footballFields: m2High / FOOTBALL_FIELD_M2,
    yeouidoRatio: m2High / 1e6 / YEOUIDO_KM2,
    farmlandPyeong: pyeongHigh * farmlandRatio,
  };
}

export interface AmenityImpact {
  noiseDb: number;
  tempRiseAvg: number;
  tempRiseMax: number;
  healthCostLowUsd: number;
  healthCostHighUsd: number;
  prematureDeathsLow: number;
  prematureDeathsHigh: number;
  /** 환산 기준이 된 시설 수 (1GW를 1개 시설로 본다) */
  siteEquivalent: number;
}

/**
 * 생활환경 영향. 건강피해는 시설 1개 기준 실측치를 용량 비례로 확대한 값이므로
 * 확대 부분은 추정이다 — 소음·온도는 확대하지 않고 측정값 그대로 낸다.
 */
export function amenityImpact(capacityGw: number): AmenityImpact {
  assertCapacity(capacityGw);
  const sites = capacityGw;

  return {
    noiseDb: NOISE_LEVEL.value,
    tempRiseAvg: TEMPERATURE_RISE.low,
    tempRiseMax: TEMPERATURE_RISE.high,
    healthCostLowUsd: HEALTH_COST_PER_SITE.low * sites,
    healthCostHighUsd: HEALTH_COST_PER_SITE.high * sites,
    prematureDeathsLow: PREMATURE_DEATHS_PER_SITE.low * sites,
    prematureDeathsHigh: PREMATURE_DEATHS_PER_SITE.high * sites,
    siteEquivalent: sites,
  };
}

export interface GridRisk {
  delayRate: number;
  typicalDelayYears: number;
  /** 지연 확률과 통상 지연 기간을 곱한 기대 지연 연수 */
  expectedDelayYears: number;
}

/**
 * 11차 송변전계획의 실측 지연율을 적용해 기대 지연 연수를 낸다.
 *
 * 이 값은 재무 모델에 자동으로 들어가지 않는다. "가동이 N년 늦으면 회수기간이 어떻게 되는가"는
 * 사용자가 가정 조절에서 직접 넣어 확인한다.
 */
export function gridRisk(): GridRisk {
  return {
    delayRate: GRID_DELAY_RATE.value,
    typicalDelayYears: TYPICAL_DELAY_YEARS.value,
    expectedDelayYears: GRID_DELAY_RATE.value * TYPICAL_DELAY_YEARS.value,
  };
}

export interface PropertyEffect {
  /** 가격에 관한 실증 연구 결과 */
  priceEvidence: string;
  /** 주민이 실제 비용으로 지목하는 항목 */
  residentConcerns: readonly string[];
}

/**
 * 양방향 증거를 모두 반환한다. 어느 쪽으로도 단정하지 않는다 —
 * 가격은 중립~긍정, 생활환경은 부정이라는 비대칭이 이 사안의 실제 모습이다.
 */
export function propertyEffect(): PropertyEffect {
  return {
    priceEvidence: PROPERTY_PRICE_EVIDENCE.note ?? '',
    residentConcerns: RESIDENT_CONCERNS,
  };
}
