import { loadFlatBudget, loadMetadata } from '@/lib/data/load-budget';
import type { BudgetRawItem } from '@/types/budget';
import { DEFAULT_YEAR } from '@/lib/constants';
import { SearchPage } from '@/components/search/SearchPage';

export const metadata = {
  title: '예산 검색 | 마을살림/나라살림',
  description: '대한민국 정부 예산 항목을 검색하세요.',
};

export default function SearchPageRoute() {
  const meta = loadMetadata();
  const years = meta.availableYears;
  const initialYear = years.includes(DEFAULT_YEAR) ? DEFAULT_YEAR : years[years.length - 1];
  const initialItems = loadFlatBudget(initialYear) as BudgetRawItem[];
  return <SearchPage initialYear={initialYear} initialItems={initialItems} metadata={meta} />;
}
