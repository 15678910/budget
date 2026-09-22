'use client';

/**
 * 자치단체 한 곳의 상세. 지표 6종의 2019~2024 값과 동종단체 평균·백분위,
 * 예산대비 채무비율 이력(2018~2024 결산), 그리고 같은 시도의 사례 아카이브 링크를 싣는다.
 * 여기에도 종합 점수는 없다.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { SectionHeader } from '@/components/fiscal/primitives';
import {
  INDICATOR_YEARS,
  OFFICIAL_INDICATORS,
  type IndicatorYear,
} from '@/lib/data/local-indicators-official';
import { debtRatioOf, percentiles } from '@/lib/watch/signals';
import {
  LEGAL_INDICATOR_LABEL,
  WASTE_INDICATORS,
  WASTE_INDICATOR_LABEL,
  type EntitySummary,
  type PercentileRank,
} from '@/lib/watch/signal-types';
import { WATCH_CASES } from '@/lib/watch/cases';
import { debtHistoryOf } from './debt-history';
import { entityLabel, formatEok, formatPct, sidoCodeOf } from './warning-labels';

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-gray-800 text-gray-500">
        <th className="px-2 py-1 text-left font-normal">지표</th>
        {INDICATOR_YEARS.map((year) => (
          <th key={year} className="px-2 py-1 text-right font-normal tabular-nums">
            {year}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export interface EntityDetailProps {
  summary: EntitySummary;
  onBack: () => void;
}

export function EntityDetail({ summary, onBack }: EntityDetailProps) {
  const entity = useMemo(
    () => OFFICIAL_INDICATORS.find((e) => e.key === summary.key),
    [summary.key],
  );

  /** 연도별 백분위표에서 이 자치단체의 행만 뽑는다 */
  const rankByYear = useMemo(() => {
    const map = new Map<IndicatorYear, PercentileRank[]>();
    for (const year of INDICATOR_YEARS) {
      map.set(year, percentiles(year).get(summary.key) ?? []);
    }
    return map;
  }, [summary.key]);

  const debtHistory = useMemo(() => debtHistoryOf(summary), [summary]);
  const sidoCode = sidoCodeOf(summary.region);
  const cases = useMemo(
    () => (sidoCode ? WATCH_CASES.filter((c) => c.gov.code === sidoCode) : []),
    [sidoCode],
  );

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border border-gray-800 px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-200">{entityLabel(summary)}</span>
          <span className="text-xs text-gray-500">
            {summary.level === 'metro' ? '광역' : '기초'} · 유형 {summary.typeCd}
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="border border-gray-700 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-200"
        >
          ← 목록으로
        </button>
      </div>

      <SectionHeader title="지표 이력 (결산, 2019~2024)" color="text-sky-400" />
      <div className="overflow-x-auto border border-gray-800">
        <table className="w-full min-w-[640px] text-xs">
          <TableHead />
          <tbody>
            <tr className="border-b border-gray-900">
              <td className="px-2 py-1.5 text-gray-400">{LEGAL_INDICATOR_LABEL.debtRatio}</td>
              {INDICATOR_YEARS.map((year) => (
                <td key={year} className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
                  {formatPct(debtRatioOf(summary.key, year))}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-900">
              <td className="px-2 py-1.5 text-gray-400">{LEGAL_INDICATOR_LABEL.fiscalBalance}</td>
              {INDICATOR_YEARS.map((year, index) => (
                <td key={year} className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
                  {formatPct(entity?.values.fiscalBalance[index] ?? null)}
                </td>
              ))}
            </tr>
            {WASTE_INDICATORS.map((indicator) => (
              <tr key={indicator} className="border-b border-gray-900">
                <td className="px-2 py-1.5 text-gray-400">{WASTE_INDICATOR_LABEL[indicator]}</td>
                {INDICATOR_YEARS.map((year, index) => {
                  const rank = rankByYear.get(year)?.find((r) => r.indicator === indicator);
                  const percentile = rank?.percentile ?? null;
                  return (
                    <td key={year} className="px-2 py-1.5 text-right tabular-nums">
                      <div className="font-mono text-gray-300">
                        {formatPct(entity?.values[indicator][index] ?? null)}
                      </div>
                      <div className="font-mono text-[10px] text-gray-600">
                        평균 {formatPct(rank?.peerAvg ?? null)}
                        {percentile === null ? '' : ` · 상위 ${percentile}%`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader title="예산대비 채무비율 이력 (결산)" color="text-amber-400" />
      <div className="overflow-x-auto border border-gray-800">
        {debtHistory.length === 0 ? (
          <p className="px-2 py-3 text-xs text-gray-500">공식 채무 공시 자료 없음</p>
        ) : (
          <table className="w-full min-w-[480px] text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="px-2 py-1 text-left font-normal">연도</th>
                {debtHistory.map((row) => (
                  <th key={row.year} className="px-2 py-1 text-right font-normal tabular-nums">
                    {row.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-900">
                <td className="px-2 py-1.5 text-gray-400">채무잔액</td>
                {debtHistory.map((row) => (
                  <td key={row.year} className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
                    {formatEok(row.debt)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-2 py-1.5 text-gray-400">채무비율</td>
                {debtHistory.map((row) => (
                  <td key={row.year} className="px-2 py-1.5 text-right font-mono tabular-nums text-gray-300">
                    {formatPct(row.ratio)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <SectionHeader title="같은 시도의 사례 아카이브" color="text-orange-400" />
      <div className="border border-gray-800 p-3">
        {cases.length === 0 ? (
          <p className="text-xs text-gray-500">이 시도에 등록된 사례 없음</p>
        ) : (
          <ul className="space-y-1">
            {cases.map((watchCase) => (
              <li key={watchCase.slug}>
                <Link
                  href="/fiscal-innovation?tab=cases"
                  className="text-xs text-orange-300 underline-offset-2 hover:underline"
                >
                  {watchCase.gov.name} · {watchCase.title}
                </Link>
                <span className="ml-2 text-[11px] text-gray-600">{watchCase.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
