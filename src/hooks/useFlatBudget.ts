'use client';

import { useEffect, useState } from 'react';
import type { BudgetRawItem } from '@/types/budget';

export type FlatBudgetStatus = 'loading' | 'ready' | 'error';

const EMPTY_ITEMS: BudgetRawItem[] = [];

/**
 * 연도별 세부사업(flat) 예산을 /api/budget/flat에서 필요할 때 받아온다.
 * 이미 받은 연도는 다시 받지 않는다.
 */
export function useFlatBudget(
  year: number,
  initialYear: number,
  initialItems: BudgetRawItem[]
): { items: BudgetRawItem[]; status: FlatBudgetStatus } {
  const [cache, setCache] = useState<Record<number, BudgetRawItem[]>>({
    [initialYear]: initialItems,
  });
  const [failedYear, setFailedYear] = useState<number | null>(null);

  const cached = cache[year];

  useEffect(() => {
    if (cached) return;
    const controller = new AbortController();
    fetch(`/api/budget/flat?year=${year}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json() as Promise<BudgetRawItem[]>;
      })
      .then((data) => {
        setCache((prev) => ({ ...prev, [year]: data }));
        setFailedYear((prev) => (prev === year ? null : prev));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setFailedYear(year);
      });
    return () => controller.abort();
  }, [year, cached]);

  if (cached) return { items: cached, status: 'ready' };
  if (failedYear === year) return { items: EMPTY_ITEMS, status: 'error' };
  return { items: EMPTY_ITEMS, status: 'loading' };
}
