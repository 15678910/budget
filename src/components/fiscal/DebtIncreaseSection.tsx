'use client';

import { useMemo, useState } from 'react';
import { netIncreaseRows } from '@/lib/data/fiscal-health-official';
import type { NetIncreaseRow } from '@/lib/data/fiscal-health-official';
import { OFFICIAL_DEBT_YEARS, OFFICIAL_DEBT_SOURCE } from '@/lib/data/local-debt-official';
import type { OfficialDebtYear } from '@/lib/data/local-debt-official';
import { SELECT_CLASS } from './types';
import { Cell, SectionHeader } from './primitives';
import { DebtIncreaseTable, displayName, formatDelta, deltaColor } from './DebtIncreaseTable';

// ============================================================
// Constants & helpers
// ============================================================

/** 순증은 전년 대비이므로 첫 해(2018)는 선택할 수 없다 */
const YEAR_OPTIONS: OfficialDebtYear[] = OFFICIAL_DEBT_YEARS.slice(1);
const DEFAULT_YEAR: OfficialDebtYear = 2024;
const BASIC_PREVIEW_ROWS = 30;

type LevelKey = 'metro' | 'basic';
type SortKey = 'deltaDesc' | 'deltaAsc' | 'pctBudget' | 'ratio';

const LEVEL_OPTIONS: { key: LevelKey; label: string }[] = [
  { key: 'metro', label: '광역' },
  { key: 'basic', label: '기초' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'deltaDesc', label: '순증 큰 순' },
  { key: 'deltaAsc', label: '순증 작은 순' },
  { key: 'pctBudget', label: '예산 대비 순증 %' },
  { key: 'ratio', label: '채무비율 %' },
];

/** null은 항상 뒤로 보내는 내림차순 비교 */
function descNullsLast(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function sortRows(rows: NetIncreaseRow[], sortKey: SortKey): NetIncreaseRow[] {
  const sorted = [...rows];
  if (sortKey === 'deltaAsc') sorted.sort((a, b) => a.deltaEok - b.deltaEok);
  else if (sortKey === 'pctBudget') sorted.sort((a, b) => descNullsLast(a.deltaPctOfBudget, b.deltaPctOfBudget));
  else if (sortKey === 'ratio') sorted.sort((a, b) => descNullsLast(a.ratioPct, b.ratioPct));
  else sorted.sort((a, b) => b.deltaEok - a.deltaEok);
  return sorted;
}

// ============================================================
// Section
// ============================================================

export function DebtIncreaseSection() {
  const [year, setYear] = useState<OfficialDebtYear>(DEFAULT_YEAR);
  const [level, setLevel] = useState<LevelKey>('metro');
  const [region, setRegion] = useState<string>('전체');
  const [sortKey, setSortKey] = useState<SortKey>('deltaDesc');
  const [showAll, setShowAll] = useState(false);

  const allRows = useMemo(() => netIncreaseRows(year, level), [year, level]);

  const regionOptions = useMemo(() => {
    const seen: string[] = [];
    for (const row of allRows) if (!seen.includes(row.region)) seen.push(row.region);
    return seen;
  }, [allRows]);

  const filteredRows = useMemo(
    () => (level === 'basic' && region !== '전체' ? allRows.filter((r) => r.region === region) : allRows),
    [allRows, level, region]
  );

  const sortedRows = useMemo(() => sortRows(filteredRows, sortKey), [filteredRows, sortKey]);

  const summary = useMemo(() => {
    const total = Math.round(filteredRows.reduce((sum, r) => sum + r.deltaEok, 0) * 10) / 10;
    const increased = filteredRows.filter((r) => r.deltaEok > 0).length;
    const decreased = filteredRows.filter((r) => r.deltaEok < 0).length;
    const flat = filteredRows.length - increased - decreased;
    const byDelta = [...filteredRows].sort((a, b) => b.deltaEok - a.deltaEok);
    return { total, increased, decreased, flat, top: byDelta[0], bottom: byDelta[byDelta.length - 1] };
  }, [filteredRows]);

  const isTruncated = level === 'basic' && !showAll && sortedRows.length > BASIC_PREVIEW_ROWS;
  const visibleRows = isTruncated ? sortedRows.slice(0, BASIC_PREVIEW_ROWS) : sortedRows;

  const changeLevel = (next: LevelKey) => {
    setLevel(next);
    setRegion('전체');
    setShowAll(false);
  };

  return (
    <div className="space-y-1">
      <SectionHeader title="채무 순증 Net Debt Increase" color="text-amber-400" />

      {/* Controls */}
      <div className="flex items-center gap-2 border border-gray-800 px-3 py-2 flex-wrap">
        <span className="text-sm text-gray-500">연도:</span>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value) as OfficialDebtYear)}
          className={SELECT_CLASS}
          aria-label="연도 선택"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>

        <span className="text-sm text-gray-500 ml-2">단위:</span>
        {LEVEL_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => changeLevel(opt.key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              level === opt.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {level === 'basic' && (
          <>
            <span className="text-sm text-gray-500 ml-2">시도:</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={SELECT_CLASS}
              aria-label="시도 선택"
            >
              <option value="전체">전체</option>
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </>
        )}

        <span className="text-sm text-gray-500 ml-2">정렬:</span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className={SELECT_CLASS}
          aria-label="정렬 기준 선택"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        <Cell
          label={`${year}년 순증 합계`}
          value={`${formatDelta(summary.total)}억원`}
          color={deltaColor(summary.total)}
          sub={`${level === 'metro' ? '광역' : '기초'} ${filteredRows.length}곳 합계`}
        />
        <Cell
          label="늘린 곳 / 줄인 곳 / 변동 없음"
          value={`${summary.increased} / ${summary.decreased} / ${summary.flat}`}
          color="text-gray-300"
          sub="채무잔액 전년 대비 기준"
        />
        <Cell
          label="순증 1위 · 순감 1위"
          value={
            summary.top && summary.bottom
              ? `${displayName(summary.top)} / ${displayName(summary.bottom)}`
              : '—'
          }
          color="text-gray-300"
          sub={
            summary.top && summary.bottom
              ? `${formatDelta(summary.top.deltaEok)} / ${formatDelta(summary.bottom.deltaEok)}억원`
              : undefined
          }
        />
      </div>

      <DebtIncreaseTable rows={visibleRows} />

      {level === 'basic' && sortedRows.length > BASIC_PREVIEW_ROWS && (
        <div className="border border-gray-800 border-t-0 px-3 py-2 text-center">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="px-3 py-1 rounded text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            {showAll ? `상위 ${BASIC_PREVIEW_ROWS}곳만 보기` : `전체 보기 (${sortedRows.length}곳)`}
          </button>
        </div>
      )}

      {/* Footnote */}
      <div className="border border-gray-800 px-3 py-2">
        <p className="text-xs text-gray-600 leading-relaxed">
          순증은 발행액이 아니라 연말 채무잔액의 전년 대비 증감(= 발행 − 상환)입니다. 출처: 지방재정365
          지방재정통합공시 예산대비채무비율(결산기준), 통합회계(일반회계+공기업특별회계+기타특별회계+기금).
          기초자치단체 226곳 중 2024년 채무가 있는 곳은 74곳입니다.{' '}
          <a
            href={OFFICIAL_DEBT_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            원문 보기
          </a>
        </p>
      </div>
    </div>
  );
}
