'use client';

import { METRO_PREV_YEAR, getChangeRate } from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData } from './types';
import { Bar } from './primitives';
import {
  independenceColor,
  independenceBarColor,
  autonomyBarColor,
  debtColor,
  formatDebt,
  formatDebtPerCapita,
  formatRawWon,
  getDebtPerCapitaManWon,
  getCurrentMetroDebt,
  getCurrentDistrictDebt,
} from './utils';

// ============================================================
// Metro Card (for grid view)
// ============================================================

export function MetroCard({ metro, onClick }: { metro: MetroFiscalData; onClick: () => void }) {
  const perCapita = getDebtPerCapitaManWon(metro.debt, metro.population);

  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0 space-y-2 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors" onClick={onClick}>
      {/* Name */}
      <div className={`text-base md:text-lg font-bold truncate ${independenceColor(metro.independence)}`}>
        {metro.name}
      </div>

      {/* 재정자립도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자립도</span>
          <span className={`text-base md:text-base font-mono font-bold tabular-nums ${independenceColor(metro.independence)}`}>
            {metro.independence.toFixed(1)}%
          </span>
        </div>
        <Bar value={metro.independence} max={100} colorClass={independenceBarColor(metro.independence)} height="h-3" />
      </div>

      {/* 재정자주도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자주도</span>
          <span className="text-base md:text-base font-mono font-bold tabular-nums text-blue-400">
            {metro.autonomy.toFixed(1)}%
          </span>
        </div>
        <Bar value={metro.autonomy} max={100} colorClass={autonomyBarColor(metro.autonomy)} height="h-3" />
      </div>

      {/* 지역채무 (실시간) */}
      <div className="pt-1 border-t border-gray-800">
        <div className="text-sm text-gray-500 mb-1">지역채무 (실시간)</div>
        <div className={`text-sm md:text-base font-mono font-bold tabular-nums leading-tight ${debtColor(perCapita)}`}>
          {formatRawWon(getCurrentMetroDebt(metro.name, metro.debt))}
        </div>
        <div className="text-xs text-gray-600">
          ≈ {formatDebt(getCurrentMetroDebt(metro.name, metro.debt))}
        </div>
      </div>

      {/* 1인당 채무 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">1인당 채무</span>
        <span className={`text-base md:text-base font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
          {formatDebtPerCapita(getCurrentMetroDebt(metro.name, metro.debt), metro.population)}
        </span>
      </div>

      {/* Mini comparison bar (자립도 vs 자주도) */}
      <div className="pt-1 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>자립도</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={`absolute left-0 top-0 h-full rounded-full ${independenceBarColor(metro.independence)} opacity-80`}
              style={{ width: `${metro.independence}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-blue-500 opacity-40"
              style={{ width: `${metro.autonomy}%` }}
            />
          </div>
          <span>자주도</span>
        </div>
      </div>

      {/* 전년 대비 증감률 (g0v 스타일) */}
      {(() => {
        const prev = METRO_PREV_YEAR[metro.name];
        if (!prev) return null;
        const indChange = getChangeRate(metro.independence, prev.independence);
        const debtChange = getChangeRate(metro.debt, prev.debt);
        return (
          <div className="pt-1 border-t border-gray-800 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">전년比</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${indChange >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              자립 {indChange >= 0 ? '▲' : '▼'}{Math.abs(indChange).toFixed(1)}%
            </span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${debtChange <= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              채무 {debtChange >= 0 ? '▲' : '▼'}{Math.abs(debtChange).toFixed(1)}%
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================
// District Card (for grid view)
// ============================================================

export function DistrictCard({ district, onClick }: { district: DistrictFiscalData; onClick: () => void }) {
  const currentDebt = getCurrentDistrictDebt(district.debt);
  const perCapita = getDebtPerCapitaManWon(currentDebt, district.population);

  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0 space-y-2 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors" onClick={onClick}>
      {/* Name */}
      <div className={`text-base md:text-lg font-bold truncate ${independenceColor(district.independence)}`}>
        {district.name}
      </div>
      <div className="text-xs text-gray-600 truncate">{district.metro}</div>

      {/* 재정자립도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자립도</span>
          <span className={`text-base md:text-base font-mono font-bold tabular-nums ${independenceColor(district.independence)}`}>
            {district.independence.toFixed(1)}%
          </span>
        </div>
        <Bar value={district.independence} max={100} colorClass={independenceBarColor(district.independence)} height="h-3" />
      </div>

      {/* 재정자주도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자주도</span>
          <span className="text-base md:text-base font-mono font-bold tabular-nums text-blue-400">
            {district.autonomy.toFixed(1)}%
          </span>
        </div>
        <Bar value={district.autonomy} max={100} colorClass={autonomyBarColor(district.autonomy)} height="h-3" />
      </div>

      {/* 지역채무 (실시간) */}
      <div className="pt-1 border-t border-gray-800">
        <div className="text-sm text-gray-500 mb-1">지역채무 (실시간)</div>
        <div className={`text-sm md:text-base font-mono font-bold tabular-nums leading-tight ${debtColor(perCapita)}`}>
          {formatRawWon(currentDebt)}
        </div>
        <div className="text-xs text-gray-600">
          ≈ {formatDebt(currentDebt)}
        </div>
      </div>

      {/* 1인당 채무 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">1인당 채무</span>
        <span className={`text-base md:text-base font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
          {formatDebtPerCapita(currentDebt, district.population)}
        </span>
      </div>
    </div>
  );
}
