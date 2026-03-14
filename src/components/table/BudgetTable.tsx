'use client';

import { useState, useMemo, useCallback } from 'react';
import type { BudgetRawItem } from '@/types/budget';
import { formatKoreanWon, cn } from '@/lib/utils/format';
import { ExportButton } from './ExportButton';

interface BudgetTableProps {
  items: BudgetRawItem[];
}

type SortKey = 'name' | 'amount';
type SortDir = 'asc' | 'desc';

interface DomainRow {
  domainName: string;
  domainCode: string;
  amount: number;
  sectors: SectorRow[];
}
interface SectorRow {
  sectorName: string;
  sectorCode: string;
  amount: number;
  programs: ProgramRow[];
}
interface ProgramRow {
  programName: string;
  amount: number;
  projects: BudgetRawItem[];
}

const PAGE_SIZE = 20;

function buildHierarchy(items: BudgetRawItem[]): DomainRow[] {
  const map = new Map<string, DomainRow>();
  for (const item of items) {
    if (!map.has(item.domainCode)) {
      map.set(item.domainCode, { domainName: item.domainName, domainCode: item.domainCode, amount: 0, sectors: [] });
    }
    const domain = map.get(item.domainCode)!;
    domain.amount += item.amount;

    let sector = domain.sectors.find(s => s.sectorCode === item.sectorCode);
    if (!sector) {
      sector = { sectorName: item.sectorName, sectorCode: item.sectorCode, amount: 0, programs: [] };
      domain.sectors.push(sector);
    }
    sector.amount += item.amount;

    let program = sector.programs.find(p => p.programName === item.programName);
    if (!program) {
      program = { programName: item.programName, amount: 0, projects: [] };
      sector.programs.push(program);
    }
    program.amount += item.amount;
    program.projects.push(item);
  }
  return Array.from(map.values());
}

function filterItems(items: BudgetRawItem[], filter: string): BudgetRawItem[] {
  if (!filter.trim()) return items;
  const q = filter.toLowerCase();
  return items.filter(it =>
    it.domainName.toLowerCase().includes(q) || it.sectorName.toLowerCase().includes(q) ||
    it.programName.toLowerCase().includes(q) || it.unitProjectName.toLowerCase().includes(q) ||
    it.detailProjectName.toLowerCase().includes(q) || it.ministryName.toLowerCase().includes(q)
  );
}

