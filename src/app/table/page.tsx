import { loadFlatBudget, loadMetadata } from '@/lib/data/load-budget';
import type { BudgetRawItem } from '@/types/budget';
import { TablePageWrapper } from '@/components/table/TablePageWrapper';

export const metadata = {
  title: '예산 테이블 | 나라살림',
  description: '대한민국 정부 예산 계층 구조를 테이블로 확인하세요.',
};

export default function TablePageRoute() {
  const meta = loadMetadata();
  const dataByYear: Record<number, BudgetRawItem[]> = {};
  for (const year of meta.availableYears) {
    dataByYear[year] = loadFlatBudget(year) as BudgetRawItem[];
  }
  return <TablePageWrapper dataByYear={dataByYear} availableYears={meta.availableYears} />;
}
