'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  BND_REFERENCE,
  SPARKASSEN_REFERENCE,
  BPDC_REFERENCE,
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

function formatEok(v: number): string {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}조원`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}천억원`;
  return `${Math.round(v).toLocaleString('ko-KR')}억원`;
}

function formatPopLocal(pop: number): string {
  if (pop >= 10000) return `${(pop / 10000).toFixed(0)}만명`;
  return `${pop.toLocaleString('ko-KR')}명`;
}

// ============================================================
// Styling
// ============================================================

// ============================================================
// Main Component
// ============================================================

interface RegionProps {
  regionTab: 'metro' | 'district';
  selectedMetroName: string;
  selectedDistrictName: string;
}

export function CapitalMixOptimizer({ regionTab, selectedMetroName, selectedDistrictName }: RegionProps) {
  // === Data ===
  const allMetros = useMemo(() => getMetroFiscalData(), []);

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
    if (regionTab !== 'district' || districts.length === 0) return null;
    const found = districts.find((d) => d.name === selectedDistrictName);
    return found ?? districts[0];
  }, [regionTab, districts, selectedDistrictName]);

  // === Computed region data ===
  const regionData = useMemo(() => {
    if (regionTab === 'metro') {
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
  }, [regionTab, selectedMetro, selectedDistrict]);

  const regionBudget = regionData.budget;
  const regionPopulation = regionData.population;
  const regionIndependence = regionData.independence;

  // === Slider states ===
  const [budgetAlloc, setBudgetAlloc] = useState(15);
  const [bondAlloc, setBondAlloc] = useState(20);
  const [mandatoryDeposit, setMandatoryDeposit] = useState(25);
  const [citizenContrib, setCitizenContrib] = useState(10);
  const [localResource, setLocalResource] = useState(10);
  const [retainedEarnings, setRetainedEarnings] = useState(20);
  const [targetCapital, setTargetCapital] = useState(5000);

  // === Simulation ===
  const result = useMemo(() => {
    const localTaxRevenue = regionBudget * (regionIndependence / 100);
    const avgIncome = 3500; // 평균 연소득 3,500만원
    const totalSliderSum = budgetAlloc + bondAlloc + mandatoryDeposit + citizenContrib + localResource + retainedEarnings;

    // Source definitions - each calculates annual contribution in 억원
    const sources = [
      {
        key: 'budget', label: '예산 출연', color: 'bg-cyan-500', textColor: 'text-cyan-400',
        model: 'BND',
        annual: regionBudget * (budgetAlloc / 1000),
      },
      {
        key: 'bond', label: '지방채 발행', color: 'bg-purple-500', textColor: 'text-purple-400',
        model: '캘리포니아',
        annual: regionBudget * (bondAlloc / 2000),
      },
      {
        key: 'deposit', label: '의무예치', color: 'bg-emerald-500', textColor: 'text-emerald-400',
        model: 'BND',
        annual: localTaxRevenue * (mandatoryDeposit / 100) * 0.05,
      },
      {
        key: 'citizen', label: '주민 기여', color: 'bg-amber-500', textColor: 'text-amber-400',
        model: 'BPDC',
        annual: (regionPopulation * avgIncome * (citizenContrib / 100)) / 10000,
      },
      {
        key: 'resource', label: '지역자원', color: 'bg-orange-500', textColor: 'text-orange-400',
        model: '독자',
        annual: regionBudget * (localResource / 5000),
      },
      {
        key: 'retained', label: '내부유보', color: 'bg-teal-500', textColor: 'text-teal-400',
        model: 'Sparkassen',
        annual: 0,
      },
    ];

    // 10-year simulation
    const yearlyData: Array<{
      year: number;
      totalCapital: number;
      composition: number[];
      bisRatio: number;
    }> = [];

    let totalCapital = 0;
    let bankRevenue = 0;
    let foundTarget = false;
    let targetYear: number | null = null;

    for (let y = 1; y <= 10; y++) {
      const yearContributions: number[] = [];

      for (let i = 0; i < sources.length; i++) {
        if (i === 5) {
          // retained earnings - bank starts earning after year 2
          if (y > 2) {
            const loanPortfolio = totalCapital * 8;
            bankRevenue = loanPortfolio * 0.02 * 0.8;
            yearContributions.push(bankRevenue * (retainedEarnings / 100));
          } else {
            yearContributions.push(0);
          }
        } else {
          yearContributions.push(sources[i].annual);
        }
      }

      const yearTotal = yearContributions.reduce((s, v) => s + v, 0);
      totalCapital += yearTotal;

      if (!foundTarget && totalCapital >= targetCapital) {
        targetYear = y;
        foundTarget = true;
      }

      yearlyData.push({
        year: 2026 + y,
        totalCapital,
        composition: [...yearContributions],
        bisRatio: 10,
      });
    }

    const annualTotal = sources.reduce((s, src) => s + src.annual, 0) + (bankRevenue > 0 ? bankRevenue * (retainedEarnings / 100) : 0);

    // Sensitivity: rank by annual contribution
    const sensitivity = sources.map((src, i) => ({
      label: src.label,
      impact: i === 5
        ? bankRevenue * 0.01
        : src.annual / (
          i === 0 ? budgetAlloc
          : i === 1 ? bondAlloc
          : i === 2 ? mandatoryDeposit
          : i === 3 ? citizenContrib
          : localResource || 1
        ),
      color: src.textColor,
    })).sort((a, b) => b.impact - a.impact);

    const verdict = (targetYear ?? 999) <= 5 ? 'fast' : (targetYear ?? 999) <= 10 ? 'achievable' : 'slow';

    return {
      sources, yearlyData, targetYear, annualTotal, totalSliderSum,
      sensitivity, verdict, finalCapital: totalCapital,
    };
  }, [budgetAlloc, bondAlloc, mandatoryDeposit, citizenContrib, localResource, retainedEarnings,
      targetCapital, regionBudget, regionIndependence, regionPopulation]);

  // === Verdict config ===
  const verdictConfig: Record<string, { label: string; emoji: string; bg: string; border: string; text: string; desc: string }> = {
    fast: { label: '빠른 달성', emoji: '\uD83D\uDE80', bg: 'bg-emerald-900/40', border: 'border-emerald-700', text: 'text-emerald-400', desc: '목표 자본금을 5년 이내에 달성할 수 있는 강력한 자본 조달 믹스입니다' },
    achievable: { label: '달성 가능', emoji: '\uD83D\uDCC8', bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-400', desc: '10년 이내 목표 달성이 가능합니다. 일부 비율을 높이면 더 빨라집니다' },
    slow: { label: '조달 부족', emoji: '\u26A0\uFE0F', bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', desc: '현재 믹스로는 10년 내 목표 달성이 어렵습니다. 비율을 높여보세요' },
  };

  const currentVerdict = verdictConfig[result.verdict];

  // === Chart scaling ===
  const maxCapital = Math.max(...result.yearlyData.map((d) => d.totalCapital), targetCapital, 1);

  // === 10-year total per source ===
  const sourceTotals = result.sources.map((src, i) => {
    let total = 0;
    for (const yd of result.yearlyData) {
      total += yd.composition[i];
    }
    return { ...src, total };
  });
  const maxSourceTotal = Math.max(...sourceTotals.map((s) => s.total), 1);

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            자본 조달 믹스 최적화
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="자본조달믹스" />
          <span className="text-sm md:text-base text-gray-600">
            공공은행 자본금 시뮬레이터
          </span>
        </div>
      </div>

      {/* ====== SECTION: 자본 조달 원천 설정 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <SectionHeader title="자본 조달 원천 설정 Capital Source Mix" color="text-blue-400" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-3">
          <Slider
            label="예산 출연 (BND모델)"
            value={budgetAlloc}
            min={0}
            max={50}
            step={1}
            unit="%"
            color="text-cyan-400"
            onChange={setBudgetAlloc}
          />
          <Slider
            label="지방채 발행"
            value={bondAlloc}
            min={0}
            max={50}
            step={1}
            unit="%"
            color="text-purple-400"
            onChange={setBondAlloc}
          />
          <Slider
            label="의무예치 (BND모델)"
            value={mandatoryDeposit}
            min={0}
            max={50}
            step={1}
            unit="%"
            color="text-emerald-400"
            onChange={setMandatoryDeposit}
          />
          <Slider
            label="주민 기여 (BPDC모델)"
            value={citizenContrib}
            min={0}
            max={30}
            step={1}
            unit="%"
            color="text-amber-400"
            onChange={setCitizenContrib}
          />
          <Slider
            label="지역자원 수익화"
            value={localResource}
            min={0}
            max={30}
            step={1}
            unit="%"
            color="text-orange-400"
            onChange={setLocalResource}
          />
          <Slider
            label="내부유보 (Sparkassen)"
            value={retainedEarnings}
            min={0}
            max={40}
            step={1}
            unit="%"
            color="text-teal-400"
            onChange={setRetainedEarnings}
          />
        </div>
        <div className="mt-2">
          <Slider
            label="목표 자본금"
            value={targetCapital}
            min={100}
            max={50000}
            step={100}
            unit="억원"
            color="text-rose-400"
            onChange={setTargetCapital}
          />
        </div>

        {/* Total allocation display */}
        <div className="mt-3 flex items-center gap-3 border-t border-gray-800 pt-3">
          <span className="text-sm text-gray-500">원천 합계:</span>
          <span className={`text-lg font-mono font-bold ${result.totalSliderSum > 150 ? 'text-red-400' : 'text-gray-300'}`}>
            {result.totalSliderSum}%
          </span>
          {result.totalSliderSum > 150 && (
            <span className="text-sm text-red-400">
              합계가 높습니다. 실현 가능성을 고려하세요.
            </span>
          )}
        </div>
      </div>

      {/* ====== VERDICT BANNER ====== */}
      <div className={`border ${currentVerdict.border} ${currentVerdict.bg} p-4 md:p-5 rounded`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{currentVerdict.emoji}</span>
          <span className={`text-lg md:text-xl font-bold ${currentVerdict.text}`}>
            {currentVerdict.label}
          </span>
          {result.targetYear && (
            <span className="text-sm text-gray-400">
              {result.targetYear}년차 달성
            </span>
          )}
        </div>
        <p className="text-base text-gray-400">{currentVerdict.desc}</p>
      </div>

      {/* ====== SECTION: 자본 조달 현황 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="자본 조달 현황 Capital Funding Status" color="text-cyan-400" />
        <Cell
          label="연간 총유입"
          value={formatEok(result.annualTotal)}
          color="text-emerald-400"
          sub="6개 원천 합산"
        />
        <Cell
          label="목표 자본금"
          value={formatEok(targetCapital)}
          color="text-rose-400"
          sub={`${regionData.name} 공공은행`}
        />
        <Cell
          label="도달 연도"
          value={result.targetYear ? `${result.targetYear}년차 (${2026 + result.targetYear}년)` : '10년 내 미달성'}
          color={result.targetYear ? 'text-emerald-400' : 'text-red-400'}
          sub={result.targetYear ? '목표 자본금 도달 시점' : '비율 조정 필요'}
        />
        <Cell
          label="10년차 자본"
          value={formatEok(result.finalCapital)}
          color="text-cyan-400"
          sub={`${2036}년 예상 자본금`}
        />
        <Cell
          label="목표 달성률"
          value={`${Math.min(100, Math.round(result.finalCapital / targetCapital * 100))}%`}
          color="text-amber-400"
          sub={result.finalCapital >= targetCapital ? '목표 초과 달성' : '목표 미달'}
        />
        <Cell
          label="BIS 자본비율"
          value="10.0%"
          color="text-purple-400"
          sub="레버리지 10배"
        />
      </div>

      {/* ====== SECTION: 연도별 자본 구성 (Stacked Bar Chart) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <SectionHeader title="연도별 자본 구성 Yearly Capital Composition" color="text-purple-400" />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 mb-4">
          {result.sources.map((src) => (
            <div key={src.key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${src.color}`} />
              <span className="text-xs text-gray-500">{src.label}</span>
            </div>
          ))}
        </div>

        {/* Stacked bar chart area */}
        <div className="relative">
          {/* Target line */}
          {targetCapital <= maxCapital && (
            <div
              className="absolute left-12 right-16 border-t-2 border-dashed border-rose-500/60 z-10 pointer-events-none"
              style={{ bottom: `${(targetCapital / maxCapital) * 280}px` }}
            >
              <span className="absolute -top-5 right-0 text-xs text-rose-400 font-mono">
                목표 {formatEok(targetCapital)}
              </span>
            </div>
          )}

          <div className="flex items-end gap-1 md:gap-2" style={{ height: 280 }}>
            {result.yearlyData.map((yd) => {
              const barHeight = maxCapital > 0 ? (yd.totalCapital / maxCapital) * 260 : 0;
              // Build stack segments
              const segments = yd.composition.map((val, i) => ({
                height: yd.totalCapital > 0 ? (val / yd.totalCapital) * barHeight : 0,
                color: result.sources[i].color,
                key: result.sources[i].key,
              }));

              return (
                <div key={yd.year} className="flex-1 flex flex-col items-center">
                  {/* Bar */}
                  <div className="w-full flex flex-col-reverse" style={{ height: barHeight > 0 ? barHeight : 2 }}>
                    {segments.map((seg) => (
                      <div
                        key={seg.key}
                        className={`w-full ${seg.color} first:rounded-b-sm last:rounded-t-sm`}
                        style={{ height: Math.max(seg.height, 0) }}
                        title={`${result.sources.find(s => s.key === seg.key)?.label}: ${formatEok(yd.composition[result.sources.findIndex(s => s.key === seg.key)])}`}
                      />
                    ))}
                  </div>
                  {/* Year label */}
                  <span className="text-xs text-gray-600 font-mono mt-1">{yd.year}</span>
                  {/* Total label */}
                  <span className="text-xs text-gray-500 font-mono leading-tight">
                    {yd.totalCapital >= 10000 ? `${(yd.totalCapital / 10000).toFixed(1)}조` : `${Math.round(yd.totalCapital)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====== SECTION: 원천별 기여도 ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <SectionHeader title="원천별 기여도 Source Contribution (10년 누적)" color="text-teal-400" />
        <div className="mt-3 space-y-2">
          {sourceTotals.map((src) => (
            <div key={src.key} className="flex items-center gap-3">
              <div className="w-20 md:w-28 flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-600 font-mono">[{src.model}]</span>
                <span className={`text-sm ${src.textColor} truncate`}>{src.label}</span>
              </div>
              <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${src.color}`}
                  style={{ width: `${(src.total / maxSourceTotal) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 font-mono w-20 text-right flex-shrink-0">
                {formatEok(src.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ====== INFO: 참조 모델 ====== */}
      <InfoSection title="참조 모델 Reference Models" color="text-cyan-400">
        <div className="space-y-3">
          <div>
            <h4 className="text-base font-bold text-cyan-400 mb-1">BND (노스다코타 은행)</h4>
            <p className="text-gray-500 text-base">
              주정부 세수 <span className="text-cyan-400 font-semibold">{BND_REFERENCE.mandatoryDepositRate}% 의무예치</span> &rarr;
              예금 기반 ${(BND_REFERENCE.currentAssetsUSD / 100).toFixed(0)}억 총자산.
              설립 이후 누적 ${(BND_REFERENCE.totalReturnedUSD / 100).toFixed(0)}억+ 주정부 환원.
              BIS 자본비율 {BND_REFERENCE.capitalRatio}%, ROE {BND_REFERENCE.roe}%.
            </p>
          </div>
          <div>
            <h4 className="text-base font-bold text-teal-400 mb-1">Sparkassen (독일 저축은행)</h4>
            <p className="text-gray-500 text-base">
              수익 전액 내부유보 &rarr; 자본 축적.
              총자산 약 {formatEok(SPARKASSEN_REFERENCE.totalAssetsEok)}, 독일 소매예금 점유율 {SPARKASSEN_REFERENCE.marketShareDeposits}%.
              예금의 {SPARKASSEN_REFERENCE.localRetention}%를 지역 내 재대출하여 지역경제 순환.
            </p>
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-400 mb-1">BPDC (코스타리카 국민은행)</h4>
            <p className="text-gray-500 text-base">
              근로자 {BPDC_REFERENCE.workerContribution}% + 고용주 {BPDC_REFERENCE.employerContribution}% 급여 기여 &rarr; 자동 자본화.
              {(BPDC_REFERENCE.workerOwners / 10000).toFixed(0)}만명 근로자-소유자, 총자산 {formatEok(BPDC_REFERENCE.totalAssetsEok)}.
            </p>
          </div>
          <div>
            <h4 className="text-base font-bold text-purple-400 mb-1">캘리포니아 AB 857</h4>
            <p className="text-gray-500 text-base">
              지방채 발행으로 공공은행 자본화. 지방정부가 채권을 발행하여 초기 자본금을 조달하는 모델.
              이자 비용은 은행 수익으로 상쇄 가능.
            </p>
          </div>
          <div>
            <h4 className="text-base font-bold text-orange-400 mb-1">독자 모델: 지역자원 수익화</h4>
            <p className="text-gray-500 text-base">
              공유재산, 공공데이터, 재생에너지, 주차수입 등 지역자원을 수익화하여 은행 자본금으로 전환.
              기존 세수에 의존하지 않는 창의적 자본 조달 방안.
            </p>
          </div>
        </div>
      </InfoSection>

      {/* ====== INFO: 분석 방법론 ====== */}
      <InfoSection title="분석 방법론 Methodology" color="text-blue-400">
        <div className="space-y-3">
          <div>
            <h4 className="text-base font-bold text-gray-300 mb-1.5">각 원천의 연간 기여액 산출</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
                <div>
                  <span className="text-gray-300 font-semibold">예산 출연</span>
                  <p className="text-gray-500 text-base">지역 예산 x (예산출연%/1000). 예산의 0.1% 수준에서 비율 조정.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
                <div>
                  <span className="text-gray-300 font-semibold">지방채 발행</span>
                  <p className="text-gray-500 text-base">지역 예산 x (지방채%/2000). 채권 발행 역량 기반.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
                <div>
                  <span className="text-gray-300 font-semibold">의무예치</span>
                  <p className="text-gray-500 text-base">자체세입 x 의무예치% x 5%. 의무예치금의 5%가 Tier 2 자본으로 기여.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-amber-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
                <div>
                  <span className="text-gray-300 font-semibold">주민 기여</span>
                  <p className="text-gray-500 text-base">인구 x 평균연소득(3,500만원) x 기여율% / 10,000. BPDC 급여기여 모델.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-400 font-mono text-base mt-0.5 flex-shrink-0">05</span>
                <div>
                  <span className="text-gray-300 font-semibold">지역자원</span>
                  <p className="text-gray-500 text-base">지역 예산 x (지역자원%/5000). 공유재산, 데이터, 에너지 등.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-teal-400 font-mono text-base mt-0.5 flex-shrink-0">06</span>
                <div>
                  <span className="text-gray-300 font-semibold">내부유보</span>
                  <p className="text-gray-500 text-base">3년차부터 발생. 자본금 x 8배 대출 x 2% 이자수익 x 80% 비용후 x 유보율%.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-base font-bold text-gray-300 mb-1.5">BIS 자본비율과 레버리지</h4>
            <p className="text-gray-500 text-base">
              BIS 자본비율 10% = 자본금 대비 <span className="text-purple-400 font-semibold">10배 대출</span> 가능.
              예: 자본금 5,000억원 &rarr; 대출 포트폴리오 5조원 운용 가능.
              BND의 실제 BIS비율은 {BND_REFERENCE.capitalRatio}%로 본 시뮬레이션의 10%보다 높은 안전마진을 유지합니다.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-base font-bold text-gray-300 mb-1.5">내부유보 발생 시점</h4>
            <p className="text-gray-500 text-base">
              은행 설립 후 <span className="text-teal-400 font-semibold">2년간 세팅 기간</span>을 가정합니다.
              3년차부터 대출 영업을 본격화하여 이자수익이 발생하고, Sparkassen 모델처럼 수익을 내부유보하여 자본을 축적합니다.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-base font-bold text-gray-300 mb-1.5">한계 및 유의사항</h4>
            <ul className="list-disc list-inside space-y-1.5 text-gray-500 text-base">
              <li>실제 자본 조달은 법적·제도적 여건에 따라 크게 달라질 수 있습니다</li>
              <li>대출 부실률, 운영비용 등 은행 경영 리스크는 단순화되어 있습니다</li>
              <li>인플레이션 미반영 명목 수치이며, 금리 환경 변화를 고려하지 않습니다</li>
              <li>각 원천의 비율은 독립적으로 설정되며, 상호작용 효과는 미반영합니다</li>
            </ul>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER: 데이터 출처 ====== */}
      <DataSources />
    </div>
  );
}
