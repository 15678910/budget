'use client';
import { useState } from 'react';
import { SDGBoardMatrix } from './SDGBoardMatrix';
import { SDGRegionProfile, type FiscalContext } from './SDGRegionProfile';
import { SDGMapDashboard } from './SDGMapDashboard';
import { SDGScopeSelector, type SDGScope } from './SDGScopeSelector';
import { SDGNationalSummary } from './SDGNationalSummary';
import { SDGMunicipalProfile } from './SDGMunicipalProfile';
import type { Matrix } from '@/lib/sdg/matrix';
import type { SDGIndicator } from '@/lib/sdg/goals';
import type { NationalByGoal } from '@/lib/sdg/national';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

interface KosisData {
  goals: Record<string, SDGIndicator>;
}

export function SDGBoard({
  matrix,
  metros,
  national,
  fiscalByRegion,
  geoData,
  kosis,
  valuesByIndicator,
  direction,
}: {
  matrix: Matrix;
  metros: readonly string[];
  national: NationalByGoal;
  fiscalByRegion: Record<string, FiscalContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- topojson(geoData)는 외부 토포 구조라 런타임 가드만 가능
  geoData: any;
  kosis: KosisData;
  valuesByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
}) {
  const [scope, setScope] = useState<SDGScope>('national');
  const [selectedMetro, setSelectedMetro] = useState<string | null>(null);
  const [selectedSgg, setSelectedSgg] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-50">SDG 지역 상황판</h2>
        <p className="text-sm text-gray-400 mt-1">
          스코프(전국·광역·기초)를 선택해 한 대상의 17개 SDG 목표를 집중해서 확인하세요.
        </p>
      </div>

      <SDGScopeSelector
        scope={scope}
        metros={metros}
        selectedMetro={selectedMetro}
        selectedSgg={selectedSgg}
        onScope={(s) => {
          setScope(s);
        }}
        onMetro={setSelectedMetro}
        onSgg={setSelectedSgg}
      />

      {/* 스코프별 단일 대상 뷰 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          {scope === 'national' && (
            <SDGNationalSummary national={national} onSelectGoal={setGoal} />
          )}
          {scope === 'metro' &&
            (selectedMetro ? (
              <SDGRegionProfile
                region={selectedMetro}
                matrix={matrix}
                fiscal={fiscalByRegion[selectedMetro] ?? null}
                onSelectGoal={setGoal}
                valuesByIndicator={valuesByIndicator}
                direction={direction}
              />
            ) : (
              <Placeholder text="광역을 선택하면 프로파일이 표시됩니다." />
            ))}
          {scope === 'municipal' &&
            (selectedMetro && selectedSgg ? (
              <SDGMunicipalProfile metro={selectedMetro} sgg={selectedSgg} />
            ) : (
              <Placeholder text="광역 → 시군구를 선택하면 프로파일이 표시됩니다." />
            ))}
        </div>

        {/* 목표 선택 시 전국 지도 */}
        <div>
          {goal ? (
            <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-2">
              <SDGMapDashboard key={goal} initialGoal={goal} geoData={geoData} kosis={kosis} />
            </div>
          ) : (
            <Placeholder text="목표 카드/게이지를 클릭하면 전국 지도가 표시됩니다." />
          )}
        </div>
      </div>

      {/* 전체 비교 — 16×17 매트릭스(접이식, opt-in) */}
      <details className="border border-gray-800 rounded-lg bg-gray-900/20 group">
        <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> 전체
          비교 (16광역 × 17목표 매트릭스)
        </summary>
        <div className="p-3 pt-0">
          <SDGBoardMatrix
            matrix={matrix}
            metros={metros}
            selectedRegion={selectedMetro}
            selectedGoal={goal}
            onSelectRegion={(m) => {
              setScope('metro');
              setSelectedMetro(m);
              setSelectedSgg(null);
            }}
            onSelectGoal={(g) => {
              setGoal(g);
            }}
          />
        </div>
      </details>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/20 p-8 text-center text-gray-500 text-sm">
      {text}
    </div>
  );
}
