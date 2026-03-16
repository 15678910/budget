'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
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

function formatEok(eokWon: number): string {
  if (eokWon >= 10000) return `${(eokWon / 10000).toFixed(1)}조원`;
  if (eokWon >= 1000) return `${(eokWon / 1000).toFixed(1)}천억원`;
  return `${Math.round(eokWon).toLocaleString('ko-KR')}억원`;
}

function formatManWon(won: number): string {
  const man = won / 10000;
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억원`;
  return `${Math.round(man).toLocaleString('ko-KR')}만원`;
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
  significant: {
    border: 'border-emerald-900/50',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-400',
    label: '의미 있는 절감',
    message: '이자 절감이 예산의 3% 이상으로, 자치구 재정에 실질적 도움이 됩니다.',
  },
  moderate: {
    border: 'border-amber-900/50',
    bg: 'bg-amber-950/30',
    text: 'text-amber-400',
    label: '보통 수준',
    message: '이자 절감 효과가 있으나, 재정에 미치는 영향은 제한적입니다.',
  },
  minimal: {
    border: 'border-red-900/50',
    bg: 'bg-red-950/30',
    text: 'text-red-400',
    label: '미미한 효과',
    message: '이자율 차이가 작거나 부채 규모가 적어 절감 효과가 미미합니다.',
  },
};

// ============================================================
// Main Component
// ============================================================

export function InterestBurdenSimulator() {
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

  // === Computed region data for active selection ===
  const regionData = useMemo(() => {
    if (tab === 'district' && selectedDistrict) {
      return {
        name: selectedDistrict.name,
        budget: selectedDistrict.budget,
        debt: selectedDistrict.debt,
        independence: selectedDistrict.independence,
        population: selectedDistrict.population,
      };
    }
    return {
      name: selectedMetro.name,
      budget: selectedMetro.budget,
      debt: selectedMetro.debt,
      independence: selectedMetro.independence,
      population: selectedMetro.population,
    };
  }, [tab, selectedMetro, selectedDistrict]);

  const regionBudget = regionData.budget;
  const regionDebt = regionData.debt;
  const regionPopulation = regionData.population;
  const debtBudgetRatio = regionBudget > 0 ? (regionDebt / regionBudget) * 100 : 0;

  // === Slider states ===
  const [currentRate, setCurrentRate] = useState(3.5);
  const [targetRate, setTargetRate] = useState(1.5);
  const [debtReduction, setDebtReduction] = useState(2);
  const [years, setYears] = useState(10);

  // === Simulation calculation ===
  const simulation = useMemo(() => {
    const effectiveTargetRate = Math.min(targetRate, currentRate);
    const annualInterestCurrent = regionDebt * (currentRate / 100);
    const annualInterestTarget = regionDebt * (effectiveTargetRate / 100);
    const annualSavings = annualInterestCurrent - annualInterestTarget;
    const savingsRatio = regionBudget > 0 ? (annualSavings / regionBudget) * 100 : 0;

    const yearlyData: { year: number; saving: number; cumulative: number; debt: number }[] = [];
    let remainingDebt = regionDebt;
    let cumulativeSavings = 0;

    for (let y = 1; y <= years; y++) {
      remainingDebt *= (1 - debtReduction / 100);
      const yearSaving = remainingDebt * ((currentRate - effectiveTargetRate) / 100);
      cumulativeSavings += yearSaving;
      yearlyData.push({ year: 2026 + y, saving: yearSaving, cumulative: cumulativeSavings, debt: remainingDebt });
    }

    const finalCumulative = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].cumulative : 0;
    const finalDebt = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].debt : regionDebt;
    const teacherSalary = 5000; // 만원/년
    const possibleTeachers = Math.floor((annualSavings * 10000) / teacherSalary);
    const perCapitaSaving = regionPopulation > 0 ? Math.round((annualSavings / regionPopulation) * 100000000) : 0; // 원

    const verdict: 'significant' | 'moderate' | 'minimal' =
      savingsRatio >= 3 ? 'significant' : savingsRatio >= 1 ? 'moderate' : 'minimal';

    return { annualSavings, savingsRatio, yearlyData, finalCumulative, finalDebt, possibleTeachers, perCapitaSaving, verdict };
  }, [currentRate, targetRate, debtReduction, years, regionDebt, regionBudget, regionPopulation]);

  // Chart data: every 5 years + final year
  const chartData = simulation.yearlyData.filter(
    (_, i) => (i + 1) % 5 === 0 || i === simulation.yearlyData.length - 1,
  );
  const maxSaving = Math.max(...chartData.map((d) => d.cumulative), 1);

  const vConfig = verdictConfig[simulation.verdict];
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            이자부담 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="이자부담" />
          <span className="text-sm md:text-base text-gray-600">
            지방채무 이자 절감 분석
          </span>
        </div>
      </div>

      {/* ====== REGION SELECTOR ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-sm md:text-base font-semibold uppercase tracking-widest text-teal-400 shrink-0">
            지역 선택
          </span>

          {/* Tab buttons */}
          <div className="flex rounded overflow-hidden border border-gray-700 shrink-0">
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
          <select
            className={`${SELECT_CLASS} shrink-0`}
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
              className={`${SELECT_CLASS} shrink-0`}
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
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title={`${regionData.name} 현황 Region Overview`} color="text-cyan-400" />
        <Cell
          label="예산규모"
          value={formatEok(regionBudget)}
          color="text-cyan-400"
          sub="당초예산 기준"
        />
        <Cell
          label="지역채무"
          value={formatEok(regionDebt)}
          color="text-red-400"
          sub={`채무/예산 ${debtBudgetRatio.toFixed(1)}%`}
        />
        <Cell
          label="재정자립도"
          value={`${regionData.independence.toFixed(1)}%`}
          color={regionData.independence >= 40 ? 'text-emerald-400' : regionData.independence >= 25 ? 'text-amber-400' : 'text-red-400'}
          sub="자체수입 / 총세입"
        />
        <Cell
          label="채무비율"
          value={`${debtBudgetRatio.toFixed(1)}%`}
          color={debtBudgetRatio < 10 ? 'text-emerald-400' : debtBudgetRatio < 20 ? 'text-amber-400' : 'text-red-400'}
          sub="채무 / 예산"
        />
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="현재 평균 이자율"
            value={currentRate}
            min={1.0}
            max={7.0}
            step={0.1}
            unit="%"
            color="text-cyan-400"
            onChange={setCurrentRate}
          />
          <Slider
            label="목표 이자율"
            value={targetRate}
            min={0.0}
            max={7.0}
            step={0.1}
            unit="%"
            subLabel={targetRate > currentRate ? `유효: ${currentRate}%` : undefined}
            color="text-emerald-400"
            onChange={setTargetRate}
          />
          <Slider
            label="부채 감축률 (연간)"
            value={debtReduction}
            min={0}
            max={10}
            step={0.5}
            unit="%"
            color="text-purple-400"
            onChange={setDebtReduction}
          />
          <Slider
            label="시뮬레이션 기간"
            value={years}
            min={1}
            max={30}
            step={1}
            unit="년"
            color="text-amber-400"
            onChange={setYears}
          />
        </div>
      </div>

      {/* ====== SECTION 3: 시뮬레이션 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="시뮬레이션 결과 Simulation Results" color="text-blue-400" />
        <Cell
          label="연간 이자절감"
          value={formatEok(simulation.annualSavings)}
          color="text-emerald-400"
          sub={`이자율 차이 ${(currentRate - Math.min(targetRate, currentRate)).toFixed(1)}%p`}
        />
        <Cell
          label="누적 절감액"
          value={formatEok(simulation.finalCumulative)}
          color="text-emerald-400"
          sub={`${years}년간 총 절감`}
        />
        <Cell
          label="예산 대비 비율"
          value={`${simulation.savingsRatio.toFixed(2)}%`}
          color={simulation.savingsRatio >= 3 ? 'text-emerald-400' : simulation.savingsRatio >= 1 ? 'text-amber-400' : 'text-red-400'}
          sub="연간 절감 / 예산"
        />
        <Cell
          label="1인당 절감액"
          value={`${simulation.perCapitaSaving.toLocaleString('ko-KR')}원`}
          color="text-cyan-400"
          sub={`인구 ${formatPopLocal(regionPopulation)}`}
        />
        <Cell
          label="고용 가능 교사"
          value={`${simulation.possibleTeachers.toLocaleString('ko-KR')}명`}
          color="text-purple-400"
          sub="연봉 5,000만원 기준"
        />
        <Cell
          label="최종 잔여채무"
          value={formatEok(simulation.finalDebt)}
          color="text-amber-400"
          sub={`현재 ${formatEok(regionDebt)} 대비`}
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
          {regionData.name}의 채무 <span className={`font-bold ${vConfig.text}`}>{formatEok(regionDebt)}</span>에 대해
          이자율을 <span className="text-cyan-400 font-bold">{currentRate}%</span>에서{' '}
          <span className="text-emerald-400 font-bold">{Math.min(targetRate, currentRate)}%</span>로 낮추면,
          연간 <span className="text-emerald-400 font-bold">{formatEok(simulation.annualSavings)}</span>을 절감할 수 있습니다.
          {years}년간 부채를 연 <span className="text-purple-400 font-bold">{debtReduction}%</span>씩 감축하면,
          누적 절감액은 <span className={`font-bold ${vConfig.text}`}>{formatEok(simulation.finalCumulative)}</span>이며,
          잔여 채무는 <span className="text-amber-400 font-bold">{formatEok(simulation.finalDebt)}</span>이 됩니다.
          {' '}{vConfig.message}
        </p>
      </div>

      {/* ====== BAR CHART: 연도별 절감액 추이 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-4">
          연도별 누적 절감액 추이 Savings Timeline
        </div>
        <div className="space-y-2">
          {chartData.map((d) => (
            <div key={d.year} className="flex items-center gap-3 py-1">
              <span className="text-sm md:text-base text-gray-500 w-12 text-right font-mono">{d.year}</span>
              <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                  style={{ width: `${(d.cumulative / maxSaving) * 100}%` }}
                />
              </div>
              <span className="text-sm md:text-base text-gray-400 w-24 text-right font-mono">
                {formatEok(d.cumulative)}
              </span>
            </div>
          ))}
        </div>
        {simulation.annualSavings <= 0 && (
          <p className="text-sm md:text-base text-gray-600 mt-3 text-center">
            목표 이자율이 현재 이자율 이상이므로 절감 효과가 없습니다.
          </p>
        )}
      </div>

      {/* ====== INFO SECTION: 가정 및 방법론 ====== */}
      <InfoSection title="가정 및 방법론 Assumptions & Methodology" color="text-teal-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">이자 절감액 산출</span>
              <p className="text-gray-500 text-base">
                지역채무 x (현재 이자율 - 목표 이자율)로 연간 절감액을 계산합니다. 목표 이자율은 현재 이자율을 초과할 수 없습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">부채 감축 반영</span>
              <p className="text-gray-500 text-base">
                매년 잔여 부채에서 감축률만큼 감소시킨 뒤 이자 절감액을 산출합니다. 부채가 줄수록 절감액도 자연 감소합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">교사 고용 환산</span>
              <p className="text-gray-500 text-base">
                연간 절감액을 교사 1인 연봉 5,000만원으로 나누어 고용 가능 인원을 추정합니다. 실제 복리후생비 등은 미반영입니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">한계</span>
              <p className="text-gray-500 text-base">
                실제 지방채 이자율은 채권 종류·만기·시장 상황에 따라 다르며, 단일 평균 이자율로 단순화했습니다.
                인플레이션, 신규 차입, 이자율 변동은 미반영합니다.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== INFO SECTION: 슬라이더 가이드 ====== */}
      <InfoSection title="슬라이더 가이드 Parameter Guide" color="text-purple-400">
        <div className="space-y-4">
          <div>
            <span className="text-cyan-400 font-bold">현재 평균 이자율 (1.0~7.0%)</span>
            <p className="text-gray-500 text-base mt-1">
              지방채 가중평균 이자율. 2024년 기준 대부분 지자체는 2~4% 수준입니다. 고금리 시기에는 5% 이상도 가능합니다.
            </p>
          </div>
          <div>
            <span className="text-emerald-400 font-bold">목표 이자율 (0.0~7.0%)</span>
            <p className="text-gray-500 text-base mt-1">
              차환·재협상 등으로 달성하고자 하는 이자율. 0%에 가까울수록 절감 효과가 크지만, 현실적으로는 1~2%가 하한입니다.
            </p>
          </div>
          <div>
            <span className="text-purple-400 font-bold">부채 감축률 (0~10%)</span>
            <p className="text-gray-500 text-base mt-1">
              매년 부채 원금을 줄이는 비율. 0% = 원금 유지 (이자만 변동). 5% = 적극 상환. 10% = 매우 공격적 상환입니다.
            </p>
          </div>
          <div>
            <span className="text-amber-400 font-bold">시뮬레이션 기간 (1~30년)</span>
            <p className="text-gray-500 text-base mt-1">
              분석 기간. 기간이 길수록 부채 감축 + 이자 절감의 복합 효과가 커집니다. 통상 중기재정계획은 5년, 장기 전망은 10~20년입니다.
            </p>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
