'use client';

import { DataDownload } from '@/components/shared/DataDownload';
import type { MetroFiscalData, DistrictFiscalData } from './types';
import { SectionHeader } from './primitives';
import { MetroCard, DistrictCard } from './FiscalCards';

export function FiscalStatusSection({
  globalMetro,
  metroData,
  filteredDistricts,
  onExpandMetro,
  onExpandDistrict,
}: {
  globalMetro: string;
  metroData: MetroFiscalData[];
  filteredDistricts: DistrictFiscalData[];
  onExpandMetro: (metro: MetroFiscalData) => void;
  onExpandDistrict: (district: DistrictFiscalData) => void;
}) {
  return (
    <div className="space-y-1">
      {globalMetro === '전체' ? (
        <>
          <div className="flex items-center gap-2 border border-gray-800 px-3 py-2">
            <div className="ml-auto">
              <DataDownload
                data={metroData.map(m => ({
                  광역시도: m.name,
                  재정자립도: m.independence,
                  재정자주도: m.autonomy,
                  '지역채무(억원)': m.debt,
                  인구: m.population,
                  '예산규모(억원)': m.budget,
                }))}
                filename="광역시도_재정현황_2025"
                label=""
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {metroData.map((metro) => (
              <MetroCard key={metro.name} metro={metro} onClick={() => onExpandMetro(metro)} />
            ))}
          </div>
        </>
      ) : (
        <>
          {(() => {
            const selected = metroData.find(m => m.name === globalMetro);
            if (!selected) return null;
            return (
              <div className="grid grid-cols-1 gap-1">
                <MetroCard metro={selected} onClick={() => onExpandMetro(selected)} />
              </div>
            );
          })()}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            <SectionHeader
              title={`${globalMetro} 시군구 재정현황 (${filteredDistricts.length}개)`}
              color="text-purple-400"
            />
            {filteredDistricts.map((d) => (
              <DistrictCard
                key={`${d.metro}-${d.name}`}
                district={d}
                onClick={() => onExpandDistrict(d)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
