'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  getMetroFiscalData,
  getAllDistrictFiscalData,
  getDistrictFiscalData,
  getNationalAverage,
  getMetroNames,
  getNationalDebtHistory,
  getMetroDebtHistory,
  generateDistrictDebtHistory,
} from '@/lib/data/fiscal-health-data';
import { DataSources } from '@/components/shared/DataSources';

import type { ViewMode, SortKey, MetroFiscalData, DistrictFiscalData } from './types';
import { MODE_TABS, SELECT_CLASS, METRO_YEARLY_DEBT_INCREASE } from './types';
import {
  independenceColor,
  formatDebt,
  formatDebtPerCapita,
  formatRawWon,
  formatPerSecond,
  formatPopulation,
  getDebtPerCapitaManWon,
  getCurrentMetroDebt,
} from './utils';
import { Cell, SectionHeader } from './primitives';
import { MetroDetailModal } from './MetroDetailModal';
import { DistrictDetailModal } from './DistrictDetailModal';
import { MetroDebtRatioModal } from './MetroDebtRatioModal';
import { DistrictDebtRatioModal } from './DistrictDebtRatioModal';
import { FiscalStatusSection } from './FiscalStatusSection';
import { RankingSection } from './RankingSection';
import { CompareSection } from './CompareSection';
import { DebtRatioSection } from './DebtRatioSection';
import { HealthScoreSection } from './HealthScoreSection';
import { PeerBenchSection } from './PeerBenchSection';

// ============================================================
// Main Component
// ============================================================

