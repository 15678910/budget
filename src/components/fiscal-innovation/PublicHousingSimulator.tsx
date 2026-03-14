'use client';

import React, { useState, useMemo, useRef } from 'react';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';

// ============================================================
// Constants
// ============================================================

const CURRENT_PUBLIC_HOUSING = 1_740_000; // 174만호
const TOTAL_HOUSING_STOCK = 21_750_000; // 약 2,175만호 (2025)
const HOUSING_GROWTH_RATE = 0.005; // 연간 주택 재고 증가율 0.5%
const SEOUL_BASE_PIR = 13.9; // 서울 PIR (2024)
const NATIONAL_BASE_PIR = 5.8; // 전국 평균 PIR
const BASE_TFR = 0.72; // 합계출산율 (2023)
const CURRENT_PUBLIC_RATIO = 8.0; // 현재 공공주택 비율 %

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
  return `${Math.round(v).toLocaleString()}억원`;
}

function formatMan(v: number): string {
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}만호`;
  return `${Math.round(v).toLocaleString()}호`;
}

// ============================================================
// YearData Interface
// ============================================================

interface YearData {
  year: number;
  annualInvestment: number; // 연간 투자액 (억원)
  unitsBuilt: number; // 연간 건설 호수
  cumulativeUnits: number; // 누적 건설 호수
  totalHousingStock: number; // 전체 주택 재고
  publicRatio: number; // 공공주택 비율 (%)
  seoulPIR: number; // 서울 PIR
  nationalPIR: number; // 전국 PIR
  estimatedTFR: number; // 추정 출산율
  metroUnits: number; // 수도권 건설 (누적)
  nonMetroUnits: number; // 비수도권 건설 (누적)
}

// ============================================================
// Main Component
// ============================================================

export function PublicHousingSimulator() {
  // === Slider states ===
  const [annualBudget, setAnnualBudget] = useState(50);
  const [conversionRate, setConversionRate] = useState(50);
  const [costPerUnit, setCostPerUnit] = useState(3.0);
  const [bankDiscount, setBankDiscount] = useState(15);
  const [metroAllocation, setMetroAllocation] = useState(40);

  // === 30-Year Simulation ===
  const data = useMemo(() => {
    const yearlyData: YearData[] = [];
    let cumulativeUnits = 0;

    for (let y = 1; y <= 30; y++) {
      // Budget calculation
      const housingBudget = annualBudget * (conversionRate / 100) * 10000; // 조원 -> 억원
      const effectiveCost = costPerUnit * (1 - bankDiscount / 100); // 억원

      // Ramp-up: 3-year gradual implementation
      const rampFactor = Math.min(y / 3, 1.0);
      const annualInvestment = housingBudget * rampFactor;
      const unitsBuilt = effectiveCost > 0 ? Math.round(annualInvestment / effectiveCost) : 0;

      cumulativeUnits += unitsBuilt;

      // Housing stock grows naturally
      const totalHousingStock = TOTAL_HOUSING_STOCK * Math.pow(1 + HOUSING_GROWTH_RATE, y);

      // Public housing ratio
      const publicRatio = ((CURRENT_PUBLIC_HOUSING + cumulativeUnits) / totalHousingStock) * 100;

      // PIR dampening: each 1% increase in public ratio -> PIR decreases by ~0.3 for Seoul
      const ratioIncrease = publicRatio - CURRENT_PUBLIC_RATIO;
      const pirReduction = ratioIncrease * 0.3;
      const seoulPIR = Math.max(SEOUL_BASE_PIR - pirReduction, 3.5); // floor at 3.5 (Singapore level)
      const nationalPIR = Math.max(NATIONAL_BASE_PIR - ratioIncrease * 0.15, 2.5);

      // TFR estimation: PIR decrease of 1 -> TFR increase by 0.015
      const pirDecrease = SEOUL_BASE_PIR - seoulPIR;
      const tfrIncrease = pirDecrease * 0.015;
      const estimatedTFR = Math.min(BASE_TFR + tfrIncrease, 1.8); // cap at 1.8

      const metroUnits = Math.round(cumulativeUnits * (metroAllocation / 100));
      const nonMetroUnits = cumulativeUnits - metroUnits;

      yearlyData.push({
        year: 2026 + y - 1, // year 1 = 2026
        annualInvestment,
        unitsBuilt,
        cumulativeUnits,
        totalHousingStock,
        publicRatio,
        seoulPIR,
        nationalPIR,
        estimatedTFR,
        metroUnits,
        nonMetroUnits,
      });
    }

    return yearlyData;
  }, [annualBudget, conversionRate, costPerUnit, bankDiscount, metroAllocation]);

  // === Derived metrics ===
  const finalData = data[29];
  const pirStableYear = data.findIndex(d => d.seoulPIR <= 7.0);
  const ratioThreshold = data.findIndex(d => d.publicRatio >= 20);
  const tfrRecoveryYear = data.findIndex(d => d.estimatedTFR >= 1.0);

  // Total investment over 30 years
  const totalInvestment = data.reduce((sum, d) => sum + d.annualInvestment, 0);
  const avgAnnualUnits = Math.round(finalData.cumulativeUnits / 30);

  // === Verdict ===
  const verdict: 'stable' | 'partial' | 'insufficient' =
    finalData.publicRatio >= 25 ? 'stable'
    : finalData.publicRatio >= 15 ? 'partial'
    : 'insufficient';

  const verdictConfig = {
    stable: {
      label: '구조적 안정',
      bg: 'bg-emerald-900/40',
      border: 'border-emerald-700',
      text: 'text-emerald-400',
      desc: `30년차 공공주택 비율 ${finalData.publicRatio.toFixed(1)}%로 구조적 부동산 안정 달성. 서울 PIR ${finalData.seoulPIR.toFixed(1)}배, 추정 출산율 ${finalData.estimatedTFR.toFixed(2)}명.`,
    },
    partial: {
      label: '부분 안정',
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-400',
      desc: `공공주택 비율 ${finalData.publicRatio.toFixed(1)}%로 시장 안정 효과 발생하나 구조적 전환에는 미흡. 예산 확대 또는 전환율 상향 필요.`,
    },
    insufficient: {
      label: '효과 미흡',
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-400',
      desc: `공공주택 비율 ${finalData.publicRatio.toFixed(1)}%로 시장 구조 변화에 불충분. 예산·전환율·건설비 절감 등 복합 정책 필요.`,
    },
  };

  const v = verdictConfig[verdict];

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            공공주택 확대 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="공공주택시뮬레이터" />
          <span className="text-sm md:text-base text-gray-600">
            저출산 예산 &rarr; 공공주택 &rarr; 부동산 안정
          </span>
        </div>
      </div>

      {/* ====== SLIDERS ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="연간 저출산 예산"
            value={annualBudget}
            min={20}
            max={100}
            step={5}
            unit="조원"
            color="text-cyan-400"
            onChange={setAnnualBudget}
          />
          <Slider
            label="공공주택 전환율"
            value={conversionRate}
            min={10}
            max={80}
            step={5}
            unit="%"
            color="text-emerald-400"
            onChange={setConversionRate}
          />
          <Slider
            label="호당 건설비용"
            value={costPerUnit}
            min={2.0}
            max={5.0}
            step={0.1}
            unit="억원"
            color="text-amber-400"
            onChange={setCostPerUnit}
          />
          <Slider
            label="공공은행 금리할인 효과"
            value={bankDiscount}
            min={0}
            max={30}
            step={1}
            unit="%"
            color="text-blue-400"
            onChange={setBankDiscount}
          />
          <Slider
            label="수도권 배정 비율"
            value={metroAllocation}
            min={20}
            max={80}
            step={5}
            unit="%"
            color="text-purple-400"
            onChange={setMetroAllocation}
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
        <SectionHeader title="주요 성과" color="text-emerald-400" />

        {/* Row 1 */}
        <Cell
          label="30년차 공공주택 비율"
          value={`${finalData.publicRatio.toFixed(1)}%`}
          color="text-emerald-400"
          sub={`현재 ${CURRENT_PUBLIC_RATIO}%`}
        />
        <Cell
          label="30년차 서울 PIR"
          value={`${finalData.seoulPIR.toFixed(1)}배`}
          color="text-cyan-400"
          sub={`현재 ${SEOUL_BASE_PIR}배`}
        />

        {/* Row 2 */}
        <Cell
          label="추정 출산율"
          value={`${finalData.estimatedTFR.toFixed(2)}명`}
          color="text-rose-400"
          sub={`현재 ${BASE_TFR}명`}
        />
        <Cell
          label="부동산 안정 판정"
          value={v.label}
          color={v.text}
          sub={finalData.publicRatio >= 25 ? '공공비율 25%+ 구조적 안정' : finalData.publicRatio >= 15 ? '공공비율 15%+ 부분 안정' : '공공비율 15% 미만'}
        />

        {/* Row 3 */}
        <Cell
          label="총 건설 호수"
          value={formatMan(finalData.cumulativeUnits)}
          color="text-amber-400"
          sub={`연평균 ${formatMan(avgAnnualUnits)}`}
        />
        <Cell
          label="총 투자 금액"
          value={formatEok(totalInvestment)}
          color="text-cyan-400"
        />

        {/* Row 4 */}
        <Cell
          label="PIR 안정 도달 (<=7배)"
          value={pirStableYear >= 0 ? `${pirStableYear + 1}년차` : '미도달'}
          color={pirStableYear >= 0 ? 'text-blue-400' : 'text-red-400'}
          sub={pirStableYear >= 0 ? `${2026 + pirStableYear}년` : '30년 내 미도달'}
        />
        <Cell
          label="출산율 1.0 도달"
          value={tfrRecoveryYear >= 0 ? `${tfrRecoveryYear + 1}년차` : '미도달'}
          color={tfrRecoveryYear >= 0 ? 'text-purple-400' : 'text-red-400'}
          sub={tfrRecoveryYear >= 0 ? `${2026 + tfrRecoveryYear}년` : '30년 내 미도달'}
        />

        {/* Row 5 */}
        <Cell
          label="수도권 건설 호수"
          value={formatMan(finalData.metroUnits)}
          color="text-indigo-400"
          sub={`전체의 ${metroAllocation}%`}
        />
        <Cell
          label="비수도권 건설 호수"
          value={formatMan(finalData.nonMetroUnits)}
          color="text-teal-400"
          sub={`전체의 ${100 - metroAllocation}%`}
        />
      </div>

      {/* ====== CHART 1: 공공주택 비율 변화 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="공공주택 비율 변화 (%)" color="text-emerald-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="flex items-end gap-[2px] h-32">
          {data.map((d, i) => {
            const maxVal = Math.max(...data.map(x => x.publicRatio));
            const pct = maxVal > 0 ? (d.publicRatio / maxVal) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 bg-emerald-500 rounded-t-sm min-w-0"
                style={{ height: `${pct}%` }}
                title={`${2026 + i}년: ${d.publicRatio.toFixed(1)}%`}
              />
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-[2px]">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 5 === 0 ? `'${String(d.year).slice(-2)}` : ''}
            </div>
          ))}
        </div>
        {/* Reference thresholds */}
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>&apos;26</span>
          <span className="text-emerald-600">&larr; 20% 안정 시작점</span>
          <span className="text-emerald-400">&larr; 30% 구조적 안정</span>
          <span>&apos;56</span>
        </div>
      </div>

      {/* ====== CHART 2: 서울 PIR 변화 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="서울 PIR 변화 (연소득 대비 집값)" color="text-cyan-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="flex items-end gap-[2px] h-28">
          {data.map((d, i) => {
            const maxVal = Math.max(...data.map(x => x.seoulPIR));
            const pct = maxVal > 0 ? (d.seoulPIR / maxVal) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 bg-cyan-500 rounded-t-sm min-w-0"
                style={{ height: `${pct}%` }}
                title={`${2026 + i}년: PIR ${d.seoulPIR.toFixed(1)}배`}
              />
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-[2px]">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 5 === 0 ? `'${String(d.year).slice(-2)}` : ''}
            </div>
          ))}
        </div>
        {/* Reference threshold */}
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>&apos;26</span>
          <span className="text-cyan-600">&larr; PIR 7배 (안정 기준)</span>
          <span>&apos;56</span>
        </div>
      </div>

      {/* ====== INFO SECTIONS ====== */}
      <InfoSection title="공공주택과 부동산 안정" color="text-emerald-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">왜 공공주택인가?</span>
              <p className="text-gray-500 text-base">
                국토연구원 연구: 주택가격이 첫째 출산 결정의 30.4%를 좌우 (가장 큰 단일 요인).
                18년간 380조원 저출산 예산에도 출산율은 0.72명으로 하락.
                주거 안정 없이 출산율 반등은 불가능합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">임계점: 20~25%</span>
              <p className="text-gray-500 text-base">
                국제 비교 분석 결과, 공공주택 비율 20% 이상에서 시장 전체에 하방 압력이 발생합니다.
                30% 이상이면 사회임대가 시장 기준선 역할을 하여 구조적 안정이 가능합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">PIR과 출산율</span>
              <p className="text-gray-500 text-base">
                서울 PIR이 13.9배에서 7배 이하로 떨어지면 (14년&rarr;7년 저축으로 내집 마련),
                청년의 결혼&middot;출산 결정에 실질적 변화가 시작됩니다.
                PIR 1 감소당 출산율 약 0.015명 상승 효과.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="해외 공공주택 모델" color="text-blue-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">싱가포르 HDB (80%+)</span>
              <p className="text-gray-500 text-base">
                전 국민의 81%가 공공주택 거주. PIR 3.8배, 소득의 25% 미만으로 주거비 해결.
                다만 2024년 출산율 0.97명으로, 공급만으로는 한계가 있으며 가격 접근성이 핵심.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">비엔나 사회주택 (60%)</span>
              <p className="text-gray-500 text-base">
                평균 임대료 &euro;10.3/m&sup2; (런던의 1/3). 주민 75~80%가 입주 자격.
                민간 임대료도 사회주택 기준선에 억제됨.
                2008~2016년 사회주택 임대료 20% 상승 vs 민간 60% 상승.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">네덜란드 (30%)</span>
              <p className="text-gray-500 text-base">
                사회임대 임대료가 민간의 52% 수준. 시장 안정 효과 있으나 신규 공급 부족 시 효과 약화.
                2024년 저렴주거법으로 30만호 월 &euro;190 인하.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">프랑스 HLM (17%)</span>
              <p className="text-gray-500 text-base">
                GDP 4% 가족지원 + 17% 사회주택 조합. 출산율 1.59명으로 EU 상위.
                현금 이전과 주거 지원의 결합이 핵심.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="공공은행 시너지" color="text-indigo-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">건설금융 저리 대출</span>
              <p className="text-gray-500 text-base">
                공공은행이 공공주택 건설에 시중 금리 대비 2~3%p 낮은 저리 대출을 제공하면,
                호당 건설비를 15~30% 절감 가능. 같은 예산으로 더 많은 주택 건설.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">선순환 구조</span>
              <p className="text-gray-500 text-base">
                공공주택 &rarr; 주거 안정 &rarr; 소비 여력 증가 &rarr; 지역경제 활성화 &rarr;
                공공은행 수익 증가 &rarr; 추가 건설금융 &rarr; 더 많은 공공주택.
                AI 기본소득과 결합하면 3중 안전망 완성.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">6년차 적자 해소</span>
              <p className="text-gray-500 text-base">
                민간 금융 의존 시 공공주택 사업은 높은 이자비용으로 장기 적자 위험.
                공공은행의 저리 장기대출(20~30년)로 사업 안정성 확보.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="분석 가정" color="text-gray-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">PIR 탄성치</span>
              <p className="text-gray-500 text-base">
                공공주택 비율 1%p 증가 시 서울 PIR 0.3 감소 가정.
                비엔나 모델(60% &rarr; PIR 5 이하)과 네덜란드(30% &rarr; 시장 안정)의 중간값 기반.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">출산율 반응</span>
              <p className="text-gray-500 text-base">
                PIR 1 감소당 합계출산율 0.015명 상승 가정.
                국토연구원 &lsquo;매매가 1% 상승 &rarr; 출산율 0.00203 감소&rsquo; 연구를 PIR 스케일로 변환.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">건설 비용</span>
              <p className="text-gray-500 text-base">
                2024년 국토부 고시 표준건축비 2,319,000원/m&sup2; 기준.
                60m&sup2; 순건축비 1.4억원에 토지&middot;부대비용 포함 시 호당 2~5억원 범위.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">주택 재고 성장</span>
              <p className="text-gray-500 text-base">
                연간 0.5% 주택 재고 자연 증가 가정. 신규 분양 + 멸실 고려한 순증가율.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">05</span>
            <div>
              <span className="text-gray-300 font-semibold">저출산 예산 범위</span>
              <p className="text-gray-500 text-base">
                2025년 저출산&middot;고령 대응 88.5조원 중 직접 저출산 대응 28.6조원 기준.
                광의 예산의 38%만 실제 출산&middot;양육 관련.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== FOOTER ====== */}
      <DataSources />
    </div>
  );
}
