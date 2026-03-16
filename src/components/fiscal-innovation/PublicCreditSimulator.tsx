'use client';

import React, { useState, useMemo, useRef } from 'react';
import { getMetroFiscalData, getDistrictFiscalData, getMetroNames, getMetroHouseholdDebt, type MetroFiscalData, type DistrictFiscalData } from '@/lib/data/fiscal-health-data';
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

/** Format 억원 amounts for display */
function formatEok(eokWon: number): string {
  if (eokWon >= 10000) {
    return `${(eokWon / 10000).toFixed(1)}조원`;
  }
  if (eokWon >= 1) {
    return `${Math.round(eokWon).toLocaleString('ko-KR')}억원`;
  }
  return `${(eokWon * 10000).toFixed(0)}만원`;
}

// ============================================================
// Main Component
// ============================================================

export function PublicCreditSimulator() {
  // === Region selection ===
  const [regionTab, setRegionTab] = useState<'metro' | 'district'>('metro');
  const metroData = getMetroFiscalData();
  const metroNames = getMetroNames();
  const [selectedMetroName, setSelectedMetroName] = useState(metroData[0]?.name ?? '서울특별시');
  const districts = getDistrictFiscalData(selectedMetroName);
  const [selectedDistrictName, setSelectedDistrictName] = useState(districts[0]?.name ?? '');

  // Resolve the selected region's data
  const selectedMetro: MetroFiscalData | undefined = metroData.find(m => m.name === selectedMetroName);
  const selectedDistrict: DistrictFiscalData | undefined = districts.find(d => d.name === selectedDistrictName);

  const regionBudget = regionTab === 'metro'
    ? (selectedMetro?.budget ?? 0)
    : (selectedDistrict?.budget ?? 0);
  const regionIndependence = regionTab === 'metro'
    ? (selectedMetro?.independence ?? 0)
    : (selectedDistrict?.independence ?? 0);
  const regionPopulation = regionTab === 'metro'
    ? (selectedMetro?.population ?? 0)
    : (selectedDistrict?.population ?? 0);
  const regionName = regionTab === 'metro'
    ? selectedMetroName
    : selectedDistrictName;

  // === Slider states ===
  const [lendingRate, setLendingRate] = useState(2.0);
  const [captureRate, setCaptureRate] = useState(15);
  const [opCostRatio, setOpCostRatio] = useState(20);
  const [rampUpYears, setRampUpYears] = useState(5);

  // === Household debt for selected metro ===
  const householdDebtData = getMetroHouseholdDebt();
  const metroDebtInfo = householdDebtData.find(h => h.name === selectedMetroName);
  const avgDebtPerHousehold = metroDebtInfo?.avgDebt ?? 9534; // 만원

  // === Simulation calculation ===
  const simulation = useMemo(() => {
    const households = regionPopulation / 2.4;
    const totalHouseholdDebt = (households * avgDebtPerHousehold) / 10000; // 억원 (만원 -> 억원)
    const capturedLoanVolume = totalHouseholdDebt * (captureRate / 100);

    const yearlyData: { year: number; loanVolume: number; netRevenue: number; independence: number; change: number }[] = [];

    for (let y = 1; y <= rampUpYears; y++) {
      const rampFactor = y / rampUpYears;
      const activeLoanVolume = capturedLoanVolume * rampFactor;
      const grossRevenue = activeLoanVolume * (lendingRate / 100);
      const operatingCost = grossRevenue * (opCostRatio / 100);
      const netRevenue = grossRevenue - operatingCost;

      const currentOwnRevenue = regionBudget * (regionIndependence / 100);
      const newOwnRevenue = currentOwnRevenue + netRevenue;
      const newIndependence = (newOwnRevenue / regionBudget) * 100;

      yearlyData.push({
        year: 2026 + y,
        loanVolume: activeLoanVolume,
        netRevenue,
        independence: newIndependence,
        change: newIndependence - regionIndependence,
      });
    }

    const final = yearlyData[yearlyData.length - 1];
    const finalIndependence = final?.independence ?? regionIndependence;
    const change = final?.change ?? 0;
    const finalNetRevenue = final?.netRevenue ?? 0;
    const finalLoanVolume = final?.loanVolume ?? 0;

    const verdict: 'transformative' | 'significant' | 'moderate' | 'minimal' =
      change >= 10 ? 'transformative' : change >= 5 ? 'significant' : change >= 2 ? 'moderate' : 'minimal';

    // 필요 초기자본 추정 (대출 포트폴리오의 10% 자기자본비율 BIS 기준)
    const requiredCapital = finalLoanVolume * 0.10; // 억원
    // 자본 조달 구성 추정
    const capitalFromBudget = requiredCapital * 0.3; // 예산 출연 30%
    const capitalFromBonds = requiredCapital * 0.4;  // 지방채 발행 40%
    const capitalFromDeposits = requiredCapital * 0.3; // 주민예금 30%

    return { yearlyData, finalIndependence, change, finalNetRevenue, finalLoanVolume, capturedLoanVolume, totalHouseholdDebt, verdict, requiredCapital, capitalFromBudget, capitalFromBonds, capitalFromDeposits };
  }, [lendingRate, captureRate, opCostRatio, rampUpYears, avgDebtPerHousehold, regionBudget, regionIndependence, regionPopulation]);

  // Chart scaling
  const allIndependenceValues = [regionIndependence, ...simulation.yearlyData.map(d => d.independence)];
  const chartCeiling = Math.ceil(Math.max(...allIndependenceValues, 1) / 10) * 10 + 10;

  const contentRef = useRef<HTMLDivElement>(null);

  // Verdict styling
  const verdictConfig = {
    transformative: { border: 'border-emerald-900/50', bg: 'bg-emerald-950/30', text: 'text-emerald-400', label: '혁신적 변화', message: '공공신용기관이 재정자립도를 10%p 이상 개선하여 자치구 재정 구조를 근본적으로 변화시킵니다.' },
    significant: { border: 'border-emerald-900/50', bg: 'bg-emerald-950/30', text: 'text-emerald-300', label: '의미 있는 개선', message: '재정자립도가 5%p 이상 개선되어 자치구의 재정 자주권이 크게 강화됩니다.' },
    moderate: { border: 'border-amber-900/50', bg: 'bg-amber-950/30', text: 'text-amber-400', label: '보통 수준', message: '재정자립도 개선이 있으나, 대출 규모 확대나 운영 효율화가 필요합니다.' },
    minimal: { border: 'border-red-900/50', bg: 'bg-red-950/30', text: 'text-red-400', label: '미미한 효과', message: '대출 포획률이 낮거나 운영비가 높아 재정자립도 개선 효과가 미미합니다.' },
  };

  const vConfig = verdictConfig[simulation.verdict];

  // Handle metro change: reset district selection
  const handleMetroChange = (name: string) => {
    setSelectedMetroName(name);
    const newDistricts = getDistrictFiscalData(name);
    setSelectedDistrictName(newDistricts[0]?.name ?? '');
  };

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            공공신용기관 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="공공신용기관" />
          <span className="text-sm md:text-base text-gray-600">
            재정자립도 개선 분석
          </span>
        </div>
      </div>

      {/* ====== SECTION 1: 지역 현황 + Region Selector ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <div className="col-span-full border border-gray-800 px-4 py-2 text-cyan-400">
          <div className="flex items-center justify-between overflow-x-auto gap-3">
            <span className="text-sm md:text-base font-semibold uppercase tracking-widest shrink-0">
              지역 현황 Regional Overview
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {/* Tab: 광역시도 | 시군구 */}
              <div className="flex rounded overflow-hidden border border-gray-700">
                <button
                  onClick={() => setRegionTab('metro')}
                  className={`px-4 py-2 text-base font-medium transition-colors ${
                    regionTab === 'metro'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  광역시도
                </button>
                <button
                  onClick={() => setRegionTab('district')}
                  className={`px-4 py-2 text-base font-medium transition-colors ${
                    regionTab === 'district'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  시군구
                </button>
              </div>

              {/* Dropdowns */}
              <select
                value={selectedMetroName}
                onChange={(e) => handleMetroChange(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-cyan-600"
              >
                {metroNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {regionTab === 'district' && (
                <select
                  value={selectedDistrictName}
                  onChange={(e) => setSelectedDistrictName(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none focus:border-cyan-600"
                >
                  {districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Regional info cells */}
        <Cell
          label="예산규모"
          value={formatEok(regionBudget)}
          color="text-cyan-400"
          sub={regionName}
        />
        <Cell
          label="재정자립도"
          value={`${regionIndependence.toFixed(1)}%`}
          color={regionIndependence >= 50 ? 'text-emerald-400' : regionIndependence >= 30 ? 'text-amber-400' : 'text-red-400'}
          sub="자체수입 / 총예산"
        />
        <Cell
          label="인구"
          value={`${(regionPopulation / 10000).toFixed(1)}만명`}
          color="text-cyan-400"
          sub={`약 ${Math.round(regionPopulation / 2.4).toLocaleString('ko-KR')} 가구`}
        />
        <Cell
          label="가구당 평균부채"
          value={`${avgDebtPerHousehold.toLocaleString('ko-KR')}만원`}
          color="text-red-400"
          sub={`${selectedMetroName} 기준`}
        />
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="대출 금리"
            value={lendingRate}
            min={0.5}
            max={5.0}
            step={0.1}
            unit="%"
            subLabel={`연 이자수익률`}
            color="text-emerald-400"
            onChange={setLendingRate}
          />
          <Slider
            label="지역 가구부채 포획률"
            value={captureRate}
            min={5}
            max={50}
            step={1}
            unit="%"
            subLabel={`지역 가구부채 중 공공대출 비중`}
            color="text-cyan-400"
            onChange={setCaptureRate}
          />
          <Slider
            label="운영비 비율"
            value={opCostRatio}
            min={10}
            max={40}
            step={1}
            unit="%"
            subLabel={`이자수입 대비 운영비`}
            color="text-purple-400"
            onChange={setOpCostRatio}
          />
          <Slider
            label="운영 도달 기간"
            value={rampUpYears}
            min={1}
            max={10}
            step={1}
            unit="년"
            subLabel={`완전 운영까지 소요 기간`}
            color="text-amber-400"
            onChange={setRampUpYears}
          />
        </div>
      </div>

      {/* ====== SECTION 3: 시뮬레이션 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="시뮬레이션 결과 Simulation Results" color="text-blue-400" />
        <Cell
          label="현재 재정자립도"
          value={`${regionIndependence.toFixed(1)}%`}
          color="text-gray-400"
          sub={regionName}
        />
        <Cell
          label="예상 재정자립도"
          value={`${simulation.finalIndependence.toFixed(1)}%`}
          color={simulation.change >= 5 ? 'text-emerald-400' : simulation.change >= 2 ? 'text-amber-400' : 'text-red-400'}
          sub={`${rampUpYears}년 후 예상`}
        />
        <Cell
          label="변화폭"
          value={`${simulation.change >= 0 ? '+' : ''}${simulation.change.toFixed(1)}%p`}
          color={simulation.change >= 5 ? 'text-emerald-400' : simulation.change >= 2 ? 'text-amber-400' : 'text-red-400'}
          sub={`${regionIndependence.toFixed(1)}% → ${simulation.finalIndependence.toFixed(1)}%`}
        />
        <Cell
          label="연간 순수익"
          value={formatEok(simulation.finalNetRevenue)}
          color="text-emerald-400"
          sub="이자수입 - 운영비"
        />
        <Cell
          label="대출 규모"
          value={formatEok(simulation.finalLoanVolume)}
          color="text-cyan-400"
          sub={`포획률 ${captureRate}% 적용`}
        />
        <Cell
          label="지역 총 가구부채"
          value={formatEok(simulation.totalHouseholdDebt)}
          color="text-red-400"
          sub={`${selectedMetroName} 가구당 ${avgDebtPerHousehold.toLocaleString('ko-KR')}만원`}
        />
      </div>

      {/* ====== SECTION 3b: 필요 자본 및 조달 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="필요 자본 및 조달 Capital Requirements" color="text-teal-400" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px col-span-full">
          <Cell label="필요 초기자본" value={formatEok(simulation.requiredCapital)} color="text-teal-400" sub="BIS 자기자본비율 10%" />
          <Cell label="예산 출연" value={formatEok(simulation.capitalFromBudget)} color="text-cyan-400" sub="초기자본의 30%" />
          <Cell label="지방채 발행" value={formatEok(simulation.capitalFromBonds)} color="text-purple-400" sub="초기자본의 40%" />
          <Cell label="주민예금 유치" value={formatEok(simulation.capitalFromDeposits)} color="text-amber-400" sub="초기자본의 30%" />
        </div>
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
          <span className="text-cyan-400 font-bold">{regionName}</span>에
          공공신용기관을 설립하면, 지역 가구부채{' '}
          <span className="text-red-400 font-bold">{formatEok(simulation.totalHouseholdDebt)}</span> 중{' '}
          <span className="text-cyan-400 font-bold">{captureRate}%</span>를 공공대출로 전환하여{' '}
          <span className="text-emerald-400 font-bold">{formatEok(simulation.capturedLoanVolume)}</span> 규모의
          대출 포트폴리오를 구축합니다.{' '}
          <span className="text-amber-400 font-bold">{rampUpYears}년</span> 후 연간 순수익{' '}
          <span className="text-emerald-400 font-bold">{formatEok(simulation.finalNetRevenue)}</span>을
          확보하여 재정자립도가{' '}
          <span className={`font-bold ${vConfig.text}`}>
            {regionIndependence.toFixed(1)}% → {simulation.finalIndependence.toFixed(1)}%
          </span>로{' '}
          <span className={`font-bold ${vConfig.text}`}>
            {simulation.change >= 0 ? '+' : ''}{simulation.change.toFixed(1)}%p
          </span>{' '}
          변화합니다.
        </p>
        <p className="text-sm text-gray-500 mt-2">{vConfig.message}</p>
      </div>

      {/* ====== BAR CHART: 연도별 재정자립도 변화 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-4">
          연도별 재정자립도 변화 Independence Timeline
        </div>
        <div className="space-y-2">
          {/* Baseline: current year */}
          <div className="flex items-center gap-3 py-1">
            <span className="text-sm md:text-base text-gray-500 w-12 text-right font-mono">2026</span>
            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
              {/* Current independence reference line */}
              <div
                className="absolute top-0 bottom-0 w-px bg-cyan-500/50 z-10"
                style={{ left: `${(regionIndependence / chartCeiling) * 100}%` }}
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-gray-600 to-gray-400"
                style={{ width: `${(regionIndependence / chartCeiling) * 100}%` }}
              />
            </div>
            <span className="text-sm md:text-base text-gray-400 w-16 text-right font-mono">
              {regionIndependence.toFixed(1)}%
            </span>
          </div>
          {/* Year-by-year data */}
          {simulation.yearlyData.map((d) => {
            const barColor =
              d.change >= 10
                ? 'from-emerald-600 to-emerald-400'
                : d.change >= 5
                  ? 'from-emerald-700 to-emerald-500'
                  : d.change >= 2
                    ? 'from-amber-600 to-amber-400'
                    : 'from-red-600 to-red-400';
            return (
              <div key={d.year} className="flex items-center gap-3 py-1">
                <span className="text-sm md:text-base text-gray-500 w-12 text-right font-mono">{d.year}</span>
                <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
                  {/* Current independence reference line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cyan-500/50 z-10"
                    style={{ left: `${(regionIndependence / chartCeiling) * 100}%` }}
                  />
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                    style={{ width: `${(d.independence / chartCeiling) * 100}%` }}
                  />
                </div>
                <span className="text-sm md:text-base text-gray-400 w-16 text-right font-mono">
                  {d.independence.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
          <div className="w-3 h-px bg-cyan-500/50" />
          <span>현재 재정자립도 {regionIndependence.toFixed(1)}% 기준선</span>
        </div>
      </div>

      {/* ====== INFO SECTION: 가정 및 방법론 ====== */}
      <InfoSection title="가정 및 방법론 Assumptions & Methodology" color="text-teal-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-bold text-base flex-shrink-0">가구부채 구성</span>
            <p className="text-gray-500 text-base">
              가구부채에는 주택담보대출(~55%), 전세보증금 대출(~15%), 신용대출(~15%),
              자동차 할부(~8%), 기타(학자금·카드론 등 ~7%)가 모두 포함됩니다.
              공공신용기관은 주로 주택담보대출과 전세대출(전체의 ~70%)을 낮은 금리로 전환하는 것을 목표로 합니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold text-base flex-shrink-0">자본 조달</span>
            <p className="text-gray-500 text-base">
              공공신용기관의 초기 자본은 ① 자치구 예산 출연(30%), ② 저리 지방채 발행(40%),
              ③ 주민 예금 유치(30%)로 구성됩니다. BIS 자기자본비율 10% 기준으로
              대출 포트폴리오의 10%에 해당하는 자본이 필요합니다.
              기존 새마을금고·신협과의 협력을 통해 초기 인프라 비용을 절감할 수 있습니다.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">가구 수 추정</span>
              <p className="text-gray-500 text-base">지역 인구를 평균 가구원 수 2.4명으로 나누어 가구 수를 추정합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">가구부채 총액</span>
              <p className="text-gray-500 text-base">추정 가구 수 x 광역시도별 가구당 평균 부채(가계금융복지조사)로 지역 총 가구부채를 산출합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">포획률 적용</span>
              <p className="text-gray-500 text-base">지역 가구부채 중 공공신용기관이 흡수할 수 있는 비율(포획률)을 적용하여 대출 규모를 결정합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">단계적 확대</span>
              <p className="text-gray-500 text-base">운영 도달 기간 동안 선형적으로 대출 규모가 확대되며, 최종 연도에 목표 포획률에 도달합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">05</span>
            <div>
              <span className="text-gray-300 font-semibold">순수익 산정</span>
              <p className="text-gray-500 text-base">대출 이자수입에서 운영비(인건비, 시스템 유지 등)를 차감하여 순수익을 산출하고, 이를 자체수입에 추가합니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-400 font-mono text-base flex-shrink-0">06</span>
            <div>
              <span className="text-gray-300 font-semibold">재정자립도 변화</span>
              <p className="text-gray-500 text-base">기존 자체수입 + 공공신용기관 순수익을 총예산으로 나누어 새로운 재정자립도를 산출합니다.</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            * 본 시뮬레이션은 단순 추정 모델이며, 실제 공공신용기관 운영 시 대손율, 자금조달 비용, 규제 환경 등 추가 변수가 반영되어야 합니다.
          </p>
        </div>
      </InfoSection>

      {/* ====== INFO SECTION: 슬라이더 가이드 ====== */}
      <InfoSection title="슬라이더 가이드 Slider Guide" color="text-blue-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base flex-shrink-0">대출 금리</span>
            <p className="text-gray-500 text-base">공공신용기관의 대출 금리입니다. 시중은행보다 낮은 2~3%가 일반적이며, 금리가 높을수록 이자수입이 증가하지만 주민 부담도 커집니다.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold text-base flex-shrink-0">포획률</span>
            <p className="text-gray-500 text-base">지역 가구부채 중 공공기관이 흡수하는 비율입니다. 독일 Sparkassen 모델은 지역 예금의 30~50%를 점유하며, 초기에는 10~15%가 현실적입니다.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold text-base flex-shrink-0">운영비 비율</span>
            <p className="text-gray-500 text-base">이자수입 대비 운영비 비율입니다. 인건비, IT 시스템, 점포 운영비 등이 포함되며, 효율적 운영 시 15~25%가 목표입니다.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-bold text-base flex-shrink-0">도달 기간</span>
            <p className="text-gray-500 text-base">목표 대출 규모에 도달하기까지의 기간입니다. 조직 구축, 인력 확보, 고객 확보에 3~5년이 소요되는 것이 일반적입니다.</p>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
