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

function formatEok(eokWon: number): string {
  if (eokWon >= 10000) return `${(eokWon / 10000).toFixed(1)}조원`;
  if (eokWon >= 1000) return `${(eokWon / 1000).toFixed(1)}천억원`;
  return `${Math.round(eokWon).toLocaleString('ko-KR')}억원`;
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
// Main Component
// ============================================================

export function LocalCurrencySimulator() {
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
    if (selectedDistrict) {
      return {
        name: selectedDistrict.name,
        budget: selectedDistrict.budget,
        population: selectedDistrict.population,
        independence: selectedDistrict.independence,
      };
    }
    return {
      name: selectedMetro.name,
      budget: selectedMetro.budget,
      population: selectedMetro.population,
      independence: selectedMetro.independence,
    };
  }, [tab, selectedMetro, selectedDistrict]);

  const regionBudget = regionData.budget;   // 억원
  const regionPopulation = regionData.population;

  // === Slider states ===
  const [issuanceRate, setIssuanceRate] = useState(5);       // 발행 규모 (예산 대비 %)
  const [multiplier, setMultiplier] = useState(1.8);         // 순환 승수
  const [cashbackRate, setCashbackRate] = useState(5);       // 캐시백 인센티브 %
  const [retentionRate, setRetentionRate] = useState(75);    // 지역 내 소비 잔류율 %

  // === Simulation calculation ===
  const simulation = useMemo(() => {
    const issuanceAmount = regionBudget * (issuanceRate / 100); // 억원
    const totalEconomicImpact = issuanceAmount * multiplier * (retentionRate / 100);
    const incentiveCost = issuanceAmount * (cashbackRate / 100);

    const localTaxRate = 0.025; // 지방세 실효세율 2.5%
    const taxReturn = totalEconomicImpact * localTaxRate;
    const netFiscalCost = incentiveCost - taxReturn;
    const roi = incentiveCost > 0 ? (taxReturn / incentiveCost) * 100 : 0; // %

    const perCapitaStimulus = regionPopulation > 0 ? Math.round((totalEconomicImpact / regionPopulation) * 100000000) : 0; // 원

    const smallBizShare = 0.65;
    const bizRevenueIncrease = totalEconomicImpact * smallBizShare;

    const perCapitaIssuance = regionPopulation > 0 ? Math.round((issuanceAmount / regionPopulation) * 100000000) : 0; // 원

    // 발행 규모별 효과 (차트 데이터) — 수확체감 반영
    const chartData: { rate: number; impact: number; cost: number; netEffect: number; taxReturn: number }[] = [];
    for (let r = 1; r <= 20; r += 1) {
      const iss = regionBudget * (r / 100);
      // 수확체감: 발행률이 높아질수록 승수 효과 감소 (10% 이상부터 감소)
      const diminishing = r <= 10 ? 1.0 : 1.0 - (r - 10) * 0.03;
      const effectiveMultiplier = multiplier * Math.max(diminishing, 0.7);
      const imp = iss * effectiveMultiplier * (retentionRate / 100);
      const cost = iss * (cashbackRate / 100);
      const tax = imp * localTaxRate;
      chartData.push({ rate: r, impact: imp, cost, netEffect: tax - cost, taxReturn: tax });
    }

    const verdict: 'highly_effective' | 'effective' | 'moderate' | 'inefficient' =
      roi >= 150 ? 'highly_effective' : roi >= 100 ? 'effective' : roi >= 50 ? 'moderate' : 'inefficient';

    return { issuanceAmount, totalEconomicImpact, incentiveCost, taxReturn, netFiscalCost, roi, perCapitaStimulus, bizRevenueIncrease, perCapitaIssuance, chartData, verdict };
  }, [issuanceRate, multiplier, cashbackRate, retentionRate, regionBudget, regionPopulation]);

  const contentRef = useRef<HTMLDivElement>(null);

  // === Verdict config ===
  const verdictConfig = {
    highly_effective: { border: 'border-emerald-900/50', bg: 'bg-emerald-950/30', text: 'text-emerald-400', label: '매우 효과적', message: '세수 환류가 인센티브 비용의 150%를 초과하여 지역화폐 프로그램이 재정적으로 매우 효과적입니다.' },
    effective: { border: 'border-emerald-900/50', bg: 'bg-emerald-950/30', text: 'text-emerald-300', label: '효과적', message: '세수 환류가 인센티브 비용을 초과하여 재정적으로 효과적인 프로그램입니다.' },
    moderate: { border: 'border-amber-900/50', bg: 'bg-amber-950/30', text: 'text-amber-400', label: '보통', message: '경제 활성화 효과는 있으나, 세수 환류가 비용을 완전히 상쇄하지 못합니다.' },
    inefficient: { border: 'border-red-900/50', bg: 'bg-red-950/30', text: 'text-red-400', label: '비효율적', message: '인센티브 대비 세수 환류가 낮아 비용 효율성 개선이 필요합니다.' },
  };

  const vConfig = verdictConfig[simulation.verdict];

  // Chart scaling (unused maxROI removed — chart now uses absolute amounts)

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            지역화폐 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="지역화폐시뮬레이션" />
          <span className="text-sm md:text-base text-gray-600">
            경제 파급효과 분석
          </span>
        </div>
      </div>

      {/* ====== SECTION: 지역 현황 + Region Selector ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <div className="col-span-full border border-gray-800 px-4 py-2 text-cyan-400">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
              지역 현황 Regional Status
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
          value={formatEok(regionData.budget)}
          color="text-cyan-400"
          sub={regionData.name}
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
          color={regionData.independence >= 50 ? 'text-emerald-400' : regionData.independence >= 30 ? 'text-amber-400' : 'text-red-400'}
          sub="자체수입 / 총예산"
        />
      </div>

      {/* ====== SECTION: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="발행 규모 (예산 대비)"
            value={issuanceRate}
            min={1}
            max={20}
            step={0.5}
            unit="%"
            subLabel={`${formatEok(regionBudget * (issuanceRate / 100))}`}
            color="text-purple-400"
            onChange={setIssuanceRate}
          />
          <Slider
            label="순환 승수"
            value={multiplier}
            min={1.0}
            max={3.0}
            step={0.1}
            unit="배"
            color="text-cyan-400"
            onChange={setMultiplier}
          />
          <Slider
            label="캐시백 인센티브"
            value={cashbackRate}
            min={0}
            max={10}
            step={0.5}
            unit="%"
            subLabel={`${formatEok(regionBudget * (issuanceRate / 100) * (cashbackRate / 100))} 소요`}
            color="text-emerald-400"
            onChange={setCashbackRate}
          />
          <Slider
            label="지역 내 소비 잔류율"
            value={retentionRate}
            min={50}
            max={95}
            step={1}
            unit="%"
            color="text-amber-400"
            onChange={setRetentionRate}
          />
        </div>
      </div>

      {/* ====== SECTION: 시뮬레이션 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="시뮬레이션 결과 Simulation Results" color="text-purple-400" />
        <Cell
          label="발행 규모"
          value={formatEok(simulation.issuanceAmount)}
          color="text-purple-400"
          sub={`예산 대비 ${issuanceRate}%`}
        />
        <Cell
          label="총 경제효과"
          value={formatEok(simulation.totalEconomicImpact)}
          color="text-cyan-400"
          sub={`승수 ${multiplier}배 적용`}
        />
        <Cell
          label="세수 환류"
          value={formatEok(simulation.taxReturn)}
          color="text-emerald-400"
          sub="지방세 실효세율 2.5%"
        />
        <Cell
          label="인센티브 비용"
          value={formatEok(simulation.incentiveCost)}
          color="text-red-400"
          sub={`캐시백 ${cashbackRate}%`}
        />
        <Cell
          label="순 재정효과"
          value={`${simulation.netFiscalCost > 0 ? '-' : '+'}${formatEok(Math.abs(simulation.netFiscalCost))}`}
          color={simulation.netFiscalCost <= 0 ? 'text-emerald-400' : 'text-red-400'}
          sub="인센티브 비용 - 세수 환류"
        />
        <Cell
          label="투자수익률 (ROI)"
          value={`${simulation.roi.toFixed(1)}%`}
          color={simulation.roi >= 100 ? 'text-emerald-400' : simulation.roi >= 50 ? 'text-amber-400' : 'text-red-400'}
          sub="세수 환류 / 인센티브 비용"
        />
        <Cell
          label="소상공인 매출 증대"
          value={formatEok(simulation.bizRevenueIncrease)}
          color="text-cyan-400"
          sub="소상공인 매출 비중 65%"
        />
      </div>

      <div className="grid grid-cols-2">
        <Cell
          label="1인당 경제자극"
          value={`${simulation.perCapitaStimulus.toLocaleString('ko-KR')}원`}
          color="text-amber-400"
          sub="총 경제효과 / 인구"
        />
        <Cell
          label="1인당 발행액"
          value={`${simulation.perCapitaIssuance.toLocaleString('ko-KR')}원`}
          color="text-purple-400"
          sub="발행 규모 / 인구"
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
          {vConfig.message}
          {' '}예산 대비 <span className={`font-bold ${vConfig.text}`}>{issuanceRate}%</span> 규모({formatEok(simulation.issuanceAmount)})를
          발행하면, 순환 승수 <span className="text-cyan-400 font-bold">{multiplier}배</span>와
          지역 잔류율 <span className="text-amber-400 font-bold">{retentionRate}%</span> 적용 시
          총 <span className="text-cyan-400 font-bold">{formatEok(simulation.totalEconomicImpact)}</span>의 경제효과가 발생하며,
          ROI는 <span className={`font-bold ${vConfig.text}`}>{simulation.roi.toFixed(1)}%</span>입니다.
        </p>
      </div>

      {/* ====== BAR CHART: 발행 규모별 경제효과 vs 재정비용 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-4">
          발행 규모별 경제효과 Economic Impact by Issuance Rate
        </div>
        {(() => {
          const maxImpact = Math.max(...simulation.chartData.map(d => d.impact), 1);
          return (
            <div className="space-y-1">
              {simulation.chartData.map((d) => (
                <div key={d.rate} className={`flex items-center gap-3 py-0.5 ${d.rate === issuanceRate ? 'bg-gray-800/40 rounded px-1 -mx-1' : ''}`}>
                  <span className={`text-sm w-8 text-right font-mono ${d.rate === issuanceRate ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                    {d.rate}%
                  </span>
                  <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* 인센티브 비용 (빨간색) */}
                    <div
                      className="absolute h-full bg-red-500/30 rounded-full"
                      style={{ width: `${(d.cost / maxImpact) * 100}%` }}
                    />
                    {/* 경제효과 (시안색) */}
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-cyan-400"
                      style={{ width: `${(d.impact / maxImpact) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs w-20 text-right font-mono ${d.netEffect >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {d.netEffect >= 0 ? '+' : ''}{formatEok(d.netEffect)}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded bg-gradient-to-r from-cyan-700 to-cyan-400" />
            <span>경제효과</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded bg-red-500/30" />
            <span>인센티브 비용</span>
          </div>
          <span className="mx-1">|</span>
          <span>우측: 순 재정효과 (세수환류 - 비용)</span>
          <span className="mx-1">|</span>
          <span className="text-purple-400 font-bold">강조</span>
          <span>= 현재 ({issuanceRate}%)</span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          * 발행률 10% 초과 시 수확체감 효과 적용 (승수 효과 점진 감소)
        </div>
      </div>

      {/* ====== INFO SECTION: 가정 및 방법론 ====== */}
      <InfoSection title="가정 및 방법론 Methodology" color="text-teal-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold text-base flex-shrink-0">순환 승수</span>
            <p className="text-gray-500 text-base">
              지역화폐가 지역 내에서 반복 사용되며 경제적 파급효과를 생성하는 배수입니다.
              한국조세재정연구원 연구에 따르면 지역화폐의 승수 효과는 1.5~2.5배 범위로 추정됩니다.
              기본값 1.8배는 보수적 추정치입니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">지방세 실효세율</span>
            <p className="text-gray-500 text-base">
              경제활동 증가에 따른 지방세 수입 증가분을 추정하기 위해 실효세율 2.5%를 적용합니다.
              이는 취득세, 주민세, 지방소득세 등 주요 지방세의 가중평균 실효세율입니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-bold text-base flex-shrink-0">소상공인 비중</span>
            <p className="text-gray-500 text-base">
              지역화폐 사용처의 약 65%가 소상공인 업체라는 행정안전부 통계를 기반으로,
              총 경제효과 중 소상공인 매출 증대분을 추정합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold text-base flex-shrink-0">ROI 산출</span>
            <p className="text-gray-500 text-base">
              투자수익률(ROI) = (세수 환류 / 인센티브 비용) x 100으로 계산합니다.
              ROI가 100%를 초과하면 인센티브 비용 이상의 세수가 환류되어 재정적으로 이익입니다.
            </p>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            * 본 시뮬레이션은 단순화된 모델이며, 실제 효과는 지역 산업 구조, 소비 패턴, 계절성 등에 따라 달라질 수 있습니다.
          </p>
        </div>
      </InfoSection>

      {/* ====== INFO SECTION: 슬라이더 가이드 ====== */}
      <InfoSection title="슬라이더 가이드 Parameter Guide" color="text-blue-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold text-base flex-shrink-0">발행 규모</span>
            <p className="text-gray-500 text-base">
              지자체 예산 대비 지역화폐 발행 비율입니다. 경기도는 약 3~5%, 일부 시군은 10% 이상 발행합니다.
              너무 높으면 재정 부담이 커지고, 너무 낮으면 경제 활성화 효과가 미미합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold text-base flex-shrink-0">순환 승수</span>
            <p className="text-gray-500 text-base">
              1.0배는 1회 사용 후 유출, 3.0배는 높은 지역 내 재순환을 의미합니다.
              도시 지역(1.5~2.0배)보다 농촌 지역(2.0~2.5배)이 잔류율이 높아 승수가 큰 경향이 있습니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">캐시백 인센티브</span>
            <p className="text-gray-500 text-base">
              소비자에게 제공하는 캐시백 비율입니다. 높을수록 사용률이 증가하나 재정 비용도 커집니다.
              대부분의 지역화폐는 5~10% 인센티브를 제공합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-bold text-base flex-shrink-0">소비 잔류율</span>
            <p className="text-gray-500 text-base">
              지역화폐로 결제된 금액 중 해당 지역 내에 머무는 비율입니다.
              대형마트·프랜차이즈 배제 시 잔류율이 높아지며, 소상공인 전용 시 80~90%까지 상승합니다.
            </p>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