export function FiscalHealthDashboard() {
  // Real-time tick for debt counters
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastUpdate = 0;
    function loop(timestamp: number) {
      if (timestamp - lastUpdate >= 100) {
        setTick((t) => t + 1);
        lastUpdate = timestamp;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  void tick;

  // View state
  const [mode, setMode] = useState<ViewMode>('fiscalStatus');
  const [sortKey, setSortKey] = useState<SortKey>('independence');

  // Compare mode state
  const [metroA, setMetroA] = useState('서울특별시');
  const [metroB, setMetroB] = useState('경기도');
  const [districtA, setDistrictA] = useState('강남구');
  const [districtB, setDistrictB] = useState('성남시');

  // Modal state
  const [expandedMetro, setExpandedMetro] = useState<MetroFiscalData | null>(null);
  const [expandedDistrict, setExpandedDistrict] = useState<DistrictFiscalData | null>(null);
  const [debtRatioMetro, setDebtRatioMetro] = useState<string | null>(null);
  const [debtRatioDistrict, setDebtRatioDistrict] = useState<DistrictFiscalData | null>(null);

  // Filters
  const [districtMetroFilter, setDistrictMetroFilter] = useState<string>('전체');
  const [healthScoreMetroFilter, setHealthScoreMetroFilter] = useState<string>('전체');
  const [debtRatioDistrictFilter, setDebtRatioDistrictFilter] = useState<string>('전체');
  const [globalMetro, setGlobalMetro] = useState<string>('전체');
  const [globalDistrict, setGlobalDistrict] = useState<string>('전체');

  // Data
  const metroData = useMemo(() => getMetroFiscalData(), []);
  const allDistricts = useMemo(() => getAllDistrictFiscalData(), []);
  const nationalAvg = useMemo(() => getNationalAverage(), []);
  const metroNameList = useMemo(() => getMetroNames(), []);
  const nationalDebtHistory = useMemo(() => getNationalDebtHistory(), []);

  const globalDistrictList = useMemo(() => {
    if (globalMetro === '전체') return [];
    return allDistricts.filter(d => d.metro === globalMetro);
  }, [allDistricts, globalMetro]);

  useEffect(() => {
    setGlobalDistrict('전체');
  }, [globalMetro]);

  const totals = useMemo(() => {
    const totalPop = metroData.reduce((sum, m) => sum + m.population, 0);
    const totalDebt = metroData.reduce((sum, m) => sum + m.debt, 0);
    return { totalPop, totalDebt };
  }, [metroData]);

  const filteredDistricts = useMemo(() => {
    const list = districtMetroFilter === '전체' ? allDistricts : allDistricts.filter((d) => d.metro === districtMetroFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [allDistricts, districtMetroFilter]);

  const districtsA = useMemo(() => getDistrictFiscalData(metroA), [metroA]);
  const districtsB = useMemo(() => getDistrictFiscalData(metroB), [metroB]);

  const selectedA = useMemo(() => {
    const found = districtsA.find((d) => d.name === districtA);
    if (!found && districtsA.length > 0) return districtsA[0];
    return found ?? null;
  }, [districtsA, districtA]);

  const selectedB = useMemo(() => {
    const found = districtsB.find((d) => d.name === districtB);
    if (!found && districtsB.length > 0) return districtsB[0];
    return found ?? null;
  }, [districtsB, districtB]);

  const sortedDistricts = useMemo(() => {
    const base = globalMetro === '전체' ? allDistricts : allDistricts.filter(d => d.metro === globalMetro);
    const sorted = [...base];
    switch (sortKey) {
      case 'independence':
        sorted.sort((a, b) => b.independence - a.independence);
        break;
      case 'autonomy':
        sorted.sort((a, b) => b.autonomy - a.autonomy);
        break;
      case 'debtPerCapita':
        sorted.sort(
          (a, b) =>
            getDebtPerCapitaManWon(b.debt, b.population) -
            getDebtPerCapitaManWon(a.debt, a.population),
        );
        break;
    }
    return sorted;
  }, [allDistricts, sortKey, globalMetro]);

  function handleGlobalMetroChange(metro: string) {
    setGlobalMetro(metro);
    if (metro !== '전체') {
      setDistrictMetroFilter(metro);
      setHealthScoreMetroFilter(metro);
      setDebtRatioDistrictFilter(metro);
      setMetroA(metro);
      if (mode === 'fiscalStatus') {
        // auto-switch not needed, section handles it
      }
    } else {
      setDistrictMetroFilter('전체');
      setHealthScoreMetroFilter('전체');
      setDebtRatioDistrictFilter('전체');
    }
  }

  function handleGlobalDistrictChange(districtName: string) {
    setGlobalDistrict(districtName);
    if (districtName !== '전체') {
      const d = allDistricts.find(dd => dd.metro === globalMetro && dd.name === districtName);
      if (d) {
        setExpandedDistrict(d);
        setDistrictA(districtName);
      }
    }
  }

  return (
    <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1 font-mono">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-3 py-2 text-center">
        <h1 className="text-base md:text-base font-bold tracking-[0.3em] uppercase text-gray-400">
          지역재정 건전성 대시보드
        </h1>
        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
          재정자립도 &middot; 재정자주도 &middot; 지역채무 &mdash; 2025 당초예산 기준
        </p>
      </div>

      {/* ====== HERO: 지역채무 총액 실시간 ====== */}
      {(() => {
        const totalCurrentDebt = metroData.reduce(
          (sum, m) => sum + getCurrentMetroDebt(m.name, m.debt),
          0,
        );
        const totalYearlyIncrease = metroData.reduce(
          (sum, m) => sum + (METRO_YEARLY_DEBT_INCREASE[m.name] ?? m.debt * 0.06),
          0,
        );
        return (
          <div className="border border-gray-800 p-3 md:p-5 text-center">
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-widest mb-1">
              전국 지역채무 총액 &middot; Total Local Government Debt
            </div>
            <div
              className="text-2xl sm:text-3xl md:text-5xl font-mono font-bold text-red-500 tabular-nums leading-none tracking-tight"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatRawWon(totalCurrentDebt)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1.5 space-x-3">
              <span>≈ {formatDebt(totalCurrentDebt)}</span>
              <span>|</span>
              <span>초당 +{formatPerSecond(totalYearlyIncrease)}</span>
            </div>
          </div>
        );
      })()}

      {/* ====== REGION FILTER ====== */}
      <div className="flex items-center gap-3 border border-gray-800 px-3 py-2">
        <span className="text-xs text-gray-500 mr-1">지역 필터</span>
        <select
          value={globalMetro}
          onChange={(e) => handleGlobalMetroChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="전체">전체 광역시도</option>
          {metroNameList.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {globalMetro !== '전체' && (
          <select
            value={globalDistrict}
            onChange={(e) => handleGlobalDistrictChange(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="전체">전체 시군구</option>
            {globalDistrictList.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        )}

        {globalMetro !== '전체' && (
          <button
            onClick={() => {
              setGlobalMetro('전체');
              setGlobalDistrict('전체');
              setDistrictMetroFilter('전체');
              setHealthScoreMetroFilter('전체');
              setDebtRatioDistrictFilter('전체');
            }}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* ====== MODE TABS ====== */}
      <div className="flex items-center gap-2 border border-gray-800 px-3 py-2">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`px-4 py-1.5 rounded-full text-base font-medium transition-colors ${
              mode === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== NATIONAL SUMMARY ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="전국 현황 요약 National Summary" color="text-cyan-400" />
        <Cell
          label="전국 평균 재정자립도"
          value={`${nationalAvg.independence}%`}
          color={independenceColor(nationalAvg.independence)}
          glossaryKey="재정자립도"
        />
        <Cell
          label="전국 평균 재정자주도"
          value={`${nationalAvg.autonomy}%`}
          color="text-blue-400"
          glossaryKey="재정자주도"
        />
        {(() => {
          const totalCurrentDebt = metroData.reduce(
            (sum, m) => sum + getCurrentMetroDebt(m.name, m.debt),
            0,
          );
          return (
            <Cell
              label="전국 지역채무 합계"
              value={formatDebt(totalCurrentDebt)}
              color="text-red-400"
              sub={`${formatRawWon(totalCurrentDebt)}`}
              glossaryKey="지역채무"
            />
          );
        })()}
        {(() => {
          const totalCurrentDebt = metroData.reduce(
            (sum, m) => sum + getCurrentMetroDebt(m.name, m.debt),
            0,
          );
          return (
            <Cell
              label="1인당 지역채무"
              value={formatDebtPerCapita(totalCurrentDebt, totals.totalPop)}
              color="text-amber-400"
              sub={`인구 ${formatPopulation(totals.totalPop)}`}
              glossaryKey="1인당 지역채무"
            />
          );
        })()}
      </div>

      {/* ====== MODE SECTIONS ====== */}
      {mode === 'fiscalStatus' && (
        <FiscalStatusSection
          globalMetro={globalMetro}
          metroData={metroData}
          filteredDistricts={filteredDistricts}
          onExpandMetro={setExpandedMetro}
          onExpandDistrict={setExpandedDistrict}
        />
      )}

      {mode === 'ranking' && (
        <RankingSection
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortedDistricts={sortedDistricts}
        />
      )}

      {mode === 'compare' && (
        <CompareSection
          metroNameList={metroNameList}
          metroA={metroA}
          setMetroA={setMetroA}
          metroB={metroB}
          setMetroB={setMetroB}
          districtA={districtA}
          setDistrictA={setDistrictA}
          districtB={districtB}
          setDistrictB={setDistrictB}
          districtsA={districtsA}
          districtsB={districtsB}
          selectedA={selectedA}
          selectedB={selectedB}
        />
      )}

      {mode === 'debtRatio' && (
        <DebtRatioSection
          globalMetro={globalMetro}
          globalDistrict={globalDistrict}
          metroData={metroData}
          allDistricts={allDistricts}
          nationalDebtHistory={nationalDebtHistory}
          onDebtRatioMetroClick={setDebtRatioMetro}
        />
      )}

      {mode === 'healthScore' && (
        <HealthScoreSection
          globalMetro={globalMetro}
          metroData={metroData}
          allDistricts={allDistricts}
        />
      )}

      {mode === 'peerBench' && <PeerBenchSection />}

      {/* ====== FOOTER ====== */}
      <div className="border border-gray-800 px-3 py-2">
        <div className="text-[9px] md:text-xs text-gray-600 text-center space-y-0.5">
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-[8px] md:text-[9px] mb-1">
            데이터 출처 Sources
          </p>
          <p>
            행정안전부 지역재정365 (lofin.mois.go.kr) &middot; 통계청 인구통계 (kosis.kr) &middot; 지역재정연감 2025
          </p>
          <p className="text-gray-700">
            * 재정자립도 = (자체수입 / 자치단체예산규모) x 100 &nbsp;|&nbsp;
            재정자주도 = ((자체수입 + 자주재원) / 자치단체예산규모) x 100
          </p>
          <p className="text-gray-700">
            * 재정자립도·자주도는 2025 당초예산 기준, 지역채무·인구·예산규모는 2024 기준이며 실제 결산액과 차이가 있을 수 있습니다.
          </p>
          <p className="text-gray-700">
            * 실시간 카운터는 연간 채무 증가 추정치를 선형 보간하여 표시합니다. 실제 집행 시점과 차이가 있을 수 있습니다.
          </p>
        </div>
      </div>

      <DataSources />

      {/* ====== MODALS ====== */}
      {expandedMetro && (
        <MetroDetailModal
          metro={expandedMetro}
          nationalAvg={nationalAvg}
          onClose={() => setExpandedMetro(null)}
        />
      )}

      {expandedDistrict && (
        <DistrictDetailModal
          district={expandedDistrict}
          nationalAvg={nationalAvg}
          onClose={() => setExpandedDistrict(null)}
        />
      )}

      {debtRatioMetro && (
        <MetroDebtRatioModal
          name={debtRatioMetro}
          history={getMetroDebtHistory(debtRatioMetro)}
          onClose={() => setDebtRatioMetro(null)}
        />
      )}

      {debtRatioDistrict && (
        <DistrictDebtRatioModal
          district={debtRatioDistrict}
          history={generateDistrictDebtHistory(debtRatioDistrict)}
          onClose={() => setDebtRatioDistrict(null)}
        />
      )}
    </div>
  );
}
