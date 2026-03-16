'use client';

import React, { useState, useMemo, useRef } from 'react';
import { DataSources } from '@/components/shared/DataSources';
import { PDFExportButton } from '@/components/shared/PDFExportButton';
import { getMetroFiscalData, getDistrictFiscalData } from '@/lib/data/fiscal-health-data';

// ============================================================
// Constants
// ============================================================

const SNU_STUDENTS = 30_323;
const SNU_FACULTY = 2_369;
const SNU_EMERITUS = 1_195;
const SNU_ANNUAL_BUDGET = 15_117; // 억원 (1조 5117억)
const SNU_GOV_GRANT = 4_450; // 억원 (국고출연금)
const SNU_RESEARCH_FUND = 5_506; // 억원 (정부 연구비)
const UNSOLD_TOTAL = 90_690; // 전국 미분양
const UNSOLD_NONMETRO = 23_733; // 비수도권 악성 미분양
const REGIONAL_EMPLOYMENT_RATE = 35.7; // 지방대 소재지 취업률 %
const METRO_POPULATION_RATIO = 50.4; // 수도권 인구 비중 %
const BASE_TFR = 0.72;
const GWANAK_AREA_HA = 411; // 관악캠퍼스 면적 ha

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
  tooltip,
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
  tooltip?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base text-gray-400 relative group/tip cursor-help">
          {label}
          {tooltip && (
            <span className="invisible group-hover/tip:visible absolute left-0 top-full mt-1 z-50 w-64 p-2 text-xs text-gray-300 bg-gray-800 border border-gray-700 rounded-lg shadow-lg leading-relaxed whitespace-normal">
              {tooltip}
            </span>
          )}
        </span>
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

// ============================================================
// YearData Interface
// ============================================================

interface YearData {
  year: number;
  studentsTransferred: number;
  facultyTransferred: number;
  relatedPopulation: number;
  unsoldAbsorbed: number;
  unsoldRemaining: number;
  regionalEmployRate: number;
  metroPopRatio: number;
  estimatedTFR: number;
  citizenUniStudents: number;
  regionalGDP_boost: number;
  industryJobs: number;
}

// ============================================================
// Main Component
// ============================================================

interface RegionProps {
  regionTab: 'metro' | 'district';
  selectedMetroName: string;
  selectedDistrictName: string;
}

