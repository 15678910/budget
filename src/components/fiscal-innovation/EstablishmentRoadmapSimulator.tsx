'use client';

import React, { useState, useMemo, useRef } from 'react';
import { getMetroFiscalData, getDistrictFiscalData, getMetroNames, BND_REFERENCE, type MetroFiscalData, type DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';

// ============================================================
// Sub-components
// ============================================================

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  subLabel,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  subLabel?: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base md:text-base text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
          {subLabel && <span className="text-sm md:text-base text-gray-500">({subLabel})</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-gray-800
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}

function Cell({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0">
      <div className="text-sm md:text-base text-gray-500 leading-tight truncate">{label}</div>
      <div className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-xs md:text-sm text-gray-600 leading-tight truncate">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-gray-800 px-4 py-2 ${color}`}>
      <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

function InfoSection({ title, color, children, defaultOpen = false }: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-800 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${color} hover:bg-gray-900/50 transition-colors text-left`}
      >
        <span className="text-sm md:text-base font-semibold uppercase tracking-widest">{title}</span>
        <span className="text-gray-500 text-lg leading-none">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 md:px-5 md:py-5 border-t border-gray-800 bg-gray-950/50 space-y-4 text-base md:text-base text-gray-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Formatting helpers
// ============================================================

function formatEok(v: number): string {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}조원`;
  return `${Math.round(v).toLocaleString()}억원`;
}

function formatPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

// ============================================================
// Styling
// ============================================================

const SELECT_CLASS =
  'bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-blue-500';

const TAB_BASE =
  'px-4 py-2 text-base font-medium transition-colors';

const TAB_ACTIVE =
  'bg-blue-600 text-white';

const TAB_INACTIVE =
  'bg-gray-800 text-gray-400 hover:text-gray-200';

// ============================================================
// Verdict config
// ============================================================

const verdictConfig = {
  fast: { label: '빠른 성장', emoji: '🚀', bg: 'bg-emerald-900/40', border: 'border-emerald-700', text: 'text-emerald-400', desc: '공공은행이 빠르게 자립하여 지역 재정에 기여할 수 있습니다' },
  moderate: { label: '안정적 성장', emoji: '📈', bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-400', desc: '시간은 걸리지만 안정적으로 성장하는 경로입니다' },
  slow: { label: '장기 투자', emoji: '⏳', bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', desc: '초기 자본이나 의무예치율을 높이면 성장이 빨라집니다' },
};

// ============================================================
// Main Component
// ============================================================

export function EstablishmentRoadmapSimulator() {
  // === Region selection ===
  const [tab, setTab] = useState<'metro' | 'district'>('metro');
  const allMetros = useMemo(() => getMetroFiscalData(), []);
  const metroNames = useMemo(
    () => getMetroNames().sort((a, b) => a.localeCompare(b, 'ko')),
    [],
  );
  const [selectedMetroName, setSelectedMetroName] = useState(allMetros[0]?.name ?? '서울특별시');

  const districts = useMemo(
    () => getDistrictFiscalData(selectedMetroName).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [selectedMetroName],
  );
  const [selectedDistrictName, setSelectedDistrictName] = useState(districts[0]?.name ?? '');

  // Derived metro
  const selectedMetro: MetroFiscalData | undefined = allMetros.find(m => m.name === selectedMetroName);

  // Derived district
  const selectedDistrict: DistrictFiscalData | undefined = useMemo(() => {
    if (tab !== 'district' || districts.length === 0) return undefined;
    const found = districts.find(d => d.name === selectedDistrictName);
    return found ?? districts[0];
  }, [tab, districts, selectedDistrictName]);

  // Resolved region data
  const regionBudget = tab === 'metro'
    ? (selectedMetro?.budget ?? 0)
    : (selectedDistrict?.budget ?? 0);
  const regionIndependence = tab === 'metro'
    ? (selectedMetro?.independence ?? 0)
    : (selectedDistrict?.independence ?? 0);
  const regionName = tab === 'metro'
    ? selectedMetroName
    : (selectedDistrict?.name ?? selectedDistrictName);

  // Handle metro change: reset district selection
  const handleMetroChange = (name: string) => {
    setSelectedMetroName(name);
    const newDistricts = getDistrictFiscalData(name);
    setSelectedDistrictName(newDistricts[0]?.name ?? '');
  };

  // Handle tab change
  const handleTabChange = (t: 'metro' | 'district') => {
    setTab(t);
    if (t === 'district' && districts.length > 0 && !selectedDistrictName) {
      setSelectedDistrictName(districts[0].name);
    }
  };

  // === Slider states ===
  const [initialCapitalRate, setInitialCapitalRate] = useState(5);
  const [mandatoryDepositRate, setMandatoryDepositRate] = useState(30);
  const [phaseYears, setPhaseYears] = useState(5);
  const [targetLendingRate, setTargetLendingRate] = useState(2.5);

  // === Simulation calculation ===
  const result = useMemo(() => {
    const initialCapital = regionBudget * (initialCapitalRate / 100);
    const localTaxRevenue = regionBudget * (regionIndependence / 100);
    const opCostRatio = 0.20;
    const totalYears = phaseYears * 3;

    const yearlyData: Array<{
      year: number; phase: number; capital: number; deposits: number;
      loanVolume: number; grossRevenue: number; netIncome: number;
      cumulativeProfit: number; roe: number;
    }> = [];

    let capital = initialCapital;
    let deposits = 0;
    let cumulativeProfit = 0;
    let breakEvenYear: number | null = null;

    for (let y = 1; y <= totalYears; y++) {
      let phase: number;
      let loanVolume: number;
      let grossRevenue: number;
      let netIncome: number;

      if (y <= phaseYears) {
        // Phase 1: Credit guarantee expansion (current law)
        phase = 1;
        const ramp = y / phaseYears;
        loanVolume = capital * 0.5 * ramp;
        grossRevenue = loanVolume * (targetLendingRate / 100);
        netIncome = grossRevenue * (1 - opCostRatio) - (initialCapital * 0.01); // minus setup cost
      } else if (y <= phaseYears * 2) {
        // Phase 2: Bank conversion (special law)
        phase = 2;
        const ramp2 = (y - phaseYears) / phaseYears;
        deposits += localTaxRevenue * (mandatoryDepositRate / 100) * ramp2;
        loanVolume = (capital + deposits * 0.8) * 0.7; // 70% loan-to-deposit
        grossRevenue = loanVolume * (targetLendingRate / 100);
        netIncome = grossRevenue * (1 - opCostRatio);
        capital += netIncome * 0.5; // 50% retained
      } else {
        // Phase 3: Maturity (BND-style)
        phase = 3;
        deposits += localTaxRevenue * (mandatoryDepositRate / 100);
        loanVolume = (capital + deposits * 0.8) * 0.8; // 80% loan-to-deposit
        grossRevenue = loanVolume * (targetLendingRate / 100);
        netIncome = grossRevenue * (1 - opCostRatio);
        capital += netIncome * 0.4; // 40% retained, 60% to local govt
      }

      cumulativeProfit += netIncome;
      const roe = capital > 0 ? (netIncome / capital) * 100 : 0;

      if (breakEvenYear === null && cumulativeProfit > 0) {
        breakEvenYear = y;
      }

      yearlyData.push({
        year: 2026 + y, phase, capital, deposits,
        loanVolume, grossRevenue, netIncome, cumulativeProfit, roe,
      });
    }

    const finalData = yearlyData[yearlyData.length - 1];
    const finalAssets = finalData.capital + finalData.deposits;
    const finalROE = finalData.roe;
    const annualGovernmentReturn = finalData.netIncome * 0.6; // 60% to government in Phase 3

    // Capital ratio: capital / (capital + deposits)
    const capitalRatio = finalData.capital > 0 && finalAssets > 0
      ? (finalData.capital / finalAssets) * 100
      : 0;

    // Verdict
    const verdict: 'fast' | 'moderate' | 'slow' = (breakEvenYear ?? 999) <= 5 ? 'fast'
      : (breakEvenYear ?? 999) <= 10 ? 'moderate'
      : 'slow';

    return {
      initialCapital, yearlyData, breakEvenYear, finalAssets, finalROE,
      cumulativeProfit, annualGovernmentReturn, totalYears, verdict,
      finalData, capitalRatio,
    };
  }, [initialCapitalRate, mandatoryDepositRate, phaseYears, targetLendingRate,
      regionBudget, regionIndependence]);

  const vConfig = verdictConfig[result.verdict];
  const contentRef = useRef<HTMLDivElement>(null);

  // === Bar chart scaling ===
  const allCumulativeValues = result.yearlyData.map(d => d.cumulativeProfit);
  const maxCumulativeProfit = Math.max(...allCumulativeValues, 1);
  const minCumulativeProfit = Math.min(...allCumulativeValues, 0);
  const chartRange = maxCumulativeProfit - Math.min(minCumulativeProfit, 0);

  // Decide whether to show every year or every other year
  const showEveryOther = result.totalYears > 20;
  const displayYears = showEveryOther
    ? result.yearlyData.filter((_, i) => i % 2 === 0 || i === result.yearlyData.length - 1)
    : result.yearlyData;

  // Phase boundaries for labels
  const phase1End = 2026 + phaseYears;
  const phase2End = 2026 + phaseYears * 2;

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            공공은행 설립 로드맵 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="공공은행설립로드맵" />
          <span className="text-sm md:text-base text-gray-600">
            BND형 3단계 성장 시뮬레이션
          </span>
        </div>
      </div>

      {/* ====== REGION SELECTOR ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-teal-400 mb-3">
          지역 선택 Region Selector
        </div>

        {/* Tab buttons */}
        <div className="flex mb-4 rounded overflow-hidden border border-gray-700 w-fit">
          <button
            className={`${TAB_BASE} ${tab === 'metro' ? TAB_ACTIVE : TAB_INACTIVE}`}
            onClick={() => handleTabChange('metro')}
          >
            광역시도
          </button>
          <button
            className={`${TAB_BASE} ${tab === 'district' ? TAB_ACTIVE : TAB_INACTIVE}`}
            onClick={() => handleTabChange('district')}
          >
            시군구
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <select
            className={SELECT_CLASS}
            value={selectedMetroName}
            onChange={(e) => handleMetroChange(e.target.value)}
          >
            {metroNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {tab === 'district' && (
            <select
              className={SELECT_CLASS}
              value={selectedDistrict?.name ?? ''}
              onChange={(e) => setSelectedDistrictName(e.target.value)}
            >
              {districts.length === 0 ? (
                <option value="">데이터 없음</option>
              ) : (
                districts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {tab === 'district' && districts.length === 0 && (
          <p className="text-sm text-amber-400/70 mt-2">
            해당 광역시도의 시군구 데이터가 없습니다. 광역시도 단위로 시뮬레이션됩니다.
          </p>
        )}
      </div>

      {/* ====== SLIDERS ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="초기자본 (예산 대비)"
            value={initialCapitalRate}
            min={1}
            max={20}
            step={0.5}
            unit="%"
            subLabel={`${formatEok(regionBudget * (initialCapitalRate / 100))}`}
            color="text-cyan-400"
            onChange={setInitialCapitalRate}
          />
          <Slider
            label="의무예치율 (지방세 대비)"
            value={mandatoryDepositRate}
            min={10}
            max={80}
            step={5}
            unit="%"
            color="text-emerald-400"
            onChange={setMandatoryDepositRate}
          />
          <Slider
            label="단계별 이행기간"
            value={phaseYears}
            min={2}
            max={10}
            step={1}
            unit="년"
            subLabel={`총 ${phaseYears * 3}년`}
            color="text-purple-400"
            onChange={setPhaseYears}
          />
          <Slider
            label="목표 대출금리"
            value={targetLendingRate}
            min={1.0}
            max={5.0}
            step={0.1}
            unit="%"
            color="text-amber-400"
            onChange={setTargetLendingRate}
          />
        </div>
      </div>

      {/* ====== VERDICT BANNER ====== */}
      <div className={`border ${vConfig.border} ${vConfig.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{vConfig.emoji}</span>
          <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-gray-400">
            판정 결과 Verdict
          </div>
          <span className={`text-lg md:text-xl font-bold ${vConfig.text}`}>
            {vConfig.label}
          </span>
        </div>
        <p className="text-base md:text-base text-gray-300 leading-relaxed">
          <span className="text-cyan-400 font-bold">{regionName}</span>에
          예산의 <span className="text-cyan-400 font-bold">{initialCapitalRate}%</span>인{' '}
          <span className="text-cyan-400 font-bold">{formatEok(result.initialCapital)}</span>을 초기자본으로 투입하면,{' '}
          {result.breakEvenYear
            ? <>손익분기점은 <span className="text-emerald-400 font-bold">{result.breakEvenYear}년차</span> ({2026 + result.breakEvenYear}년)에 도달하며,{' '}</>
            : <span className="text-red-400 font-bold">시뮬레이션 기간 내 손익분기점에 도달하지 못하며,{' '}</span>
          }
          최종 자산규모 <span className={`font-bold ${vConfig.text}`}>{formatEok(result.finalAssets)}</span>,{' '}
          연간 정부 환원금 <span className="text-emerald-400 font-bold">{formatEok(result.annualGovernmentReturn)}</span>을
          달성합니다.
        </p>
        <p className="text-sm text-gray-500 mt-2">{vConfig.desc}</p>
      </div>

      {/* ====== SECTION: 3단계 성장 로드맵 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="3단계 성장 로드맵" color="text-cyan-400" />
        <Cell
          label="초기자본"
          value={formatEok(result.initialCapital)}
          color="text-cyan-400"
          sub={`예산의 ${initialCapitalRate}%`}
        />
        <Cell
          label="손익분기"
          value={result.breakEvenYear ? `${result.breakEvenYear}년차` : '미도달'}
          color="text-emerald-400"
          sub={result.breakEvenYear ? `${2026 + result.breakEvenYear}년` : undefined}
        />
        <Cell
          label="최종 ROE"
          value={formatPercent(result.finalROE)}
          color="text-purple-400"
        />
        <Cell
          label="누적순이익"
          value={formatEok(result.cumulativeProfit)}
          color="text-rose-400"
        />
        <Cell
          label="최종 자산규모"
          value={formatEok(result.finalAssets)}
          color="text-amber-400"
          sub="자본+예치금"
        />
        <Cell
          label="연간 정부환원"
          value={formatEok(result.annualGovernmentReturn)}
          color="text-emerald-400"
          sub="Phase 3 기준"
        />
      </div>

      {/* ====== BAR CHART: 연도별 성장 추이 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <SectionHeader title="연도별 성장 추이" color="text-purple-400" />

        <div className="mt-4">
          {/* Phase labels */}
          <div className="flex mb-3 gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-cyan-600" />
              <span className="text-gray-500">Phase 1: 신용보증 확장</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span className="text-gray-500">Phase 2: 은행 전환</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-600" />
              <span className="text-gray-500">Phase 3: BND형 성숙</span>
            </div>
          </div>

          {/* Bar chart area */}
          <div className="flex items-end gap-1 md:gap-1.5" style={{ height: '200px' }}>
            {displayYears.map((d) => {
              const barBg = d.phase === 1 ? 'bg-cyan-600'
                : d.phase === 2 ? 'bg-emerald-600'
                : 'bg-purple-600';

              // Normalize bar height: handle negative cumulative profits
              const normalizedValue = d.cumulativeProfit - Math.min(minCumulativeProfit, 0);
              const heightPct = chartRange > 0 ? (normalizedValue / chartRange) * 100 : 0;
              const clampedHeight = Math.max(heightPct, 2); // minimum visible height

              // Phase divider
              const isPhaseStart = d.year === phase1End + 1 || d.year === phase2End + 1;

              return (
                <div
                  key={d.year}
                  className="flex flex-col items-center flex-1 min-w-0 relative"
                  style={{ height: '100%' }}
                >
                  {/* Phase divider line */}
                  {isPhaseStart && (
                    <div className="absolute left-0 top-0 bottom-5 w-px bg-gray-600 z-10" />
                  )}

                  {/* Bar container */}
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className={`w-full max-w-[28px] rounded-t ${barBg} transition-all duration-300 relative group`}
                      style={{ height: `${clampedHeight}%` }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap">
                        <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300">
                          <div className="font-bold">{d.year}년 (Phase {d.phase})</div>
                          <div>누적이익: {formatEok(d.cumulativeProfit)}</div>
                          <div>연간수익: {formatEok(d.netIncome)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Year label */}
                  <div className="text-[10px] md:text-xs text-gray-600 mt-1 font-mono leading-none">
                    {String(d.year).slice(2)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zero line if there are negative values */}
          {minCumulativeProfit < 0 && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              <div className="flex-1 border-t border-dashed border-gray-700" />
              <span>0 (손익분기선)</span>
              <div className="flex-1 border-t border-dashed border-gray-700" />
            </div>
          )}
        </div>
      </div>

      {/* ====== BND 비교 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <SectionHeader title="BND 비교" color="text-amber-400" />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Simulation */}
          <div className="border border-gray-800 rounded overflow-hidden">
            <div className="bg-cyan-900/20 border-b border-gray-800 px-4 py-2">
              <span className="text-sm md:text-base font-semibold text-cyan-400">
                {regionName} 공공은행 (시뮬레이션)
              </span>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">초기자본</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{formatEok(result.initialCapital)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">총자산</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{formatEok(result.finalAssets)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">연간순이익</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{formatEok(result.finalData.netIncome)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">ROE</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{formatPercent(result.finalROE)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">자본비율</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{formatPercent(result.capitalRatio)}</span>
              </div>
            </div>
          </div>

          {/* Right: BND actual */}
          <div className="border border-gray-800 rounded overflow-hidden">
            <div className="bg-amber-900/20 border-b border-gray-800 px-4 py-2">
              <span className="text-sm md:text-base font-semibold text-amber-400">
                BND (실제, {new Date().getFullYear() - BND_REFERENCE.founded}년 운영)
              </span>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">초기자본</span>
                <span className="text-sm font-mono text-amber-400 font-bold">$2M (27억원)</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">총자산</span>
                <span className="text-sm font-mono text-amber-400 font-bold">{formatEok(BND_REFERENCE.currentAssetsEok)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">연간순이익</span>
                <span className="text-sm font-mono text-amber-400 font-bold">{formatEok(BND_REFERENCE.annualNetIncomeEok)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">ROE</span>
                <span className="text-sm font-mono text-amber-400 font-bold">{formatPercent(BND_REFERENCE.roe)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">자본비율</span>
                <span className="text-sm font-mono text-amber-400 font-bold">{formatPercent(BND_REFERENCE.capitalRatio)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== INFO SECTION: 분석 방법론 ====== */}
      <InfoSection title="분석 방법론 Methodology" color="text-teal-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold text-base flex-shrink-0">Phase 1</span>
            <p className="text-gray-500 text-base">
              현행법 하 신용보증재단 확장 단계입니다. 소규모 대출을 시작하며, 초기자본의 50%까지
              대출 포트폴리오를 구축합니다. 설립 비용(초기자본의 1%)이 차감됩니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">Phase 2</span>
            <p className="text-gray-500 text-base">
              특별법 제정 후 은행 전환 단계입니다. 지방세 의무예치가 시작되어 예금이 유입되고,
              대출-예금 비율 70%로 운영합니다. 순이익의 50%를 자본으로 유보합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold text-base flex-shrink-0">Phase 3</span>
            <p className="text-gray-500 text-base">
              BND형 도매은행으로 성숙한 단계입니다. 지역 금융기관 대출에 참여하며,
              대출-예금 비율 80%로 운영합니다. 순이익의 40%를 유보하고 60%를 지방정부에 환원합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-bold text-base flex-shrink-0">공통</span>
            <p className="text-gray-500 text-base">
              운영비율 20%를 적용하며, Phase 3에서는 수익의 60%를 지방정부에 환원하는 것을 전제로 합니다.
              복리 성장 효과가 반영되어 자본과 예금이 누적적으로 증가합니다.
            </p>
          </div>
        </div>
      </InfoSection>

      {/* ====== INFO SECTION: 노스다코타 은행(BND) 참고 ====== */}
      <InfoSection title="노스다코타 은행(BND) 참고 BND Reference" color="text-amber-400">
        <div className="space-y-3">
          <p className="text-gray-400 text-base">
            <span className="text-amber-400 font-bold">노스다코타 은행(Bank of North Dakota, BND)</span>은
            1919년 $2M(약 27억원)의 초기자본으로 설립된 미국 유일의 주정부 소유 공공은행입니다.
          </p>
          <p className="text-gray-500 text-base">
            BND의 핵심 모델은 <span className="text-emerald-400 font-bold">주정부 세수 의무예치</span>입니다.
            노스다코타 주의 모든 세수가 BND에 의무적으로 예치되며, 이를 기반으로
            지역 금융기관에 도매 대출을 제공하는 구조입니다.
          </p>
          <p className="text-gray-500 text-base">
            105년간의 운영 결과, 총자산 <span className="text-amber-400 font-bold">$10.8B(약 14.6조원)</span>,
            연간 순이익 <span className="text-amber-400 font-bold">$200M(약 2,700억원)</span>,
            ROE <span className="text-amber-400 font-bold">15.8%</span>를 달성하고 있습니다.
          </p>
          <p className="text-gray-500 text-base">
            특히 2008년 글로벌 금융위기 당시 노스다코타 주는 미국 50개 주 중
            유일하게 재정 흑자를 기록했으며, 이는 BND의 지역 중심 안정적 대출 모델 덕분이었습니다.
            설립 이후 누적 $1B 이상을 주정부에 환원하여 세금 부담을 경감했습니다.
          </p>
          <p className="text-gray-500 text-base">
            S&P 신용등급 <span className="text-amber-400 font-bold">{BND_REFERENCE.creditRating}</span>,
            BIS 자본비율 <span className="text-amber-400 font-bold">{formatPercent(BND_REFERENCE.capitalRatio)}</span>로
            상업은행과 비교해도 건전한 재무구조를 유지하고 있습니다.
          </p>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
