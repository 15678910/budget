'use client';
import { useRef, useState } from 'react';
import { SDGBoardMatrix } from './SDGBoardMatrix';
import { SDGRegionProfile, type FiscalContext } from './SDGRegionProfile';
import { SDGMapDashboard } from './SDGMapDashboard';
import { SDGScopeSelector, type SDGScope } from './SDGScopeSelector';
import { SDGNationalSummary } from './SDGNationalSummary';
import { SDGMunicipalProfile } from './SDGMunicipalProfile';
import type { Matrix } from '@/lib/sdg/matrix';
import { SDG_GOALS } from '@/lib/sdg/goals';
import { GOAL_BG_CLASS } from '@/lib/sdg/goal-style';
import type { NationalByGoal } from '@/lib/sdg/national';
import type { GoalAchievementByGoal } from '@/lib/sdg/scoring';
import type { GoalTrendByGoal } from '@/lib/sdg/trend-build';
import type { MapSourceByGoal } from '@/lib/sdg/map-source';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

export function SDGBoard({
  matrix,
  metros,
  national,
  nationalAchievement,
  nationalTrend,
  fiscalByRegion,
  geoData,
  mapSource,
  valuesByIndicator,
  base2018ByIndicator,
  direction,
}: {
  matrix: Matrix;
  metros: readonly string[];
  national: NationalByGoal;
  nationalAchievement: GoalAchievementByGoal;
  nationalTrend: GoalTrendByGoal;
  fiscalByRegion: Record<string, FiscalContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- topojson(geoData)는 외부 토포 구조라 런타임 가드만 가능
  geoData: any;
  mapSource: MapSourceByGoal;
  valuesByIndicator: Record<string, Record<string, number>>;
  base2018ByIndicator: Record<string, Record<string, number>>;
  direction: Record<string, IndicatorDirection>;
}) {
  const [scope, setScope] = useState<SDGScope>('national');
  const [selectedMetro, setSelectedMetro] = useState<string | null>(null);
  const [selectedSgg, setSelectedSgg] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const mapRef = useRef<HTMLElement | null>(null);

  // 목표를 고르면 목록 위에 열린 지도로 스크롤(렌더 직후)
  const selectGoal = (g: number) => {
    setGoal(g);
    requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

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

      {/* 목표 선택 시 전국 지도 — 목록 위 전체 폭(2단으로 나누면 목록·지도 모두 좁아져 줄바꿈이 심함) */}
      {goal ? (
        <section
          ref={mapRef}
          aria-label={`SDG ${goal} 전국 지도`}
          className="scroll-mt-32 border border-gray-800 rounded-lg bg-gray-900/30 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm font-bold text-white ${GOAL_BG_CLASS[goal]}`}
              >
                {goal}
              </span>
              <span className="text-base font-semibold text-gray-100 break-keep">
                SDG {goal}. {SDG_GOALS.find((g) => g.num === goal)?.name}
              </span>
            </span>
            <button
              onClick={() => setGoal(null)}
              className="shrink-0 rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-500 hover:text-gray-100"
            >
              지도 닫기
            </button>
          </div>
          <SDGMapDashboard key={goal} initialGoal={goal} geoData={geoData} mapSource={mapSource} />
        </section>
      ) : (
        <p className="text-sm text-gray-400">목표를 누르면 이 자리에 전국 지도가 열립니다.</p>
      )}

      {/* 스코프별 단일 대상 뷰 — 항상 전체 폭 */}
      <div>
        {scope === 'national' && (
          <SDGNationalSummary
            national={national}
            achievement={nationalAchievement}
            trend={nationalTrend}
            onSelectGoal={selectGoal}
            selectedGoal={goal}
          />
        )}
        {scope === 'metro' &&
          (selectedMetro ? (
            <SDGRegionProfile
              region={selectedMetro}
              matrix={matrix}
              fiscal={fiscalByRegion[selectedMetro] ?? null}
              onSelectGoal={selectGoal}
              valuesByIndicator={valuesByIndicator}
              base2018ByIndicator={base2018ByIndicator}
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
            onSelectGoal={selectGoal}
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
