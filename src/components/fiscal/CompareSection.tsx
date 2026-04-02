'use client';

import { getDistrictFiscalData } from '@/lib/data/fiscal-health-data';
import type { DistrictFiscalData } from './types';
import { SELECT_CLASS } from './types';
import { SectionHeader, Cell, Bar } from './primitives';
import {
  independenceColor,
  independenceBarColor,
  autonomyBarColor,
  debtColor,
  formatDebt,
  formatDebtPerCapita,
  formatPopulation,
  getDebtPerCapitaManWon,
} from './utils';

// ============================================================
// Compare Side
// ============================================================

function CompareSide({
  label,
  data,
  color,
}: {
  label: string;
  data: DistrictFiscalData | null;
  color: string;
}) {
  if (!data) {
    return (
      <div className="flex-1 border border-gray-800 p-4 text-center text-gray-600">
        {label}을 선택하세요
      </div>
    );
  }

  const perCapita = getDebtPerCapitaManWon(data.debt, data.population);

  return (
    <div className="flex-1 space-y-1">
      <div className={`text-center text-lg md:text-xl font-bold ${color} py-2 border border-gray-800`}>
        {data.metro} {data.name}
      </div>
      <div className="border border-gray-800 p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base text-gray-500">재정자립도</span>
            <span className={`text-lg md:text-xl font-mono font-bold tabular-nums ${independenceColor(data.independence)}`}>
              {data.independence.toFixed(1)}%
            </span>
          </div>
          <Bar value={data.independence} max={100} colorClass={independenceBarColor(data.independence)} height="h-4" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base text-gray-500">재정자주도</span>
            <span className="text-lg md:text-xl font-mono font-bold tabular-nums text-blue-400">
              {data.autonomy.toFixed(1)}%
            </span>
          </div>
          <Bar value={data.autonomy} max={100} colorClass={autonomyBarColor(data.autonomy)} height="h-4" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-sm md:text-base text-gray-500">지역채무</span>
          <span className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatDebt(data.debt)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-gray-500">1인당 채무</span>
          <span className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatDebtPerCapita(data.debt, data.population)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-gray-500">인구</span>
          <span className="text-lg md:text-xl font-mono font-bold tabular-nums text-gray-300">
            {formatPopulation(data.population)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Compare Section
// ============================================================

export function CompareSection({
  metroNameList,
  metroA,
  setMetroA,
  metroB,
  setMetroB,
  districtA,
  setDistrictA,
  districtB,
  setDistrictB,
  districtsA,
  districtsB,
  selectedA,
  selectedB,
}: {
  metroNameList: string[];
  metroA: string;
  setMetroA: (v: string) => void;
  metroB: string;
  setMetroB: (v: string) => void;
  districtA: string;
  setDistrictA: (v: string) => void;
  districtB: string;
  setDistrictB: (v: string) => void;
  districtsA: DistrictFiscalData[];
  districtsB: DistrictFiscalData[];
  selectedA: DistrictFiscalData | null;
  selectedB: DistrictFiscalData | null;
}) {
  return (
    <div className="space-y-1">
      <SectionHeader title="시군구 비교 District Comparison" color="text-purple-400" />

      {/* Picker row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 border border-gray-800 px-3 py-3">
        {/* Side A */}
        <div className="flex-1 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0" />
          <select
            value={metroA}
            onChange={(e) => {
              setMetroA(e.target.value);
              const dists = getDistrictFiscalData(e.target.value);
              if (dists.length > 0) setDistrictA(dists[0].name);
            }}
            className={SELECT_CLASS}
            aria-label="비교 A 시도"
          >
            {metroNameList.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            value={selectedA?.name ?? ''}
            onChange={(e) => setDistrictA(e.target.value)}
            className={SELECT_CLASS}
            aria-label="비교 A 시군구"
          >
            {districtsA.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <span className="text-gray-500 text-lg font-bold text-center">vs</span>

        {/* Side B */}
        <div className="flex-1 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
          <select
            value={metroB}
            onChange={(e) => {
              setMetroB(e.target.value);
              const dists = getDistrictFiscalData(e.target.value);
              if (dists.length > 0) setDistrictB(dists[0].name);
            }}
            className={SELECT_CLASS}
            aria-label="비교 B 시도"
          >
            {metroNameList.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            value={selectedB?.name ?? ''}
            onChange={(e) => setDistrictB(e.target.value)}
            className={SELECT_CLASS}
            aria-label="비교 B 시군구"
          >
            {districtsB.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* No data message */}
      {districtsA.length === 0 && (
        <div className="border border-gray-800 px-4 py-3 text-base text-gray-600 text-center">
          {metroA}의 시군구 데이터가 없습니다.
        </div>
      )}
      {districtsB.length === 0 && (
        <div className="border border-gray-800 px-4 py-3 text-base text-gray-600 text-center">
          {metroB}의 시군구 데이터가 없습니다.
        </div>
      )}

      {/* Side-by-side comparison */}
      {selectedA && selectedB && (
        <>
          <div className="flex flex-col md:flex-row gap-1">
            <CompareSide label="A" data={selectedA} color="text-cyan-400" />
            <CompareSide label="B" data={selectedB} color="text-amber-400" />
          </div>

          {/* Difference summary */}
          <div className="grid grid-cols-2 md:grid-cols-4">
            <SectionHeader title="비교 결과" color="text-gray-400" />
            {(() => {
              const indDiff = selectedA.independence - selectedB.independence;
              const autDiff = selectedA.autonomy - selectedB.autonomy;
              const pcA = getDebtPerCapitaManWon(selectedA.debt, selectedA.population);
              const pcB = getDebtPerCapitaManWon(selectedB.debt, selectedB.population);
              const pcDiff = pcA - pcB;

              return (
                <>
                  <Cell
                    label="재정자립도 차이"
                    value={`${indDiff >= 0 ? '+' : ''}${indDiff.toFixed(1)}%p`}
                    color={indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}
                    sub={`${selectedA.name} vs ${selectedB.name}`}
                  />
                  <Cell
                    label="재정자주도 차이"
                    value={`${autDiff >= 0 ? '+' : ''}${autDiff.toFixed(1)}%p`}
                    color={autDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}
                  />
                  <Cell
                    label="1인당 채무 차이"
                    value={`${pcDiff >= 0 ? '+' : ''}${Math.round(pcDiff).toLocaleString('ko-KR')}만원`}
                    color={pcDiff <= 0 ? 'text-emerald-400' : 'text-red-400'}
                    sub="A 기준 차이"
                  />
                  <Cell
                    label="인구 비율"
                    value={
                      selectedA.population > selectedB.population
                        ? `${(selectedA.population / selectedB.population).toFixed(1)}배`
                        : `${(selectedB.population / selectedA.population).toFixed(1)}배`
                    }
                    color="text-gray-300"
                    sub={`${formatPopulation(selectedA.population)} vs ${formatPopulation(selectedB.population)}`}
                  />
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