export function RegionalRevitalizationSimulator({ regionTab, selectedMetroName, selectedDistrictName }: RegionProps) {
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

  // Dynamic population calculations (replacing hardcoded constants)
  const TOTAL_POPULATION = useMemo(
    () => allMetros.reduce((sum, m) => sum + m.population, 0),
    [allMetros],
  );
  const METRO_AREA_NAMES = ['서울특별시', '인천광역시', '경기도'];
  const metroAreaPopulation = useMemo(
    () => allMetros.filter(m => METRO_AREA_NAMES.includes(m.name)).reduce((sum, m) => sum + m.population, 0),
    [allMetros],
  );
  const nonMetroPopulation = TOTAL_POPULATION - metroAreaPopulation;
  const dynamicMetroPopRatio = TOTAL_POPULATION > 0 ? (metroAreaPopulation / TOTAL_POPULATION) * 100 : 50.4;

  // Scale unsold housing to selected region's share of non-metro population
  const regionalUnsoldScale = nonMetroPopulation > 0 ? regionPopulation / nonMetroPopulation : 0;
  const scaledUnsoldNonmetro = Math.round(UNSOLD_NONMETRO * regionalUnsoldScale);

  // === Slider states ===
  const [deptTransferRate, setDeptTransferRate] = useState(50);
  const [unsoldConversionRate, setUnsoldConversionRate] = useState(50);
  const [regionalInvestment, setRegionalInvestment] = useState(1.0);
  const [citizenUniBudget, setCitizenUniBudget] = useState(1500);
  const [industryRate, setIndustryRate] = useState(15);

  // === 15-Year Simulation ===
  const data = useMemo(() => {
    const yearlyData: YearData[] = [];
    let industryJobsCumulative = 0;

    for (let y = 1; y <= 15; y++) {
      const ramp = Math.min(y / 5, 1.0);

      // 학생/교수 이전 (누적, 5년 완료)
      const studentsTransferred = Math.round(SNU_STUDENTS * (deptTransferRate / 100) * ramp);
      const facultyTransferred = Math.round(SNU_FACULTY * (deptTransferRate / 100) * ramp);

      // 관련 인구 (학생 + 교수 + 가족 + 서비스업 종사자) = 약 2.5배
      const relatedPopulation = Math.round((studentsTransferred + facultyTransferred) * 2.5);

      // 미분양 흡수
      const directConversion = Math.round(UNSOLD_NONMETRO * (unsoldConversionRate / 100) * ramp);
      const populationAbsorption = Math.round(relatedPopulation / 2.5);
      const unsoldAbsorbed = Math.min(directConversion + populationAbsorption, scaledUnsoldNonmetro);
      const unsoldRemaining = Math.max(scaledUnsoldNonmetro - unsoldAbsorbed, 0);

      // 지역 취업률 개선
      const investmentEffect = (regionalInvestment * 10000 / SNU_GOV_GRANT) * 3.0 * ramp;
      const industryEffect = (industryRate / 100) * 15 * ramp;
      const regionalEmployRate = Math.min(REGIONAL_EMPLOYMENT_RATE + investmentEffect + industryEffect, 75);

      // 수도권 인구 비중 감소
      const popShift = (relatedPopulation / TOTAL_POPULATION) * 100;
      const indirectShift = investmentEffect * 0.1 * ramp;
      const metroPopRatio = Math.max(dynamicMetroPopRatio - popShift - indirectShift, 38);

      // 출산율
      const housingEffect = scaledUnsoldNonmetro > 0 ? (unsoldAbsorbed / scaledUnsoldNonmetro) * 0.08 : 0;
      const employEffect = ((regionalEmployRate - REGIONAL_EMPLOYMENT_RATE) / 100) * 0.5;
      const estimatedTFR = Math.min(BASE_TFR + housingEffect + employEffect, 1.5);

      // 시민대학 수강생
      const emeritusParticipation = Math.min(0.3 + y * 0.04, 0.8);
      const citizenUniStudents = Math.round(SNU_EMERITUS * emeritusParticipation * 200 * Math.min(y / 3, 1.0));

      // 산학협력 일자리 (누적)
      const annualJobs = Math.round(studentsTransferred * (industryRate / 100) * 0.3);
      industryJobsCumulative += annualJobs;

      // 지역 GDP 증가
      const regionalGDP_boost = Math.round(
        (studentsTransferred * 1200 / 10000) +
        (SNU_RESEARCH_FUND * (deptTransferRate / 100) * ramp) +
        (industryJobsCumulative * 0.5)
      );

      yearlyData.push({
        year: 2026 + y - 1,
        studentsTransferred,
        facultyTransferred,
        relatedPopulation,
        unsoldAbsorbed,
        unsoldRemaining,
        regionalEmployRate,
        metroPopRatio,
        estimatedTFR,
        citizenUniStudents,
        regionalGDP_boost,
        industryJobs: industryJobsCumulative,
      });
    }

    return yearlyData;
  }, [deptTransferRate, unsoldConversionRate, regionalInvestment, citizenUniBudget, industryRate, TOTAL_POPULATION, dynamicMetroPopRatio, scaledUnsoldNonmetro]);

  // === Derived metrics ===
  const finalData = data[14];
  const emeritusParticipationFinal = Math.min(0.3 + 15 * 0.04, 0.8);

  // === Verdict ===
  const verdict: 'success' | 'partial' | 'insufficient' =
    finalData.unsoldRemaining <= scaledUnsoldNonmetro * 0.3 && finalData.regionalEmployRate >= 55
      ? 'success'
      : finalData.unsoldRemaining <= scaledUnsoldNonmetro * 0.5
        ? 'partial'
        : 'insufficient';

  const verdictConfig = {
    success: {
      label: '지역 활성화 성공',
      bg: 'bg-emerald-900/40',
      border: 'border-emerald-700',
      text: 'text-emerald-400',
      desc: `15년차 비수도권 잔여 미분양 ${finalData.unsoldRemaining.toLocaleString()}호(${((finalData.unsoldRemaining / UNSOLD_NONMETRO) * 100).toFixed(0)}%), 지역 취업률 ${finalData.regionalEmployRate.toFixed(1)}%. 학과 이전과 산학협력이 지역 자립 경제를 구축했습니다.`,
    },
    partial: {
      label: '부분 활성화',
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-400',
      desc: `미분양 흡수가 진행 중이나(잔여 ${finalData.unsoldRemaining.toLocaleString()}호), 취업률 ${finalData.regionalEmployRate.toFixed(1)}%로 자립 구조에는 미흡. 추가 투자 또는 산학협력 확대 필요.`,
    },
    insufficient: {
      label: '효과 미흡',
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-400',
      desc: `미분양 잔여 ${finalData.unsoldRemaining.toLocaleString()}호(${((finalData.unsoldRemaining / UNSOLD_NONMETRO) * 100).toFixed(0)}%), 취업률 ${finalData.regionalEmployRate.toFixed(1)}%로 구조 전환에 불충분. 이전 비율, 투자, 기업유치 모두 확대 필요.`,
    },
  };

  const v = verdictConfig[verdict];

  // Unsold remaining color
  const unsoldRemainingColor =
    finalData.unsoldRemaining <= UNSOLD_NONMETRO * 0.3
      ? 'text-emerald-400'
      : finalData.unsoldRemaining <= UNSOLD_NONMETRO * 0.5
        ? 'text-amber-400'
        : 'text-red-400';

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-400">
            지역 활성화 시뮬레이터
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="지역활성화시뮬레이터" />
          <span className="text-sm md:text-base text-gray-600">
            학과 이전 &rarr; 미분양 해소 &rarr; 지역 자립
          </span>
        </div>
      </div>

      {/* Region Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px">
        <SectionHeader title={`선택 지역: ${regionName}`} color="text-teal-400" />
        <Cell label="지역 예산" value={`${(regionBudget / 10000).toFixed(1)}조원`} color="text-teal-300" />
        <Cell label="지역 인구" value={`${(regionPopulation / 10000).toFixed(0)}만명`} color="text-teal-300" />
        <Cell label="지역 미분양 추정" value={`${scaledUnsoldNonmetro.toLocaleString()}호`} color="text-orange-300" />
      </div>

      {/* ====== SLIDERS ====== */}
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Slider
            label="학과 이전 비율"
            value={deptTransferRate}
            min={10}
            max={80}
            step={5}
            unit="%"
            subLabel={`${Math.round(SNU_STUDENTS * deptTransferRate / 100).toLocaleString()}명`}
            color="text-cyan-400"
            tooltip="서울대 전체 학과 중 지역으로 이전하는 비율. 5년에 걸쳐 단계적 이전"
            onChange={setDeptTransferRate}
          />
          <Slider
            label="미분양 학생주택 전환율"
            value={unsoldConversionRate}
            min={10}
            max={80}
            step={5}
            unit="%"
            color="text-emerald-400"
            tooltip="비수도권 악성 미분양을 학생주택으로 전환하는 비율. 신축 대비 33% 저렴"
            onChange={setUnsoldConversionRate}
          />
          <Slider
            label="거점대 추가 투자"
            value={regionalInvestment}
            min={0.5}
            max={3.0}
            step={0.1}
            unit="조원"
            color="text-amber-400"
            tooltip="지역 거점 국립대에 추가 투자하는 금액. 1조원당 지역 취업률 약 3%p 상승 효과"
            onChange={setRegionalInvestment}
          />
          <Slider
            label="시민대학 운영예산"
            value={citizenUniBudget}
            min={500}
            max={3000}
            step={100}
            unit="억원"
            color="text-purple-400"
            tooltip="관악캠퍼스 자유시민대학 운영 예산. 명예교수 기반 평생학습 프로그램 운영"
            onChange={setCitizenUniBudget}
          />
          <Slider
            label="산학협력 기업유치율"
            value={industryRate}
            min={5}
            max={40}
            step={1}
            unit="%"
            color="text-rose-400"
            tooltip="이전 학과 학생 수 대비 산학협력으로 유치하는 기업 비율. 기업당 연 30명 고용"
            onChange={setIndustryRate}
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
      <div className="grid grid-cols-2">
        <SectionHeader title="학과 이전 성과" color="text-cyan-400" />
        <Cell
          label="이전 학생 수"
          value={`${finalData.studentsTransferred.toLocaleString()}명`}
          color="text-cyan-400"
          sub={`전체 ${SNU_STUDENTS.toLocaleString()}명 중`}
        />
        <Cell
          label="이전 교수 수"
          value={`${finalData.facultyTransferred.toLocaleString()}명`}
          color="text-cyan-400"
          sub={`전체 ${SNU_FACULTY}명 중`}
        />

        <SectionHeader title="미분양 해소" color="text-emerald-400" />
        <Cell
          label="미분양 흡수"
          value={`${finalData.unsoldAbsorbed.toLocaleString()}호`}
          color="text-emerald-400"
          sub={`전체 ${UNSOLD_NONMETRO.toLocaleString()}호 중`}
        />
        <Cell
          label="잔여 미분양"
          value={`${finalData.unsoldRemaining.toLocaleString()}호`}
          color={unsoldRemainingColor}
          sub={`${((finalData.unsoldRemaining / UNSOLD_NONMETRO) * 100).toFixed(0)}% 잔여`}
        />

        <SectionHeader title="지역 경제 효과" color="text-amber-400" />
        <Cell
          label="지역 취업률"
          value={`${finalData.regionalEmployRate.toFixed(1)}%`}
          color="text-amber-400"
          sub={`현재 ${REGIONAL_EMPLOYMENT_RATE}%`}
        />
        <Cell
          label="산학 일자리"
          value={`${finalData.industryJobs.toLocaleString()}개`}
          color="text-rose-400"
          sub="15년 누적"
        />

        <SectionHeader title="인구 효과" color="text-purple-400" />
        <Cell
          label="수도권 인구 비중"
          value={`${finalData.metroPopRatio.toFixed(1)}%`}
          color="text-purple-400"
          sub={`현재 ${METRO_POPULATION_RATIO}%`}
        />
        <Cell
          label="추정 출산율"
          value={`${finalData.estimatedTFR.toFixed(2)}명`}
          color="text-rose-400"
          sub={`현재 ${BASE_TFR}명`}
        />

        <SectionHeader title="시민대학" color="text-indigo-400" />
        <Cell
          label="시민대학 수강생"
          value={`${(finalData.citizenUniStudents / 10000).toFixed(1)}만명/년`}
          color="text-indigo-400"
        />
        <Cell
          label="참여 교수"
          value={`${Math.round(SNU_EMERITUS * emeritusParticipationFinal)}명`}
          color="text-indigo-400"
          sub={`명예교수 ${SNU_EMERITUS}명 중`}
        />

        <SectionHeader title="판정" color={v.text} />
        <Cell
          label="활성화 판정"
          value={v.label}
          color={v.text}
        />
        <Cell
          label="지역 GDP 증가"
          value={formatEok(finalData.regionalGDP_boost)}
          color="text-amber-400"
        />
      </div>

      {/* ====== CHART 1: 미분양 흡수 추이 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="미분양 흡수 추이 (호)" color="text-emerald-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="flex items-end gap-[2px] h-32">
          {data.map((d, i) => {
            const maxVal = Math.max(...data.map(x => x.unsoldAbsorbed));
            const pct = maxVal > 0 ? (d.unsoldAbsorbed / maxVal) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 bg-emerald-500 rounded-t-sm min-w-0"
                style={{ height: `${pct}%` }}
                title={`${2026 + i}년: ${d.unsoldAbsorbed.toLocaleString()}호`}
              />
            );
          })}
        </div>
        <div className="flex gap-[2px]">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 3 === 0 ? `'${String(d.year).slice(-2)}` : ''}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>&apos;26</span>
          <span className="text-emerald-600">&larr; 비수도권 악성 미분양 {UNSOLD_NONMETRO.toLocaleString()}호</span>
          <span>&apos;40</span>
        </div>
      </div>

      {/* ====== CHART 2: 지역 취업률 변화 ====== */}
      <div className="grid grid-cols-1">
        <SectionHeader title="지역 취업률 변화 (%)" color="text-amber-400" />
      </div>
      <div className="border border-gray-800 p-4 md:p-5">
        <div className="flex items-end gap-[2px] h-28">
          {data.map((d, i) => {
            const maxVal = Math.max(...data.map(x => x.regionalEmployRate));
            const pct = maxVal > 0 ? (d.regionalEmployRate / maxVal) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 bg-amber-500 rounded-t-sm min-w-0"
                style={{ height: `${pct}%` }}
                title={`${2026 + i}년: ${d.regionalEmployRate.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex gap-[2px]">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center text-xs text-gray-600 min-w-0">
              {i % 3 === 0 ? `'${String(d.year).slice(-2)}` : ''}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>&apos;26</span>
          <span className="text-amber-600">&larr; 현재 {REGIONAL_EMPLOYMENT_RATE}%</span>
          <span>&apos;40</span>
        </div>
      </div>

      {/* ====== INFO SECTIONS ====== */}
      <InfoSection title="서울대 학과 지역 이전" color="text-cyan-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">왜 서울대 학과 이전인가?</span>
              <p className="text-gray-500 text-base">
                서울대 합격자의 78.4%가 수도권 출신이며, 국고 지원금만으로 하위 132개 대학 전체 지원금과 맞먹습니다.
                이 집중 구조가 수도권 쏠림의 교육적 원인입니다. 학과를 지역 산업과 연계하여 이전하면
                인재가 지역에 정착하는 구조를 만듭니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">이전 시나리오</span>
              <p className="text-gray-500 text-base">
                농업생명과학 &rarr; 전북&middot;전남 (농업벨트), 수산해양 &rarr; 부산&middot;여수,
                공과대 일부 &rarr; 대전 (대덕연구단지), 의과대학 &rarr; 경북&middot;경남 (의료 소외지역),
                AI&middot;IT &rarr; 세종 (행정수도), 에너지공학 &rarr; 영광&middot;울산.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">해외 성공 사례</span>
              <p className="text-gray-500 text-base">
                일본: 7개 제국대학 지역 분산으로 도호쿠대가 2024년 세계연구탁월대학 지정.
                독일: 하이델베르크&middot;뮌헨이 베를린보다 선호되는 다극 체제.
                영국: 러셀그룹 24개교가 전국 분포.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="미분양 &rarr; 학생주택 전환" color="text-emerald-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">악성 미분양 현황</span>
              <p className="text-gray-500 text-base">
                비수도권 악성 미분양 23,733호(2025.10). 매입임대 예산은 2022년 9.2조 &rarr; 2025년 3.3조로
                64% 삭감. LH 매입 목표 8,000호로는 절반도 해소 불가.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">학생주택 전환의 장점</span>
              <p className="text-gray-500 text-base">
                신축 공공주택(호당 3억) 대비 미분양 매입(호당 2억)이 33% 저렴.
                즉시 입주 가능(건설 기간 3~5년 절약). 건설사 유동성 위기 해소로 지역 경제 안정.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">선순환 구조</span>
              <p className="text-gray-500 text-base">
                학과 이전 &rarr; 학생&middot;교수 유입 &rarr; 미분양 흡수 &rarr; 지역 소비 증가 &rarr;
                일자리 창출 &rarr; 졸업생 지역 정착 &rarr; 추가 인구 유입.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="자유시민대학 (관악캠퍼스)" color="text-purple-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">독일 VHS 모델</span>
              <p className="text-gray-500 text-base">
                전국 900개 센터, 연간 900만명 참여, 50만개 강좌. 지자체 운영의 민주적 평생학습 기관.
                바이마르 헌법(1919) 이래 100년 전통.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">영국 Open University 모델</span>
              <p className="text-gray-500 text-base">
                208,000명 재학, 영국 최대 규모 대학. 원격+모듈 교육. 연령&middot;학력 무관 입학.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">관악캠퍼스 활용 구상</span>
              <p className="text-gray-500 text-base">
                {GWANAK_AREA_HA}ha 캠퍼스를 시민 평생학습 허브로 전환. 명예교수 {SNU_EMERITUS.toLocaleString()}명이
                시민교양&middot;AI리터러시&middot;문화예술&middot;건강 프로그램 운영.
                국고 절감분(약 2,400억원)을 거점대에 재배분.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="서울 주택가격 영향 분석" color="text-rose-400">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-gray-300 font-semibold">관악구 직접 충격</span>
              <p className="text-gray-500 text-base">
                학생 24,000명 외부 주거 수요 소멸 &rarr; 원룸 공실률 15~25%로 급증. 월세 42.3만원 &rarr; 30~35만원(-18~29%). 아파트 매매가 -5~10% 예상. 단, 관악구가 이미 서울 최하위가 수준이어서 하방 제한적.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">강남 학군 프리미엄 축소 (최대 영향)</span>
              <p className="text-gray-500 text-base">
                대치동 학원 1,500개의 핵심 동기가 서울대 입시. 학과 이전으로 &quot;서울대=강남 사교육&quot; 등식 약화 &rarr; 대치동 84㎡(36억) 교육 프리미엄 -5~15%(단기), -15~25%(장기) 축소 가능. 강남3구 교육 프리미엄 규모 추정 75~175조원 중 서울대 관련분 22~87조원.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">서울 전체 평균: -3~7%</span>
              <p className="text-gray-500 text-base">
                관악구 임대시장(-18~29%) + 강남 학군 프리미엄 축소(-5~15%) + 수요 분산 효과를 종합하면, 서울 전체 평균 아파트 가격에 장기적으로 -3~7% 하방 압력. 단독으로는 &quot;폭락&quot;이 아닌 &quot;완만한 조정&quot;.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">해외 사례 경고</span>
              <p className="text-gray-500 text-base">
                세종시 정부청사 이전 &rarr; 서울 종로 가격 하락 없음. 일본 츠쿠바대 이전 &rarr; 도쿄 사상 최고가. 혁신도시 153개 기관 &rarr; 서울 가격 지속 상승. 기관&middot;대학 이전 단독으로 수도 부동산을 하락시킨 사례는 전 세계적으로 없음.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">05</span>
            <div>
              <span className="text-gray-300 font-semibold">관악캠퍼스 411ha 활용</span>
              <p className="text-gray-500 text-base">
                면적은 여의도의 1.38배이나 70%가 관악산 산지(개발 불가). 실질 평지 약 120ha. 자유시민대학으로 보존 시 주택 공급 효과는 미미하나, 411ha 녹지+교육 공간이 관악구의 새로운 가치를 창출.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">06</span>
            <div>
              <span className="text-gray-300 font-semibold">복합 정책 결합 시 진짜 효과</span>
              <p className="text-gray-500 text-base">
                서울대 이전 단독(-3~7%)은 제한적이나, 공공주택 20%+ 확대 + 지역 산업 이전 + 공공은행 저리 대출 + 에너지 기본소득을 결합하면 서울 PIR 13.9배 &rarr; 10~11배 달성 가능. 구조적 전환의 핵심 축.
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
              <span className="text-gray-300 font-semibold">이전 속도</span>
              <p className="text-gray-500 text-base">
                5년 단계적 이전. 1년차 20% &rarr; 5년차 100% 완료. 학생&middot;교수 동시 이동.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-gray-300 font-semibold">인구 승수</span>
              <p className="text-gray-500 text-base">
                학생+교수 1명 이전 시 가족&middot;서비스업 포함 2.5명 파급 효과. 혁신도시 이전 실적 기반.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-gray-300 font-semibold">미분양 흡수</span>
              <p className="text-gray-500 text-base">
                직접 전환(정부 매입) + 인구 유입 자연 흡수의 합산. 매입 단가 호당 2억원 기준.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-gray-300 font-semibold">취업률 개선</span>
              <p className="text-gray-500 text-base">
                거점대 투자 1조원당 지역 취업률 3%p 상승 가정.
                산학협력 유치 기업 1개당 연간 30명 고용.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gray-400 font-mono text-base mt-0.5 flex-shrink-0">05</span>
            <div>
              <span className="text-gray-300 font-semibold">출산율 반응</span>
              <p className="text-gray-500 text-base">
                주거 안정(미분양 해소)과 고용 안정(지역 취업) 복합 효과.
                미분양 해소율 100% &rarr; 출산율 +0.08, 취업률 10%p 개선 &rarr; +0.05.
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
