'use client';

import type { MetroFiscalData, DistrictFiscalData, NationalDebtHistoryEntry } from './types';
import { NationalDebtChart } from './NationalDebtChart';
import { InlineDebtRatioChart } from './InlineDebtRatioChart';
import { HouseholdDebtSection } from './HouseholdDebtSection';
import { getDebtPerCapitaManWon } from './utils';

export function DebtRatioSection({
  globalMetro,
  globalDistrict,
  metroData,
  allDistricts,
  nationalDebtHistory,
  onDebtRatioMetroClick,
}: {
  globalMetro: string;
  globalDistrict: string;
  metroData: MetroFiscalData[];
  allDistricts: DistrictFiscalData[];
  nationalDebtHistory: NationalDebtHistoryEntry[];
  onDebtRatioMetroClick: (name: string) => void;
}) {
  return (
    <div className="space-y-1">
      {/* National Chart (전체일 때만) */}
      {globalMetro === '전체' && <NationalDebtChart data={nationalDebtHistory} />}

      {/* Inline chart for selected metro/district */}
      {globalMetro !== '전체' && (
        <InlineDebtRatioChart
          globalMetro={globalMetro}
          globalDistrict={globalDistrict}
          metroData={metroData}
          allDistricts={allDistricts}
        />
      )}

      {/* Metro comparison: current debt/budget ratio bar chart */}
      <div className="border border-gray-800 p-3 md:p-5">
        <div className="text-base md:text-base font-bold text-gray-300 mb-1">
          광역시도별 예산 대비 채무비율 (2025 기준)
        </div>
        <div className="text-xs text-gray-600 mb-4">
          클릭하면 연도별 추이를 확인할 수 있습니다
        </div>
        <div className="space-y-1.5">
          {[...(globalMetro === '전체' ? metroData : metroData.filter(m => m.name === globalMetro))]
            .map((m) => ({
              name: m.name,
              ratio: (m.debt / m.budget) * 100,
              debt: m.debt,
              budget: m.budget,
            }))
            .sort((a, b) => b.ratio - a.ratio)
            .map((m) => {
              const shortName = m.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
              return (
                <div
                  key={m.name}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-900/50 px-2 py-1 rounded transition-colors"
                  onClick={() => onDebtRatioMetroClick(m.name)}
                >
                  <span className="text-sm text-gray-400 w-16 truncate text-right">{shortName}</span>
                  <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                    <div
                      className={`h-full rounded ${m.ratio > 15 ? 'bg-red-500' : m.ratio > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min((m.ratio / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-base font-mono font-bold tabular-nums w-16 text-right ${m.ratio > 15 ? 'text-red-400' : m.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {m.ratio.toFixed(1)}%
                  </span>
                </div>
              );
            })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500" /> &gt;15%</div>
          <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-500" /> 10~15%</div>
          <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-500" /> &lt;10%</div>
        </div>
      </div>

      {/* District top/bottom by per-capita debt */}
      <div className="border border-gray-800 p-3 md:p-5">
        <div className="text-base md:text-base font-bold text-gray-300 mb-2">
          시군구별 1인당 채무 비교
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-red-400 font-bold mb-2">1인당 채무 상위 10</div>
            {[...(globalMetro === '전체' ? allDistricts : allDistricts.filter(d => d.metro === globalMetro))]
              .sort((a, b) =>
                getDebtPerCapitaManWon(b.debt, b.population) - getDebtPerCapitaManWon(a.debt, a.population)
              )
              .slice(0, 10)
              .map((d, i) => {
                const pc = getDebtPerCapitaManWon(d.debt, d.population);
                return (
                  <div key={`${d.metro}-${d.name}`} className="flex items-center gap-2 py-0.5">
                    <span className="text-sm text-gray-600 w-5 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-400 w-28 truncate">{d.name} <span className="text-gray-600 text-xs">({d.metro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')})</span></span>
                    <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full rounded bg-red-500/70" style={{ width: `${Math.min((pc / 200) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold tabular-nums text-red-400 w-16 text-right">{Math.round(pc)}만원</span>
                  </div>
                );
              })}
          </div>
          <div>
            <div className="text-sm text-emerald-400 font-bold mb-2">1인당 채무 하위 10</div>
            {[...(globalMetro === '전체' ? allDistricts : allDistricts.filter(d => d.metro === globalMetro))]
              .sort((a, b) =>
                getDebtPerCapitaManWon(a.debt, a.population) - getDebtPerCapitaManWon(b.debt, b.population)
              )
              .slice(0, 10)
              .map((d, i) => {
                const pc = getDebtPerCapitaManWon(d.debt, d.population);
                return (
                  <div key={`${d.metro}-${d.name}`} className="flex items-center gap-2 py-0.5">
                    <span className="text-sm text-gray-600 w-5 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-400 w-28 truncate">{d.name} <span className="text-gray-600 text-xs">({d.metro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')})</span></span>
                    <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full rounded bg-emerald-500/70" style={{ width: `${Math.min((pc / 200) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm font-mono font-bold tabular-nums text-emerald-400 w-16 text-right">{Math.round(pc)}만원</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Household debt */}
      <HouseholdDebtSection globalMetro={globalMetro} metroData={metroData} />
    </div>
  );
}
