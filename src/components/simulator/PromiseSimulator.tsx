'use client';

import React, { useState, useMemo, useRef } from 'react';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';
import { getMetroFiscalData, getDistrictFiscalData } from '@/lib/data/fiscal-health-data';

// ============================================================
// 2026년 기준 대한민국 재정 데이터
// ============================================================

const NATIONAL_BUDGET = 728;     // 조원 (총예산)
const GDP = 2742;             // 조원
const NATIONAL_DEBT = 1415;   // 조원
const NATIONAL_POP = 51_350_000;
const NATIONAL_DEBT_RATIO = (NATIONAL_DEBT / GDP) * 100; // ~51.6%
const CURRENT_DEFICIT = 109;  // 조원 (관리재정수지 적자)

// ============================================================
// Election scope types
// ============================================================

type ElectionScope = 'national' | 'metro' | 'district';

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

/** Format 조원 amounts for display */
function formatJo(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}천조원`;
  }
  if (value >= 1) {
    return `${value.toFixed(1)}조원`;
  }
  return `${(value * 10000).toFixed(0)}억원`;
}

// ============================================================
// Main Component
// ============================================================

export function PromiseSimulator() {
  // === Scope selection ===
  const [scope, setScope] = useState<ElectionScope>('national');
  const [selectedMetro, setSelectedMetro] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const metros = useMemo(() => getMetroFiscalData(), []);
  const metroData = useMemo(
    () => metros.find((m) => m.name === selectedMetro),
    [metros, selectedMetro],
  );
  const districts = useMemo(
    () => (selectedMetro ? getDistrictFiscalData(selectedMetro) : []),
    [selectedMetro],
  );
  const districtData = useMemo(
    () => districts.find((d) => d.name === selectedDistrict),
    [districts, selectedDistrict],
  );

  // Active fiscal context (national, metro, or district)
  const activeBudget =
    scope === 'district' && districtData
      ? districtData.budget / 10000
      : scope === 'metro' && metroData
      ? metroData.budget / 10000
      : NATIONAL_BUDGET;
  const activeDebt =
    scope === 'district' && districtData
      ? districtData.debt / 10000
      : scope === 'metro' && metroData
      ? metroData.debt / 10000
      : NATIONAL_DEBT;
  const activeGdp =
    scope === 'district' && districtData
      ? (districtData.budget / 10000) * 8
      : scope === 'metro' && metroData
      ? (metroData.budget / 10000) * 8
      : GDP;
  const activePop =
    scope === 'district' && districtData
      ? districtData.population
      : scope === 'metro' && metroData
      ? metroData.population
      : NATIONAL_POP;
  const activeDebtRatio = (activeDebt / activeGdp) * 100;

  // === Slider states ===
  const [promiseCost, setPromiseCost] = useState(20);    // 공약 비용 (조원 for national, 1000억원 for metro)
  const [years, setYears] = useState(5);                  // 이행 기간 1~10년
  const [taxRatio, setTaxRatio] = useState(30);           // 증세 비중 0~100%
  const [gdpGrowth, setGdpGrowth] = useState(2.0);       // GDP 성장률 0~5%

  // Adjust promise cost range based on scope
  const costMax = scope === 'district' ? 5 : scope === 'metro' ? 50 : 100;
  const costUnit = '조원';

  // === Simulation calculation ===
  const simulation = useMemo(() => {
    const annualCost = promiseCost / years;
    const annualTaxFunded = annualCost * (taxRatio / 100);
    const annualDebtFunded = annualCost - annualTaxFunded;

    const yearlyData: { year: number; debtRatio: number; totalDebt: number; gdpVal: number }[] = [];
    let cumulativeDebt = 0;
    let gdpVal = activeGdp;

    for (let y = 1; y <= years; y++) {
      cumulativeDebt += annualDebtFunded;
      gdpVal *= (1 + gdpGrowth / 100);
      const totalDebt = activeDebt + cumulativeDebt;
      const debtRatio = (totalDebt / gdpVal) * 100;
      yearlyData.push({ year: 2026 + y, debtRatio, totalDebt, gdpVal });
    }

    const finalDebtRatio = yearlyData[yearlyData.length - 1]?.debtRatio ?? activeDebtRatio;
    const budgetImpact = (annualCost / activeBudget) * 100;
    const totalCost = promiseCost;
    const taxBurdenPerCapita = Math.round((annualTaxFunded * 1_0000_0000_0000) / activePop); // 원

    // Verdict
    let verdict: 'safe' | 'caution' | 'danger';
    if (finalDebtRatio < 55 && budgetImpact < 3) {
      verdict = 'safe';
    } else if (finalDebtRatio < 65 && budgetImpact < 5) {
      verdict = 'caution';
    } else {
      verdict = 'danger';
    }

    return {
      annualCost,
      annualTaxFunded,
      annualDebtFunded,
      cumulativeDebt,
      totalCost,
      budgetImpact,
      finalDebtRatio,
      taxBurdenPerCapita,
      yearlyData,
      verdict,
    };
  }, [promiseCost, years, taxRatio, gdpGrowth, activeBudget, activeDebt, activeGdp, activePop, activeDebtRatio]);

  // Chart max value for scaling bars
  const maxDebtRatio = Math.max(...simulation.yearlyData.map(d => d.debtRatio), activeDebtRatio, 1);
  // Scale the chart so that the max bar doesn't exceed the chart area
  const chartCeiling = Math.ceil(maxDebtRatio / 10) * 10 + 10;

  const contentRef = useRef<HTMLDivElement>(null);

  // Verdict styling
  const verdictConfig = {
    safe: {
      border: 'border-emerald-900/50',
      bg: 'bg-emerald-950/30',
      text: 'text-emerald-400',
      label: '\uc2e4\ud604 \uac00\ub2a5',
    },
    caution: {
      border: 'border-amber-900/50',
      bg: 'bg-amber-950/30',
      text: 'text-amber-400',
      label: '\uc8fc\uc758 \ud544\uc694',
    },
    danger: {
      border: 'border-red-900/50',
      bg: 'bg-red-950/30',
      text: 'text-red-400',
      label: '\uc7ac\uc815 \uc704\ud5d8',
    },
  };

  const vConfig = verdictConfig[simulation.verdict];

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            공약 검증 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Toggle */}
          <div className="flex border border-gray-700 rounded overflow-hidden text-sm">
            <button
              onClick={() => { setScope('national'); setSelectedDistrict(''); }}
              className={`px-3 py-1.5 ${scope === 'national' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
            >
              대선/총선
            </button>
            <button
              onClick={() => { setScope('metro'); setSelectedDistrict(''); }}
              className={`px-3 py-1.5 ${scope === 'metro' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
            >
              광역단체장
            </button>
            <button
              onClick={() => setScope('district')}
              className={`px-3 py-1.5 ${scope === 'district' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
            >
              기초단체장
            </button>
          </div>
          <PDFExportButton
            targetRef={contentRef}
            filename={
              scope === 'district' && selectedDistrict
                ? `공약검증_${selectedMetro}_${selectedDistrict}`
                : scope === 'metro' && selectedMetro
                ? `공약검증_${selectedMetro}`
                : '공약검증'
            }
          />
        </div>
      </div>

      {/* ====== 지역 선택 영역 (별도 행) ====== */}
      {(scope === 'metro' || scope === 'district') && (
        <div className="border border-gray-800 px-4 py-3 flex items-center gap-3 flex-wrap bg-gray-950/30">
          <span className="text-sm text-gray-400 font-semibold">지역 선택:</span>
          <select
            value={selectedMetro}
            onChange={(e) => { setSelectedMetro(e.target.value); setSelectedDistrict(''); }}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded min-w-[150px]"
          >
            <option value="">광역시도 선택</option>
            {[...metros].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          {scope === 'district' && (
            <>
              <span className="text-gray-600">›</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedMetro}
                className="bg-gray-900 border border-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded min-w-[150px] disabled:opacity-50"
              >
                <option value="">시·군·구 선택</option>
                {[...districts].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {scope === 'metro' && !selectedMetro && (
        <div className="border border-amber-900/50 bg-amber-950/30 p-4 rounded">
          <p className="text-amber-400 text-sm">광역시도를 선택하면 해당 지자체의 재정 데이터로 공약을 검증합니다.</p>
        </div>
      )}
      {scope === 'district' && (!selectedMetro || !selectedDistrict) && (
        <div className="border border-amber-900/50 bg-amber-950/30 p-4 rounded">
          <p className="text-amber-400 text-sm">
            {!selectedMetro ? '광역시도를 먼저 선택해주세요.' : '시·군·구를 선택하면 해당 기초단체의 재정 데이터로 공약을 검증합니다.'}
          </p>
        </div>
      )}

      {/* ====== SECTION 1: 재정 현황 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader
          title={
            scope === 'district' && districtData
              ? `${selectedMetro} ${districtData.name} 재정 현황`
              : scope === 'metro' && metroData
              ? `${metroData.name} 재정 현황`
              : '대한민국 재정 현황 Fiscal Overview'
          }
          color="text-cyan-400"
        />
        <Cell
          label="예산규모"
          value={`${activeBudget.toFixed(activeBudget < 10 ? 1 : 0)}조원`}
          color="text-cyan-400"
          sub={scope === 'national' ? '2026 세출예산' : scope === 'metro' ? '광역 예산' : '기초 예산'}
        />
        <Cell
          label={scope === 'national' ? '국가채무' : '지역채무'}
          value={`${activeDebt.toFixed(activeDebt < 10 ? 1 : 0)}조원`}
          color="text-red-400"
          sub={`${scope === 'national' ? 'GDP' : 'GRDP'} 대비 ${activeDebtRatio.toFixed(1)}%`}
        />
        <Cell
          label={scope === 'national' ? 'GDP' : 'GRDP 추정'}
          value={`${activeGdp.toFixed(activeGdp < 10 ? 1 : 0)}조원`}
          color="text-cyan-400"
          sub={scope === 'national' ? '2026 명목 GDP' : '지역내총생산 추정'}
        />
        <Cell
          label="채무비율"
          value={`${activeDebtRatio.toFixed(1)}%`}
          color="text-amber-400"
          sub={scope === 'national' ? '국가채무/GDP' : '지역채무/GRDP'}
        />
        <Cell
          label={scope === 'national' ? '관리재정적자' : '인구'}
          value={scope === 'national' ? `${CURRENT_DEFICIT}조원` : `${(activePop / 10000).toFixed(0)}만명`}
          color={scope === 'national' ? 'text-red-400' : 'text-cyan-400'}
          sub={scope === 'national' ? `GDP 대비 -${((CURRENT_DEFICIT / GDP) * 100).toFixed(1)}%` : '주민등록 기준'}
        />
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="공약 비용"
            value={promiseCost}
            min={scope === 'national' ? 1 : 0.1}
            max={costMax}
            step={scope === 'national' ? 1 : 0.1}
            unit={costUnit}
            subLabel={`연 ${(promiseCost / years).toFixed(1)}${costUnit}`}
            color="text-blue-400"
            onChange={setPromiseCost}
          />
          <Slider
            label="이행 기간"
            value={years}
            min={1}
            max={10}
            step={1}
            unit="년"
            color="text-purple-400"
            onChange={setYears}
          />
          <Slider
            label="증세 비중"
            value={taxRatio}
            min={0}
            max={100}
            step={5}
            unit="%"
            subLabel={`국채 ${100 - taxRatio}%`}
            color="text-emerald-400"
            onChange={setTaxRatio}
          />
          <Slider
            label="GDP 성장률"
            value={gdpGrowth}
            min={0}
            max={5}
            step={0.1}
            unit="%"
            color="text-amber-400"
            onChange={setGdpGrowth}
          />
        </div>
      </div>

      {/* ====== SECTION 3: 검증 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="검증 결과 Verification Results" color="text-blue-400" />
        <Cell
          label="공약 총비용"
          value={formatJo(simulation.totalCost)}
          color="text-blue-400"
          sub={`${years}년간 총소요`}
        />
        <Cell
          label="연간 소요"
          value={formatJo(simulation.annualCost)}
          color="text-blue-400"
          sub="연평균 소요액"
        />
        <Cell
          label="예산대비 비중"
          value={`${simulation.budgetImpact.toFixed(1)}%`}
          color={simulation.budgetImpact < 3 ? 'text-emerald-400' : simulation.budgetImpact < 5 ? 'text-amber-400' : 'text-red-400'}
          sub={`총예산 ${activeBudget.toFixed(activeBudget < 10 ? 1 : 0)}조 대비`}
        />
        <Cell
          label="국채 증가분"
          value={formatJo(simulation.cumulativeDebt)}
          color="text-red-400"
          sub={`${years}년간 누적 국채 발행`}
        />
        <Cell
          label="최종 채무비율"
          value={`${simulation.finalDebtRatio.toFixed(1)}%`}
          color={simulation.finalDebtRatio < 55 ? 'text-emerald-400' : simulation.finalDebtRatio < 65 ? 'text-amber-400' : 'text-red-400'}
          sub={`현재 ${activeDebtRatio.toFixed(1)}% → ${simulation.finalDebtRatio.toFixed(1)}%`}
        />
        <Cell
          label="1인당 증세부담"
          value={`${simulation.taxBurdenPerCapita.toLocaleString('ko-KR')}원`}
          color="text-amber-400"
          sub="연간 1인당 추가 세금"
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
          공약 비용 <span className={`font-bold ${vConfig.text}`}>{simulation.totalCost}조원</span>을{' '}
          <span className="text-purple-400 font-bold">{years}년</span>간 이행 시,
          연간 <span className="text-blue-400 font-bold">{simulation.annualCost.toFixed(1)}조원</span>이
          소요됩니다. 이 중 증세로{' '}
          <span className="text-emerald-400 font-bold">{simulation.annualTaxFunded.toFixed(1)}조원</span>,
          국채 발행으로{' '}
          <span className="text-red-400 font-bold">{simulation.annualDebtFunded.toFixed(1)}조원</span>을
          조달하면, {years}년 후 국가채무비율은{' '}
          <span className={`font-bold ${vConfig.text}`}>{simulation.finalDebtRatio.toFixed(1)}%</span>에
          도달합니다.
        </p>
      </div>

      {/* ====== BAR CHART: 연도별 채무/GDP 비율 추이 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-4">
          연도별 채무/GDP 비율 추이 Debt Ratio Timeline
        </div>
        <div className="space-y-2">
          {/* Baseline: current year */}
          <div className="flex items-center gap-3 py-1">
            <span className="text-sm md:text-base text-gray-500 w-12 text-right font-mono">2026</span>
            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
              {/* 50% reference line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500/50 z-10"
                style={{ left: `${(50 / chartCeiling) * 100}%` }}
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                style={{ width: `${(activeDebtRatio / chartCeiling) * 100}%` }}
              />
            </div>
            <span className="text-sm md:text-base text-gray-400 w-16 text-right font-mono">
              {activeDebtRatio.toFixed(1)}%
            </span>
          </div>
          {/* Year-by-year data */}
          {simulation.yearlyData.map((d) => {
            const barColor =
              d.debtRatio < 55
                ? 'from-emerald-600 to-emerald-400'
                : d.debtRatio < 65
                  ? 'from-amber-600 to-amber-400'
                  : 'from-red-600 to-red-400';
            return (
              <div key={d.year} className="flex items-center gap-3 py-1">
                <span className="text-sm md:text-base text-gray-500 w-12 text-right font-mono">{d.year}</span>
                <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                  {/* 50% reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-500/50 z-10"
                    style={{ left: `${(50 / chartCeiling) * 100}%` }}
                  />
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                    style={{ width: `${(d.debtRatio / chartCeiling) * 100}%` }}
                  />
                </div>
                <span className="text-sm md:text-base text-gray-400 w-16 text-right font-mono">
                  {d.debtRatio.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <div className="w-3 h-px bg-red-500/50" />
          <span>GDP 대비 50% 기준선</span>
        </div>
      </div>

      {/* ====== INFO SECTION: 판정 기준 ====== */}
      <InfoSection title="판정 기준 Verdict Criteria" color="text-teal-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">실현 가능</span>
            <p className="text-gray-500 text-base">채무/GDP 55% 미만 + 예산대비 3% 미만</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-bold text-base flex-shrink-0">주의 필요</span>
            <p className="text-gray-500 text-base">채무/GDP 55~65% 또는 예산대비 3~5%</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-400 font-bold text-base flex-shrink-0">재정 위험</span>
            <p className="text-gray-500 text-base">채무/GDP 65% 초과 또는 예산대비 5% 초과</p>
          </div>
          <p className="text-gray-600 text-sm mt-2">* IMF, OECD 재정건전성 가이드라인 참고</p>
        </div>
      </InfoSection>

      {/* ====== INFO SECTION: 데이터 출처 ====== */}
      <InfoSection title="데이터 출처 Data Sources" color="text-blue-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">기획재정부 2026 예산안</span>
              <p className="text-gray-500 text-base">총예산 728조원, 관리재정수지 적자 109조원</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">한국은행 GDP</span>
              <p className="text-gray-500 text-base">2026년 명목 GDP 2,742조원</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">국가재정운용계획</span>
              <p className="text-gray-500 text-base">국가채무 1,415조원, 채무비율 전망</p>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
