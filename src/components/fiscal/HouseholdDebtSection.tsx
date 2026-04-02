'use client';

import {
  getMetroHouseholdDebt,
  getNationalAvgHouseholdDebt,
} from '@/lib/data/fiscal-health-data';
import { DataDownload } from '@/components/shared/DataDownload';
import type { MetroFiscalData } from './types';
import { formatDebt } from './utils';

export function HouseholdDebtSection({
  globalMetro,
  metroData,
}: {
  globalMetro: string;
  metroData: MetroFiscalData[];
}) {
  const householdDebtData = getMetroHouseholdDebt();
  const nationalAvg = getNationalAvgHouseholdDebt();
  const filtered = globalMetro === '전체'
    ? householdDebtData
    : householdDebtData.filter(h => h.name === globalMetro);
  const sorted = [...filtered].sort((a, b) => b.avgDebt - a.avgDebt);
  const maxDebt = Math.max(...householdDebtData.map(h => h.avgDebt));

  return (
    <div className="border border-gray-800 p-3 md:p-5 space-y-4">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-base font-bold text-gray-300">
            광역시도별 가계부채 (2025 가계금융복지조사)
          </div>
          <DataDownload
            data={sorted.map(h => ({
              광역시도: h.name,
              '가구당 평균부채(만원)': h.avgDebt,
              '금융부채(만원)': h.avgFinDebt,
              '임대보증금(만원)': h.avgDeposit,
              '부채보유가구비율(%)': h.debtHoldingRate,
              '가구당 평균자산(만원)': h.avgAsset,
            }))}
            filename="metro-household-debt-2025"
          />
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          출처: 통계청·한국은행·금융감독원 | 2025년 3월말 기준 | 가구당 평균 부채 (만원)
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-1.5">
        {sorted.map((h) => {
          const shortName = h.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
          const aboveAvg = h.avgDebt >= nationalAvg;
          return (
            <div key={h.name} className="flex items-center gap-2 px-2 py-1">
              <span className="text-sm text-gray-400 w-16 truncate text-right">{shortName}</span>
              <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                <div
                  className={`h-full rounded ${aboveAvg ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${(h.avgDebt / maxDebt) * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full border-l-2 border-dashed border-gray-500"
                  style={{ left: `${(nationalAvg / maxDebt) * 100}%` }}
                />
              </div>
              <span className={`text-sm font-mono font-bold tabular-nums w-24 text-right ${aboveAvg ? 'text-red-400' : 'text-emerald-400'}`}>
                {h.avgDebt.toLocaleString()}만원
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500" /> 전국 평균 이상</div>
        <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-500" /> 전국 평균 미만</div>
        <div className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-gray-500" /> 전국 평균 ({nationalAvg.toLocaleString()}만원)</div>
      </div>

      {/* Debt composition breakdown */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-sm font-bold text-gray-400 mb-2">부채 구성 (금융부채 vs 임대보증금)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sorted.map((h) => {
            const shortName = h.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
            const finPct = ((h.avgFinDebt / h.avgDebt) * 100).toFixed(0);
            const depPct = ((h.avgDeposit / h.avgDebt) * 100).toFixed(0);
            const aboveAvg = h.avgDebt >= nationalAvg;
            const metroFiscal = metroData.find(m => m.name === h.name);
            return (
              <div key={h.name} className="border border-gray-800 p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-300">{shortName}</span>
                  <span className={`text-sm font-mono font-bold ${aboveAvg ? 'text-red-400' : 'text-emerald-400'}`}>
                    {h.avgDebt.toLocaleString()}만원
                  </span>
                </div>
                <div className="flex h-3 rounded overflow-hidden">
                  <div className="bg-blue-500" style={{ width: `${finPct}%` }} title={`금융부채 ${finPct}%`} />
                  <div className="bg-amber-500" style={{ width: `${depPct}%` }} title={`임대보증금 ${depPct}%`} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>금융 {h.avgFinDebt.toLocaleString()}만 ({finPct}%)</span>
                  <span>보증금 {h.avgDeposit.toLocaleString()}만 ({depPct}%)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">부채보유가구</span>
                  <span className="text-gray-400 font-mono">{h.debtHoldingRate}%</span>
                </div>
                {metroFiscal && (
                  <div className="flex justify-between text-xs border-t border-gray-800 pt-1">
                    <span className="text-gray-600">지역채무</span>
                    <span className="text-gray-400 font-mono">{formatDebt(metroFiscal.debt)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stacked bar legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-500" /> 금융부채</div>
        <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-500" /> 임대보증금</div>
      </div>
    </div>
  );
}
