'use client';

/**
 * 조기경보 지표판.
 *
 * 지방재정365 결산 공시(243개 자치단체 × 2019~2024)에 지방재정법 시행령 제65조의3의
 * 법정 기준을 그대로 대어 본 결과와, 유형별 백분위를 함께 놓는다.
 * 사이트는 종합 점수·등급을 매기지 않고, "낭비"라고 판정하지 않는다.
 */
import { useMemo, useState } from 'react';
import { Cell, SectionHeader } from '@/components/fiscal/primitives';
import type { IndicatorYear } from '@/lib/data/local-indicators-official';
import { entitySummaries, nationalCounts } from '@/lib/watch/signals';
import type { EntitySummary } from '@/lib/watch/signal-types';
import { EntityCard } from './EntityCard';
import { EntityDetail } from './EntityDetail';
import { WarningControls, type SortKey } from './WarningControls';
import { WarningFootnotes } from './WarningFootnotes';
import { entityLabel, formatEok, minHeadroom } from './warning-labels';

/** 기초는 한 시도에 최대 31곳이지만 기본은 30장만 그린다 */
const BASIC_PAGE_SIZE = 30;

function fiscalBalanceOf(summary: EntitySummary): number | null {
  return summary.crisis.find((signal) => signal.indicator === 'fiscalBalance')?.value ?? null;
}

/** null은 언제나 뒤로 */
function byNullableAsc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function byNullableDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function compare(sort: SortKey, a: EntitySummary, b: EntitySummary): number {
  if (sort === 'headroom') return byNullableAsc(minHeadroom(a), minHeadroom(b));
  if (sort === 'debt') return byNullableDesc(a.debtDelta3y, b.debtDelta3y);
  return byNullableAsc(fiscalBalanceOf(a), fiscalBalanceOf(b));
}

export function EarlyWarningSection() {
  const [year, setYear] = useState<IndicatorYear>(2024);
  const [level, setLevel] = useState<'metro' | 'basic'>('metro');
  const [region, setRegion] = useState<string>('서울');
  const [sort, setSort] = useState<SortKey>('headroom');
  const [showAll, setShowAll] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const summaries = useMemo(() => entitySummaries(year), [year]);
  const counts = useMemo(() => nationalCounts(year), [year]);

  const topDebt = useMemo(
    () =>
      summaries
        .filter((s) => s.debtDelta3y !== null)
        .sort((a, b) => (b.debtDelta3y ?? 0) - (a.debtDelta3y ?? 0))
        .slice(0, 5),
    [summaries],
  );

  const filtered = useMemo(() => {
    const base = summaries.filter(
      (s) => s.level === level && (level === 'metro' || s.region === region),
    );
    return base.sort((a, b) => compare(sort, a, b));
  }, [summaries, level, region, sort]);

  const selected = selectedKey ? summaries.find((s) => s.key === selectedKey) : undefined;
  const visible = level === 'basic' && !showAll ? filtered.slice(0, BASIC_PAGE_SIZE) : filtered;
  const hidden = filtered.length - visible.length;

  if (selected) {
    return (
      <div className="space-y-1">
        <EntityDetail summary={selected} onBack={() => setSelectedKey(null)} />
        <WarningFootnotes />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <SectionHeader title="조기경보 — 법정 기준 신호와 동종단체 백분위" color="text-red-400" />

      <WarningControls
        year={year}
        level={level}
        region={region}
        sort={sort}
        onYear={(next) => {
          setYear(next);
          setShowAll(false);
        }}
        onLevel={(next) => {
          setLevel(next);
          setShowAll(false);
        }}
        onRegion={(next) => {
          setRegion(next);
          setShowAll(false);
        }}
        onSort={setSort}
      />

      <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
        <Cell
          label={`법정 「주의」 이상 (${year} 결산)`}
          value={`${counts.cautionOrWorse.debtRatio} · ${counts.cautionOrWorse.fiscalBalance}곳`}
          color={
            counts.cautionOrWorse.debtRatio + counts.cautionOrWorse.fiscalBalance > 0
              ? 'text-amber-300'
              : 'text-gray-300'
          }
          sub="채무비율 · 통합재정수지 (243곳 중)"
        />
        <Cell
          label="통합재정수지 적자 자치단체"
          value={`${counts.deficitCount}곳`}
          color="text-red-300"
          sub="243곳 중 · 적자는 법정 기준 충족과 별개다"
        />
        <Cell
          label="3년 채무 순증 상위 5"
          value={topDebt.length > 0 ? entityLabel(topDebt[0]) : '—'}
          color="text-red-300"
          sub={topDebt.slice(1).map(entityLabel).join(' · ') || '자료 없음'}
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border border-gray-800 px-4 py-2 text-[11px] text-gray-500">
        {topDebt.map((summary) => (
          <span key={summary.key}>
            {entityLabel(summary)}{' '}
            <span className="font-mono tabular-nums text-red-300">
              {formatEok(summary.debtDelta3y, true)}
            </span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((summary) => (
          <EntityCard key={summary.key} summary={summary} onOpen={setSelectedKey} />
        ))}
      </div>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full border border-gray-800 py-2 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
        >
          전체 보기 (+{hidden}곳)
        </button>
      )}

      <WarningFootnotes />
    </div>
  );
}
