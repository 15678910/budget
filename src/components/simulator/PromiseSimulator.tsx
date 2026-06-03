'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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

type ElectionScope = 'national' | 'metro' | 'district' | 'education';

// ============================================================
// 시·도 교육청 재정 지표
//
// budget (2026 예산 세입총계, 조원):
//   - 출처: 지방교육재정알리미(eduinfo.go.kr) OpenAPI `opbdIntFiSta` (통합재정통계 — 예산공시)
//   - 수집: scripts/fetch-eduinfo-2026.mjs, YMQ=2026 세입총계(A=B+C) 기준
//   - 17개 시도교육청 합계 = 100.98조원. 교육부 발표 총재정규모 106.3조원과 약 5조 차이는
//     국고 직접집행·교육세 편입분이 교육청 세입으로 표시되지 않는 구조 차이 때문.
//
// debt (2024 실질 채무, 조원 = BTL 잔액 기준):
//   - 출처: eduinfo.go.kr OpenAPI `opclPriInvstBizBTL` (민간투자사업), FSCL_Y=2024, FNOW_REMDR
//   - 수집: scripts/fetch-eduinfo-debt-2024.mjs
//   - 공식 지방교육채 잔액은 2022년부터 전 교육청 0원 (교부금 급증으로 조기상환 완료).
//     BTL 원리금 상환이 교육청의 실질 장기 채무 부담.
//   - 2026 데이터가 없어 2024 값 사용 (BTL은 장기계약이라 연간 변동 미미).
//
// students (학생 수):
//   - 출처: 교육통계연보 2024년 추정치 (KESS/학교알리미 API로 갱신 예정)
// ============================================================

interface EducationOfficeData {
  name: string;       // 교육청명
  metro: string;      // 관할 광역시도
  budget: number;     // 2026 세입총계 예산 (조원)
  students: number;   // 학생 수 (명)
  debt: number;       // 2024 BTL 잔액 (조원) — 실질 장기 채무
}

const EDUCATION_OFFICES: EducationOfficeData[] = [
  { name: '서울특별시교육청', metro: '서울특별시', budget: 12.2, students: 839000, debt: 0.35 },
  { name: '부산광역시교육청', metro: '부산광역시', budget: 6.6, students: 313000, debt: 0.10 },
  { name: '대구광역시교육청', metro: '대구광역시', budget: 4.7, students: 243000, debt: 0.16 },
  { name: '인천광역시교육청', metro: '인천광역시', budget: 5.3, students: 316000, debt: 0.18 },
  { name: '대전광역시교육청', metro: '대전광역시', budget: 3.1, students: 169000, debt: 0.10 },
  { name: '울산광역시교육청', metro: '울산광역시', budget: 2.4, students: 135000, debt: 0.06 },
  { name: '세종특별자치시교육청', metro: '세종특별자치시', budget: 1.4, students: 75000, debt: 0.06 },
  { name: '경기도교육청', metro: '경기도', budget: 23.4, students: 1594000, debt: 1.28 },
  { name: '강원특별자치도교육청', metro: '강원특별자치도', budget: 5.4, students: 160000, debt: 0.03 },
  { name: '충청북도교육청', metro: '충청북도', budget: 4.1, students: 171000, debt: 0.05 },
  { name: '충청남도교육청', metro: '충청남도', budget: 4.9, students: 237000, debt: 0.06 },
  { name: '전북특별자치도교육청', metro: '전북특별자치도', budget: 4.8, students: 189000, debt: 0.07 },
  { name: '전남광주통합특별시교육청', metro: '전남광주통합특별시', budget: 7.5, students: 397000, debt: 0.08 },
  { name: '경상북도교육청', metro: '경상북도', budget: 6.4, students: 258000, debt: 0.17 },
  { name: '경상남도교육청', metro: '경상남도', budget: 7.0, students: 358000, debt: 0.22 },
  { name: '제주특별자치도교육청', metro: '제주특별자치도', budget: 1.7, students: 84000, debt: 0.00 },
];

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
        <span className="text-base md:text-base text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
            {value}{unit}
          </span>
          {subLabel && <span className="text-sm md:text-base text-gray-400">({subLabel})</span>}
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

