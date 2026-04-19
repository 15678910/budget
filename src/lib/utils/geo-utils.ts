import { BudgetTreeNode } from '@/types/budget';
import { METRO_POPULATION } from '@/lib/utils/extract-entity';

/**
 * Maps GeoJSON region names to budget data region names.
 * Two names differ: 강원도→강원특별자치도, 전라북도→전북특별자치도
 */
export const GEO_TO_BUDGET_NAME: Record<string, string> = {
  '서울특별시': '서울특별시',
  '부산광역시': '부산광역시',
  '대구광역시': '대구광역시',
  '인천광역시': '인천광역시',
  '광주광역시': '전남광주통합특별시',
  '대전광역시': '대전광역시',
  '울산광역시': '울산광역시',
  '세종특별자치시': '세종특별자치시',
  '경기도': '경기도',
  '강원도': '강원특별자치도',
  '충청북도': '충청북도',
  '충청남도': '충청남도',
  '전라북도': '전북특별자치도',
  '전라남도': '전남광주통합특별시',
  '경상북도': '경상북도',
  '경상남도': '경상남도',
  '제주특별자치도': '제주특별자치도',
};

/**
 * Converts a GeoJSON region name to the budget data region name.
 * Returns the original name if no mapping exists.
 */
export function geoNameToBudgetName(geoName: string): string {
  return GEO_TO_BUDGET_NAME[geoName] ?? geoName;
}

/** Metric type for Korea map visualization */
export type MapMetric = 'totalBudget' | 'perCapita' | 'yoyChange';

function calculateNodeTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateNodeTotal(child), 0);
}

/**
 * Computes per-region metric values from metro budget tree data.
 *
 * @param metroData - Current year metro budget tree (root node with metro children)
 * @param prevYearMetroData - Previous year metro budget tree (used for yoyChange metric)
 * @param metric - The metric to compute
 * @returns Map from budget region name to metric value
 */
export function computeRegionMetrics(
  metroData: BudgetTreeNode,
  prevYearMetroData: BudgetTreeNode | null,
  metric: MapMetric
): Map<string, number> {
  const result = new Map<string, number>();

  const metroNodes = metroData.children ?? [];

  for (const metroNode of metroNodes) {
    const budgetName = metroNode.name;
    const total = calculateNodeTotal(metroNode);

    if (metric === 'totalBudget') {
      result.set(budgetName, total);
    } else if (metric === 'perCapita') {
      const population = METRO_POPULATION[budgetName] ?? 0;
      const perCapita = population > 0 ? total / population : 0;
      result.set(budgetName, perCapita);
    } else if (metric === 'yoyChange') {
      if (prevYearMetroData) {
        const prevNode = prevYearMetroData.children?.find(c => c.name === budgetName);
        const prevTotal = prevNode ? calculateNodeTotal(prevNode) : 0;
        const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
        result.set(budgetName, change);
      } else {
        result.set(budgetName, 0);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Province code <-> Budget name mapping (for district drill-down)
// ---------------------------------------------------------------------------

/** Maps budget metro name to province code (used in TopoJSON municipality data) */
export const BUDGET_NAME_TO_PROVINCE_CODE: Record<string, string> = {
  '서울특별시': '11',
  '부산광역시': '21',
  '대구광역시': '22',
  '인천광역시': '23',
  '대전광역시': '25',
  '울산광역시': '26',
  '세종특별자치시': '29',
  '경기도': '31',
  '강원특별자치도': '32',
  '충청북도': '33',
  '충청남도': '34',
  '전북특별자치도': '35',
  '전남광주통합특별시': '24', // 구 광주광역시 코드 사용 (지도 매칭용)
  '경상북도': '37',
  '경상남도': '38',
  '제주특별자치도': '39',
};

/**
 * Explicit geo-name -> budget-name mapping for districts with name changes.
 * Key format: "provinceCode::geoName" -> budgetName
 * Handles:
 * - 인천 남구 → 미추홀구 (renamed 2018)
 * - 청원군 → 청주시 (merged into 청주시 in 2014)
 */
const DISTRICT_RENAME_MAP: Record<string, string> = {
  '23::남구': '미추홀구',
  '33::청원군': '청주시',
};

/**
 * Match a TopoJSON municipality name to a budget district name.
 * Handles:
 * 1. Exact match (종로구 → 종로구)
 * 2. Explicit rename (남구 → 미추홀구 for Incheon)
 * 3. Prefix match for split cities (용인시수지구 → 용인시, 포항시북구 → 포항시)
 *
 * @param geoName - Name from TopoJSON (e.g., "종로구", "용인시수지구")
 * @param provinceCode - 2-digit province code (e.g., "11", "31")
 * @param budgetDistrictNames - Array of budget district names for this metro
 * @returns Matched budget district name, or null if no match
 */
export function matchDistrictName(
  geoName: string,
  provinceCode: string,
  budgetDistrictNames: string[],
): string | null {
  // 1. Exact match
  if (budgetDistrictNames.includes(geoName)) return geoName;

  // 2. Explicit rename mapping
  const renameKey = `${provinceCode}::${geoName}`;
  const renamed = DISTRICT_RENAME_MAP[renameKey];
  if (renamed && budgetDistrictNames.includes(renamed)) return renamed;

  // 3. Prefix match: TopoJSON "용인시수지구" → budget "용인시"
  // Find budget name that is a prefix of the geo name
  for (const budgetName of budgetDistrictNames) {
    if (budgetName !== '본청' && geoName.startsWith(budgetName)) {
      return budgetName;
    }
  }

  return null;
}
