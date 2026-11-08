import { loadFlatBudget, loadMetadata } from '@/lib/data/load-budget';
import type { BudgetRawItem } from '@/types/budget';
import { DEFAULT_YEAR } from '@/lib/constants';
import { TablePageWrapper } from '@/components/table/TablePageWrapper';

export const metadata = {
  title: '예산 테이블 | 마을살림/나라살림',
  description: '대한민국 정부 예산 계층 구조를 테이블로 확인하세요.',
};

export default function TablePageRoute() {
  const meta = loadMetadata();
  const years = meta.availableYears;
  const initialYear = years.includes(DEFAULT_YEAR) ? DEFAULT_YEAR : years[years.length - 1];
  const initialItems = loadFlatBudget(initialYear) as BudgetRawItem[];
  return (
    <TablePageWrapper
      initialYear={initialYear}
      initialItems={initialItems}
      availableYears={years}
    />
  );
}