function Cell({ label, value, color, sub, tooltip }: { label: string; value: string; color: string; sub?: string; tooltip?: string }) {
  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0">
      <div className="flex items-center gap-1">
        <div className="text-sm md:text-base text-gray-400 leading-tight truncate">{label}</div>
        {tooltip && (
          <span className="relative inline-flex group/tip">
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 text-gray-400 text-[10px] font-bold cursor-help flex-shrink-0 hover:bg-gray-600 hover:text-gray-200"
              aria-label={tooltip}
            >
              ?
            </span>
            {/* 말풍선 */}
            <span
              className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 z-30 hidden group-hover/tip:block w-72 p-3.5 rounded-lg bg-gray-900 border border-gray-600 shadow-2xl text-gray-100 leading-relaxed whitespace-normal"
              style={{ fontSize: '15px' }}
            >
              {/* 꼬리 (왼쪽 방향) - border 겹치기로 삼각형 말풍선 생성 */}
              <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-gray-600" />
              <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-gray-900 ml-[1px]" style={{ marginRight: '-1px' }} />
              {tooltip}
            </span>
          </span>
        )}
      </div>
      <div className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-xs md:text-sm text-gray-500 leading-tight truncate">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-gray-800 bg-gray-900/30 px-4 py-2 ${color}`}>
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
  const [selectedEducation, setSelectedEducation] = useState<string>('');

  const educationData = useMemo(
    () => EDUCATION_OFFICES.find((e) => e.name === selectedEducation),
    [selectedEducation],
  );

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

  // Active fiscal context (national, metro, district, or education)
  const activeBudget =
    scope === 'education' && educationData
      ? educationData.budget
      : scope === 'district' && districtData
      ? districtData.budget / 10000
      : scope === 'metro' && metroData
      ? metroData.budget / 10000
      : NATIONAL_BUDGET;
  const activeDebt =
    scope === 'education' && educationData
      ? educationData.debt
      : scope === 'district' && districtData
      ? districtData.debt / 10000
      : scope === 'metro' && metroData
      ? metroData.debt / 10000
      : NATIONAL_DEBT;
  const activeGdp =
    scope === 'education' && educationData
      ? educationData.budget * 8
      : scope === 'district' && districtData
      ? (districtData.budget / 10000) * 8
      : scope === 'metro' && metroData
      ? (metroData.budget / 10000) * 8
      : GDP;
  const activePop =
    scope === 'education' && educationData
      ? educationData.students
      : scope === 'district' && districtData
      ? districtData.population
      : scope === 'metro' && metroData
      ? metroData.population
      : NATIONAL_POP;
  const activeDebtRatio = (activeDebt / activeGdp) * 100;

  // === Slider states ===
  const [promiseCost, setPromiseCost] = useState(20);    // 공약 비용 (조원 for national, 1000억원 for metro)
  const [years, setYears] = useState(5);                  // 이행 기간 1~10년
  const [taxRatio, setTaxRatio] = useState(30);           // 증세 비중 0~100%

  // === AI 공약 분석 state ===
  const [promiseText, setPromiseText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    estimatedCost: number;
    rationale: string;
    source: 'ai' | 'local';
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Cost max by scope (declared early for handleAiAnalyze)
  const costMax =
    scope === 'district' ? 5
    : scope === 'education' ? 15
    : scope === 'metro' ? 50
    : 100;

  const handleAiAnalyze = async () => {
    if (!promiseText.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch('/api/chat/diagnosis/promise-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promiseText: promiseText.trim(),
          scope,
          regionName:
            scope === 'education' ? selectedEducation
            : scope === 'district' ? `${selectedMetro} ${selectedDistrict}`
            : scope === 'metro' ? selectedMetro
            : '대한민국',
          budget: activeBudget,
          population: activePop,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'AI 분석 실패');
        return;
      }
      setAiResult(data);
      // Auto-fill sliders
      if (data.estimatedCost) {
        const cost = Math.min(Math.max(data.estimatedCost, 0.1), costMax);
        setPromiseCost(cost);
      }
      if (data.years) setYears(data.years);
      if (data.taxRatio !== undefined) setTaxRatio(data.taxRatio);
    } catch {
      setAiError('네트워크 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };
  const [gdpGrowth, setGdpGrowth] = useState(2.0);       // GDP 성장률 0~5%

  // 공약분석 → 시뮬레이션 연결: URL 파라미터로 공약 사전 입력 + 자동 추정
  const [autoRan, setAutoRan] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const pledge = sp.get('pledge');
    const sc = sp.get('scope') as ElectionScope | null;
    const sido = sp.get('sido');
    const sgg = sp.get('sgg');
    if (sc) setScope(sc);
    if (sc === 'education' && sido) {
      const off = EDUCATION_OFFICES.find((e) => e.metro === sido);
      if (off) setSelectedEducation(off.name);
    } else if (sc === 'metro' && sido) {
      setSelectedMetro(sido);
    } else if (sc === 'district' && sido) {
      setSelectedMetro(sido);
      if (sgg) setSelectedDistrict(sgg);
    }
    if (pledge) { setPromiseText(pledge); setAutoRan(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 사전 입력 후 자동 AI 추정 1회
  useEffect(() => {
    if (autoRan && promiseText && !aiLoading) { handleAiAnalyze(); setAutoRan(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRan, promiseText]);

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
            <button
              onClick={() => { setScope('education'); setSelectedDistrict(''); }}
              className={`px-3 py-1.5 ${scope === 'education' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
            >
              교육감
            </button>
          </div>
          <PDFExportButton
            targetRef={contentRef}
            filename={
              scope === 'education' && selectedEducation
                ? `공약검증_${selectedEducation}`
                : scope === 'district' && selectedDistrict
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
      {scope === 'education' && (
        <div className="border border-gray-800 px-4 py-3 flex items-center gap-3 flex-wrap bg-gray-950/30">
          <span className="text-sm text-gray-400 font-semibold">교육청 선택:</span>
          <select
            value={selectedEducation}
            onChange={(e) => setSelectedEducation(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded min-w-[200px]"
          >
            <option value="">시·도 교육청 선택</option>
            {[...EDUCATION_OFFICES].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((e) => (
              <option key={e.name} value={e.name}>
                {e.name}
              </option>
            ))}
          </select>
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
      {scope === 'education' && !selectedEducation && (
        <div className="border border-amber-900/50 bg-amber-950/30 p-4 rounded">
          <p className="text-amber-400 text-sm">시·도 교육청을 선택하면 해당 교육청 예산 데이터로 공약을 검증합니다.</p>
        </div>
      )}

      {/* ====== SECTION 1: 재정 현황 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader
          title={
            scope === 'education' && educationData
              ? `${educationData.name} 재정 현황`
              : scope === 'district' && districtData
              ? `${selectedMetro} ${districtData.name} 재정 현황`
              : scope === 'metro' && metroData
              ? `${metroData.name} 재정 현황`
              : '대한민국 재정 현황 Fiscal Overview'
          }
          color="text-gray-300"
        />
        <Cell
          label="예산규모"
          value={`${activeBudget.toFixed(activeBudget < 10 ? 1 : 0)}조원`}
          color="text-gray-100"
          sub={
            scope === 'national' ? '2026 세출예산'
            : scope === 'metro' ? '광역 예산'
            : scope === 'district' ? '기초 예산'
            : '교육청 예산'
          }
          tooltip="한 해 동안 해당 정부·지자체·교육청이 쓸 수 있는 전체 돈의 규모입니다. 공약 비용은 이 예산에서 조달하거나 추가 재원(세금·채무)으로 마련해야 합니다."
        />
        <Cell
          label={scope === 'national' ? '국가채무' : scope === 'education' ? '교육채무' : '지역채무'}
          value={`${activeDebt.toFixed(activeDebt < 10 ? 1 : 0)}조원`}
          color={activeDebtRatio > 60 ? 'text-red-400' : 'text-gray-100'}
          sub={`${scope === 'national' ? 'GDP' : 'GRDP'} 대비 ${activeDebtRatio.toFixed(1)}%`}
          tooltip={
            scope === 'national'
              ? '국가가 갚아야 할 빚의 총액입니다. GDP 대비 비율로 재정 건전성을 판단합니다.'
              : scope === 'education'
              ? '교육청이 발행한 교육채 잔액입니다. 주로 학교 신축·시설비에 사용되며, 국가 기준 차입이 아닌 시설 관련 채무입니다.'
              : '지자체가 발행한 지방채 잔액입니다. 도로·주택 등 대규모 사업에 사용되며, 발행 시 행정안전부 승인이 필요합니다.'
          }
        />
        <Cell
          label={scope === 'national' ? 'GDP' : 'GRDP 추정'}
          value={`${activeGdp.toFixed(activeGdp < 10 ? 1 : 0)}조원`}
          color="text-gray-100"
          sub={scope === 'national' ? '2026 명목 GDP' : '지역내총생산 추정'}
          tooltip={
            scope === 'national'
              ? '한 해 동안 대한민국에서 생산된 모든 재화와 서비스의 총액입니다. 경제 규모의 대표 지표.'
              : '해당 지역에서 1년간 생산된 부가가치의 합계(GRDP) 추정치입니다. 지역 경제 규모를 나타냅니다.'
          }
        />
        <Cell
          label="채무비율"
          value={`${activeDebtRatio.toFixed(1)}%`}
          color={activeDebtRatio < 55 ? 'text-emerald-400' : activeDebtRatio < 65 ? 'text-amber-400' : 'text-red-400'}
          sub={
            scope === 'national' ? '국가채무/GDP'
            : scope === 'education' ? '교육채무/GRDP'
            : '지역채무/GRDP'
          }
          tooltip="경제 규모(GDP/GRDP) 대비 빚이 얼마나 되는지 나타내는 비율입니다. IMF 권고 기준: 60% 미만 안전, 60% 이상 주의."
        />
        <Cell
          label={
            scope === 'national' ? '관리재정적자'
            : scope === 'education' ? '학생 수'
            : '인구'
          }
          value={
            scope === 'national' ? `${CURRENT_DEFICIT}조원`
            : scope === 'education' ? `${(activePop / 10000).toFixed(1)}만명`
            : `${(activePop / 10000).toFixed(0)}만명`
          }
          color="text-gray-100"
          sub={
            scope === 'national' ? `GDP 대비 -${((CURRENT_DEFICIT / GDP) * 100).toFixed(1)}%`
            : scope === 'education' ? '관할 학생'
            : '주민등록 기준'
          }
          tooltip={
            scope === 'national'
              ? '한 해 국가 수입보다 지출이 얼마나 많은지 나타냅니다. 적자가 클수록 국채 발행이 늘어납니다.'
              : scope === 'education'
              ? '해당 교육청이 관할하는 초·중·고등학교 재학생 수입니다. 예산 배분과 학생 1인당 부담 계산 기준.'
              : '해당 지역의 주민등록 기준 인구수입니다. 1인당 세금 부담 계산의 기준이 됩니다.'
          }
        />
      </div>

      {/* 기초단체 데이터 기준·한계 안내 */}
      {scope === 'district' && districtData && (
        <div className="border border-amber-900/40 bg-amber-950/20 p-3 md:p-4 text-xs md:text-sm text-amber-200/90 leading-relaxed">
          ℹ️ <strong className="text-amber-300">기초단체 예산 데이터 안내:</strong> 현재 표시 금액은{' '}
          <span className="font-semibold">2024년 본예산 기준 추정치</span>이며, 일부 구·시·군은 인구 유사 지역에서 추정한 값입니다.
          국내 공공데이터 API 한계로 전국 228개 기초단체 자동 수집이 불가한 상태입니다
          (행정안전부 지방재정365 API 군(群)은 LINK 타입).{' '}
          <span className="text-amber-300">최신 2026년 본예산 확정치는 해당 자치단체 홈페이지를 참고</span>해주시고,
          오류 발견 시 알려주시면 즉시 교정 반영하겠습니다.
        </div>
      )}

      {/* ====== SECTION 1.5: AI 공약 분석 ====== */}
      <div className="border border-purple-900/50 bg-purple-950/20 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-purple-400 mb-3">
          AI 공약 분석 Ai Promise Analysis
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={promiseText}
            onChange={(e) => setPromiseText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiAnalyze()}
            placeholder="공약을 입력하세요 (예: 무상교복 지원, 청년 1인당 100만원 지급, 공공병원 신설...)"
            maxLength={200}
            className="flex-1 min-w-[250px] bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-gray-600"
          />
          <button
            onClick={handleAiAnalyze}
            disabled={aiLoading || !promiseText.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded transition-colors whitespace-nowrap"
          >
            {aiLoading ? 'AI 분석 중...' : 'AI 비용 추정'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {scope === 'education'
            ? '공약 내용을 입력하면 AI가 예상 비용·이행기간·교부금/전입금 활용 비중을 자동 추정하여 슬라이더에 반영합니다. (교육채는 시설비에 한해 제한적으로 활용)'
            : scope === 'district' || scope === 'metro'
            ? '공약 내용을 입력하면 AI가 예상 비용·이행기간·지방세/교부금 비중을 자동 추정하여 슬라이더에 반영합니다. (지방채 발행은 행안부 승인 필요)'
            : '공약 내용을 입력하면 AI가 예상 비용·이행기간·증세 비중을 자동 추정하여 슬라이더에 반영합니다.'}
        </p>
        {aiError && (
          <div className="mt-3 border border-red-900/50 bg-red-950/30 p-3 rounded text-sm text-red-400">
            {aiError}
          </div>
        )}
        {aiResult && (
          <div
            className={`mt-3 border p-3 rounded space-y-2 ${
              aiResult.source === 'ai'
                ? 'border-emerald-700 bg-emerald-950/30'
                : 'border-gray-700 bg-gray-900/50'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold ${
                  aiResult.source === 'ai' ? 'text-emerald-400' : 'text-gray-300'
                }`}
              >
                {aiResult.source === 'ai' ? 'AI 분석 결과 (Gemini)' : '규칙 기반 추정'}
              </span>
              <span className="ml-auto text-sm font-mono text-blue-400 font-bold">
                {aiResult.estimatedCost.toFixed(1)}조원
              </span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{aiResult.rationale}</p>
            {aiResult.source === 'local' && (
              <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-amber-400">
                  ⚠️ AI 호출 실패 (무료 한도 초과 또는 일시적 오류). 규칙 기반 추정값 표시 중.
                </p>
                <button
                  onClick={handleAiAnalyze}
                  disabled={aiLoading}
                  className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white rounded"
                >
                  {aiLoading ? '재시도 중...' : 'AI 재시도'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== SECTION 2: 시뮬레이션 설정 (Sliders) ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-gray-300 mb-3">
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
            label={
              scope === 'education' ? '교부금·전입금 활용 비중'
              : scope === 'district' || scope === 'metro' ? '지방세·교부금 비중'
              : '증세 비중'
            }
            value={taxRatio}
            min={0}
            max={100}
            step={5}
            unit="%"
            subLabel={
              scope === 'education' ? `교육채 ${100 - taxRatio}%`
              : scope === 'district' || scope === 'metro' ? `지방채 ${100 - taxRatio}%`
              : `국채 ${100 - taxRatio}%`
            }
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
        {scope === 'education' && (
          <div className="mt-4 border border-cyan-900/50 bg-cyan-950/20 p-3 rounded text-xs text-cyan-300 leading-relaxed">
            ℹ️ <strong>교육감은 증세·국채 발행 권한이 없습니다.</strong> 교육청 예산은 주로
            ①지방교육재정교부금(내국세의 20.79%, 약 70%), ②시·도 전입금(약 15%), ③국고보조금·자체수입(약 15%)으로 구성됩니다.
            신규 공약은 <strong>기존 예산 재편성</strong> 또는 <strong>교육채 발행(시설비 충당)</strong>으로 조달해야 합니다.
          </div>
        )}
        {(scope === 'district' || scope === 'metro') && (
          <div className="mt-4 border border-cyan-900/50 bg-cyan-950/20 p-3 rounded text-xs text-cyan-300 leading-relaxed">
            ℹ️ <strong>지방자치단체는 국세 증세 권한이 없습니다.</strong> 지방세 인상(주민세, 재산세 등),
            지방교부세·국고보조금 확보, 지방채 발행으로 재원을 조달합니다. 지방채 발행은 행정안전부 승인이 필요합니다.
          </div>
        )}
      </div>

      {/* ====== SECTION 3: 검증 결과 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-3">
        <SectionHeader title="검증 결과 Verification Results" color="text-gray-300" />
        <Cell
          label="공약 총비용"
          value={formatJo(simulation.totalCost)}
          color="text-gray-100"
          sub={`${years}년간 총소요`}
          tooltip="공약을 이행 기간 동안 완료하는 데 필요한 총 예산입니다. (공약 비용 × 1)"
        />
        <Cell
          label="연간 소요"
          value={formatJo(simulation.annualCost)}
          color="text-gray-100"
          sub="연평균 소요액"
          tooltip="공약 총비용을 이행 기간으로 나눈 연평균 금액입니다. 매년 이 금액이 기존 예산에 추가로 필요합니다."
        />
        <Cell
          label="예산대비 비중"
          value={`${simulation.budgetImpact.toFixed(1)}%`}
          color={simulation.budgetImpact < 3 ? 'text-emerald-400' : simulation.budgetImpact < 5 ? 'text-amber-400' : 'text-red-400'}
          sub={`총예산 ${activeBudget.toFixed(activeBudget < 10 ? 1 : 0)}조 대비`}
          tooltip="연간 공약 비용이 해당 정부·지자체·교육청 총예산의 몇 %를 차지하는지 나타냅니다. 3% 미만: 여유, 5% 초과: 재정 압박."
        />
        <Cell
          label={
            scope === 'education' ? '교육채 발행분'
            : scope === 'district' || scope === 'metro' ? '지방채 발행분'
            : '국채 증가분'
          }
          value={formatJo(simulation.cumulativeDebt)}
          color={simulation.cumulativeDebt > activeBudget * 0.3 ? 'text-red-400' : 'text-gray-100'}
          sub={
            scope === 'education' ? `${years}년간 누적 교육채 (시설비 한정)`
            : scope === 'district' || scope === 'metro' ? `${years}년간 누적 지방채 (행안부 승인 필요)`
            : `${years}년간 누적 국채 발행`
          }
          tooltip={
            scope === 'education'
              ? '공약 중 세금(교부금·전입금)으로 조달하지 못한 금액을 교육채로 발행해 조달합니다. 교육채는 주로 학교 건물·시설 관련 대규모 투자에 한정됩니다.'
              : scope === 'district' || scope === 'metro'
              ? '공약 중 지방세·교부금으로 조달하지 못한 금액을 지방채로 조달합니다. 행정안전부 승인이 필요하며, 지자체 재정 건전성을 해칠 수 있습니다.'
              : '공약 중 세금으로 조달하지 못한 금액을 국채 발행으로 조달합니다. 미래 세대가 갚아야 할 빚이 됩니다.'
          }
        />
        <Cell
          label="최종 채무비율"
          value={`${simulation.finalDebtRatio.toFixed(1)}%`}
          color={simulation.finalDebtRatio < 55 ? 'text-emerald-400' : simulation.finalDebtRatio < 65 ? 'text-amber-400' : 'text-red-400'}
          sub={`현재 ${activeDebtRatio.toFixed(1)}% → ${simulation.finalDebtRatio.toFixed(1)}%`}
          tooltip="공약 이행 기간이 끝났을 때 예상되는 채무비율입니다. 현재값과 비교하여 증감폭이 크면 재정이 악화됩니다."
        />
        <Cell
          label={
            scope === 'education' ? '학생 1인당 재원'
            : scope === 'district' || scope === 'metro' ? '1인당 지방세 부담'
            : '1인당 증세부담'
          }
          value={`${simulation.taxBurdenPerCapita.toLocaleString('ko-KR')}원`}
          color={simulation.taxBurdenPerCapita > 300000 ? 'text-amber-400' : 'text-gray-100'}
          sub={
            scope === 'education' ? '학생 1인당 연간 배정액'
            : scope === 'district' || scope === 'metro' ? '연간 지방세 추가 필요액'
            : '연간 1인당 추가 세금'
          }
          tooltip={
            scope === 'education'
              ? '공약 중 국가 교부금·시도 전입금으로 조달되는 부분을 학생 수로 나눈 1인당 배정액입니다. 학생이 직접 내는 돈이 아니라, 학생 1명당 공약에 투입되는 재원 규모를 뜻합니다.'
              : scope === 'district' || scope === 'metro'
              ? '공약을 시행할 때 주민 1인당 매년 추가로 부담해야 할 지방세 금액입니다. (주민세·재산세 등 인상 가정)'
              : '공약 이행을 위해 국민 1인당 매년 추가로 부담해야 할 세금 금액입니다.'
          }
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
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-gray-300 mb-4">
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
      <InfoSection title="판정 기준 Verdict Criteria" color="text-gray-300">
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
      <InfoSection title="데이터 출처 Data Sources" color="text-gray-300">
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
