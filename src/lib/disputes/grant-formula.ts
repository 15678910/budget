/**
 * 지방교육재정교부금 산식 (2027년 정부 개정안)
 *
 *   전년도 교부금
 *     × (1 + 3년 연평균 경상성장률)
 *     × [1 + (3년 연평균 학령인구 변화율 × 반영률)]
 *
 * 국가재정운용계획 17쪽에 실린 산식을 그대로 옮긴다.
 * 감소분 보전 규정에 따라 결과가 전년보다 적으면 전년 금액을 유지한다.
 */

/** 폐지 대상인 현행 내국세 연동 비율 */
export const LEGACY_LINK_RATE = 0.2079;

export interface GrantInput {
  /** 전년도 교부금 (조원) */
  previousGrantJo: number;
  /** 3년 연평균 경상성장률. 0.05 = 5% */
  nominalGrowth: number;
  /** 3년 연평균 학령인구 변화율. -0.03 = 3% 감소 */
  schoolAgeChange: number;
  /** 학령인구 반영률. 정부안은 0.35 */
  reflectRate: number;
  /** 비교용 내국세 총액 (조원). 주면 기존 연동 방식 결과를 함께 낸다 */
  internalTaxJo?: number;
}

export interface GrantResult {
  /** 하한 적용 후 최종 교부금 (조원) */
  grantJo: number;
  /** 하한 적용 전 산식 결과 (조원) */
  rawJo: number;
  floorApplied: boolean;
  /** 기존 20.79% 연동 시 금액. internalTaxJo를 주지 않으면 null */
  legacyJo: number | null;
  /** 기존 방식 대비 차액. 음수면 새 산식이 적다 */
  gapJo: number | null;
}

export function computeGrant(input: GrantInput): GrantResult {
  const { previousGrantJo, nominalGrowth, schoolAgeChange, reflectRate, internalTaxJo } = input;

  if (!Number.isFinite(previousGrantJo) || previousGrantJo <= 0) {
    throw new Error(`전년도 교부금은 양수여야 합니다: ${previousGrantJo}`);
  }
  if (!Number.isFinite(reflectRate) || reflectRate < 0 || reflectRate > 1) {
    throw new Error(`반영률은 0 이상 1 이하여야 합니다: ${reflectRate}`);
  }
  if (!Number.isFinite(nominalGrowth) || !Number.isFinite(schoolAgeChange)) {
    throw new Error('경상성장률과 학령인구 변화율은 유한한 수여야 합니다');
  }

  const rawJo = previousGrantJo * (1 + nominalGrowth) * (1 + schoolAgeChange * reflectRate);
  const floorApplied = rawJo < previousGrantJo;
  const grantJo = floorApplied ? previousGrantJo : rawJo;

  const legacyJo = internalTaxJo === undefined ? null : internalTaxJo * LEGACY_LINK_RATE;

  return {
    grantJo,
    rawJo,
    floorApplied,
    legacyJo,
    gapJo: legacyJo === null ? null : grantJo - legacyJo,
  };
}
