'use client';

import React, { useState, useMemo } from 'react';

// ============================================================
// Slider with tooltip (group/tip hover pattern)
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
        <span className="text-base md:text-base text-gray-400 relative group/tip cursor-help">
          {label}
          {tooltip && (
            <span className="invisible group-hover/tip:visible absolute left-0 top-full mt-1 z-50 w-72 p-2.5 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg shadow-lg leading-relaxed whitespace-normal">
              {tooltip}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value.toLocaleString('ko-KR')}{unit}
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

// ============================================================
// Bar chart row
// ============================================================

function BarRow({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-gray-400 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono text-gray-300 w-20 text-right shrink-0">
        {value < 1 ? `${(value * 10000).toLocaleString('ko-KR')}만원` : `${value.toLocaleString('ko-KR')}억원`}
      </span>
    </div>
  );
}

// ============================================================
// Section card
// ============================================================

function ResultCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-800 p-4 md:p-5">
      <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${color} mb-3`}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// Main Calculator
// ============================================================

export function CostCalculator() {
  const [employees, setEmployees] = useState(500);
  const [civilServices, setCivilServices] = useState(50000);
  const [existingSystems, setExistingSystems] = useState(20);
  const [dataVolume, setDataVolume] = useState(100);

  const results = useMemo(() => {
    // Initial costs (one-time, in 억원)
    const aiPlatformCost = Math.max(5, Math.round(employees * 0.015));
    const dataInfraCost = Math.max(2, Math.round(dataVolume * 0.03));
    const systemIntegrationCost = Math.max(3, Math.round(existingSystems * 0.3));
    const consultingCost = Math.max(1, Math.round((aiPlatformCost + dataInfraCost) * 0.15));
    const trainingCost = Math.max(0.5, Math.round(employees * 0.002 * 10) / 10);
    const totalInitialCost = aiPlatformCost + dataInfraCost + systemIntegrationCost + consultingCost + trainingCost;

    // Annual operating costs
    const annualMaintenance = Math.round(totalInitialCost * 0.2 * 10) / 10;
    const annualCloudCost = Math.max(1, Math.round(dataVolume * 0.01 * 10) / 10);
    const annualLicenseCost = Math.max(0.5, Math.round(employees * 0.001 * 10) / 10);
    const totalAnnualCost = annualMaintenance + annualCloudCost + annualLicenseCost;

    // Annual savings
    const laborSaving = Math.round(employees * 0.05 * 0.5);
    const civilServiceSaving = Math.round(civilServices * 0.15 * 0.00002 * 10) / 10;
    const efficiencySaving = Math.round(existingSystems * 0.1 * 10) / 10;
    const totalAnnualSaving = laborSaving + civilServiceSaving + efficiencySaving;

    // ROI
    const netAnnualBenefit = totalAnnualSaving - totalAnnualCost;
    const paybackYears = netAnnualBenefit > 0 ? Math.round(totalInitialCost / netAnnualBenefit * 10) / 10 : Infinity;
    const roi3year = Math.round(((totalAnnualSaving * 3 - totalInitialCost - totalAnnualCost * 3) / (totalInitialCost + totalAnnualCost * 3)) * 100);
    const roi5year = Math.round(((totalAnnualSaving * 5 - totalInitialCost - totalAnnualCost * 5) / (totalInitialCost + totalAnnualCost * 5)) * 100);
    const roi10year = Math.round(((totalAnnualSaving * 10 - totalInitialCost - totalAnnualCost * 10) / (totalInitialCost + totalAnnualCost * 10)) * 100);

    return {
      initial: { aiPlatformCost, dataInfraCost, systemIntegrationCost, consultingCost, trainingCost, total: totalInitialCost },
      annual: { maintenance: annualMaintenance, cloud: annualCloudCost, license: annualLicenseCost, total: totalAnnualCost },
      savings: { labor: laborSaving, civilService: civilServiceSaving, efficiency: efficiencySaving, total: totalAnnualSaving },
      roi: { paybackYears, roi3year, roi5year, roi10year },
    };
  }, [employees, civilServices, existingSystems, dataVolume]);

  return (
    <div className="space-y-1">
      {/* Sliders */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-emerald-400 mb-4">
          지자체 기본 정보 입력
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Slider
            label="공무원 수"
            value={employees}
            min={50}
            max={10000}
            step={50}
            unit="명"
            color="text-blue-400"
            tooltip="해당 지자체의 총 공무원 수. AI 도입 규모 산정의 기준이 됩니다."
            onChange={setEmployees}
          />
          <Slider
            label="연간 민원 처리량"
            value={civilServices}
            min={1000}
            max={1000000}
            step={1000}
            unit="건"
            color="text-emerald-400"
            tooltip="연간 처리하는 민원 건수. AI 챗봇/자동화 대상 규모를 결정합니다."
            onChange={setCivilServices}
          />
          <Slider
            label="기존 행정 시스템 수"
            value={existingSystems}
            min={5}
            max={100}
            step={1}
            unit="개"
            color="text-purple-400"
            tooltip="현재 운영 중인 행정정보시스템 수. AI 연동 비용에 영향을 줍니다."
            onChange={setExistingSystems}
          />
          <Slider
            label="보유 데이터량"
            value={dataVolume}
            min={1}
            max={1000}
            step={10}
            unit="TB"
            color="text-amber-400"
            tooltip="보유한 공공데이터 총량. AI 학습 및 인프라 비용에 영향을 줍니다."
            onChange={setDataVolume}
          />
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {/* Initial Cost */}
        <ResultCard title="초기 도입 비용 (1회성)" color="text-blue-400">
          <BarRow label="AI 플랫폼" value={results.initial.aiPlatformCost} maxValue={results.initial.total} color="bg-blue-500" />
          <BarRow label="데이터 인프라" value={results.initial.dataInfraCost} maxValue={results.initial.total} color="bg-cyan-500" />
          <BarRow label="시스템 연동" value={results.initial.systemIntegrationCost} maxValue={results.initial.total} color="bg-indigo-500" />
          <BarRow label="컨설팅" value={results.initial.consultingCost} maxValue={results.initial.total} color="bg-purple-500" />
          <BarRow label="교육" value={results.initial.trainingCost} maxValue={results.initial.total} color="bg-violet-500" />
          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">합계</span>
            <span className="text-lg font-mono font-bold text-blue-400">
              {results.initial.total.toLocaleString('ko-KR')}억원
            </span>
          </div>
        </ResultCard>

        {/* Annual Operating Cost */}
        <ResultCard title="연간 운영 비용" color="text-rose-400">
          <BarRow label="유지보수" value={results.annual.maintenance} maxValue={results.annual.total} color="bg-rose-500" />
          <BarRow label="클라우드" value={results.annual.cloud} maxValue={results.annual.total} color="bg-pink-500" />
          <BarRow label="라이선스" value={results.annual.license} maxValue={results.annual.total} color="bg-red-400" />
          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">합계</span>
            <span className="text-lg font-mono font-bold text-rose-400">
              {results.annual.total.toLocaleString('ko-KR')}억원
            </span>
          </div>
        </ResultCard>

        {/* Annual Savings */}
        <ResultCard title="연간 절감 효과" color="text-emerald-400">
          <BarRow label="인건비 절감" value={results.savings.labor} maxValue={results.savings.total} color="bg-emerald-500" />
          <BarRow label="민원 자동화" value={results.savings.civilService} maxValue={results.savings.total} color="bg-green-500" />
          <BarRow label="시스템 효율" value={results.savings.efficiency} maxValue={results.savings.total} color="bg-teal-500" />
          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-300">합계</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              {results.savings.total.toLocaleString('ko-KR')}억원
            </span>
          </div>
        </ResultCard>

        {/* ROI Analysis */}
        <ResultCard title="ROI 분석" color="text-amber-400">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">손익분기점</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                {results.roi.paybackYears === Infinity ? 'N/A' : `${results.roi.paybackYears}년`}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">3년 ROI</span>
              <span className={`text-lg font-mono font-bold ${results.roi.roi3year >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {results.roi.roi3year}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">5년 ROI</span>
              <span className={`text-lg font-mono font-bold ${results.roi.roi5year >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {results.roi.roi5year}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">10년 ROI</span>
              <span className={`text-lg font-mono font-bold ${results.roi.roi10year >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {results.roi.roi10year}%
              </span>
            </div>
          </div>
        </ResultCard>
      </div>

      {/* Summary Message */}
      <div className="border border-emerald-900/50 bg-emerald-950/20 p-4 md:p-5 rounded">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-emerald-400 mb-3">
          핵심 요약
        </div>
        <p className="text-base text-gray-300 leading-relaxed">
          공무원 <span className="text-blue-400 font-bold">{employees.toLocaleString('ko-KR')}명</span> 규모의 지자체가
          AI를 도입하면 초기 <span className="text-blue-400 font-bold">{results.initial.total.toLocaleString('ko-KR')}억원</span>이 소요되며,
          연간 <span className="text-emerald-400 font-bold">{results.savings.total.toLocaleString('ko-KR')}억원</span>의 절감 효과를 기대할 수 있습니다.
          {results.roi.paybackYears !== Infinity && (
            <> 손익분기점은 약 <span className="text-amber-400 font-bold">{results.roi.paybackYears}년</span>이며,
            5년 기준 ROI는 <span className={`font-bold ${results.roi.roi5year >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{results.roi.roi5year}%</span>입니다.</>
          )}
        </p>
      </div>
    </div>
  );
}