export function BudgetTable({ items }: BudgetTableProps) {
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => filterItems(items, filter), [items, filter]);
  const totalBudget = useMemo(() => filtered.reduce((s, it) => s + it.amount, 0), [filtered]);
  const hierarchy = useMemo(() => buildHierarchy(filtered), [filtered]);
  const sorted = useMemo(() => {
    return [...hierarchy].sort((a, b) => {
      const cmp = sortKey === 'name' ? a.domainName.localeCompare(b.domainName, 'ko') : a.amount - b.amount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [hierarchy, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const grandTotal = useMemo(() => items.reduce((s, it) => s + it.amount, 0), [items]);

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }, [sortKey]);

  const toggle = (set: Set<string>, key: string, setter: (fn: (prev: Set<string>) => Set<string>) => void) => {
    setter(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 inline-flex flex-col text-xs leading-none">
      <span className={cn(sortKey === col && sortDir === 'asc' ? 'text-primary' : 'text-muted-foreground/40')}>&#9650;</span>
      <span className={cn(sortKey === col && sortDir === 'desc' ? 'text-primary' : 'text-muted-foreground/40')}>&#9660;</span>
    </span>
  );

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">예산 테이블</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text" value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              placeholder="필터..."
              className={cn('pl-8 pr-3 py-1.5 text-base rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48')}
            />
          </div>
          <ExportButton items={filtered} />
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-base text-muted-foreground">
        <span>전체 <span className="font-semibold text-foreground">{sorted.length}</span> 분야</span>
        <span>|</span>
        <span>합계 <span className="font-semibold text-foreground">{formatKoreanWon(totalBudget)}</span></span>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="w-8 px-4 py-2.5"></th>
                <th className="text-left px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-primary" onClick={() => handleSort('name')}>
                  분야 / 부문 / 프로그램 / 세부사업 <SortIcon col="name" />
                </th>
                <th className="text-left px-4 py-2.5 font-semibold hidden md:table-cell">부처</th>
                <th className="text-right px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-primary" onClick={() => handleSort('amount')}>
                  예산액 <SortIcon col="amount" />
                </th>
                <th className="text-right px-4 py-2.5 font-semibold hidden sm:table-cell">비중</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(domain => {
                const dExp = expandedDomains.has(domain.domainCode);
                const dPct = grandTotal > 0 ? (domain.amount / grandTotal) * 100 : 0;
                return [
                  <tr key={`d-${domain.domainCode}`} className="border-b border-border hover:bg-muted/30 cursor-pointer" onClick={() => toggle(expandedDomains, domain.domainCode, setExpandedDomains)}>
                    <td className="px-4 py-2.5 text-muted-foreground text-sm">{dExp ? '▾' : '▸'}</td>
                    <td className="px-4 py-2.5 font-semibold">{domain.domainName} <span className="ml-2 text-sm text-muted-foreground font-normal">({domain.sectors.length}개 부문)</span></td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground text-sm">—</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">{formatKoreanWon(domain.amount)}</td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-muted-foreground tabular-nums">{dPct.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary/70 rounded-full" style={{ width: `${Math.min(dPct, 100)}%` }} /></div>
                      </div>
                    </td>
                  </tr>,
                  ...(dExp ? domain.sectors.map(sector => {
                    const sKey = `${domain.domainCode}-${sector.sectorCode}`;
                    const sExp = expandedSectors.has(sKey);
                    return [
                      <tr key={`s-${sKey}`} className="border-b border-border hover:bg-muted/20 cursor-pointer bg-muted/5" onClick={() => toggle(expandedSectors, sKey, setExpandedSectors)}>
                        <td className="px-4 py-2 pl-8 text-muted-foreground text-sm">{sExp ? '▾' : '▸'}</td>
                        <td className="px-4 py-2 pl-8">{sector.sectorName} <span className="ml-2 text-sm text-muted-foreground">({sector.programs.length}개 프로그램)</span></td>
                        <td className="px-4 py-2 hidden md:table-cell text-muted-foreground text-sm">—</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatKoreanWon(sector.amount)}</td>
                        <td className="px-4 py-2 text-right hidden sm:table-cell"><span className="text-sm text-muted-foreground tabular-nums">{grandTotal > 0 ? ((sector.amount / grandTotal) * 100).toFixed(1) : 0}%</span></td>
                      </tr>,
                      ...(sExp ? sector.programs.map(program => {
                        const pKey = `${sKey}-${program.programName}`;
                        const pExp = expandedPrograms.has(pKey);
                        return [
                          <tr key={`p-${pKey}`} className="border-b border-border hover:bg-muted/20 cursor-pointer bg-muted/10" onClick={() => toggle(expandedPrograms, pKey, setExpandedPrograms)}>
                            <td className="px-4 py-2 pl-12 text-muted-foreground text-sm">{pExp ? '▾' : '▸'}</td>
                            <td className="px-4 py-2 pl-12 text-sm">{program.programName} <span className="text-muted-foreground">({program.projects.length}개)</span></td>
                            <td className="px-4 py-2 hidden md:table-cell text-muted-foreground text-sm">—</td>
                            <td className="px-4 py-2 text-right tabular-nums text-sm font-medium">{formatKoreanWon(program.amount)}</td>
                            <td className="px-4 py-2 text-right hidden sm:table-cell"><span className="text-sm text-muted-foreground tabular-nums">{grandTotal > 0 ? ((program.amount / grandTotal) * 100).toFixed(2) : 0}%</span></td>
                          </tr>,
                          ...(pExp ? program.projects.map((proj, i) => (
                            <tr key={`pr-${pKey}-${i}`} className="border-b border-border/60 bg-muted/20 hover:bg-muted/30">
                              <td className="px-4 py-1.5 pl-16"></td>
                              <td className="px-4 py-1.5 pl-16 text-sm text-foreground/80">{proj.detailProjectName || proj.unitProjectName}</td>
                              <td className="px-4 py-1.5 hidden md:table-cell text-muted-foreground text-sm">{proj.ministryName}</td>
                              <td className="px-4 py-1.5 text-right tabular-nums text-sm">{formatKoreanWon(proj.amount)}</td>
                              <td className="px-4 py-1.5 text-right hidden sm:table-cell"><span className="text-sm text-muted-foreground tabular-nums">{grandTotal > 0 ? ((proj.amount / grandTotal) * 100) < 0.01 ? '<0.01' : ((proj.amount / grandTotal) * 100).toFixed(3) : 0}%</span></td>
                            </tr>
                          )) : []),
                        ];
                      }).flat() : []),
                    ];
                  }).flat() : []),
                ];
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">{filter ? '필터 결과가 없습니다.' : '데이터가 없습니다.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className={cn('px-3 py-1.5 rounded-md text-base border border-border', page === 1 ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-muted')}>이전</button>
          <span className="text-base text-muted-foreground">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className={cn('px-3 py-1.5 rounded-md text-base border border-border', page === totalPages ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-muted')}>다음</button>
        </div>
      )}
    </div>
  );
}
