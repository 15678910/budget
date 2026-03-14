'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getMetroNames,
  getMetroHouseholdDebt,
  getPropertyTaxShare,
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
    label: '혁신적 개선',
    emoji: '\uD83D\uDE80',
    bg: 'bg-emerald-900/40',
    border: 'border-emerald-700',
    text: 'text-emerald-400',
    desc: '종합 재정혁신 패키지가 지역 재정에 혁신적 변화를 가져올 수 있습니다',
  },
  significant: {
    label: '의미있는 개선',
    emoji: '\uD83D\uDCC8',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-800',
    text: 'text-emerald-500',
    desc: '4가지 정책의 시너지로 의미 있는 재정 개선이 가능합니다',
  },
  moderate: {
    label: '보통 수준',
    emoji: '\uD83D\uDCCA',
    bg: 'bg-amber-900/30',
    border: 'border-amber-700',
    text: 'text-amber-400',
    desc: '일부 정책 파라미터를 높이면 더 큰 효과를 기대할 수 있습니다',
  },
  minimal: {
    label: '미미한 효과',
    emoji: '\u26A0\uFE0F',
    bg: 'bg-red-900/30',
    border: 'border-red-700',
    text: 'text-red-400',
    desc: '정책 강도를 높이거나 추가적인 재정혁신 수단이 필요합니다',
  },
};

// ============================================================
// Main Component
// ============================================================

