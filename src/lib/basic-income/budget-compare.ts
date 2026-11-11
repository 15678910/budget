/** 연간 필요액을 2027 예산 분야별 규모와 나란히 놓는다. ratio = 필요액 ÷ 분야 예산. */
import type { BudgetComparison, BudgetSector } from './types';

export function compareToBudget(annualNeed: number, sectors: readonly BudgetSector[]): BudgetComparison[] {
  return sectors
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((s) => ({ id: s.id, label: s.label, amount: s.amount, ratio: annualNeed / s.amount }));
}
