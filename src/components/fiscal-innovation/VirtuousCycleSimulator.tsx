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

// Central government constants
const NATIONAL_POPULATION = 51_350_000;
const BASE_GDP = 2643.9;  // 조원 (2025)
const GDP_GROWTH_RATE = 0.02;

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
        <span className="text-base text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
          {subLabel && <span className="text-sm text-gray-500">({subLabel})</span>}
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
        <div className="px-4 py-4 md:px-5 md:py-5 border-t border-gray-800 bg-gray-950/50 space-y-4 text-base text-gray-400 leading-relaxed">
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

function formatManWon(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}억원`;
  return `${Math.round(v).toLocaleString()}만원`;
}

function formatPopLocal(pop: number): string {
  if (pop >= 10000) return `${(pop / 10000).toFixed(0)}만명`;
  return `${pop.toLocaleString()}명`;
}

// ============================================================
// Styling constants
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
// Phase color config
// ============================================================

const PHASE_CONFIG = {
  capitalize: { label: '자본화', years: 'Y0-3', color: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
  lending:    { label: '대출성장', years: 'Y4-7', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
  services:   { label: '서비스확대', years: 'Y8-15', color: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500' },
  compound:   { label: '복리성장', years: 'Y16-30', color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
} as const;

// ============================================================
// Main Component
// ============================================================

export function VirtuousCycleSimulator() {
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

  // === Computed region data ===
  const regionData = useMemo(() => {
    if (tab === 'metro') {
      return {
        name: selectedMetro.name,
        budget: selectedMetro.budget,
        population: selectedMetro.population,
        independence: selectedMetro.independence,
      };
    }
    if (!selectedDistrict) {
      return {
        name: selectedMetro.name,
        budget: selectedMetro.budget,
        population: selectedMetro.population,
        independence: selectedMetro.independence,
      };
    }
    const metroPerCapitaBudget = selectedMetro.budget / selectedMetro.population;
    const estimatedBudget = metroPerCapitaBudget * selectedDistrict.population;
    return {
      name: `${selectedMetro.name} ${selectedDistrict.name}`,
      budget: Math.round(estimatedBudget),
      population: selectedDistrict.population,
      independence: selectedDistrict.independence,
    };
  }, [tab, selectedMetro, selectedDistrict]);

  const regionBudget = regionData.budget;
  const regionPopulation = regionData.population;
  const regionIndependence = regionData.independence;

  // === Slider states ===
  const [aiEfficiencyRate, setAiEfficiencyRate] = useState(10);
  const [bankLendingRate, setBankLendingRate] = useState(2.5);
  const [currencyMultiplier, setCurrencyMultiplier] = useState(1.8);
  const [reinvestmentRate, setReinvestmentRate] = useState(40);
  const [centralAITaxRate, setCentralAITaxRate] = useState(2.0);
  const [centralBIRate, setCentralBIRate] = useState(30);
  const [energyCapacityMW, setEnergyCapacityMW] = useState(100);

  // === 30-Year Compound Simulation ===
  const simulation = useMemo(() => {
    interface YearData {
      year: number;
      phase: 'capitalize' | 'lending' | 'services' | 'compound';
      phaseLabel: string;
      bankCapital: number;
      bankAssets: number;
      bankNetIncome: number;
      cumulativeIncome: number;
      servicesBudget: number;
      basicIncomeMonthly: number;
      independence: number;
      currencyEffect: number;
      centralBIMonthly: number;
      totalBIMonthly: number;
      gdp: number;
      energyBIMonthly: number;
    }

    const yearlyData: YearData[] = [];
    const aiSavings = regionBudget * (aiEfficiencyRate / 100);

    let bankCapital = 0;
    let cumulativeIncome = 0;

    // Asset cap to prevent unrealistic compounding
    const maxBankCapital = regionBudget * 5;

    for (let y = 0; y <= 30; y++) {
      let phase: YearData['phase'];
      let phaseLabel: string;
      let bankNetIncome = 0;
      let servicesBudget = 0;
      let currencyEffect = 0;
      let bankAssets = 0;

      // Energy generation BI calculation (구양리/영광군 모델)
      // Solar: ~1,200 MWh/MW/year, revenue ~100원/kWh after costs
      // Wind: ~2,500 MWh/MW/year, revenue ~80원/kWh after costs
      // Blended average: ~1,500 MWh/MW/year, net revenue ~90원/kWh
      // Ramp: 3-year construction period (0→33→66→100%)
      const energyRamp = Math.min(y / 3, 1.0);
      const annualEnergyRevenue = energyCapacityMW * 1500 * 1000 * 90 * energyRamp; // 원/year (1500MWh×1000kWh/MWh×90원/kWh)
      // 50% of revenue goes to BI distribution, 30% to maintenance, 20% to bank capital
      const energyBIFund = annualEnergyRevenue * 0.5;
      const energyBankContribution = annualEnergyRevenue * 0.2; // feeds into bank capital
      const energyBIMonthly = regionPopulation > 0
        ? Math.round(energyBIFund / regionPopulation / 12)
        : 0;

      if (y <= 3) {
        phase = 'capitalize';
        phaseLabel = '자본화';
        const ramp = Math.min(y / 3, 1);
        const capitalContribution = aiSavings * ramp * 0.5;
        bankCapital = Math.min(bankCapital + capitalContribution, maxBankCapital);
        bankCapital = Math.min(bankCapital + energyBankContribution / 100000000, maxBankCapital); // 원→억원
      } else if (y <= 7) {
        phase = 'lending';
        phaseLabel = '대출성장';
        const leverage = 8;
        const loanPortfolio = bankCapital * leverage;
        const grossRevenue = loanPortfolio * (bankLendingRate / 100);
        bankNetIncome = grossRevenue * 0.80;
        bankAssets = bankCapital + loanPortfolio;

        const retainedAmount = bankNetIncome * (reinvestmentRate / 100);
        bankCapital = Math.min(bankCapital + retainedAmount + aiSavings * 0.3 + energyBankContribution / 100000000, maxBankCapital);
      } else if (y <= 15) {
        phase = 'services';
        phaseLabel = '서비스확대';
        const leverage = 9;
        const loanPortfolio = bankCapital * leverage;
        const grossRevenue = loanPortfolio * (bankLendingRate / 100);
        bankNetIncome = grossRevenue * 0.80;
        bankAssets = bankCapital + loanPortfolio;

        const retainedAmount = bankNetIncome * (reinvestmentRate / 100);
        bankCapital = Math.min(bankCapital + retainedAmount + energyBankContribution / 100000000, maxBankCapital);

        servicesBudget = bankNetIncome * (1 - reinvestmentRate / 100) + aiSavings * 0.3;
      } else {
        phase = 'compound';
        phaseLabel = '복리성장';
        const leverage = 10;
        const loanPortfolio = bankCapital * leverage;
        const grossRevenue = loanPortfolio * (bankLendingRate / 100);
        bankNetIncome = grossRevenue * 0.80;
        bankAssets = bankCapital + loanPortfolio;

        const retainedAmount = bankNetIncome * (reinvestmentRate / 100);
        bankCapital = Math.min(bankCapital + retainedAmount + energyBankContribution / 100000000, maxBankCapital);

        servicesBudget = bankNetIncome * (1 - reinvestmentRate / 100) + aiSavings * 0.3;

        // Local currency amplification
        const currencyBase = servicesBudget * 0.3;
        currencyEffect = currencyBase * currencyMultiplier * 0.75;
        const additionalTaxReturn = currencyEffect * 0.025;
        servicesBudget += additionalTaxReturn;
      }

      cumulativeIncome += bankNetIncome;

      let basicIncomeMonthly = 0;
      if (regionPopulation > 0 && y >= 5) {
        basicIncomeMonthly = Math.round((servicesBudget / regionPopulation) * 100000000 / 12);
      }

      const currentOwnRevenue = regionBudget * (regionIndependence / 100);
      const newOwnRevenue = currentOwnRevenue + bankNetIncome + aiSavings;
      const independence = Math.min((newOwnRevenue / regionBudget) * 100, 100);

      // Central government BI calculation
      const gdp = BASE_GDP * Math.pow(1 + GDP_GROWTH_RATE, y);
      const centralAITaxRevenue = gdp * (centralAITaxRate / 100);
      const centralBIFund = centralAITaxRevenue * (centralBIRate / 100);
      const centralRamp = Math.min(y / 5, 1.0);
      const centralBIMonthly = Math.round(
        (centralBIFund * centralRamp * 1_0000_0000_0000) / NATIONAL_POPULATION / 12
      );
      const totalBIMonthly = centralBIMonthly + basicIncomeMonthly + energyBIMonthly;

      yearlyData.push({
        year: 2026 + y, phase, phaseLabel, bankCapital, bankAssets,
        bankNetIncome, cumulativeIncome, servicesBudget,
        basicIncomeMonthly, independence, currencyEffect,
        centralBIMonthly, totalBIMonthly, gdp, energyBIMonthly,
      });
    }

    // AI기본사회 threshold: 30만원/월/인
    const thresholdYear = yearlyData.find(d => d.totalBIMonthly >= 300000)?.year ?? null;

    // Key milestones
    const year10 = yearlyData[10];
    const year20 = yearlyData[20];
    const year30 = yearlyData[30];

    const verdict: 'achievable' | 'long_term' | 'unreachable' =
      thresholdYear !== null && thresholdYear <= 2046 ? 'achievable'
      : thresholdYear !== null && thresholdYear <= 2056 ? 'long_term'
      : 'unreachable';

    return { yearlyData, thresholdYear, year10, year20, year30, verdict, aiSavings };
  }, [aiEfficiencyRate, bankLendingRate, currencyMultiplier, reinvestmentRate,
      centralAITaxRate, centralBIRate, energyCapacityMW,
      regionBudget, regionPopulation, regionIndependence]);

  const { yearlyData, thresholdYear, year10, year20, year30, verdict, aiSavings } = simulation;

  // === Verdict config ===
  const verdictConfig = {
    achievable: {
      label: '달성 가능',
      emoji: '\uD83C\uDFAF',
      bg: 'bg-emerald-900/40',
      border: 'border-emerald-700',
      text: 'text-emerald-400',
      desc: `중앙+지역 합산 기본소득 30만원/월을 ${thresholdYear}년에 달성할 수 있습니다`,
    },
    long_term: {
      label: '장기 목표',
      emoji: '\uD83D\uDD2E',
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-400',
      desc: `${thresholdYear}년경 달성 가능합니다. AI효율화율·AI세율·재투자율을 높이면 앞당길 수 있습니다`,
    },
    unreachable: {
      label: '추가 정책 필요',
      emoji: '\u26A0\uFE0F',
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-400',
      desc: '현재 설정으로는 30년 내 AI기본사회 도달이 어렵습니다. AI세율·효율화율·에너지 설비·재투자율을 높여보세요',
    },
  };

  const v = verdictConfig[verdict];

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            선순환 사이클 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="선순환사이클" />
          <span className="text-sm md:text-base text-gray-600">
            AI 효율화 → 공공은행 → 기본소득
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

        {/* Group 1: 지역 공공은행 */}
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">지역 공공은행 Local Public Bank</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="AI 효율화율"
            value={aiEfficiencyRate}
            min={1}
            max={30}
            step={0.5}
            unit="%"
            color="text-cyan-400"
            onChange={setAiEfficiencyRate}
          />
          <Slider
            label="공공은행 대출금리"
            value={bankLendingRate}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="%"
            color="text-emerald-400"
            onChange={setBankLendingRate}
          />
          <Slider
            label="지역화폐 승수"
            value={currencyMultiplier}
            min={1.0}
            max={3.0}
            step={0.1}
            unit="배"
            color="text-purple-400"
            onChange={setCurrencyMultiplier}
          />
          <Slider
            label="순환 재투자율"
            value={reinvestmentRate}
            min={10}
            max={80}
            step={5}
            unit="%"
            color="text-amber-400"
            onChange={setReinvestmentRate}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-4" />

        {/* Group 2: 중앙정부 AI세 */}
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">중앙정부 AI세 Central AI Tax</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="중앙 AI세 수준"
            value={centralAITaxRate}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="%"
            subLabel={`GDP의 ${centralAITaxRate}%`}
            color="text-blue-400"
            onChange={setCentralAITaxRate}
          />
          <Slider
            label="중앙 기본소득 비중"
            value={centralBIRate}
            min={10}
            max={60}
            step={5}
            unit="%"
            subLabel="AI세 중 UBI 배분"
            color="text-indigo-400"
            onChange={setCentralBIRate}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-4" />

        {/* Group 3: 에너지 발전 */}
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">에너지 발전 Energy Generation</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="재생에너지 설비용량"
            value={energyCapacityMW}
            min={0}
            max={5000}
            step={50}
            unit="MW"
            subLabel={energyCapacityMW >= 1000 ? `${(energyCapacityMW / 1000).toFixed(1)}GW` : `${energyCapacityMW}MW`}
            color="text-yellow-400"
            onChange={setEnergyCapacityMW}
          />
        </div>
      </div>

      {/* ====== VERDICT BANNER ====== */}
      <div className={`border ${v.border} ${v.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{v.emoji}</span>
          <span className={`text-lg md:text-xl font-bold ${v.text}`}>{v.label}</span>
          <span className="text-sm text-gray-500">({regionData.name})</span>
        </div>
        <p className="text-base text-gray-300 leading-relaxed">{v.desc}</p>
      </div>

      {/* ====== 4-PHASE CYCLE ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="4단계 선순환 사이클" color="text-cyan-400" />
      </div>
      <div className="grid grid-cols-4 gap-px">
        {(Object.keys(PHASE_CONFIG) as Array<keyof typeof PHASE_CONFIG>).map((phaseKey) => {
          const cfg = PHASE_CONFIG[phaseKey];
          const isActive = year30.phase === phaseKey;
          return (
            <div
              key={phaseKey}
              className={`border ${isActive ? cfg.border : 'border-gray-800'} p-3 md:p-4 text-center ${isActive ? 'bg-gray-900/50' : ''}`}
            >
              <div className={`w-3 h-3 ${cfg.color} rounded-full mx-auto mb-2`} />
              <div className={`text-sm md:text-base font-bold ${cfg.text}`}>{cfg.label}</div>
              <div className="text-xs text-gray-600">{cfg.years}</div>
            </div>
          );
        })}
      </div>

      {/* ====== KEY METRICS ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="핵심 지표" color="text-emerald-400" />
        <Cell
          label="AI 연간 절감액"
          value={formatEok(aiSavings)}
          color="text-cyan-400"
          sub={`예산 ${formatEok(regionBudget)} x ${aiEfficiencyRate}%`}
        />
        <Cell
          label="10년차 은행자산"
          value={formatEok(year10.bankAssets)}
          color="text-emerald-400"
          sub={`자본 ${formatEok(year10.bankCapital)}`}
        />
        <Cell
          label="20년차 은행자산"
          value={formatEok(year20.bankAssets)}
          color="text-purple-400"
          sub={`자본 ${formatEok(year20.bankCapital)}`}
        />
        <Cell
          label="30년차 합산소득"
          value={`${Math.round(year30.totalBIMonthly).toLocaleString()}원/월`}
          color="text-rose-400"
          sub={`연 ${Math.round(year30.totalBIMonthly * 12).toLocaleString()}원`}
        />
        <Cell
          label="AI기본사회 도달"
          value={thresholdYear ? `${thresholdYear}년` : '미도달'}
          color={thresholdYear ? 'text-emerald-400' : 'text-red-400'}
          sub="중앙+지역+에너지 합산 30만원/월"
        />
        <Cell
          label="최종 재정자립도"
          value={`${year30.independence.toFixed(1)}%`}
          color="text-amber-400"
          sub={`현재 ${regionIndependence.toFixed(1)}%`}
        />
        <Cell
          label="중앙 기본소득 (30년차)"
          value={`${Math.round(year30.centralBIMonthly).toLocaleString()}원/월`}
          color="text-blue-400"
          sub={`GDP ${(BASE_GDP * Math.pow(1.02, 30)).toFixed(0)}조 × ${centralAITaxRate}%`}
        />
        <Cell
          label="지역 기본소득 (30년차)"
          value={`${Math.round(year30.basicIncomeMonthly).toLocaleString()}원/월`}
          color="text-rose-400"
          sub="공공은행 수익 기반"
        />
        <Cell
          label="합산 기본소득 (30년차)"
          value={`${Math.round(year30.totalBIMonthly).toLocaleString()}원/월`}
          color="text-emerald-400"
          sub={`연 ${Math.round(year30.totalBIMonthly * 12).toLocaleString()}원`}
        />
        <Cell
          label="에너지 기본소득 (30년차)"
          value={`${Math.round(year30.energyBIMonthly).toLocaleString()}원/월`}
          color="text-yellow-400"
          sub={`${energyCapacityMW}MW × 1,500MWh`}
        />
      </div>

      {/* ====== 30-YEAR GROWTH CHART ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="30년 성장 궤적" color="text-purple-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-cyan-500" />자본화
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />대출성장
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-purple-500" />서비스확대
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-rose-500" />복리성장
          </span>
        </div>

        {/* Bank Capital bar chart */}
        <div className="text-xs text-gray-600 mb-1">은행 자본</div>
        <div className="flex items-end gap-px h-48">
          {yearlyData.map((d, i) => {
            const maxCapital = Math.max(...yearlyData.map(y => y.bankCapital));
            const h = maxCapital > 0 ? (d.bankCapital / maxCapital) * 100 : 0;
            const phaseColor = d.phase === 'capitalize' ? 'bg-cyan-500'
              : d.phase === 'lending' ? 'bg-emerald-500'
              : d.phase === 'services' ? 'bg-purple-500'
              : 'bg-rose-500';
            return (
              <div
                key={i}
                className={`flex-1 ${phaseColor} rounded-t-sm min-w-0 relative group`}
                style={{ height: `${h}%` }}
                title={`${d.year}: ${formatEok(d.bankCapital)}`}
              />
            );
          })}
        </div>
        {/* Year labels */}
        <div className="flex gap-px">
          {yearlyData.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 5 === 0 ? `'${String(d.year).slice(-2)}` : ''}
            </div>
          ))}
        </div>

        {/* Basic Income bar chart - STACKED central + local + energy */}
        <div className="text-xs text-gray-600 mb-1 mt-4">기본소득 (원/월/인) — 중앙 + 지역 + 에너지</div>
        <div className="flex flex-wrap gap-4 mb-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />중앙정부
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-rose-500/60" />지역 (공공은행)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-500/60" />에너지
          </span>
        </div>
        <div className="flex items-end gap-px h-32">
          {(() => {
            const maxTotal = Math.max(...yearlyData.map(y => y.totalBIMonthly));
            return yearlyData.map((d, i) => {
              const totalH = maxTotal > 0 ? (d.totalBIMonthly / maxTotal) * 100 : 0;
              const centralPct = d.totalBIMonthly > 0 ? (d.centralBIMonthly / d.totalBIMonthly) * 100 : 0;
              const energyPct = d.totalBIMonthly > 0 ? (d.energyBIMonthly / d.totalBIMonthly) * 100 : 0;
              const localPct = Math.max(0, 100 - centralPct - energyPct);
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col min-w-0"
                  style={{ height: `${totalH}%` }}
                  title={`${d.year}: 중앙 ${d.centralBIMonthly.toLocaleString()}원 + 지역 ${d.basicIncomeMonthly.toLocaleString()}원 + 에너지 ${d.energyBIMonthly.toLocaleString()}원 = ${d.totalBIMonthly.toLocaleString()}원/월`}
                >
                  <div
                    className="w-full bg-rose-500/60 rounded-t-sm"
                    style={{ height: `${localPct}%` }}
                  />
                  <div
                    className="w-full bg-yellow-500/60"
                    style={{ height: `${energyPct}%` }}
                  />
                  <div
                    className="w-full bg-blue-500 rounded-b-sm"
                    style={{ height: `${centralPct}%` }}
                  />
                </div>
              );
            });
          })()}
        </div>
        {/* Year labels for basic income chart */}
        <div className="flex gap-px">
          {yearlyData.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 5 === 0 ? `'${String(d.year).slice(-2)}` : ''}
            </div>
          ))}
        </div>
      </div>

      {/* ====== PHASE DETAIL CARDS ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="단계별 상세" color="text-teal-400" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        <div className="border border-cyan-900/50 bg-cyan-950/20 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-cyan-500 rounded-full" />
            <span className="text-base font-bold text-cyan-400">Phase 1: 자본화 (Y0-3)</span>
          </div>
          <p className="text-sm text-gray-400">
            AI 절감액의 50%를 공공은행 자본으로 적립합니다.
            점진적으로 자본을 축적하여 대출 업무의 기반을 마련합니다.
          </p>
        </div>
        <div className="border border-emerald-900/50 bg-emerald-950/20 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-base font-bold text-emerald-400">Phase 2: 대출성장 (Y4-7)</span>
          </div>
          <p className="text-sm text-gray-400">
            BIS 8배 레버리지로 대출 포트폴리오를 구성하고 대출수익이 발생합니다.
            수익의 {reinvestmentRate}%를 재투자하여 자본을 확대합니다.
          </p>
        </div>
        <div className="border border-purple-900/50 bg-purple-950/20 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-base font-bold text-purple-400">Phase 3: 서비스확대 (Y8-15)</span>
          </div>
          <p className="text-sm text-gray-400">
            수익의 {100 - reinvestmentRate}%를 주민 서비스 및 기본소득으로 배분합니다.
            BIS 9배 레버리지로 확대 운영합니다.
          </p>
        </div>
        <div className="border border-rose-900/50 bg-rose-950/20 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-rose-500 rounded-full" />
            <span className="text-base font-bold text-rose-400">Phase 4: 복리성장 (Y16-30)</span>
          </div>
          <p className="text-sm text-gray-400">
            BIS 10배 레버리지, 지역화폐 승수효과({currencyMultiplier}배) 추가.
            복리 성장과 화폐 승수가 결합되어 기본소득이 가속화됩니다.
          </p>
        </div>
      </div>

      {/* ====== INFO SECTIONS ====== */}
      <InfoSection title="AI기본사회란?" color="text-cyan-400">
        <p>
          AI 효율화로 절감된 공공 예산을 공공은행 자본으로 전환하고,
          은행 대출수익과 지역화폐 효과를 결합하여
          주민에게 월 30만원 이상의 기본소득/서비스를 제공하는 사회.
        </p>
        <p>
          이 시뮬레이터는 자치구 단위에서 이 비전이 실현 가능한지를 30년 궤적으로 보여줍니다.
        </p>
      </InfoSection>

      <InfoSection title="중앙+지역 시너지 모델" color="text-indigo-400">
        <p>
          중앙정부가 AI/디지털/로봇세를 GDP 대비 일정비율로 부과하여
          전 국민에게 기본소득(national floor)을 제공하고,
          지역 공공은행이 추가적인 지역 기본소득(regional supplement)을
          상층 적립하는 이중 안전망 모델입니다.
        </p>
        <div className="space-y-2 mt-3">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">중앙 기본소득 (National Floor)</span>
              <p className="text-gray-500 text-base">
                GDP &times; AI세율 &times; 기본소득비중 / 전국인구 / 12개월.
                5년에 걸쳐 단계적 도입 (0&rarr;20&rarr;40&rarr;60&rarr;80&rarr;100%).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">지역 기본소득 (Regional Supplement)</span>
              <p className="text-gray-500 text-base">
                지역 공공은행 대출수익 기반. 지역 인구 대비로 계산되어
                소규모 자치구에서 더 높은 추가 기본소득 실현 가능.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">시너지 효과</span>
              <p className="text-gray-500 text-base">
                중앙이 전국적 최소 안전망을 보장하고, 지역이 추가 소득을 제공합니다.
                해외 사례: 노르웨이(국부펀드+지자체), 스위스(연방+칸톤), 독일(연방+Sparkassen).
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="에너지 기본소득 모델 (여주 구양리·영광군)" color="text-yellow-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">여주 구양리 모델</span>
              <p className="text-gray-500 text-base">
                주민 협동조합이 유휴부지에 1MW 태양광 설치 &rarr; 월 ~1,000만원 순수익.
                마을버스·공동식당 등 공동체 서비스로 환원.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">영광군 에너지 기본소득</span>
              <p className="text-gray-500 text-base">
                11GW 해상풍력 클러스터 계획. 2027년 1인당 연 20만원 &rarr; 2037년 연 353만원(월 ~29만원).
                발전이익을 군민 권리 배당으로 지급.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">공공은행과의 시너지</span>
              <p className="text-gray-500 text-base">
                에너지 수익의 20%를 공공은행 자본에 투입하여 Phase 1 자본화를 가속합니다.
                공공은행은 에너지 조합에 저리 대출을 제공하여 6년차 적자 문제를 해소합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">환경 관리</span>
              <p className="text-gray-500 text-base">
                폐패널 중금속은 지정폐기물 기준 미만. EPR(생산자책임재활용) 제도로 재활용률 ~80%.
                유휴지·건물 옥상 우선 활용으로 산림 훼손 최소화.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="분석 가정" color="text-blue-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">운영비율 20%, BIS 자본비율 유지</span>
              <p className="text-gray-500 text-base">대출 총수익의 20%를 운영비로 제하고 순수익의 80%를 활용합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">Phase별 레버리지</span>
              <p className="text-gray-500 text-base">8배(대출성장) &rarr; 9배(서비스확대) &rarr; 10배(복리성장)으로 단계적으로 확대합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">지역화폐</span>
              <p className="text-gray-500 text-base">Phase 4에서 서비스예산의 30%를 지역화폐로 발행하여 승수효과를 창출합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">세수환류</span>
              <p className="text-gray-500 text-base">지방세 실효세율 2.5%를 적용하여 지역화폐 유통으로 발생하는 추가 세수를 반영합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">05</span>
            <div>
              <span className="text-gray-300 font-semibold">은행자산 상한</span>
              <p className="text-gray-500 text-base">지역 예산의 5배로 은행 자본 상한을 설정하여 비현실적 무한 성장을 방지합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">06</span>
            <div>
              <span className="text-gray-300 font-semibold">중앙 AI세</span>
              <p className="text-gray-500 text-base">
                GDP 연 2% 성장 가정. AI/디지털/로봇세는 GDP 대비 비율로 부과하며,
                5년 도입 램프업 적용. 전 국민 {NATIONAL_POPULATION.toLocaleString()}명 기준 균등 배분.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">07</span>
            <div>
              <span className="text-gray-300 font-semibold">에너지 발전</span>
              <p className="text-gray-500 text-base">
                태양광·풍력 혼합 기준 1MW당 연 1,500MWh 발전, 순수익 90원/kWh 가정.
                수익 배분: 기본소득 50%, 유지보수 30%, 공공은행 자본 20%.
                3년 건설기간 램프업 적용.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER ====== */}
      <DataSources />
    </div>
  );
}
