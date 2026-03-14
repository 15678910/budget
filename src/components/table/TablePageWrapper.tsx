'use client';

import { useState } from 'react';
import type { BudgetRawItem } from '@/types/budget';
import { BudgetTable } from '@/components/table/BudgetTable';
import { DEFAULT_YEAR } from '@/lib/constants';
import { cn } from '@/lib/utils/format';

interface TablePageWrapperProps {
  dataByYear: Record<number, BudgetRawItem[]>;
  availableYears: number[];
}

export function TablePageWrapper({ dataByYear, availableYears }: TablePageWrapperProps) {
  const defaultYear = availableYears.includes(DEFAULT_YEAR)
    ? DEFAULT_YEAR
    : availableYears[availableYears.length - 1];
  const [year, setYear] = useState(defaultYear);

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
      <BudgetTable items={dataByYear[year]} />
    </div>
  );
}
