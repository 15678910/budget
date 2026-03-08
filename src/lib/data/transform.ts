import type { BudgetTreeNode, BudgetComparison } from '@/types/budget';

/**
 * Recursively computes the total value of a tree node.
 * Leaf nodes return their `value`; branch nodes sum their children.
 */
export function calculateTotal(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

/**
 * Builds a comparison array from two root-level BudgetTreeNodes (one per year).
 * Compares each top-level child by name, computing delta and delta-percent.
 * Result is sorted descending by yearB amount.
 */
export function buildComparison(
  dataA: BudgetTreeNode,
  dataB: BudgetTreeNode,
  yearA: number,
  yearB: number
): BudgetComparison[] {
  const childrenA = dataA.children ?? [];
  const childrenB = dataB.children ?? [];

  // Build map from name to total for both years
  const mapA = new Map(childrenA.map(c => [c.name, calculateTotal(c)]));
  const mapB = new Map(childrenB.map(c => [c.name, calculateTotal(c)]));

  // Merge all names
  const allNames = new Set([...mapA.keys(), ...mapB.keys()]);

  const comparisons: BudgetComparison[] = Array.from(allNames).map(name => {
    const amountA = mapA.get(name) ?? 0;
    const amountB = mapB.get(name) ?? 0;
    const delta = amountB - amountA;
    const deltaPercent = amountA > 0 ? (delta / amountA) * 100 : 0;

    return {
      id: name,
      name,
      yearA: { year: yearA, amount: amountA },
      yearB: { year: yearB, amount: amountB },
      delta,
      deltaPercent,
    };
  });

  return comparisons.sort((a, b) => b.yearB.amount - a.yearB.amount);
}
