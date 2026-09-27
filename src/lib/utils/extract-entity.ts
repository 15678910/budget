import { BudgetTreeNode } from '@/types/budget';

// 2026년 기준 주민등록인구 (통계청, 단위: 명)
export const METRO_POPULATION: Record<string, number> = {
  '서울특별시': 9_411_000,
  '부산광역시': 3_298_000,
  '대구광역시': 2_365_000,
  '인천광역시': 2_988_000,
  '광주광역시': 1_431_000,
  '대전광역시': 1_446_000,
  '울산광역시': 1_104_000,
  '세종특별자치시': 398_000,
  '경기도': 13_636_000,
  '강원특별자치도': 1_533_000,
  '충청북도': 1_595_000,
  '충청남도': 2_122_000,
  '전북특별자치도': 1_761_000,
  '전라남도': 1_804_000,
  '경상북도': 2_577_000,
  '경상남도': 3_262_000,
  '제주특별자치도': 678_000,
};

// 교육청 관할 인구 (해당 시도 인구와 동일)
const EDUCATION_METRO_MAP: Record<string, string> = {
  '서울특별시교육청': '서울특별시',
  '부산광역시교육청': '부산광역시',
  '대구광역시교육청': '대구광역시',
  '인천광역시교육청': '인천광역시',
  '광주광역시교육청': '광주광역시',
  '대전광역시교육청': '대전광역시',
  '울산광역시교육청': '울산광역시',
  '세종특별자치시교육청': '세종특별자치시',
  '경기도교육청': '경기도',
  '강원특별자치도교육청': '강원특별자치도',
  '충청북도교육청': '충청북도',
  '충청남도교육청': '충청남도',
  '전북특별자치도교육청': '전북특별자치도',
  '전라남도교육청': '전라남도',
  '경상북도교육청': '경상북도',
  '경상남도교육청': '경상남도',
  '제주특별자치도교육청': '제주특별자치도',
};

/** Get population for a metro area */
export function getMetroPopulation(metroName: string): number {
  return METRO_POPULATION[metroName] ?? 0;
}

/** Get population for an education office (same as parent metro) */
export function getEducationPopulation(officeName: string): number {
  const metro = EDUCATION_METRO_MAP[officeName];
  return metro ? (METRO_POPULATION[metro] ?? 0) : 0;
}

export interface EntityData {
  name: string;
  totalAmount: number;  // in 백만원
  population: number;   // 인구 (명)
  categories: { name: string; amount: number }[];
}

export interface EntityComparison {
  categoryName: string;
  amountA: number;
  amountB: number;
  delta: number;         // B - A
  ratio: number;         // max(A,B) / min(A,B), or 0 if min is 0
  shareA: number;        // percentage of A's total (0-100)
  shareB: number;        // percentage of B's total (0-100)
}

function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/** Extract a metro entity from metro tree */
export function extractMetroEntity(tree: BudgetTreeNode, metroName: string): EntityData | null {
  const metroNode = tree.children?.find(c => c.name === metroName);
  if (!metroNode) return null;

  const categories = (metroNode.children || []).map(c => ({
    name: c.name,
    amount: calculateTotal(c),
  })).sort((a, b) => b.amount - a.amount);

  return {
    name: metroName,
    totalAmount: categories.reduce((sum, c) => sum + c.amount, 0),
    population: getMetroPopulation(metroName),
    categories,
  };
}

/** Extract a district entity from district tree */
export function extractDistrictEntity(
  tree: BudgetTreeNode,
  metroName: string,
  districtName: string
): EntityData | null {
  const metroNode = tree.children?.find(c => c.name === metroName);
  if (!metroNode) return null;

  const districtNode = metroNode.children?.find(c => c.name === districtName);
  if (!districtNode) return null;

  const categories = (districtNode.children || []).map(c => ({
    name: c.name,
    amount: calculateTotal(c),
  })).sort((a, b) => b.amount - a.amount);

  // District population: approximate as metro population / number of districts
  const numDistricts = metroNode.children?.length ?? 1;
  const metroPop = getMetroPopulation(metroName);
  const districtPop = Math.round(metroPop / numDistricts);

  return {
    name: `${metroName} ${districtName}`,
    totalAmount: categories.reduce((sum, c) => sum + c.amount, 0),
    population: districtPop,
    categories,
  };
}

/** Extract an education office entity from education tree */
export function extractEducationEntity(tree: BudgetTreeNode, officeName: string): EntityData | null {
  const officeNode = tree.children?.find(c => c.name === officeName);
  if (!officeNode) return null;

  const categories = (officeNode.children || []).map(c => ({
    name: c.name,
    amount: calculateTotal(c),
  })).sort((a, b) => b.amount - a.amount);

  return {
    name: officeName,
    totalAmount: categories.reduce((sum, c) => sum + c.amount, 0),
    population: getEducationPopulation(officeName),
    categories,
  };
}

/** Get all metro names from metro tree */
export function getMetroNames(tree: BudgetTreeNode): string[] {
  return (tree.children || []).map(c => c.name);
}

/** Get all district names under a metro from district tree, sorted in Korean alphabetical order */
export function getDistrictNames(tree: BudgetTreeNode, metroName: string): string[] {
  const metroNode = tree.children?.find(c => c.name === metroName);
  return (metroNode?.children || []).map(c => c.name).sort((a, b) => a.localeCompare(b, 'ko'));
}

/** Get all education office names from education tree */
export function getEducationNames(tree: BudgetTreeNode): string[] {
  return (tree.children || []).map(c => c.name);
}

/** Build comparison between two entities */
export function buildEntityComparison(entityA: EntityData, entityB: EntityData): EntityComparison[] {
  // Merge all category names from both
  const allCategories = new Set<string>();
  entityA.categories.forEach(c => allCategories.add(c.name));
  entityB.categories.forEach(c => allCategories.add(c.name));

  const mapA = new Map(entityA.categories.map(c => [c.name, c.amount]));
  const mapB = new Map(entityB.categories.map(c => [c.name, c.amount]));

  const comparisons: EntityComparison[] = [];
  for (const name of allCategories) {
    const amountA = mapA.get(name) ?? 0;
    const amountB = mapB.get(name) ?? 0;
    const delta = amountB - amountA;
    const minVal = Math.min(amountA, amountB);
    const maxVal = Math.max(amountA, amountB);
    const ratio = minVal > 0 ? maxVal / minVal : 0;
    const shareA = entityA.totalAmount > 0 ? (amountA / entityA.totalAmount) * 100 : 0;
    const shareB = entityB.totalAmount > 0 ? (amountB / entityB.totalAmount) * 100 : 0;

    comparisons.push({ categoryName: name, amountA, amountB, delta, ratio, shareA, shareB });
  }

  // Sort by max(amountA, amountB) descending
  comparisons.sort((a, b) => Math.max(b.amountA, b.amountB) - Math.max(a.amountA, a.amountB));

  return comparisons;
}
