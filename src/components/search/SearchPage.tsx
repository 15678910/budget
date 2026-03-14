'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { BudgetRawItem, DatasetMetadata } from '@/types/budget';
import { createSearchIndex, searchBudget } from '@/lib/data/search-index';
import { formatKoreanWon, cn } from '@/lib/utils/format';
import { DEFAULT_YEAR } from '@/lib/constants';

interface SearchPageProps {
  dataByYear: Record<number, BudgetRawItem[]>;
  metadata: DatasetMetadata;
}

export function SearchPage({ dataByYear, metadata }: SearchPageProps) {
  const availableYears = metadata.availableYears;
  const defaultYear = availableYears.includes(DEFAULT_YEAR)
    ? DEFAULT_YEAR
    : availableYears[availableYears.length - 1];

  const [year, setYear] = useState(defaultYear);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = dataByYear[year] ?? [];

  const index = useMemo(() => createSearchIndex(items), [items]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Reset query when year changes
  useEffect(() => {
    setQuery('');
    setDebouncedQuery('');
  }, [year]);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    return searchBudget(index, debouncedQuery, 50);
  }, [debouncedQuery, index]);

  const totalBudget = useMemo(() => items.reduce((s, it) => s + it.amount, 0), [items]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">예산 검색</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-1.5 text-base rounded-lg border border-border bg-background"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사업명, 부처, 분야 등으로 검색..."
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-lg border border-border',
            'bg-background text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-base'
          )}
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {!debouncedQuery && (
        <div className="text-center py-16 text-muted-foreground">
          <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>검색어를 입력하세요</p>
          <p className="text-base mt-1 opacity-70">전체 {items.length.toLocaleString('ko-KR')}개 항목에서 검색</p>
        </div>
      )}

      {debouncedQuery && results.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>검색 결과가 없습니다</p>
          <p className="text-base mt-1 opacity-70">다른 검색어를 시도해 보세요</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="text-base text-muted-foreground mb-3">
            검색 결과 <span className="font-semibold text-foreground">{results.length}</span>건
          </p>
          <ul className="space-y-2">
            {results.map((r, idx) => {
              const pct = totalBudget > 0 ? (r.item.amount / totalBudget) * 100 : 0;
              return (
                <li key={idx} className="rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold truncate">
                        {r.item.detailProjectName || r.item.unitProjectName || r.item.programName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {r.item.ministryName} · {r.item.domainName} · {r.item.sectorName}
                      </p>
                      {r.item.detailProjectName && r.item.unitProjectName && (
                        <p className="text-sm text-muted-foreground/70 mt-0.5 truncate">
                          {r.item.programName} &rsaquo; {r.item.unitProjectName}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold tabular-nums">{formatKoreanWon(r.item.amount)}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{pct < 0.01 ? '<0.01' : pct.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(pct * 10, 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
