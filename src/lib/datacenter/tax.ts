/**
 * 지방세수 — 법정 세율 기반 분해 계산 (설계문서 §4.5)
 *
 * 국내 데이터센터의 실제 지방세 납부액은 공개 사례가 없다. 따라서 법정 세율에서 직접
 * 계산하고 전체를 [추정]으로 표시한다. 계산 과정을 모두 노출해 사용자가 검증할 수 있게 한다.
 *
 * 핵심은 과세표준 분해다 — 지방세법상 재산세 과세대상은 토지·건축물·주택·선박·항공기이며
 * 서버와 GPU는 여기에 해당하지 않는다. 투자액이 아무리 커도 세수는 그 일부에만 붙는다.
 */

import { USD_KRW } from './constants';
import { LAND_PER_GW } from './sources-regional';

export interface TaxAssumptions {
  /** 취득세율 (일회성) */
  acquisitionTaxRate: number;
  /** 재산세율 — 건축물 */
  propertyTaxBuildingRate: number;
  /** 재산세율 — 별도합산토지 (법정 0.2~0.4%) */
  propertyTaxLandRate: number;
  /** 지역자원시설세율 — 특정부동산 (법정 0.04~0.12%) */
  regionalResourceTaxRate: number;
  /** 지방교육세 = 재산세 × 이 비율 */
  localEducationTaxRate: number;

  /** 시가표준액 ÷ 취득가액 [추정] */
  taxableBaseRatio: number;
  /** 산업단지·기회발전특구 취득세 감면율 */
  acquisitionTaxExemption: number;
  /** 네트워크·기타 15% 중 과세대상 비율 [추정] — 변전설비·배관 등 건축물 부속분 */
  otherTaxableRatio: number;
  /** 부지 단가 [추정] */
  landPricePerPyeongKrw: number;
}

export const DEFAULT_TAX: TaxAssumptions = {
  acquisitionTaxRate: 0.04,
  propertyTaxBuildingRate: 0.0025,
  propertyTaxLandRate: 0.003,
  regionalResourceTaxRate: 0.0008,
  localEducationTaxRate: 0.2,

  taxableBaseRatio: 0.7,
  acquisitionTaxExemption: 0.5,
  otherTaxableRatio: 0.3,
  landPricePerPyeongKrw: 500_000,
};

export interface TaxBase {
  /** 총 투자비 (원) */
  capexKrw: number;
  /** 서버·GPU — 지방세 과세대상이 아니다 */
  serverKrw: number;
  /** 건축물 — 전액 과세 */
  buildingKrw: number;
  /** 네트워크·기타 중 과세대상분 */
  otherTaxableKrw: number;
  /** 과세대상 합계 */
  taxableKrw: number;
  /** 과세대상 비율 — 투자액 중 실제로 세금이 붙는 몫 */
  taxableShare: number;
  /** 부지 평가액 (CAPEX에 계상되지 않아 별도 산출) */
  landValueKrw: number;
}

export interface TaxResult {
  base: TaxBase;
  /** 일회성 세수 */
  acquisitionTaxKrw: number;
  /** 연간 세수 항목별 */
  propertyTaxBuildingKrw: number;
  propertyTaxLandKrw: number;
  regionalResourceTaxKrw: number;
  localEducationTaxKrw: number;
  annualTotalKrw: number;
  /** 투자액 대비 비율 */
  oneTimePerCapex: number;
  annualPerCapex: number;
  /** 상시 일자리 1개당 연간 세수 */
  annualPerJobKrw: number | null;
}

function assertRatio(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0 || v > 1) {
    throw new Error(`${name}는 0~1이어야 합니다: ${v}`);
  }
}

/**
 * 지방세수를 계산한다.
 *
 * @param capexUsd 총 투자비
 * @param capexSplitServer 서버·GPU 비중 (과세대상에서 제외된다)
 * @param capexSplitBuilding 건축물 비중 (전액 과세)
 * @param capacityGw 부지 면적 산출용 용량
 * @param permanentJobs 일자리당 세수를 내기 위한 상시 고용 (없으면 null)
 */
export function localTax(
  capexUsd: number,
  capexSplitServer: number,
  capexSplitBuilding: number,
  capacityGw: number,
  permanentJobs: number | null = null,
  a: TaxAssumptions = DEFAULT_TAX,
): TaxResult {
  if (!Number.isFinite(capexUsd) || capexUsd <= 0) {
    throw new Error(`CAPEX는 양수여야 합니다: ${capexUsd}`);
  }
  if (capacityGw <= 0) throw new Error(`용량은 양수여야 합니다: ${capacityGw}`);
  assertRatio('서버 비중', capexSplitServer);
  assertRatio('건축물 비중', capexSplitBuilding);
  assertRatio('시가표준액 비율', a.taxableBaseRatio);
  assertRatio('취득세 감면율', a.acquisitionTaxExemption);
  assertRatio('기타 과세 비율', a.otherTaxableRatio);

  const capexKrw = capexUsd * USD_KRW;
  const serverKrw = capexKrw * capexSplitServer;
  const buildingKrw = capexKrw * capexSplitBuilding;
  // 나머지가 네트워크·기타다. 그중 건축물에 부속되는 부분만 과세대상이 된다고 본다.
  const otherKrw = capexKrw - serverKrw - buildingKrw;
  const otherTaxableKrw = otherKrw * a.otherTaxableRatio;
  const taxableKrw = buildingKrw + otherTaxableKrw;

  // 부지는 CAPEX에 계상되지 않으므로 면적 × 단가로 따로 잡는다.
  const landPyeong = LAND_PER_GW.high * capacityGw;
  const landValueKrw = landPyeong * a.landPricePerPyeongKrw;

  // 취득세는 취득가액 기준, 재산세는 시가표준액 기준이다.
  const acquisitionTaxKrw =
    taxableKrw * a.acquisitionTaxRate * (1 - a.acquisitionTaxExemption);

  const assessedKrw = taxableKrw * a.taxableBaseRatio;
  const propertyTaxBuildingKrw = assessedKrw * a.propertyTaxBuildingRate;
  const propertyTaxLandKrw = landValueKrw * a.propertyTaxLandRate;
  const regionalResourceTaxKrw = assessedKrw * a.regionalResourceTaxRate;
  const localEducationTaxKrw =
    (propertyTaxBuildingKrw + propertyTaxLandKrw) * a.localEducationTaxRate;

  const annualTotalKrw =
    propertyTaxBuildingKrw +
    propertyTaxLandKrw +
    regionalResourceTaxKrw +
    localEducationTaxKrw;

  return {
    base: {
      capexKrw,
      serverKrw,
      buildingKrw,
      otherTaxableKrw,
      taxableKrw,
      taxableShare: taxableKrw / capexKrw,
      landValueKrw,
    },
    acquisitionTaxKrw,
    propertyTaxBuildingKrw,
    propertyTaxLandKrw,
    regionalResourceTaxKrw,
    localEducationTaxKrw,
    annualTotalKrw,
    oneTimePerCapex: acquisitionTaxKrw / capexKrw,
    annualPerCapex: annualTotalKrw / capexKrw,
    annualPerJobKrw: permanentJobs && permanentJobs > 0 ? annualTotalKrw / permanentJobs : null,
  };
}
