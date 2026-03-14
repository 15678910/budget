'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getMetroNames,
  type MetroFiscalData,
  type DistrictFiscalData,
} from '@/lib/data/fiscal-health-data';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';
import { AICatalog } from './AICatalog';

// ============================================================
// Constants
// ============================================================

const NATIONAL_POPULATION = 51_350_000;
const NATIONAL_PUBLIC_SECTOR = 1500; // 조원

// ============================================================
// Sub-components (matching SovereignFundSimulator pattern)
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
        <span className="text-gray-500 text-lg leading-none">{open ? '−' : '+'}</span>
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

/** Format 억원 amounts for display */
function formatEok(eokWon: number): string {
  if (eokWon >= 10000) return `${(eokWon / 10000).toFixed(1)}조원`;
  if (eokWon >= 1000) return `${(eokWon / 1000).toFixed(1)}천억원`;
  return `${Math.round(eokWon).toLocaleString('ko-KR')}억원`;
}

/** Format population for display */
function formatPopLocal(pop: number): string {
  if (pop >= 10000) return `${(pop / 10000).toFixed(0)}만명`;
  return `${pop.toLocaleString('ko-KR')}명`;
}

/** Format 만원 amounts for display */
function formatManWon(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}억원`;
  return `${Math.round(value).toLocaleString('ko-KR')}만원`;
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
// Main Component
// ============================================================

export function LocalFundSimulator() {
  // === Data ===
  const allMetros = useMemo(() => getMetroFiscalData(), []);
  const metroNames = useMemo(
    () => allMetros.map((m) => m.name).sort((a, b) => a.localeCompare(b, 'ko')),
    [allMetros],
  );

  // === Tab state ===
  const [tab, setTab] = useState<'metro' | 'district'>('metro');

  // === Selection state ===
  const [selectedMetroName, setSelectedMetroName] = useState('서울특별시');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');

  // Derived metro
  const selectedMetro = useMemo(
    () => allMetros.find((m) => m.name === selectedMetroName) ?? allMetros[0],
    [allMetros, selectedMetroName],
  );

  // Derived districts for current metro
  const districts = useMemo(
    () => getDistrictFiscalData(selectedMetroName).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [selectedMetroName],
  );

  // Auto-select first district when metro changes or switching to district tab
  const selectedDistrict = useMemo(() => {
    if (tab !== 'district' || districts.length === 0) return null;
    const found = districts.find((d) => d.name === selectedDistrictName);
    return found ?? districts[0];
  }, [tab, districts, selectedDistrictName]);

  // When metro changes, reset district selection
  const handleMetroChange = (name: string) => {
    setSelectedMetroName(name);
    setSelectedDistrictName('');
  };

  // When tab changes to district, auto-set first district
  const handleTabChange = (t: 'metro' | 'district') => {
    setTab(t);
    if (t === 'district' && districts.length > 0 && !selectedDistrictName) {
      setSelectedDistrictName(districts[0].name);
    }
  };

  // === Computed budget/debt/population for active selection ===
  const regionData = useMemo(() => {
    if (tab === 'metro') {
      return {
        name: selectedMetro.name,
        budget: selectedMetro.budget, // 억원
        debt: selectedMetro.debt, // 억원
        population: selectedMetro.population,
        independence: selectedMetro.independence,
        autonomy: selectedMetro.autonomy,
      };
    }
    // District mode
    if (!selectedDistrict) {
      return {
        name: selectedMetro.name,
        budget: selectedMetro.budget,
        debt: selectedMetro.debt,
        population: selectedMetro.population,
        independence: selectedMetro.independence,
        autonomy: selectedMetro.autonomy,
      };
    }
    // Estimate district budget from parent metro per-capita budget
    const metroPerCapitaBudget = selectedMetro.budget / selectedMetro.population;
    const estimatedBudget = metroPerCapitaBudget * selectedDistrict.population;

    return {
      name: `${selectedMetro.name} ${selectedDistrict.name}`,
      budget: Math.round(estimatedBudget), // 억원
      debt: selectedDistrict.debt, // 억원
      population: selectedDistrict.population,
      independence: selectedDistrict.independence,
      autonomy: selectedDistrict.autonomy,
    };
  }, [tab, selectedMetro, selectedDistrict]);

  // === Slider states ===
  const [efficiencyRate, setEfficiencyRate] = useState(5);
  const [fundReturnRate, setFundReturnRate] = useState(7);
  const [years, setYears] = useState(20);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  // === Simulation ===
  const simulation = useMemo(() => {
    const { budget, debt, population } = regionData;
    const annualDebtService = debt * 0.05; // 연간 채무상환비 추정 (이자 + 원금상환)

    const annualSavings = budget * (efficiencyRate / 100); // 억원
    const debtServiceCoverage = Math.min(annualSavings, annualDebtService);
    const fundContribution = Math.max(0, annualSavings - debtServiceCoverage); // 억원/년

    // Year-by-year fund growth
    const yearlyData: {
      year: number;
      fundSize: number;
      annualReturn: number;
      basicIncomeManWon: number;
    }[] = [];
    let fundSize = 0;

    for (let y = 1; y <= years; y++) {
      fundSize = fundSize * (1 + fundReturnRate / 100) + fundContribution;
      const annualReturn = fundSize * (fundReturnRate / 100);
      const withdrawable = fundSize * (withdrawalRate / 100); // 억원
      const perCapitaWon = (withdrawable * 100_000_000) / population; // 원/인/년
      const monthlyManWon = perCapitaWon / 12 / 10_000; // 만원/월

      yearlyData.push({
        year: 2026 + y,
        fundSize,
        annualReturn,
        basicIncomeManWon: monthlyManWon,
      });
    }

    const finalYear = yearlyData[yearlyData.length - 1];

    // Debt service threshold: efficiency rate needed to start contributing to fund
    const debtServiceThreshold = budget > 0 ? (annualDebtService / budget) * 100 : 0;

    return {
      annualSavings,
      annualDebtService,
      debtServiceCoverage,
      fundContribution,
      debtServiceThreshold,
      yearlyData,
      finalFundSize: finalYear?.fundSize ?? 0,
      finalBasicIncomeManWon: finalYear?.basicIncomeManWon ?? 0,
      finalAnnualReturn: finalYear?.annualReturn ?? 0,
    };
  }, [regionData, efficiencyRate, fundReturnRate, years, withdrawalRate]);

  // === National comparison ===
  const nationalComparison = useMemo(() => {
    // National-level simulation with same parameters
    const nationalBudgetEok = NATIONAL_PUBLIC_SECTOR * 10000; // 조원 -> 억원
    const managedDeficitEok = 109 * 10000; // 109조원 -> 억원
    const nationalSavings = nationalBudgetEok * (efficiencyRate / 100);
    const nationalDeficitCoverage = Math.min(nationalSavings, managedDeficitEok);
    const nationalFundContrib = Math.max(0, nationalSavings - nationalDeficitCoverage);

    let nationalFund = 0;
    for (let y = 1; y <= years; y++) {
      nationalFund = nationalFund * (1 + fundReturnRate / 100) + nationalFundContrib;
    }
    const nationalWithdrawable = nationalFund * (withdrawalRate / 100);
    const nationalPerCapita = (nationalWithdrawable * 100_000_000) / NATIONAL_POPULATION;
    const nationalMonthlyManWon = nationalPerCapita / 12 / 10_000;

    return {
      fundSize: nationalFund,
      monthlyManWon: nationalMonthlyManWon,
    };
  }, [efficiencyRate, fundReturnRate, years, withdrawalRate]);

  // Chart data: every 5 years + final year
  const chartData = simulation.yearlyData.filter(
    (_, i) => (i + 1) % 5 === 0 || i === simulation.yearlyData.length - 1,
  );
  const maxFund = Math.max(...chartData.map((d) => d.fundSize), 1);

  const hasFundContribution = simulation.fundContribution > 0;
  const thresholdPct = Math.ceil(simulation.debtServiceThreshold * 10) / 10;
  const debtBudgetRatio = regionData.budget > 0 ? (regionData.debt / regionData.budget) * 100 : 0;

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            지역 AI기본사회 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="자치구AI" />
          <span className="text-sm md:text-base text-gray-600">
            광역·자치구별 효율화 계산기
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

      {/* ====== SECTION 1: 지역 현황 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title={`${regionData.name} 현황 Region Overview`} color="text-cyan-400" />
        <Cell
          label="예산규모"
          value={formatEok(regionData.budget)}
          color="text-cyan-400"
          sub={tab === 'district' && selectedDistrict ? '추정치 (1인당 광역예산 기준)' : '당초예산 기준'}
        />
        <Cell
          label="지역채무"
          value={formatEok(regionData.debt)}
          color="text-red-400"
          sub={`채무/예산 ${debtBudgetRatio.toFixed(1)}%`}
        />
        <Cell
          label="인구"
          value={formatPopLocal(regionData.population)}
          color="text-cyan-400"
          sub="주민등록 기준"
        />
        <Cell
          label="재정자립도"
          value={`${regionData.independence.toFixed(1)}%`}
          color={regionData.independence >= 40 ? 'text-emerald-400' : regionData.independence >= 25 ? 'text-amber-400' : 'text-red-400'}
          sub="자체수입 / 총세입"
        />
        <Cell
          label="채무 상환비 (추정)"
          value={formatEok(regionData.debt * 0.05)}
          color="text-amber-400"
          sub="채무 x 5% (이자+원금)"
        />
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="효율화율"
            value={efficiencyRate}
            min={1}
            max={15}
            step={0.5}
            unit="%"
            subLabel={`=${formatEok(regionData.budget * efficiencyRate / 100)}/년`}
            color="text-blue-400"
            onChange={setEfficiencyRate}
          />
          <Slider
            label="펀드 수익률"
            value={fundReturnRate}
            min={3}
            max={12}
            step={0.5}
            unit="%"
            color="text-emerald-400"
            onChange={setFundReturnRate}
          />
          <Slider
            label="운용 기간"
            value={years}
            min={5}
            max={50}
            step={1}
            unit="년"
            color="text-purple-400"
            onChange={setYears}
          />
          <Slider
            label="인출률"
            value={withdrawalRate}
            min={2}
            max={6}
            step={0.5}
            unit="%"
            subLabel="지속가능 인출"
            color="text-amber-400"
            onChange={setWithdrawalRate}
          />
        </div>
      </div>

      {/* ====== AI 활동 카탈로그 ====== */}
      <div className="space-y-1">
        <div className="border border-gray-800 px-4 py-3">
          <p className="text-sm text-gray-500">
            아래 카탈로그에서 AI 활동을 선택하면 전국 기준 효율화율(%)이 계산됩니다.
            이 비율을 {regionData.name} 예산에 동일하게 적용하여 시뮬레이션합니다.
          </p>
        </div>
        <AICatalog
          onApplyEfficiency={(rate) => setEfficiencyRate(Math.max(1, Math.min(15, Math.round(rate * 10) / 10)))}
          currentEfficiencyRate={efficiencyRate}
        />
      </div>

      {/* ====== SECTION 3: 효율화 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="효율화 결과 Efficiency Results" color="text-blue-400" />
        <Cell
          label="연간 절감액"
          value={formatEok(simulation.annualSavings)}
          color="text-blue-400"
          sub={`예산 ${formatEok(regionData.budget)} x ${efficiencyRate}%`}
        />
        <Cell
          label="채무 상환"
          value={formatEok(simulation.debtServiceCoverage)}
          color="text-amber-400"
          sub={`연간 채무상환비 ${formatEok(simulation.annualDebtService)} 중`}
        />
        <Cell
          label="펀드 적립"
          value={formatEok(simulation.fundContribution)}
          color={hasFundContribution ? 'text-emerald-400' : 'text-gray-600'}
          sub={hasFundContribution ? '연간 지역펀드 적립액' : '채무상환 후 잔여 없음'}
        />
      </div>

      {/* Contextual threshold message */}
      <div className="border border-gray-800 px-4 py-3">
        {!hasFundContribution ? (
          <p className="text-base md:text-base text-amber-400/80">
            효율화 {efficiencyRate}%로는 채무상환({formatEok(simulation.annualDebtService)})에 모두 사용됩니다.{' '}
            <span className="text-blue-400 font-semibold">{thresholdPct}% 이상</span>이면 펀드 적립이 시작됩니다.
          </p>
        ) : (
          <p className="text-base md:text-base text-emerald-400/80">
            채무상환 {formatEok(simulation.debtServiceCoverage)} 후 연간{' '}
            <span className="text-emerald-400 font-semibold">{formatEok(simulation.fundContribution)}</span>을
            지역펀드에 적립합니다.
          </p>
        )}
      </div>

      {/* ====== SECTION 4: N년 후 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader
          title={`${years}년 후 결과 (${2026 + years}년)`}
          color="text-emerald-400"
        />
        <Cell
          label="펀드 규모"
          value={formatEok(simulation.finalFundSize)}
          color="text-emerald-400"
          sub={simulation.finalFundSize > 0 ? `예산 대비 ${(simulation.finalFundSize / regionData.budget * 100).toFixed(0)}%` : undefined}
        />
        <Cell
          label="연간 수익"
          value={formatEok(simulation.finalAnnualReturn)}
          color="text-emerald-400"
          sub={`수익률 ${fundReturnRate}% 적용`}
        />
        <Cell
          label="월 기본소득"
          value={simulation.finalBasicIncomeManWon > 0 ? `${formatManWon(simulation.finalBasicIncomeManWon)}/월` : '0원/월'}
          color={simulation.finalBasicIncomeManWon > 0 ? 'text-emerald-400' : 'text-gray-600'}
          sub={`인출률 ${withdrawalRate}% / 인구 ${formatPopLocal(regionData.population)}`}
        />
        <Cell
          label="연 기본소득"
          value={simulation.finalBasicIncomeManWon > 0 ? `${formatManWon(simulation.finalBasicIncomeManWon * 12)}/년` : '0원/년'}
          color={simulation.finalBasicIncomeManWon > 0 ? 'text-emerald-400' : 'text-gray-600'}
          sub="1인당 연간 수령액"
        />
      </div>

      {/* ====== SECTION 5: 핵심 메시지 ====== */}
      <div className="border border-blue-900/50 bg-blue-950/30 p-4 md:p-5 rounded">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          핵심 메시지 Key Takeaway
        </div>
        <p className="text-base md:text-base text-gray-300 leading-relaxed">
          {regionData.name} 예산 {formatEok(regionData.budget)}의{' '}
          <span className="text-blue-400 font-bold">{efficiencyRate}%</span>를 효율화하면,
          연간 <span className="text-blue-400 font-bold">{formatEok(simulation.annualSavings)}</span>을
          절감하여 채무상환 <span className="text-amber-400 font-bold">{formatEok(simulation.debtServiceCoverage)}</span> 후,
          나머지 <span className="text-emerald-400 font-bold">{formatEok(simulation.fundContribution)}</span>을
          지역펀드에 적립할 수 있습니다.
          {simulation.finalBasicIncomeManWon > 0 && (
            <>
              {' '}{years}년 후 펀드 규모{' '}
              <span className="text-emerald-400 font-bold">{formatEok(simulation.finalFundSize)}</span>,
              월 기본소득{' '}
              <span className="text-emerald-400 font-bold">{formatManWon(simulation.finalBasicIncomeManWon)}</span> 가능.
            </>
          )}
        </p>
      </div>

      {/* ====== SECTION 6: 연도별 성장 그래프 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-4">
          연도별 성장 추이 Fund Growth Timeline
        </div>
        <div className="space-y-2">
          {chartData.map((d) => (
            <div key={d.year} className="flex items-center gap-3 py-1">
              <span className="text-sm md:text-base text-gray-500 w-12 text-right font-mono">{d.year}</span>
              <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: `${(d.fundSize / maxFund) * 100}%` }}
                />
              </div>
              <span className="text-sm md:text-base text-gray-400 w-24 text-right font-mono">
                {formatEok(d.fundSize)}
              </span>
              <span className="text-sm md:text-base text-emerald-400 w-28 text-right font-mono">
                월 {d.basicIncomeManWon > 0 ? formatManWon(d.basicIncomeManWon) : '0원'}
              </span>
            </div>
          ))}
        </div>
        {!hasFundContribution && (
          <p className="text-sm md:text-base text-gray-600 mt-3 text-center">
            현재 효율화율({efficiencyRate}%)에서는 펀드 적립이 없어 그래프가 표시되지 않습니다.
          </p>
        )}
      </div>

      {/* ====== SECTION 7: 전국 비교 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="전국 비교 National Comparison" color="text-gray-400" />
        <Cell
          label={`${regionData.name} 월 기본소득`}
          value={simulation.finalBasicIncomeManWon > 0 ? `${formatManWon(simulation.finalBasicIncomeManWon)}/월` : '0원/월'}
          color={simulation.finalBasicIncomeManWon > 0 ? 'text-emerald-400' : 'text-gray-600'}
          sub={`인구 ${formatPopLocal(regionData.population)}`}
        />
        <Cell
          label="전국 평균 월 기본소득"
          value={nationalComparison.monthlyManWon > 0 ? `${formatManWon(nationalComparison.monthlyManWon)}/월` : '0원/월'}
          color={nationalComparison.monthlyManWon > 0 ? 'text-blue-400' : 'text-gray-600'}
          sub={`인구 ${formatPopLocal(NATIONAL_POPULATION)} / 동일 설정`}
        />
        <Cell
          label="전국 대비"
          value={
            nationalComparison.monthlyManWon > 0 && simulation.finalBasicIncomeManWon > 0
              ? `${((simulation.finalBasicIncomeManWon / nationalComparison.monthlyManWon) * 100).toFixed(0)}%`
              : '-'
          }
          color={
            simulation.finalBasicIncomeManWon > nationalComparison.monthlyManWon
              ? 'text-emerald-400'
              : simulation.finalBasicIncomeManWon > 0
                ? 'text-amber-400'
                : 'text-gray-600'
          }
          sub={
            simulation.finalBasicIncomeManWon > nationalComparison.monthlyManWon
              ? '전국 평균 이상'
              : simulation.finalBasicIncomeManWon > 0
                ? '전국 평균 이하'
                : undefined
          }
        />
      </div>

      {/* ====== SECTION 8: 시뮬레이션 조건 해설 ====== */}
      <InfoSection title="시뮬레이션 전제 조건 Simulation Assumptions" color="text-blue-400">
        <div>
          <h4 className="text-base md:text-base font-bold text-gray-300 mb-1.5">지역 시뮬레이션 기본 가정</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
              <div>
                <span className="text-gray-300 font-semibold">지역 예산을 효율화 대상으로 설정</span>
                <p className="text-gray-500 text-base">국가 시뮬레이터가 공공부문 1,500조원을 대상으로 하는 것과 달리, 해당 광역/자치구의 자체 예산규모를 기준으로 합니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
              <div>
                <span className="text-gray-300 font-semibold">채무 상환 우선 (연간 채무의 5%)</span>
                <p className="text-gray-500 text-base">지역채무 × 5%를 연간 채무상환비(이자+원금상환)로 추정합니다. 효율화 절감액은 먼저 이 채무상환에 사용되고, 나머지만 펀드에 적립됩니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
              <div>
                <span className="text-gray-300 font-semibold">시군구 예산은 추정치</span>
                <p className="text-gray-500 text-base">시군구별 예산 데이터가 별도로 제공되지 않으므로, 상위 광역시도의 1인당 예산 비율을 적용하여 추정합니다. 실제 예산과 차이가 있을 수 있습니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
              <div>
                <span className="text-gray-300 font-semibold">복리 성장 + 지역별 인출</span>
                <p className="text-gray-500 text-base">적립된 펀드는 복리로 성장하며, 인출률에 따라 해당 지역 주민에게만 기본소득으로 분배됩니다. 지역 인구가 적을수록 1인당 분배액이 커집니다.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-3">
          <h4 className="text-base md:text-base font-bold text-gray-300 mb-1.5">국가 vs 지역 시뮬레이션 차이</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 text-gray-500 font-normal">항목</th>
                  <th className="text-left py-2 text-cyan-400 font-normal">국가 (AI기본사회)</th>
                  <th className="text-left py-2 text-teal-400 font-normal">지역 (지역AI)</th>
                </tr>
              </thead>
              <tbody className="text-gray-500">
                <tr className="border-b border-gray-800/50">
                  <td className="py-1.5">효율화 대상</td>
                  <td className="py-1.5">공공부문 1,500조원</td>
                  <td className="py-1.5">지역 자체 예산</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-1.5">우선 배분</td>
                  <td className="py-1.5">관리재정적자 109조원</td>
                  <td className="py-1.5">지역채무 상환비 (채무×5%)</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-1.5">분배 대상</td>
                  <td className="py-1.5">전 국민 5,135만명</td>
                  <td className="py-1.5">해당 지역 주민만</td>
                </tr>
                <tr>
                  <td className="py-1.5">특징</td>
                  <td className="py-1.5">규모의 경제</td>
                  <td className="py-1.5">지역 맞춤, 인구 적으면 유리</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-3">
          <h4 className="text-base md:text-base font-bold text-gray-300 mb-1.5">한계 및 유의사항</h4>
          <ul className="list-disc list-inside space-y-1.5 text-gray-500 text-base">
            <li>실제 지역 효율화율은 중앙정부 방침, 지자체 역량 등에 따라 크게 달라질 수 있습니다</li>
            <li>지역채무 상환비 5%는 평균적 추정치이며, 금리·상환 조건에 따라 다릅니다</li>
            <li>지역 인구 이동(전입·전출)은 미반영하며, 현재 주민등록 인구 기준입니다</li>
            <li>인플레이션 미반영 명목 수치입니다</li>
            <li>지역 간 재정 이전(교부세, 보조금 등)의 변화는 고려하지 않습니다</li>
          </ul>
        </div>
      </InfoSection>

      {/* ====== SECTION 9: 노르웨이 모델 참고 ====== */}
      <InfoSection title="참고: 노르웨이 국부펀드 모델 Norway GPFG Reference" color="text-teal-400">
        <div>
          <p>
            본 시뮬레이터의 펀드 운용 모델은 <span className="text-teal-400 font-semibold">노르웨이 정부연금기금 글로벌 (GPFG)</span>을 참고했습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-gray-800 p-3 rounded text-center">
            <div className="text-sm text-gray-500 mb-1">펀드 규모</div>
            <div className="text-lg font-mono font-bold text-teal-400">$1.7조</div>
            <div className="text-xs text-gray-600">약 2,300조원</div>
          </div>
          <div className="border border-gray-800 p-3 rounded text-center">
            <div className="text-sm text-gray-500 mb-1">1인당</div>
            <div className="text-lg font-mono font-bold text-teal-400">$310K</div>
            <div className="text-xs text-gray-600">인구 550만명</div>
          </div>
          <div className="border border-gray-800 p-3 rounded text-center">
            <div className="text-sm text-gray-500 mb-1">연평균 수익률</div>
            <div className="text-lg font-mono font-bold text-teal-400">6.3%</div>
            <div className="text-xs text-gray-600">1998~2023 실질</div>
          </div>
          <div className="border border-gray-800 p-3 rounded text-center">
            <div className="text-sm text-gray-500 mb-1">재정 인출률</div>
            <div className="text-lg font-mono font-bold text-amber-400">3%</div>
            <div className="text-xs text-gray-600">원금 보존 규칙</div>
          </div>
        </div>

        <div>
          <h4 className="text-base md:text-base font-bold text-gray-300 mb-1.5">핵심 운용 원칙</h4>
          <ul className="list-disc list-inside space-y-1.5 text-gray-500 text-base">
            <li><span className="text-gray-300 font-semibold">세대 간 형평성:</span> 현 세대의 자원을 미래 세대와 공유. 원금을 유지하며 수익분만 인출</li>
            <li><span className="text-gray-300 font-semibold">글로벌 분산투자:</span> 70개국 9,000개+ 기업에 분산. 노르웨이 자국 투자 금지</li>
            <li><span className="text-gray-300 font-semibold">투명성:</span> 모든 보유 종목, 수익률, 의결권 행사 내역 실시간 공개</li>
            <li><span className="text-gray-300 font-semibold">윤리 투자:</span> 인권·환경·부패 관련 기업 투자 배제 (윤리위원회 운영)</li>
            <li><span className="text-gray-300 font-semibold">정치적 독립성:</span> 중앙은행 산하 독립 기관이 운용, 정치적 간섭 최소화</li>
          </ul>
        </div>
      </InfoSection>

      {/* ====== SECTION 10: 파라미터 해설 ====== */}
      <InfoSection title="파라미터 해설 Parameter Guide" color="text-purple-400">
        <div className="space-y-4">
          <div>
            <span className="text-blue-400 font-bold">효율화율 (1~15%)</span>
            <p className="text-gray-500 text-base mt-1">
              지역 예산 대비 AI·자동화로 절감 가능한 비율. 보수적(3~5%): 단순 행정 자동화. 중간(7~10%): AI 도입, 디지털 전환. 적극적(10~15%): 전면 AI 행정.
            </p>
          </div>
          <div>
            <span className="text-emerald-400 font-bold">펀드 수익률 (3~12%)</span>
            <p className="text-gray-500 text-base mt-1">
              글로벌 분산투자 기준 연간 수익률. 보수적(3~5%): 채권 중심. 노르웨이 GPFG 실적: ~6.3%. 적극적(8~12%): 주식·대체투자 확대.
            </p>
          </div>
          <div>
            <span className="text-purple-400 font-bold">운용 기간 (5~50년)</span>
            <p className="text-gray-500 text-base mt-1">
              복리 효과는 시간이 길수록 극적. 노르웨이 GPFG도 28년간 운용하여 현재 규모 달성.
            </p>
          </div>
          <div>
            <span className="text-amber-400 font-bold">인출률 (2~6%)</span>
            <p className="text-gray-500 text-base mt-1">
              3% = 노르웨이 방식 (원금 보존, 영구 지속). 4% = 미국 &quot;4% 룰&quot; (30년 지속). 5~6% = 높은 분배, 원금 소진 위험.
            </p>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
