'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getPropertyTaxShare,
} from '@/lib/data/fiscal-health-data';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';

// ============================================================
// Sub-components (matching PromiseSimulator pattern)
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

/** Format 억원 amounts for display */
function formatEok(eokWon: number): string {
  if (!isFinite(eokWon)) return '\u221E';
  if (eokWon >= 10000) return `${(eokWon / 10000).toFixed(1)}\uC870\uC6D0`;
  if (eokWon >= 1000) return `${(eokWon / 1000).toFixed(1)}\uCC9C\uC5B5\uC6D0`;
  return `${Math.round(eokWon).toLocaleString('ko-KR')}\uC5B5\uC6D0`;
}

/** Format 만원 amounts for display */
function formatManWon(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}\uC5B5\uC6D0`;
  return `${Math.round(value).toLocaleString('ko-KR')}\uB9CC\uC6D0`;
}

/** Format population for display */
function formatPop(pop: number): string {
  if (pop >= 10000) return `${(pop / 10000).toFixed(0)}\uB9CC\uBA85`;
  return `${pop.toLocaleString('ko-KR')}\uBA85`;
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
  fully_replaceable: { border: 'border-emerald-900/50', bg: 'bg-emerald-950/30', text: 'text-emerald-400', label: '\uC644\uC804 \uB300\uCCB4 \uAC00\uB2A5', message: '\uACF5\uACF5 \uB300\uCD9C \uC218\uC775\uC774 \uC7AC\uC0B0\uC138 \uAC10\uBA74 \uBAA9\uD45C\uB97C 100% \uCDA9\uB2F9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC7AC\uC0B0\uC138 \uC5C6\uB294 \uC790\uCE58\uAD6C\uAC00 \uAC00\uB2A5\uD569\uB2C8\uB2E4.' },
  mostly_replaceable: { border: 'border-emerald-900/50', bg: 'bg-emerald-950/30', text: 'text-emerald-300', label: '\uB300\uBD80\uBD84 \uB300\uCCB4 \uAC00\uB2A5', message: '\uC7AC\uC0B0\uC138\uC758 70% \uC774\uC0C1\uC744 \uACF5\uACF5 \uB300\uCD9C \uC218\uC775\uC73C\uB85C \uB300\uCCB4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.' },
  partial: { border: 'border-amber-900/50', bg: 'bg-amber-950/30', text: 'text-amber-400', label: '\uBD80\uBD84 \uB300\uCCB4', message: '\uC7AC\uC0B0\uC138\uC758 \uC77C\uBD80\uB9CC \uB300\uCCB4 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uB300\uCD9C \uADDC\uBAA8 \uD655\uB300 \uB610\uB294 \uAE08\uB9AC \uC870\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.' },
  insufficient: { border: 'border-red-900/50', bg: 'bg-red-950/30', text: 'text-red-400', label: '\uB300\uCCB4 \uBD88\uCDA9\uBD84', message: '\uD604\uC7AC \uC870\uAC74\uC5D0\uC11C\uB294 \uC7AC\uC0B0\uC138\uB97C \uACF5\uACF5 \uB300\uCD9C\uB85C \uB300\uCCB4\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.' },
};

// ============================================================
// Main Component
// ============================================================

export function TaxVsLendingComparator() {
  // === Data ===
  const allMetros = useMemo(() => getMetroFiscalData(), []);
  const metroNames = useMemo(
    () => allMetros.map((m) => m.name).sort((a, b) => a.localeCompare(b, 'ko')),
    [allMetros],
  );

  // === Tab state ===
  const [tab, setTab] = useState<'metro' | 'district'>('metro');

  // === Selection state ===
  const [selectedMetroName, setSelectedMetroName] = useState('\uC11C\uC6B8\uD2B9\uBCC4\uC2DC');
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
    return {
      name: `${selectedMetro.name} ${selectedDistrict.name}`,
      budget: selectedDistrict.budget,
      population: selectedDistrict.population,
      independence: selectedDistrict.independence,
    };
  }, [tab, selectedMetro, selectedDistrict]);

  const regionBudget = regionData.budget;           // 억원
  const regionIndependence = regionData.independence; // %
  const regionPopulation = regionData.population;

  // === Slider states ===
  const [lendingRate, setLendingRate] = useState(2.5);       // 공공 대출 금리 %
  const [lendingScale, setLendingScale] = useState(50);      // 대출 규모 (예산 대비) %
  const [defaultRate, setDefaultRate] = useState(1.5);        // 대출 부실률 %
  const [reductionGoal, setReductionGoal] = useState(50);     // 재산세 감면 목표 %

  // === Simulation calculation ===
  const simulation = useMemo(() => {
    const propertyTaxSharePct = getPropertyTaxShare(selectedMetroName);
    const ownRevenue = regionBudget * (regionIndependence / 100);
    const propertyTaxRevenue = ownRevenue * (propertyTaxSharePct / 100);
    const targetReduction = propertyTaxRevenue * (reductionGoal / 100);

    const lendingVolume = regionBudget * (lendingScale / 100);
    const grossLendingRevenue = lendingVolume * (lendingRate / 100);
    const defaultLoss = lendingVolume * (defaultRate / 100);
    const netLendingRevenue = grossLendingRevenue - defaultLoss;

    const replacementRatio = targetReduction > 0 ? (netLendingRevenue / targetReduction) * 100 : 0;
    const effectiveRate = lendingRate - defaultRate;
    const requiredVolume = effectiveRate > 0 ? targetReduction / (effectiveRate / 100) : Infinity;
    const requiredVsBudget = regionBudget > 0 ? (requiredVolume / regionBudget) * 100 : 0;

    const households = regionPopulation / 2.4;
    const currentPerHouseholdTax = households > 0 ? Math.round((propertyTaxRevenue / households) * 100000000) : 0; // 원 → 만원 변환
    const savedPerHousehold = households > 0 ? Math.round((Math.min(netLendingRevenue, targetReduction) / households) * 100000000) : 0; // 원 → 만원 변환

    // 금리별 대체율 차트 데이터
    const chartData: { rate: number; netRevenue: number; replacementRatio: number }[] = [];
    for (let r = 0.5; r <= 5.0; r += 0.5) {
      const vol = regionBudget * (lendingScale / 100);
      const gross = vol * (r / 100);
      const loss = vol * (defaultRate / 100);
      const net = gross - loss;
      const ratio = targetReduction > 0 ? (net / targetReduction) * 100 : 0;
      chartData.push({ rate: r, netRevenue: net, replacementRatio: ratio });
    }

    const verdict: 'fully_replaceable' | 'mostly_replaceable' | 'partial' | 'insufficient' =
      replacementRatio >= 100 ? 'fully_replaceable'
      : replacementRatio >= 70 ? 'mostly_replaceable'
      : replacementRatio >= 30 ? 'partial'
      : 'insufficient';

    return { propertyTaxRevenue, targetReduction, lendingVolume, grossLendingRevenue, defaultLoss, netLendingRevenue, replacementRatio, requiredVolume, requiredVsBudget, currentPerHouseholdTax, savedPerHousehold, propertyTaxSharePct, chartData, verdict };
  }, [lendingRate, lendingScale, defaultRate, reductionGoal, selectedMetroName, regionBudget, regionIndependence, regionPopulation]);

  const vConfig = verdictConfig[simulation.verdict];

  // Chart scaling
  const maxRatio = Math.max(...simulation.chartData.map(d => d.replacementRatio), 100, 1);
  const chartCeiling = Math.ceil(maxRatio / 50) * 50 + 50;

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            재산세 vs 공공대출 비교기
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="재산세비교" />
          <span className="text-sm md:text-base text-gray-600">
            지방재정 혁신 분석
          </span>
        </div>
      </div>

      {/* ====== SECTION 1: 지역 현황 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <div className="col-span-full border border-gray-800 px-4 py-2 text-cyan-400 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
            지역 현황 Regional Overview
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded overflow-hidden border border-gray-700">
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
            <select
              className={SELECT_CLASS}
              value={selectedMetroName}
              onChange={(e) => handleMetroChange(e.target.value)}
            >
              {metroNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {tab === 'district' && districts.length > 0 && (
              <select
                className={SELECT_CLASS}
                value={selectedDistrict?.name ?? ''}
                onChange={(e) => setSelectedDistrictName(e.target.value)}
              >
                {districts.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <Cell
          label="예산규모"
          value={formatEok(regionBudget)}
          color="text-cyan-400"
          sub={`${regionData.name}`}
        />
        <Cell
          label="재정자립도"
          value={`${regionIndependence.toFixed(1)}%`}
          color="text-blue-400"
          sub="자체수입/총예산"
        />
        <Cell
          label="자체수입"
          value={formatEok(regionBudget * (regionIndependence / 100))}
          color="text-emerald-400"
          sub="예산 x 재정자립도"
        />
        <Cell
          label="재산세 비중"
          value={`${simulation.propertyTaxSharePct.toFixed(1)}%`}
          color="text-amber-400"
          sub={`재산세 ${formatEok(simulation.propertyTaxRevenue)}`}
        />
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="공공 대출 금리"
            value={lendingRate}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="%"
            subLabel={`실효 ${(lendingRate - defaultRate).toFixed(1)}%`}
            color="text-amber-400"
            onChange={setLendingRate}
          />
          <Slider
            label="대출 규모 (예산 대비)"
            value={lendingScale}
            min={10}
            max={200}
            step={5}
            unit="%"
            subLabel={formatEok(regionBudget * (lendingScale / 100))}
            color="text-cyan-400"
            onChange={setLendingScale}
          />
          <Slider
            label="대출 부실률"
            value={defaultRate}
            min={0}
            max={5}
            step={0.1}
            unit="%"
            subLabel={`손실 ${formatEok(regionBudget * (lendingScale / 100) * (defaultRate / 100))}`}
            color="text-red-400"
            onChange={setDefaultRate}
          />
          <Slider
            label="재산세 감면 목표"
            value={reductionGoal}
            min={0}
            max={100}
            step={5}
            unit="%"
            subLabel={`${formatEok(simulation.targetReduction)} 감면`}
            color="text-emerald-400"
            onChange={setReductionGoal}
          />
        </div>
      </div>

      {/* ====== SECTION 3: 비교 결과 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="비교 결과 Comparison Results" color="text-blue-400" />
      </div>

      {/* 좌우 비교 */}
      <div className="grid grid-cols-2 gap-1">
        <div className="border border-amber-900/30 bg-amber-950/10 p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">현행 재산세</div>
          <div className="text-2xl font-mono font-bold text-amber-400">{formatEok(simulation.propertyTaxRevenue)}</div>
          <div className="text-xs text-gray-600 mt-1">자체수입의 {simulation.propertyTaxSharePct}%</div>
          <div className="text-xs text-gray-600">가구당 {formatManWon(simulation.currentPerHouseholdTax)}/년</div>
        </div>
        <div className="border border-cyan-900/30 bg-cyan-950/10 p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">공공대출 순수익</div>
          <div className="text-2xl font-mono font-bold text-cyan-400">{formatEok(simulation.netLendingRevenue)}</div>
          <div className="text-xs text-gray-600 mt-1">대출 {formatEok(simulation.lendingVolume)} 기준</div>
          <div className="text-xs text-gray-600">부실률 {defaultRate}% 반영</div>
        </div>
      </div>

      {/* 대체율 프로그레스 바 */}
      <div className="border border-gray-800 p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">재산세 대체율</span>
          <span className={`font-mono font-bold ${simulation.replacementRatio >= 100 ? 'text-emerald-400' : simulation.replacementRatio >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
            {Math.min(simulation.replacementRatio, 999).toFixed(1)}%
          </span>
        </div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${simulation.replacementRatio >= 100 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : simulation.replacementRatio >= 70 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
            style={{ width: `${Math.min(simulation.replacementRatio, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>감면 목표: {formatEok(simulation.targetReduction)}</span>
          <span>필요 대출: {simulation.requiredVolume < Infinity ? formatEok(simulation.requiredVolume) : '\u221E'} (예산의 {simulation.requiredVsBudget < Infinity ? simulation.requiredVsBudget.toFixed(0) : '\u221E'}%)</span>
        </div>
      </div>

      {/* 추가 지표 Cells */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <Cell
          label="대출 총수익"
          value={formatEok(simulation.grossLendingRevenue)}
          color="text-cyan-400"
          sub={`금리 ${lendingRate}% 적용`}
        />
        <Cell
          label="부실 손실"
          value={formatEok(simulation.defaultLoss)}
          color="text-red-400"
          sub={`부실률 ${defaultRate}%`}
        />
        <Cell
          label="필요 대출규모"
          value={simulation.requiredVolume < Infinity ? formatEok(simulation.requiredVolume) : '\u221E'}
          color="text-purple-400"
          sub={simulation.requiredVsBudget < Infinity ? `예산의 ${simulation.requiredVsBudget.toFixed(0)}%` : '산출 불가'}
        />
        <Cell
          label="가구당 절감액"
          value={formatManWon(simulation.savedPerHousehold)}
          color="text-emerald-400"
          sub={`인구 ${formatPop(regionPopulation)} 기준`}
        />
      </div>

      {/* ====== VERDICT BOX ====== */}
      <div className={`border ${vConfig.border} ${vConfig.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-gray-400">
            판정 결과 Verdict
          </div>
          <span className={`text-lg md:text-xl font-bold ${vConfig.text}`}>
            {vConfig.label}
          </span>
        </div>
        <p className="text-base md:text-base text-gray-300 leading-relaxed">
          {regionData.name}의 재산세 수입 <span className="font-bold text-amber-400">{formatEok(simulation.propertyTaxRevenue)}</span> 중{' '}
          <span className="font-bold text-emerald-400">{reductionGoal}%</span>({formatEok(simulation.targetReduction)})를
          감면하려면, 예산 대비 <span className="font-bold text-cyan-400">{lendingScale}%</span> 규모의 공공 대출에서
          순수익 <span className="font-bold text-cyan-400">{formatEok(simulation.netLendingRevenue)}</span>이 발생합니다.{' '}
          <span className={`font-bold ${vConfig.text}`}>{vConfig.message}</span>
        </p>
      </div>

      {/* ====== BAR CHART: 금리별 대체율 추이 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-4">
          금리별 대체율 추이 Replacement Ratio by Rate
        </div>
        <div className="space-y-2">
          {simulation.chartData.map((d) => {
            const isCurrentRate = Math.abs(d.rate - lendingRate) < 0.01;
            const barColor =
              d.replacementRatio >= 100
                ? 'from-emerald-600 to-emerald-400'
                : d.replacementRatio >= 70
                  ? 'from-amber-600 to-amber-400'
                  : 'from-red-600 to-red-400';
            const barWidth = Math.max(0, Math.min((d.replacementRatio / chartCeiling) * 100, 100));
            return (
              <div key={d.rate} className={`flex items-center gap-3 py-1 ${isCurrentRate ? 'bg-blue-950/30 rounded px-2 -mx-2' : ''}`}>
                <span className={`text-sm md:text-base w-14 text-right font-mono ${isCurrentRate ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                  {d.rate.toFixed(1)}%
                </span>
                <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                  {/* 100% reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-emerald-500/50 z-10"
                    style={{ left: `${(100 / chartCeiling) * 100}%` }}
                  />
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor} ${isCurrentRate ? 'ring-2 ring-blue-400/50' : ''}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`text-sm md:text-base w-16 text-right font-mono ${isCurrentRate ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                  {d.replacementRatio.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-px bg-emerald-500/50" />
            <span>대체율 100% 기준선</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-950/50 ring-1 ring-blue-400/50" />
            <span>현재 선택 금리</span>
          </div>
        </div>
      </div>

      {/* ====== INFO SECTION: 가정 및 방법론 ====== */}
      <InfoSection title="가정 및 방법론 Assumptions & Methodology" color="text-teal-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">재산세 비중</span>
              <p className="text-gray-500 text-base">광역시도별 자체수입 대비 재산세 비중은 행안부 지역재정365 데이터 기반입니다. 시군구 선택 시 해당 광역시도의 평균 비중을 적용합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">공공 대출 수익</span>
              <p className="text-gray-500 text-base">대출 규모 x 대출 금리로 총수익을 산출하고, 대출 규모 x 부실률로 손실을 차감하여 순수익을 계산합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">가구 수 추정</span>
              <p className="text-gray-500 text-base">통계청 평균 가구원 수 2.4명을 기준으로 인구를 나누어 가구 수를 추정합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">필요 대출규모</span>
              <p className="text-gray-500 text-base">감면 목표액을 실효금리(대출금리 - 부실률)로 나누어 필요한 최소 대출 규모를 산출합니다. 실효금리가 0 이하면 산출이 불가합니다.</p>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== INFO SECTION: 슬라이더 가이드 ====== */}
      <InfoSection title="슬라이더 가이드 Slider Guide" color="text-blue-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-bold text-base flex-shrink-0">공공 대출 금리</span>
            <p className="text-gray-500 text-base">자치단체가 주민에게 제공하는 공공 대출의 연 이자율. 시중 금리보다 낮게 설정하되, 운영비용과 수익성을 고려합니다. (기본 2.5%)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold text-base flex-shrink-0">대출 규모</span>
            <p className="text-gray-500 text-base">예산 대비 공공 대출 총 규모. 100%면 예산 전체를 대출 재원으로 활용하는 것을 의미합니다. 자치단체 신용도와 유동성을 감안해야 합니다. (기본 50%)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 font-bold text-base flex-shrink-0">대출 부실률</span>
            <p className="text-gray-500 text-base">대출금 중 회수 불가 비율. 공공 대출은 심사 기준이 엄격하여 시중은행보다 낮은 부실률이 가능합니다. 한국 주택담보대출 부실률은 약 0.2~0.5%입니다. (기본 1.5%)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">재산세 감면 목표</span>
            <p className="text-gray-500 text-base">현행 재산세 수입 중 공공 대출 수익으로 대체하려는 비율. 100%면 재산세 완전 폐지를 목표로 합니다. (기본 50%)</p>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
