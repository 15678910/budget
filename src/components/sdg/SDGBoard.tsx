'use client';
import { useState } from 'react';
import { SDGBoardMatrix } from './SDGBoardMatrix';
import { SDGRegionProfile, type FiscalContext } from './SDGRegionProfile';
import { SDGMapDashboard } from './SDGMapDashboard';
import type { Matrix } from '@/lib/sdg/matrix';
import type { SDGIndicator } from '@/lib/sdg/goals';

interface KosisData {
  goals: Record<string, SDGIndicator>;
}

export function SDGBoard({
  matrix,
  metros,
  fiscalByRegion,
  geoData,
  kosis,
}: {
  matrix: Matrix;
  metros: readonly string[];
  fiscalByRegion: Record<string, FiscalContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- topojson(geoData)는 외부 토포 구조라 런타임 가드만 가능
  geoData: any;
  kosis: KosisData;
}) {
  const [region, setRegion] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-50">SDG 지역 상황판</h2>
        <p className="text-sm text-gray-400 mt-1">
          16개 광역 × 17개 SDG 목표. 행(지역) 클릭 → 프로파일, 열(목표) 클릭 → 전국 비교.
        </p>
      </div>

      <SDGBoardMatrix
        matrix={matrix}
        metros={metros}
        selectedRegion={region}
        selectedGoal={goal}
        onSelectRegion={(m) => {
          setRegion(m);
        }}
        onSelectGoal={(g) => {
          setGoal(g);
        }}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {region ? (
          <SDGRegionProfile
            region={region}
            matrix={matrix}
            fiscal={fiscalByRegion[region] ?? null}
            onSelectGoal={setGoal}
          />
        ) : (
          <div className="border border-gray-800 rounded-lg bg-gray-900/20 p-8 text-center text-gray-500 text-sm">
            행(지역)을 클릭하면 프로파일이 표시됩니다.
          </div>
        )}
        {goal ? (
          <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-2">
            <SDGMapDashboard geoData={geoData} kosis={kosis} />
          </div>
        ) : (
          <div className="border border-gray-800 rounded-lg bg-gray-900/20 p-8 text-center text-gray-500 text-sm">
            열(목표)을 클릭하면 전국 지도가 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