export function IntegratedScenarioSimulator() {
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
  const [interestCut, setInterestCut] = useState(1.5);
  const [creditCaptureRate, setCreditCaptureRate] = useState(15);
  const [taxReductionGoal, setTaxReductionGoal] = useState(50);
  const [currencyIssuanceRate, setCurrencyIssuanceRate] = useState(5);

  // === Pipeline calculation ===
  const result = useMemo(() => {
    // Step 1: Interest Savings
    const interestSaving = regionDebt * (interestCut / 100);

    // Step 2: Public Credit Revenue
    const households = regionPopulation / 2.4;
    const householdDebtData = getMetroHouseholdDebt().find(h => h.name === selectedMetroName);
    const avgDebt = householdDebtData?.avgDebt ?? 9000;
    const totalHouseholdDebt = (households * avgDebt) / 10000; // 억원
    const capturedLoanVolume = totalHouseholdDebt * (creditCaptureRate / 100);
    const lendingRate = 0.02; // 2% fixed
    const opCostRatio = 0.20;
    const grossCreditRevenue = capturedLoanVolume * lendingRate;
    const netCreditRevenue = grossCreditRevenue * (1 - opCostRatio);

    // Step 3: Property Tax Replacement
    const propertyTaxSharePct = getPropertyTaxShare(selectedMetroName);
    const ownRevenue = regionBudget * (regionIndependence / 100);
    const propertyTaxRevenue = ownRevenue * (propertyTaxSharePct / 100);
    const taxReduction = propertyTaxRevenue * (taxReductionGoal / 100);
    const taxReplacementSurplus = Math.max(0, netCreditRevenue - taxReduction);

    // Step 4: Local Currency Multiplier Effect
    const currencyIssuance = regionBudget * (currencyIssuanceRate / 100);
    const multiplier = 1.8;
    const retentionRate = 0.75;
    const localTaxRate = 0.025;
    const economicImpact = currencyIssuance * multiplier * retentionRate;
    const taxReturn = economicImpact * localTaxRate;

    // Step 5: Total
    const totalImprovement = interestSaving + netCreditRevenue + taxReturn;
    const improvementRatio = (totalImprovement / regionBudget) * 100;
    const perCapitaBenefit = regionPopulation > 0 ? Math.round((totalImprovement / regionPopulation) * 100000000) : 0;
    const newOwnRevenue = ownRevenue + totalImprovement;
    const newIndependence = (newOwnRevenue / regionBudget) * 100;
    const independenceChange = newIndependence - regionIndependence;

    // Pipeline step contributions (for bar chart)
    const steps = [
      { label: '이자절감', value: interestSaving, color: 'bg-cyan-500' },
      { label: '공공신용', value: netCreditRevenue, color: 'bg-emerald-500' },
      { label: '세수환류', value: taxReturn, color: 'bg-purple-500' },
    ];

    // Verdict
    const verdict: 'transformative' | 'significant' | 'moderate' | 'minimal' =
      improvementRatio >= 5 ? 'transformative'
      : improvementRatio >= 3 ? 'significant'
      : improvementRatio >= 1 ? 'moderate'
      : 'minimal';

    return {
      interestSaving, netCreditRevenue, taxReturn, taxReduction,
      totalImprovement, improvementRatio, perCapitaBenefit,
      newIndependence, independenceChange, steps,
      economicImpact, taxReplacementSurplus, capturedLoanVolume,
      propertyTaxRevenue, verdict,
    };
  }, [interestCut, creditCaptureRate, taxReductionGoal, currencyIssuanceRate,
      regionDebt, regionBudget, regionPopulation, regionIndependence, selectedMetroName]);

  const vConfig = verdictConfig[result.verdict];
  const contentRef = useRef<HTMLDivElement>(null);

  // Total for bar chart proportions
  const totalForBar = Math.max(result.totalImprovement, 1);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            통합 시나리오 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="통합시나리오" />
          <span className="text-sm md:text-base text-gray-600">
            4단계 재정혁신 파이프라인
          </span>
        </div>
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

      {/* ====== SIMULATION PARAMETERS (4 Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Pipeline Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="이자율 절감폭"
            value={interestCut}
            min={0.0}
            max={4.0}
            step={0.1}
            unit="%p"
            color="text-cyan-400"
            onChange={setInterestCut}
          />
          <Slider
            label="가구부채 포획률"
            value={creditCaptureRate}
            min={5}
            max={50}
            step={1}
            unit="%"
            color="text-emerald-400"
            onChange={setCreditCaptureRate}
          />
          <Slider
            label="재산세 감면 목표"
            value={taxReductionGoal}
            min={0}
            max={100}
            step={5}
            unit="%"
            color="text-amber-400"
            onChange={setTaxReductionGoal}
          />
          <Slider
            label="지역화폐 발행률"
            value={currencyIssuanceRate}
            min={1}
            max={20}
            step={0.5}
            unit="%"
            color="text-purple-400"
            onChange={setCurrencyIssuanceRate}
          />
        </div>
      </div>

      {/* ====== VERDICT BANNER ====== */}
      <div className={`border ${vConfig.border} ${vConfig.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-gray-400">
            종합 판정 Verdict
          </div>
          <span className={`text-lg md:text-xl font-bold ${vConfig.text}`}>
            {vConfig.emoji} {vConfig.label}
          </span>
        </div>
        <p className="text-base md:text-base text-gray-300 leading-relaxed">
          {regionData.name}에 4단계 재정혁신 파이프라인을 적용하면,
          총 <span className={`font-bold ${vConfig.text}`}>{formatEok(result.totalImprovement)}</span>의
          예산 개선이 가능하며 이는 예산의{' '}
          <span className={`font-bold ${vConfig.text}`}>{result.improvementRatio.toFixed(2)}%</span>에 해당합니다.
          재정자립도는{' '}
          <span className="text-cyan-400 font-bold">{regionIndependence.toFixed(1)}%</span>에서{' '}
          <span className={`font-bold ${vConfig.text}`}>{result.newIndependence.toFixed(1)}%</span>로{' '}
          <span className={`font-bold ${vConfig.text}`}>
            {result.independenceChange >= 0 ? '+' : ''}{result.independenceChange.toFixed(1)}%p
          </span>{' '}
          변화합니다. {vConfig.desc}.
        </p>
      </div>

      {/* ====== SECTION: 파이프라인 효과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="파이프라인 효과 Pipeline Effects" color="text-blue-400" />
        <Cell
          label="이자절감"
          value={formatEok(result.interestSaving)}
          color="text-cyan-400"
          sub={`이자율 ${interestCut}%p 절감`}
        />
        <Cell
          label="공공신용 순수익"
          value={formatEok(result.netCreditRevenue)}
          color="text-emerald-400"
          sub={`포획 ${formatEok(result.capturedLoanVolume)}`}
        />
        <Cell
          label="세수 환류"
          value={formatEok(result.taxReturn)}
          color="text-purple-400"
          sub={`경제효과 ${formatEok(result.economicImpact)}`}
        />
        <Cell
          label="총 예산개선"
          value={formatEok(result.totalImprovement)}
          color="text-rose-400"
          sub={`예산 대비 ${result.improvementRatio.toFixed(2)}%`}
        />
        <Cell
          label="1인당 혜택"
          value={`${result.perCapitaBenefit.toLocaleString('ko-KR')}원/년`}
          color="text-amber-400"
          sub={`인구 ${formatPopLocal(regionPopulation)}`}
        />
        <Cell
          label="재정자립도 변화"
          value={`${result.independenceChange >= 0 ? '+' : ''}${result.independenceChange.toFixed(1)}%p`}
          color={result.independenceChange >= 3 ? 'text-emerald-400' : result.independenceChange >= 1 ? 'text-amber-400' : 'text-red-400'}
          sub={`${regionIndependence.toFixed(1)}% → ${result.newIndependence.toFixed(1)}%`}
        />
      </div>

      {/* ====== SECTION: 파이프라인 기여도 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="파이프라인 기여도 Pipeline Contributions" color="text-purple-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5 space-y-3">
        {result.steps.map((step) => {
          const pct = totalForBar > 0 ? (step.value / totalForBar) * 100 : 0;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-sm md:text-base text-gray-400 w-20 flex-shrink-0">{step.label}</span>
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

      {/* ====== SECTION: 재산세 대체 분석 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <SectionHeader title="재산세 대체 분석 Property Tax Replacement" color="text-amber-400" />
        <Cell
          label="현행 재산세 수입"
          value={formatEok(result.propertyTaxRevenue)}
          color="text-amber-400"
          sub={`자체수입의 ${getPropertyTaxShare(selectedMetroName).toFixed(1)}%`}
        />
        <Cell
          label="감면 목표액"
          value={formatEok(result.taxReduction)}
          color="text-red-400"
          sub={`재산세의 ${taxReductionGoal}% 감면`}
        />
        <Cell
          label="대체 후 잉여"
          value={formatEok(result.taxReplacementSurplus)}
          color={result.taxReplacementSurplus > 0 ? 'text-emerald-400' : 'text-red-400'}
          sub="공공신용 순수익 - 감면 목표"
        />
      </div>

      {/* ====== INFO SECTION: 분석 방법론 ====== */}
      <InfoSection title="분석 방법론 Methodology" color="text-teal-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">1단계: 이자 절감</span>
              <p className="text-gray-500 text-base">
                지역채무에 이자율 절감폭을 적용하여 연간 이자 절감액을 산출합니다.
                지방채 차환·재협상을 통해 달성 가능한 절감 효과입니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">2단계: 공공신용 수익</span>
              <p className="text-gray-500 text-base">
                지역 가구부채의 일정 비율을 공공신용기관이 포획하여 대출 포트폴리오를 구축합니다.
                대출 금리 2%, 운영비 20%를 적용하여 순수익을 산출합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">3단계: 재산세 대체</span>
              <p className="text-gray-500 text-base">
                공공신용 순수익으로 재산세 감면 목표를 충당하고,
                잉여분은 추가 재원으로 활용합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">4단계: 지역화폐 승수 효과</span>
              <p className="text-gray-500 text-base">
                지역화폐 발행을 통해 경제 순환을 촉진합니다.
                승수 1.8배, 지역 잔류율 75%, 지방세 실효세율 2.5%를 적용하여 세수 환류를 산출합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">FP</span>
            <div>
              <span className="text-gray-300 font-semibold">고정 파라미터</span>
              <p className="text-gray-500 text-base">
                대출 금리 2%, 운영비 비율 20%, 순환 승수 1.8배, 지역 잔류율 75%, 지방세 실효세율 2.5%.
                가구원 수 2.4명 기준 가구 수 추정.
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            * 데이터 출처: 통계청 가계금융복지조사, 행정안전부 지방재정365. 본 시뮬레이션은 단순화된 모델이며 실제 효과는 다를 수 있습니다.
          </p>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
