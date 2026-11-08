'use client';

import { useState } from 'react';
import type { BudgetRawItem } from '@/types/budget';
import { BudgetTable } from '@/components/table/BudgetTable';
import { useFlatBudget } from '@/hooks/useFlatBudget';
import { cn } from '@/lib/utils/format';

interface TablePageWrapperProps {
  initialYear: number;
  initialItems: BudgetRawItem[];
  availableYears: number[];
}

export function TablePageWrapper({ initialYear, initialItems, availableYears }: TablePageWrapperProps) {
  const [year, setYear] = useState(initialYear);
  const { items, status } = useFlatBudget(year, initialYear, initialItems);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={cn(
            'px-3 py-1.5 text-base rounded-lg border border-border bg-background'
          )}
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>
      {status === 'loading' && (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-muted-foreground">데이터를 불러오지 못했습니다</p>
      )}
      {status === 'ready' && <BudgetTable items={items} />}
    </div>
  );
}
