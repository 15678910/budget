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
  '광주광역시': '광주광역시',
  '대전광역시': '대전광역시',
  '울산광역시': '울산광역시',
  '세종특별자치시': '세종특별자치시',
  '경기도': '경기도',
  '강원도': '강원특별자치도',
  '충청북도': '충청북도',
  '충청남도': '충청남도',
  '전라북도': '전북특별자치도',
  '전라남도': '전라남도',
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
