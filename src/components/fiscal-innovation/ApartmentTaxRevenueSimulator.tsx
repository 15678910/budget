'use client';

import React, { useState, useMemo } from 'react';
import { getMetroFiscalData, getDistrictFiscalData } from '@/lib/data/fiscal-health-data';

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
  color,
  tooltip,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  tooltip?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base text-gray-400 relative group/tip cursor-help">
          {label}
          {tooltip && (
            <span className="invisible group-hover/tip:visible absolute left-0 top-full mt-1 z-50 w-72 p-2.5 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg shadow-lg leading-relaxed whitespace-normal">
              {tooltip}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
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
// YearData Interface
// ============================================================

interface YearData {
  year: number;
  builtThisYear: number;
  cumulativeUnits: number;
  acquisitionTax: number;
  propertyTax: number;
  localIncomeTax: number;
  totalTax: number;
  inflowPopulation: number;
}

// ============================================================
// Main Component
// ============================================================

interface RegionProps {
  regionTab: 'metro' | 'district';
  selectedMetroName: string;
  selectedDistrictName: string;
}

export function ApartmentTaxRevenueSimulator({ regionTab, selectedMetroName, selectedDistrictName }: RegionProps) {
  // === Region data ===
  const allMetros = useMemo(() => getMetroFiscalData(), []);
  const districts = useMemo(
    () => getDistrictFiscalData(selectedMetroName).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [selectedMetroName],
  );
  const selectedMetro = allMetros.find(m => m.name === selectedMetroName);
  const selectedDistrict = useMemo(() => {
    if (regionTab !== 'district' || districts.length === 0) return undefined;
    const found = districts.find(d => d.name === selectedDistrictName);
    return found ?? districts[0];
  }, [regionTab, districts, selectedDistrictName]);

  const regionBudget = regionTab === 'metro'
    ? (selectedMetro?.budget ?? 0)
    : (selectedDistrict?.budget ?? 0);
  const regionPopulation = regionTab === 'metro'
    ? (selectedMetro?.population ?? 0)
    : (selectedDistrict?.population ?? 0);
  const regionName = regionTab === 'metro'
    ? selectedMetroName
    : (selectedDistrict?.name ?? selectedDistrictName);

  // === Slider states ===
  const [totalUnits, setTotalUnits] = useState(1000);
  const [avgPrice, setAvgPrice] = useState(6);
  const [acquisitionTaxRate, setAcquisitionTaxRate] = useState(2.0);
  const [assessmentRate, setAssessmentRate] = useState(70);
  const [annualBuildRate, setAnnualBuildRate] = useState(25);
  const [personsPerHousehold, setPersonsPerHousehold] = useState(2.4);

  // === 20-Year Simulation ===
  const simulation = useMemo(() => {
    const years: YearData[] = [];
    let cumulativeUnits = 0;
    let remainingUnits = totalUnits;

    for (let y = 1; y <= 20; y++) {
      // 당해 건설 호수
      const builtThisYear = Math.min(
        Math.round(totalUnits * annualBuildRate / 100),
        remainingUnits,
      );
      remainingUnits -= builtThisYear;
      cumulativeUnits += builtThisYear;

      // 취득세 (건설 당해년만 - 일회성)
      const acquisitionTax = builtThisYear * avgPrice * (acquisitionTaxRate / 100); // 억원

      // 재산세 (누적 호수에 매년 부과)
      // 공시가율 x 0.2% (재산세 실효세율)
      const propertyTax = cumulativeUnits * avgPrice * (assessmentRate / 100) * 0.002; // 억원

      // 지방소득세 (유입 인구에 매년 부과)
      const inflowPopulation = cumulativeUnits * personsPerHousehold;
      // 3,500만원 평균소득 x 0.1% 실효세율 -> 만원 단위를 억원으로 변환
      const localIncomeTax = inflowPopulation * 3500 * 0.001 / 10000; // 억원

      const totalTax = acquisitionTax + propertyTax + localIncomeTax;

      years.push({
        year: y,
        builtThisYear,
        cumulativeUnits,
        acquisitionTax,
        propertyTax,
        localIncomeTax,
        totalTax,
        inflowPopulation,
      });
    }

    const totalCumulativeTax = years.reduce((sum, y) => sum + y.totalTax, 0);
    const finalPopulation = years[years.length - 1]?.inflowPopulation ?? 0;

    return { years, totalCumulativeTax, finalPopulation };
  }, [totalUnits, avgPrice, acquisitionTaxRate, assessmentRate, annualBuildRate, personsPerHousehold]);

  // === Derived metrics ===
  const { years, totalCumulativeTax, finalPopulation } = simulation;
  const lastYear = years[years.length - 1];
  const budgetInJo = regionBudget / 10000; // 억원 -> 조원
  const annualLastTax = lastYear?.totalTax ?? 0;
  const budgetRatio = budgetInJo > 0 ? (annualLastTax / regionBudget) * 100 : 0;

  // 세수 구성 합계
  const totalAcquisitionTax = years.reduce((s, y) => s + y.acquisitionTax, 0);
  const totalPropertyTax = years.reduce((s, y) => s + y.propertyTax, 0);
  const totalLocalIncomeTax = years.reduce((s, y) => s + y.localIncomeTax, 0);

  // === Verdict ===
  const verdict: 'transformative' | 'significant' | 'moderate' | 'marginal' =
    budgetRatio >= 5 ? 'transformative'
    : budgetRatio >= 2 ? 'significant'
    : budgetRatio >= 0.5 ? 'moderate'
    : 'marginal';

  const verdictConfig = {
    transformative: {
      label: '변혁적 (Transformative)',
      bg: 'bg-rose-900/30',
      border: 'border-rose-700',
      text: 'text-rose-400',
      desc: `연간 세수 ${annualLastTax.toFixed(1)}억원으로 지역 예산의 ${budgetRatio.toFixed(2)}%에 해당. 대규모 아파트 건설이 지역 재정에 변혁적 효과를 가져옵니다.`,
    },
    significant: {
      label: '상당한 효과 (Significant)',
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-400',
      desc: `연간 세수 ${annualLastTax.toFixed(1)}억원으로 지역 예산의 ${budgetRatio.toFixed(2)}%에 해당. 지역 재정에 의미 있는 기여를 합니다.`,
    },
    moderate: {
      label: '보통 (Moderate)',
      bg: 'bg-emerald-900/30',
      border: 'border-emerald-700',
      text: 'text-emerald-400',
      desc: `연간 세수 ${annualLastTax.toFixed(1)}억원으로 지역 예산의 ${budgetRatio.toFixed(2)}%에 해당. 보통 수준의 세수 효과가 예상됩니다.`,
    },
    marginal: {
      label: '미미 (Marginal)',
      bg: 'bg-gray-900/30',
      border: 'border-gray-700',
      text: 'text-gray-400',
      desc: `연간 세수 ${annualLastTax.toFixed(1)}억원으로 지역 예산의 ${budgetRatio.toFixed(2)}%에 해당. 세수 효과가 미미하여 건설 규모 확대가 필요합니다.`,
    },
  };

  const v = verdictConfig[verdict];

  // Chart: max value for scaling
  const maxTotalTax = Math.max(...years.map(y => y.totalTax), 1);

  return (
    <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            아파트 건설 세수 시뮬레이터
          </h1>
        </div>
        <span className="text-sm md:text-base text-gray-600">
          신규 아파트 &rarr; 취득세 + 재산세 + 지방소득세
        </span>
      </div>

      {/* ====== REGION INFO ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px">
        <SectionHeader title={`선택 지역: ${regionName}`} color="text-teal-400" />
        <Cell label="지역 예산" value={`${budgetInJo.toFixed(1)}조원`} color="text-teal-300" />
        <Cell label="지역 인구" value={`${(regionPopulation / 10000).toFixed(0)}만명`} color="text-teal-300" />
      </div>

      {/* ====== SLIDERS ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="건설 호수"
            value={totalUnits}
            min={100}
            max={50000}
            step={100}
            unit="호"
            color="text-blue-400"
            tooltip="신규 건설할 총 아파트 호수. 건설 기간에 걸쳐 균등 분배됩니다."
            onChange={setTotalUnits}
          />
          <Slider
            label="호당 평균 분양가"
            value={avgPrice}
            min={2}
            max={20}
            step={0.5}
            unit="억원"
            color="text-amber-400"
            tooltip="아파트 1호당 평균 분양 가격. 취득세 및 재산세 산정 기준이 됩니다."
            onChange={setAvgPrice}
          />
          <Slider
            label="취득세율"
            value={acquisitionTaxRate}
            min={1.0}
            max={3.0}
            step={0.1}
            unit="%"
            color="text-cyan-400"
            tooltip="신규 취득 시 부과되는 취득세율. 주택 수 및 면적에 따라 1~3% 차등 적용됩니다."
            onChange={setAcquisitionTaxRate}
          />
          <Slider
            label="공시가격 현실화율"
            value={assessmentRate}
            min={50}
            max={90}
            step={5}
            unit="%"
            color="text-purple-400"
            tooltip="시세 대비 공시가격 비율. 재산세 과표 산정에 사용됩니다."
            onChange={setAssessmentRate}
          />
          <Slider
            label="연간 건설 비율"
            value={annualBuildRate}
            min={10}
            max={50}
            step={5}
            unit="%"
            color="text-emerald-400"
            tooltip="전체 호수 중 매년 건설 및 입주되는 비율. 25%면 4년에 걸쳐 건설 완료됩니다."
            onChange={setAnnualBuildRate}
          />
          <Slider
            label="가구당 인구"
            value={personsPerHousehold}
            min={1.5}
            max={3.5}
            step={0.1}
            unit="명"
            color="text-rose-400"
            tooltip="신규 아파트 1호당 예상 거주 인구. 지방소득세 산출에 사용됩니다."
            onChange={setPersonsPerHousehold}
          />
        </div>
      </div>

      {/* ====== VERDICT BANNER ====== */}
      <div className={`border ${v.border} ${v.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-lg md:text-xl font-bold ${v.text}`}>{v.label}</span>
        </div>
        <p className="text-base text-gray-300 leading-relaxed">{v.desc}</p>
      </div>

      {/* ====== KEY METRICS ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="핵심 결과" color="text-emerald-400" />
        <Cell
          label="20년 누적 세수"
          value={`${(totalCumulativeTax / 10000).toFixed(2)}조원`}
          color="text-emerald-400"
          sub={`${Math.round(totalCumulativeTax).toLocaleString()}억원`}
        />
        <Cell
          label="지역 예산 대비 비율"
          value={`${budgetRatio.toFixed(2)}%`}
          color="text-cyan-400"
          sub={`연간 마지막 해 세수 기준`}
        />
        <Cell
          label="인구 유입 효과"
          value={`${Math.round(finalPopulation).toLocaleString()}명`}
          color="text-rose-400"
          sub={`${totalUnits.toLocaleString()}호 x ${personsPerHousehold}명`}
        />
      </div>

      {/* ====== CHART: 연도별 세수 (3색 스택 바) ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="연도별 세수 추이 (억원)" color="text-cyan-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="flex items-end gap-[2px] h-40">
          {years.map((d, i) => {
            const acqPct = maxTotalTax > 0 ? (d.acquisitionTax / maxTotalTax) * 100 : 0;
            const propPct = maxTotalTax > 0 ? (d.propertyTax / maxTotalTax) * 100 : 0;
            const incPct = maxTotalTax > 0 ? (d.localIncomeTax / maxTotalTax) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end min-w-0 group relative"
                title={`${d.year}년차: 취득세 ${d.acquisitionTax.toFixed(1)}억 / 재산세 ${d.propertyTax.toFixed(1)}억 / 지방소득세 ${d.localIncomeTax.toFixed(1)}억 / 합계 ${d.totalTax.toFixed(1)}억`}
              >
                {/* Tooltip */}
                <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 p-2 text-xs text-gray-300 bg-gray-800 border border-gray-700 rounded-lg shadow-lg whitespace-normal pointer-events-none">
                  <div className="font-bold mb-1">{d.year}년차</div>
                  <div className="flex justify-between"><span className="text-cyan-400">취득세</span><span>{d.acquisitionTax.toFixed(1)}억</span></div>
                  <div className="flex justify-between"><span className="text-purple-400">재산세</span><span>{d.propertyTax.toFixed(1)}억</span></div>
                  <div className="flex justify-between"><span className="text-rose-400">지방소득세</span><span>{d.localIncomeTax.toFixed(1)}억</span></div>
                  <div className="flex justify-between border-t border-gray-700 mt-1 pt-1 font-bold"><span>합계</span><span>{d.totalTax.toFixed(1)}억</span></div>
                </div>
                {/* Stacked bars: income tax (bottom, rose) -> property tax (middle, purple) -> acquisition tax (top, cyan) */}
                <div
                  className="w-full bg-cyan-500 rounded-t-sm"
                  style={{ height: `${acqPct}%` }}
                />
                <div
                  className="w-full bg-purple-500"
                  style={{ height: `${propPct}%` }}
                />
                <div
                  className="w-full bg-rose-500"
                  style={{ height: `${incPct}%` }}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-[2px] mt-1">
          {years.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 5 === 0 ? `${d.year}년` : ''}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-cyan-500 rounded-sm" />
            <span>취득세</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-purple-500 rounded-sm" />
            <span>재산세</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-rose-500 rounded-sm" />
            <span>지방소득세</span>
          </div>
        </div>
      </div>

      {/* ====== TAX COMPOSITION TABLE ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="세수 구성 요약 (20년 합계)" color="text-purple-400" />
      </div>
      <div className="border border-gray-800 overflow-hidden">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="text-left px-4 py-2.5 font-medium">세목</th>
              <th className="text-right px-4 py-2.5 font-medium">20년 합계</th>
              <th className="text-right px-4 py-2.5 font-medium">비중</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            <tr className="border-b border-gray-800/50">
              <td className="px-4 py-2.5 text-cyan-400">취득세</td>
              <td className="px-4 py-2.5 text-right text-gray-300">{totalAcquisitionTax.toFixed(1)}억원</td>
              <td className="px-4 py-2.5 text-right text-gray-500">
                {totalCumulativeTax > 0 ? ((totalAcquisitionTax / totalCumulativeTax) * 100).toFixed(1) : '0.0'}%
              </td>
            </tr>
            <tr className="border-b border-gray-800/50">
              <td className="px-4 py-2.5 text-purple-400">재산세</td>
              <td className="px-4 py-2.5 text-right text-gray-300">{totalPropertyTax.toFixed(1)}억원</td>
              <td className="px-4 py-2.5 text-right text-gray-500">
                {totalCumulativeTax > 0 ? ((totalPropertyTax / totalCumulativeTax) * 100).toFixed(1) : '0.0'}%
              </td>
            </tr>
            <tr className="border-b border-gray-800/50">
              <td className="px-4 py-2.5 text-rose-400">지방소득세</td>
              <td className="px-4 py-2.5 text-right text-gray-300">{totalLocalIncomeTax.toFixed(1)}억원</td>
              <td className="px-4 py-2.5 text-right text-gray-500">
                {totalCumulativeTax > 0 ? ((totalLocalIncomeTax / totalCumulativeTax) * 100).toFixed(1) : '0.0'}%
              </td>
            </tr>
            <tr className="bg-gray-900/30">
              <td className="px-4 py-2.5 text-gray-300 font-bold">총합</td>
              <td className="px-4 py-2.5 text-right text-gray-200 font-bold">{totalCumulativeTax.toFixed(1)}억원</td>
              <td className="px-4 py-2.5 text-right text-gray-400 font-bold">100.0%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ====== INFO SECTIONS ====== */}
      <InfoSection title="가정 및 방법론" color="text-gray-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">재산세 실효세율</span>
              <p className="text-gray-500 text-base">
                공시가격 &times; 0.2%. 공시가격은 분양가 &times; 공시가격 현실화율로 산출합니다.
                주택분 재산세 세율 0.1~0.4%의 중위 실효세율을 적용했습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">지방소득세</span>
              <p className="text-gray-500 text-base">
                1인당 평균 소득 3,500만원 &times; 실효세율 0.1%로 산출합니다.
                지방소득세는 소득세의 10%이며, 평균 실효소득세율 약 1%를 반영한 값입니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">취득세 일회성</span>
              <p className="text-gray-500 text-base">
                취득세는 건설 당해년에만 일회성으로 발생합니다.
                최초 분양 취득 시에만 과세되며, 이후 거래 시 추가 취득세는 본 시뮬레이션에서 제외합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">재산세 및 지방소득세 반복 부과</span>
              <p className="text-gray-500 text-base">
                재산세와 지방소득세는 누적 호수에 대해 매년 반복 부과됩니다.
                건설이 완료된 이후에도 입주 세대에 대해 지속적으로 세수가 발생합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">05</span>
            <div>
              <span className="text-gray-300 font-semibold">인구 유입 산정</span>
              <p className="text-gray-500 text-base">
                인구 유입은 입주 완료 호수 &times; 가구당 인구로 산정합니다.
                실제 순유입 인구는 지역 내 이동을 제외하면 이보다 적을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>
    </div>
  );
}
