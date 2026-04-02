'use client';

import { useEffect } from 'react';
import { getDistrictRevenueExpenditure } from '@/lib/data/fiscal-health-data';
import type { DistrictFiscalData } from './types';
import { Bar } from './primitives';
import {
  independenceColor,
  independenceBarColor,
  autonomyBarColor,
  debtColor,
  formatDebt,
  formatDebtPerCapita,
  formatPopulation,
  formatRawWon,
  formatPerSecond,
  getDebtPerCapitaManWon,
  getCurrentDistrictDebt,
} from './utils';

export function DistrictDetailModal({
  district,
  nationalAvg,
  onClose,
}: {
  district: DistrictFiscalData;
  nationalAvg: { independence: number; autonomy: number; totalDebt: number };
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const currentDebt = getCurrentDistrictDebt(district.debt);
  const perCapita = getDebtPerCapitaManWon(currentDebt, district.population);
  const yearlyIncrease = district.debt * 0.06;
  const indDiff = district.independence - nationalAvg.independence;
  const autDiff = district.autonomy - nationalAvg.autonomy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-gray-700 rounded-lg max-w-lg w-full p-5 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl md:text-2xl font-bold ${independenceColor(district.independence)}`}>
              {district.name}
            </h2>
            <div className="text-base text-gray-500">{district.metro}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none px-2"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        {/* 재정자립도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base md:text-base text-gray-400">재정자립도</span>
            <span className={`text-xl md:text-2xl font-mono font-bold tabular-nums ${independenceColor(district.independence)}`}>
              {district.independence.toFixed(1)}%
            </span>
          </div>
          <Bar value={district.independence} max={100} colorClass={independenceBarColor(district.independence)} height="h-5" />
          <div className="text-sm md:text-base text-gray-500">
            전국 평균 {nationalAvg.independence}% 대비{' '}
            <span className={indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {indDiff >= 0 ? '+' : ''}{indDiff.toFixed(1)}%p
            </span>
          </div>
        </div>

        {/* 재정자주도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base md:text-base text-gray-400">재정자주도</span>
            <span className="text-xl md:text-2xl font-mono font-bold tabular-nums text-blue-400">
              {district.autonomy.toFixed(1)}%
            </span>
          </div>
          <Bar value={district.autonomy} max={100} colorClass={autonomyBarColor(district.autonomy)} height="h-5" />
          <div className="text-sm md:text-base text-gray-500">
            전국 평균 {nationalAvg.autonomy}% 대비{' '}
            <span className={autDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {autDiff >= 0 ? '+' : ''}{autDiff.toFixed(1)}%p
            </span>
          </div>
        </div>

        <div className="border-t border-gray-800" />

        {/* 지역채무 실시간 */}
        <div className="space-y-1">
          <div className="text-base md:text-base text-gray-400">지역채무 (실시간)</div>
          <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatRawWon(currentDebt)}
          </div>
          <div className="flex items-center gap-3 text-sm md:text-base text-gray-500">
            <span>≈ {formatDebt(currentDebt)}</span>
            <span>|</span>
            <span>초당 +{formatPerSecond(yearlyIncrease)}</span>
          </div>
        </div>

        <div className="border-t border-gray-800" />

        {/* 상세 지표 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">1인당 채무</div>
            <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
              {formatDebtPerCapita(currentDebt, district.population)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">인구</div>
            <div className="text-lg md:text-xl font-mono font-bold tabular-nums text-gray-300">
              {formatPopulation(district.population)}
            </div>
          </div>
        </div>

        {/* 세입 vs 세출 */}
        {(() => {
          const { revenue, expenditure } = getDistrictRevenueExpenditure(district);
          const maxVal = Math.max(revenue, expenditure) * 1.1;
          return (
            <div className="border-t border-gray-800 pt-3">
              <div className="text-sm md:text-base text-gray-500 mb-2">세입 vs 세출</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-10">세입</span>
                  <div className="flex-1">
                    <Bar value={revenue} max={maxVal} colorClass="bg-cyan-500" height="h-4" />
                  </div>
                  <span className="text-base font-mono font-bold tabular-nums w-20 text-right text-cyan-400">
                    {formatDebt(revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-10">세출</span>
                  <div className="flex-1">
                    <Bar value={expenditure} max={maxVal} colorClass="bg-amber-500" height="h-4" />
                  </div>
                  <span className="text-base font-mono font-bold tabular-nums w-20 text-right text-amber-400">
                    {formatDebt(expenditure)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                차액(세계잉여금): <span className="text-emerald-400 font-mono">{formatDebt(revenue - expenditure)}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
