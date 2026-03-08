import { loadFlatBudget, loadMetadata } from '@/lib/data/load-budget';
import type { BudgetRawItem, DatasetMetadata } from '@/types/budget';
import { SearchPage } from '@/components/search/SearchPage';

export const metadata = {
  title: '예산 검색 | 나라살림',
  description: '대한민국 정부 예산 항목을 검색하세요.',
};

export default function SearchPageRoute() {
  const meta = loadMetadata();
  const dataByYear: Record<number, BudgetRawItem[]> = {};
  for (const year of meta.availableYears) {
    dataByYear[year] = loadFlatBudget(year) as BudgetRawItem[];
  }
  return <SearchPage dataByYear={dataByYear} metadata={meta} />;
}
