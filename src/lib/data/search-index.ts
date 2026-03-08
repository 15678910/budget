import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResult } from 'fuse.js';
import type { BudgetRawItem } from '@/types/budget';

const fuseOptions: IFuseOptions<BudgetRawItem> = {
  keys: [
    { name: 'detailProjectName', weight: 3 },
    { name: 'unitProjectName', weight: 2 },
    { name: 'programName', weight: 2 },
    { name: 'ministryName', weight: 1 },
    { name: 'domainName', weight: 1 },
    { name: 'sectorName', weight: 1 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
};

export function createSearchIndex(items: BudgetRawItem[]): Fuse<BudgetRawItem> {
  return new Fuse(items, fuseOptions);
}

export function searchBudget(
  index: Fuse<BudgetRawItem>,
  query: string,
  limit = 50
): FuseResult<BudgetRawItem>[] {
  return index.search(query, { limit });
}
