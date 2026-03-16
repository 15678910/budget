'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getMetroNames,
  getMetroHouseholdDebt,
  type MetroFiscalData,
  type DistrictFiscalData,
} from '@/lib/data/fiscal-health-data';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';

// ============================================================
// Sub-components (matching existing simulator pattern)
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
  return `${Math.round(v).toLocaleString('ko-KR')}억원`;
}

function formatManWon(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}억원`;
  return `${Math.round(v).toLocaleString('ko-KR')}만원`;
}

function formatPopLocal(pop: number): string {
  if (pop >= 10000) return `${(pop / 10000).toFixed(0)}만명`;
  return `${pop.toLocaleString('ko-KR')}명`;
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
  transformative: {
    label: '혁신적 전환',
    emoji: '\uD83D\uDE80',
    bg: 'bg-emerald-900/40',
    border: 'border-emerald-700',
    text: 'text-emerald-400',
    desc: '화폐 혁명 정책이 지역 경제에 혁신적 변화를 가져올 수 있습니다',
  },
  significant: {
    label: '의미있는 개선',
    emoji: '\uD83D\uDCC8',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-800',
    text: 'text-emerald-500',
    desc: '배당형 화폐 시스템으로 상당한 재정 개선이 가능합니다',
  },
  moderate: {
    label: '보통 수준',
    emoji: '\uD83D\uDCCA',
    bg: 'bg-amber-900/30',
    border: 'border-amber-700',
    text: 'text-amber-400',
    desc: '일부 파라미터를 높이면 더 큰 효과를 기대할 수 있습니다',
  },
  minimal: {
    label: '미미한 효과',
    emoji: '\u26A0\uFE0F',
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    text: 'text-red-400',
    desc: '정책 강도를 높이거나 추가적인 혁신 수단이 필요합니다',
  },
};

// ============================================================
// Main Component
// ============================================================

export function CurrencyRevolutionSimulator() {
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
        debt: selectedMetro.debt,
        population: selectedMetro.population,
        independence: selectedMetro.independence,
      };
    }
    if (selectedDistrict) {
      return {
        name: selectedDistrict.name,
        budget: selectedDistrict.budget,
        debt: selectedDistrict.debt,
        population: selectedDistrict.population,
        independence: selectedDistrict.independence,
      };
    }
    return {
      name: selectedMetro.name,
      budget: selectedMetro.budget,
      debt: selectedMetro.debt,
      population: selectedMetro.population,
      independence: selectedMetro.independence,
    };
  }, [tab, selectedMetro, selectedDistrict]);

  const regionBudget = regionData.budget;
  const regionDebt = regionData.debt;
  const regionPopulation = regionData.population;
  const regionIndependence = regionData.independence;

  // === Slider states ===
  // Section 2: 배당형 지역화폐
  const [dividendIssuanceRate, setDividendIssuanceRate] = useState(10);
  const [dividendRate, setDividendRate] = useState(3);
  const [localCirculationRate, setLocalCirculationRate] = useState(80);

  // Section 3: 공공신용조합
  const [loanConversionRate, setLoanConversionRate] = useState(15);
  const [publicBankRate, setPublicBankRate] = useState(2);
  const [opCostRate, setOpCostRate] = useState(20);

  // Section 4: G-Money
  const [gMoneyConversionRate, setGMoneyConversionRate] = useState(30);
  const [adminEfficiencyRate, setAdminEfficiencyRate] = useState(10);

  // Section 5: 주권부준비금
  const [reserveRate, setReserveRate] = useState(3);
  const [investReturnRate, setInvestReturnRate] = useState(5);
  const [reserveYears, setReserveYears] = useState(15);

  // === Calculation ===
  const result = useMemo(() => {
    const MARKET_RATE = 0.035; // 시중금리 3.5%
    const MARKET_LENDING_RATE = 0.05; // 가계대출 시중금리 5%

    // 1 현행 시스템 분석
    const currentInterestBurden = regionDebt * MARKET_RATE;
    const perCapitaInterest = regionPopulation > 0 ? Math.round((currentInterestBurden / regionPopulation) * 100000000) : 0;
    const taxLeakageRate = regionBudget > 0 ? (currentInterestBurden / regionBudget) * 100 : 0;

    // 2 배당형 지역화폐
    const issuanceVolume = regionBudget * (dividendIssuanceRate / 100);
    const annualDividendTotal = issuanceVolume * (dividendRate / 100);
    const perCapitaDividend = regionPopulation > 0 ? Math.round((annualDividendTotal / regionPopulation) * 100000000) : 0;
    const localEconomicEffect = issuanceVolume * (localCirculationRate / 100) * 1.5;

    // 3 공공신용조합
    const households = regionPopulation / 2.4;
    const householdDebtData = getMetroHouseholdDebt().find(h => h.name === selectedMetroName);
    const avgDebt = householdDebtData?.avgDebt ?? 9000; // 만원
    const totalHouseholdDebt = (households * avgDebt) / 10000; // 억원
    const convertedLoanVolume = totalHouseholdDebt * (loanConversionRate / 100);
    const currentLoanInterest = convertedLoanVolume * MARKET_LENDING_RATE;
    const publicBankInterest = convertedLoanVolume * (publicBankRate / 100);
    const interestSaving = currentLoanInterest - publicBankInterest;
    const netCreditRevenue = publicBankInterest * (1 - opCostRate / 100);

    // 4 G-Money 디지털 투명성
    const transparentBudget = regionBudget * (gMoneyConversionRate / 100);
    const adminSaving = transparentBudget * (adminEfficiencyRate / 100);
    const fraudPrevention = transparentBudget * 0.02;
    const taxIncrease = transparentBudget * 0.01;
    const gMoneyTotal = adminSaving + fraudPrevention + taxIncrease;

    // 5 주권부준비금
    const annualReserve = regionBudget * (reserveRate / 100);
    const r = investReturnRate / 100;
    const accumulatedReserve = r > 0
      ? annualReserve * ((Math.pow(1 + r, reserveYears) - 1) / r)
      : annualReserve * reserveYears;
    const totalContributed = annualReserve * reserveYears;
    const cumulativeReturn = accumulatedReserve - totalContributed;
    const annualReturn = accumulatedReserve * r;
    const crisisResistance = regionBudget > 0 ? (accumulatedReserve / regionBudget) * 100 : 0;

    // 6 종합 평가
    const totalAnnualBenefit = interestSaving + annualDividendTotal + netCreditRevenue + gMoneyTotal + annualReturn;
    const netBenefit = totalAnnualBenefit - currentInterestBurden;
    const perCapitaNetBenefit = regionPopulation > 0 ? Math.round((netBenefit / regionPopulation) * 100000000) : 0;
    const benefitRatio = regionBudget > 0 ? (totalAnnualBenefit / regionBudget) * 100 : 0;

    // Verdict
    const verdict: 'transformative' | 'significant' | 'moderate' | 'minimal' =
      benefitRatio >= 3 ? 'transformative'
      : benefitRatio >= 1.5 ? 'significant'
      : benefitRatio >= 0.5 ? 'moderate'
      : 'minimal';

    // Bar chart steps
    const steps = [
      { label: '이자절감', value: interestSaving, color: 'bg-cyan-500' },
      { label: '배당수익', value: annualDividendTotal, color: 'bg-yellow-500' },
      { label: '신용조합', value: netCreditRevenue, color: 'bg-emerald-500' },
      { label: 'G-Money', value: gMoneyTotal, color: 'bg-blue-500' },
      { label: '준비금수익', value: annualReturn, color: 'bg-purple-500' },
    ];

    return {
      // Section 1
      currentInterestBurden, perCapitaInterest, taxLeakageRate,
      // Section 2
      issuanceVolume, annualDividendTotal, perCapitaDividend, localEconomicEffect,
      // Section 3
      convertedLoanVolume, currentLoanInterest, interestSaving, netCreditRevenue,
      // Section 4
      transparentBudget, adminSaving, fraudPrevention, taxIncrease, gMoneyTotal,
      // Section 5
      annualReserve, accumulatedReserve, cumulativeReturn, annualReturn, crisisResistance,
      // Section 6
      totalAnnualBenefit, netBenefit, perCapitaNetBenefit, benefitRatio,
      verdict, steps,
    };
  }, [regionDebt, regionBudget, regionPopulation, selectedMetroName,
      dividendIssuanceRate, dividendRate, localCirculationRate,
      loanConversionRate, publicBankRate, opCostRate,
      gMoneyConversionRate, adminEfficiencyRate,
      reserveRate, investReturnRate, reserveYears]);

  const vConfig = verdictConfig[result.verdict];
  const contentRef = useRef<HTMLDivElement>(null);

  // Total for bar chart proportions
  const totalForBar = Math.max(result.totalAnnualBenefit, 1);

  // Max for comparison bars
  const comparisonMax = Math.max(result.currentInterestBurden, result.totalAnnualBenefit, 1);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">

      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            새로운 화폐 혁명 시뮬레이터
          </h1>
          <p className="text-sm text-gray-600">
            이자 추출 경제에서 배당 환원 경제로의 전환 시뮬레이션
          </p>
        </div>
        <PDFExportButton targetRef={contentRef} filename="화폐혁명시뮬레이터" />
      </div>

      {/* ====== REGION SELECTOR ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <div className="col-span-full border border-gray-800 px-4 py-2 text-cyan-400">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
              지역 선택 Region Selector
            </span>
            <div className="flex items-center gap-2">
              {/* Tab buttons */}
              <div className="flex rounded overflow-hidden">
                <button
                  onClick={() => handleTabChange('metro')}
                  className={`${TAB_BASE} ${tab === 'metro' ? TAB_ACTIVE : TAB_INACTIVE}`}
                >
                  광역시도
                </button>
                <button
                  onClick={() => handleTabChange('district')}
                  className={`${TAB_BASE} ${tab === 'district' ? TAB_ACTIVE : TAB_INACTIVE}`}
                >
                  시군구
                </button>
              </div>
              {/* Metro dropdown */}
              <select
                value={selectedMetroName}
                onChange={(e) => handleMetroChange(e.target.value)}
                className={SELECT_CLASS}
              >
                {metroNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {/* District dropdown (only when district tab active) */}
              {tab === 'district' && districts.length > 0 && (
                <select
                  value={selectedDistrict?.name ?? ''}
                  onChange={(e) => setSelectedDistrictName(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {districts.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <Cell
          label="예산규모"
          value={formatEok(regionBudget)}
          color="text-cyan-400"
          sub={regionData.name}
        />
        <Cell
          label="지역채무"
          value={formatEok(regionDebt)}
          color="text-red-400"
          sub={`채무/예산 ${regionBudget > 0 ? ((regionDebt / regionBudget) * 100).toFixed(1) : '0'}%`}
        />
        <Cell
          label="재정자립도"
          value={`${regionIndependence.toFixed(1)}%`}
          color={regionIndependence >= 50 ? 'text-emerald-400' : regionIndependence >= 30 ? 'text-amber-400' : 'text-red-400'}
          sub={`인구 ${formatPopLocal(regionPopulation)}`}
        />
      </div>

      {tab === 'district' && districts.length === 0 && (
        <p className="text-sm text-amber-400/70 border border-gray-800 px-4 py-2">
          해당 광역시도의 시군구 데이터가 없습니다. 광역시도 단위로 시뮬레이션됩니다.
        </p>
      )}

      {/* ====== SECTION 1: 현행 시스템 분석 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="① 현행 시스템 분석 Current System" color="text-red-400" />
        <Cell
          label="이자부담"
          value={formatEok(result.currentInterestBurden)}
          color="text-red-400"
          sub="채무 × 시중금리 3.5%"
        />
        <Cell
          label="1인당 이자부담"
          value={`${result.perCapitaInterest.toLocaleString('ko-KR')}원/년`}
          color="text-red-400"
          sub="연간 이자 / 인구"
        />
        <Cell
          label="세수유출률"
          value={`${result.taxLeakageRate.toFixed(2)}%`}
          color={result.taxLeakageRate >= 1 ? 'text-red-400' : 'text-amber-400'}
          sub="이자부담 / 예산"
        />
      </div>

      {/* ====== SECTION 2: 배당형 지역화폐 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-yellow-400 mb-3">
          ② 배당형 지역화폐 Dividend Currency
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="예산 대비 발행비율"
            value={dividendIssuanceRate}
            min={5}
            max={30}
            step={1}
            unit="%"
            color="text-yellow-400"
            onChange={setDividendIssuanceRate}
          />
          <Slider
            label="연간 배당률"
            value={dividendRate}
            min={1}
            max={5}
            step={0.5}
            unit="%"
            color="text-yellow-400"
            onChange={setDividendRate}
          />
          <Slider
            label="지역 내 순환률"
            value={localCirculationRate}
            min={60}
            max={95}
            step={5}
            unit="%"
            color="text-yellow-400"
            onChange={setLocalCirculationRate}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        <Cell
          label="발행규모"
          value={formatEok(result.issuanceVolume)}
          color="text-yellow-400"
          sub={`예산의 ${dividendIssuanceRate}%`}
        />
        <Cell
          label="연간 배당금"
          value={formatEok(result.annualDividendTotal)}
          color="text-yellow-400"
          sub="발행규모 × 배당률"
        />
        <Cell
          label="1인당 배당"
          value={`${result.perCapitaDividend.toLocaleString('ko-KR')}원/년`}
          color="text-amber-400"
        />
        <Cell
          label="지역경제 효과"
          value={formatEok(result.localEconomicEffect)}
          color="text-emerald-400"
          sub={`순환률 ${localCirculationRate}% × 승수 1.5`}
        />
      </div>

      {/* ====== SECTION 3: 공공신용조합 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-emerald-400 mb-3">
          ③ 공공신용조합 Public Credit Union
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="가계대출 전환율"
            value={loanConversionRate}
            min={5}
            max={40}
            step={1}
            unit="%"
            color="text-emerald-400"
            onChange={setLoanConversionRate}
          />
          <Slider
            label="공공은행 금리"
            value={publicBankRate}
            min={1}
            max={3}
            step={0.1}
            unit="%"
            color="text-emerald-400"
            onChange={setPublicBankRate}
          />
          <Slider
            label="운영비 비율"
            value={opCostRate}
            min={15}
            max={30}
            step={1}
            unit="%"
            color="text-emerald-400"
            onChange={setOpCostRate}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        <Cell
          label="전환 대출규모"
          value={formatEok(result.convertedLoanVolume)}
          color="text-emerald-400"
          sub={`가계부채의 ${loanConversionRate}%`}
        />
        <Cell
          label="가계 이자절감"
          value={formatEok(result.interestSaving)}
          color="text-cyan-400"
          sub={`시중 5% → ${publicBankRate}%`}
        />
        <Cell
          label="신용조합 순수익"
          value={formatEok(result.netCreditRevenue)}
          color="text-emerald-400"
          sub={`운영비 ${opCostRate}% 차감`}
        />
        <Cell
          label="1인당 이자절감"
          value={`${(regionPopulation > 0 ? Math.round((result.interestSaving / regionPopulation) * 100000000) : 0).toLocaleString('ko-KR')}원/년`}
          color="text-cyan-400"
          sub="가계 실질 절감"
        />
      </div>

      {/* ====== SECTION 4: G-Money 디지털 투명성 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          ④ G-Money 디지털 투명성 Digital Transparency
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="G-Money 전환율"
            value={gMoneyConversionRate}
            min={10}
            max={80}
            step={5}
            unit="%"
            color="text-blue-400"
            onChange={setGMoneyConversionRate}
          />
          <Slider
            label="행정효율화율"
            value={adminEfficiencyRate}
            min={5}
            max={20}
            step={1}
            unit="%"
            color="text-blue-400"
            onChange={setAdminEfficiencyRate}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        <Cell
          label="투명화 예산"
          value={formatEok(result.transparentBudget)}
          color="text-blue-400"
          sub={`예산의 ${gMoneyConversionRate}%`}
        />
        <Cell
          label="행정 절감"
          value={formatEok(result.adminSaving)}
          color="text-blue-400"
          sub={`효율화율 ${adminEfficiencyRate}%`}
        />
        <Cell
          label="부정방지 효과"
          value={formatEok(result.fraudPrevention)}
          color="text-emerald-400"
          sub="추정 2% 누수방지"
        />
        <Cell
          label="세수 증대"
          value={formatEok(result.taxIncrease)}
          color="text-emerald-400"
          sub="추정 1% 세수증대"
        />
      </div>

      {/* ====== SECTION 5: 주권부준비금 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-3">
          ⑤ 주권부준비금 Sovereign Wealth Reserve
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="예산 적립비율"
            value={reserveRate}
            min={1}
            max={10}
            step={0.5}
            unit="%"
            color="text-purple-400"
            onChange={setReserveRate}
          />
          <Slider
            label="운용수익률"
            value={investReturnRate}
            min={3}
            max={8}
            step={0.5}
            unit="%"
            color="text-purple-400"
            onChange={setInvestReturnRate}
          />
          <Slider
            label="적립 기간"
            value={reserveYears}
            min={5}
            max={30}
            step={1}
            unit="년"
            color="text-purple-400"
            onChange={setReserveYears}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        <Cell
          label="연간 적립금"
          value={formatEok(result.annualReserve)}
          color="text-purple-400"
          sub={`예산의 ${reserveRate}%`}
        />
        <Cell
          label={`${reserveYears}년 후 적립금`}
          value={formatEok(result.accumulatedReserve)}
          color="text-purple-400"
        />
        <Cell
          label="누적 운용수익"
          value={formatEok(result.cumulativeReturn)}
          color="text-emerald-400"
          sub={`수익률 ${investReturnRate}%`}
        />
        <Cell
          label="재정위기 대응력"
          value={`${result.crisisResistance.toFixed(1)}%`}
          color={result.crisisResistance >= 50 ? 'text-emerald-400' : result.crisisResistance >= 20 ? 'text-amber-400' : 'text-red-400'}
          sub="적립금/예산"
        />
      </div>

      {/* ====== SECTION 6: 종합 평가 (Verdict Banner) ====== */}
      <div className={`border ${vConfig.border} ${vConfig.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-gray-400">
            종합 판정 Verdict
          </div>
          <span className={`text-lg md:text-xl font-bold ${vConfig.text}`}>
            {vConfig.emoji} {vConfig.label}
          </span>
        </div>
        <p className="text-base text-gray-300 leading-relaxed">
          {regionData.name}에 화폐 혁명 정책 패키지를 적용하면,
          총 <span className={`font-bold ${vConfig.text}`}>{formatEok(result.totalAnnualBenefit)}</span>의
          연간 혜택이 가능하며 이는 예산의{' '}
          <span className={`font-bold ${vConfig.text}`}>{result.benefitRatio.toFixed(2)}%</span>에 해당합니다.
          1인당 순혜택은{' '}
          <span className={`font-bold ${vConfig.text}`}>{result.perCapitaNetBenefit.toLocaleString('ko-KR')}원/년</span>
          입니다. {vConfig.desc}.
        </p>
      </div>

      {/* ====== SECTION: 정책별 기여도 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="정책별 기여도 Policy Contributions" color="text-yellow-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5 space-y-3">
        {result.steps.map((step) => {
          const pct = totalForBar > 0 ? (step.value / totalForBar) * 100 : 0;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-sm md:text-base text-gray-400 w-24 flex-shrink-0">{step.label}</span>
              <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden">
                <div
                  className={`h-full ${step.color} rounded transition-all`}
                  style={{ width: `${Math.max(pct, 0.5)}%` }}
                />
              </div>
              <span className="text-sm md:text-base text-gray-300 font-mono w-24 text-right flex-shrink-0">
                {formatEok(step.value)}
              </span>
              <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
        {/* Stacked summary bar */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">종합 기여 비율</div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
            {result.steps.map((step) => {
              const pct = totalForBar > 0 ? (step.value / totalForBar) * 100 : 0;
              return (
                <div
                  key={step.label}
                  className={`h-full ${step.color} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${pct}%` }}
                  title={`${step.label}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
            {result.steps.map((step) => (
              <div key={step.label} className="flex items-center gap-1">
                <div className={`w-3 h-2 rounded ${step.color}`} />
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== SECTION: 현행 vs 신 시스템 비교 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="현행 vs 신 시스템 비교 System Comparison" color="text-rose-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5 space-y-4">
        {/* 현행 이자부담 bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base text-gray-400">현행 이자부담</span>
            <span className="text-sm md:text-base text-red-400 font-mono font-bold">
              {formatEok(result.currentInterestBurden)}
            </span>
          </div>
          <div className="h-8 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-red-500 rounded transition-all"
              style={{ width: `${(result.currentInterestBurden / comparisonMax) * 100}%` }}
            />
          </div>
        </div>
        {/* 신 시스템 이익 bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base text-gray-400">신 시스템 이익</span>
            <span className="text-sm md:text-base text-emerald-400 font-mono font-bold">
              {formatEok(result.totalAnnualBenefit)}
            </span>
          </div>
          <div className="h-8 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded transition-all"
              style={{ width: `${(result.totalAnnualBenefit / comparisonMax) * 100}%` }}
            />
          </div>
        </div>
        {/* Net difference */}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm md:text-base text-gray-400">순 혜택 (신 시스템 - 이자부담)</span>
          <span className={`text-lg md:text-xl font-mono font-bold ${result.netBenefit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.netBenefit >= 0 ? '+' : ''}{formatEok(result.netBenefit)}
          </span>
        </div>
      </div>

      {/* ====== INFO SECTIONS ====== */}
      <InfoSection title="배당 달러(Dividend Dollar)란?" color="text-yellow-400">
        <p>
          기존 화폐 시스템에서는 화폐 발행 시 이자가 부과되어 경제 주체들이 지속적으로 이자를 지불합니다.
          배당 달러는 이 구조를 역전시켜, 화폐 보유자에게 배당금을 지급하는 새로운 패러다임입니다.
          지역화폐에 적용하면, 지역 내 화폐 유통이 활성화되고 주민들이 직접적인 경제적 혜택을 받습니다.
        </p>
      </InfoSection>

      <InfoSection title="G-Money와 디지털 투명성" color="text-blue-400">
        <p>
          G-Money는 정부 화폐의 디지털화를 통해 모든 공공 재정 흐름을 실시간으로 추적할 수 있는 시스템입니다.
          블록체인 기반의 투명한 거래 기록으로 행정 비용을 절감하고, 재정 누수와 부정을 방지합니다.
          시민들은 자신의 세금이 어디에 쓰이는지 실시간으로 확인할 수 있습니다.
        </p>
      </InfoSection>

      <InfoSection title="주권부준비금(SWR)의 역할" color="text-purple-400">
        <p>
          주권부준비금은 노르웨이 국부펀드와 유사한 개념으로, 지방정부가 예산의 일부를 장기 적립하여 운용하는 기금입니다.
          경제 위기 시 완충 역할을 하며, 운용 수익은 주민 복지와 지역 투자에 재투입됩니다.
          장기적으로 지방 재정의 자립도와 안정성을 크게 높일 수 있습니다.
        </p>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
