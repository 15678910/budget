'use client';

import { DataDownload } from '@/components/shared/DataDownload';
import type { DistrictFiscalData, SortKey } from './types';
import { SORT_OPTIONS } from './types';
import { Bar } from './primitives';
import {
  independenceColor,
  independenceBarColor,
  debtColor,
  formatDebt,
  formatDebtPerCapita,
  getDebtPerCapitaManWon,
} from './utils';

// ============================================================
// Ranking Row
// ============================================================

function RankingRow({
  rank,
  district,
  total,
}: {
  rank: number;
  district: DistrictFiscalData;
  total: number;
}) {
  const perCapita = getDebtPerCapitaManWon(district.debt, district.population);
  const isTop10 = rank <= 10;
  const isBottom10 = rank > total - 10;

  let rowBg = '';
  if (isTop10) rowBg = 'bg-emerald-950/30';
  else if (isBottom10) rowBg = 'bg-red-950/30';

  return (
    <div className={`grid grid-cols-12 items-center gap-1 px-2 md:px-3 py-2 border-b border-gray-800/50 ${rowBg}`}>
      <div className="col-span-1 text-center">
        <span className={`text-base font-mono font-bold tabular-nums ${isTop10 ? 'text-emerald-400' : isBottom10 ? 'text-red-400' : 'text-gray-500'}`}>
          {rank}
        </span>
      </div>
      <div className="col-span-3 truncate">
        <div className={`text-base font-bold truncate ${independenceColor(district.independence)}`}>
          {district.name}
        </div>
        <div className="text-xs text-gray-600 truncate">{district.metro}</div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <span className={`text-base font-mono font-bold tabular-nums w-14 text-right ${independenceColor(district.independence)}`}>
            {district.independence.toFixed(1)}%
          </span>
          <div className="flex-1 hidden md:block">
            <Bar value={district.independence} max={80} colorClass={independenceBarColor(district.independence)} height="h-2" />
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <span className="text-base font-mono font-bold tabular-nums text-blue-400">
          {district.autonomy.toFixed(1)}%
        </span>
      </div>
      <div className="col-span-2">
        <span className={`text-base font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
          {formatDebtPerCapita(district.debt, district.population)}
        </span>
      </div>
      <div className="col-span-2">
        <span className="text-sm font-mono tabular-nums text-gray-400">
          {formatDebt(district.debt)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Ranking Section
// ============================================================

export function RankingSection({
  sortKey,
  setSortKey,
  sortedDistricts,
}: {
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  sortedDistricts: DistrictFiscalData[];
}) {
  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 border border-gray-800 px-3 py-2 flex-wrap">
        <span className="text-sm text-gray-500">정렬:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortKey === opt.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Header row */}
      <div className="grid grid-cols-12 items-center gap-1 px-2 md:px-3 py-2 border border-gray-800 bg-gray-900">
        <div className="col-span-1 text-center text-xs md:text-sm text-gray-500">#</div>
        <div className="col-span-3 text-xs md:text-sm text-gray-500">시군구</div>
        <div className="col-span-2 text-xs md:text-sm text-gray-500">재정자립도</div>
        <div className="col-span-2 text-xs md:text-sm text-gray-500">재정자주도</div>
        <div className="col-span-2 text-xs md:text-sm text-gray-500">1인당 채무</div>
        <div className="col-span-2 text-xs md:text-sm text-gray-500">지역채무</div>
      </div>

      {/* Rows */}
      <div className="border border-gray-800 border-t-0 max-h-[70vh] overflow-y-auto">
        {sortedDistricts.map((d, i) => (
          <RankingRow
            key={`${d.metro}-${d.name}`}
            rank={i + 1}
            district={d}
            total={sortedDistricts.length}
          />
        ))}
      </div>

      {/* Legend + Download */}
      <div className="flex items-center justify-between border border-gray-800 border-t-0 px-3 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-950/50 border border-emerald-800" />
            <span className="text-xs text-gray-500">TOP 10</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-950/50 border border-red-800" />
            <span className="text-xs text-gray-500">BOTTOM 10</span>
          </div>
        </div>
        <DataDownload
          data={sortedDistricts.map((d, i) => ({
            순위: i + 1,
            시군구: d.name,
            광역시도: d.metro,
            재정자립도: d.independence,
            재정자주도: d.autonomy,
            '지역채무(억원)': d.debt,
            인구: d.population,
          }))}
          filename="시군구_순위_2025"
          label=""
        />
      </div>
    </div>
  );
}
