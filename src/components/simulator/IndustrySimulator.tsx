'use client';

import React, { useState, useMemo } from 'react';
import {
  getAllIndustryProfiles,
  getMetroIndustryProfile,
  getMergerForMetro,
  simulateIndustry,
  type MetroIndustryProfile,
  type MergerScenario,
  type SimulationYearResult,
} from '@/lib/data/regional-industry-data';
import { DataSources } from '@/components/shared/DataSources';

// ============================================================
// Sub-components (matching LocalFundSimulator pattern)
// ============================================================

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base text-muted-foreground">{label}</span>
        <span className={`text-lg md:text-xl font-mono font-bold ${color}`}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-muted
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
    <div className="border border-border p-3 md:p-4 min-w-0">
      <div className="text-sm md:text-base text-muted-foreground leading-tight truncate">{label}</div>
      <div className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="text-xs md:text-sm text-muted-foreground/60 leading-tight truncate">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-border px-4 py-2 ${color}`}>
      <span className="text-sm md:text-base font-semibold uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

function InfoSection({ title, color, children, defaultOpen = false }: { title: string; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 ${color} hover:bg-muted/50 transition-colors text-left`}
      >
        <span className="text-sm md:text-base font-semibold uppercase tracking-widest">{title}</span>
        <span className="text-muted-foreground text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 md:px-5 md:py-5 border-t border-border bg-muted/20 space-y-4 text-base text-muted-foreground leading-relaxed">
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

function formatPop(pop: number): string {
  if (pop >= 10000) return `${(pop / 10000).toFixed(0)}만명`;
  return `${pop.toLocaleString('ko-KR')}명`;
}

function formatJo(joWon: number): string {
  return `${joWon.toFixed(1)}조원`;
}

// ============================================================
// Constants
// ============================================================

const SELECT_CLASS =
  'bg-muted border border-border text-foreground rounded px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-blue-500';

const CHART_COLORS = {
  grdpStroke: '#3b82f6',
  grdpFill: '#3b82f620',
  empStroke: '#10b981',
  mergerRect: '#3b82f618',
  gridLine: '#374151',
  axisText: '#9ca3af',
};

// ============================================================
// Main Component
// ============================================================

export function IndustrySimulator() {
  // === Data ===
  const allProfiles = useMemo(() => getAllIndustryProfiles(), []);
  const metroNames = useMemo(
    () => allProfiles.map((p) => p.metroName).sort((a, b) => a.localeCompare(b, 'ko')),
    [allProfiles],
  );

  // === State ===
  const [selectedMetro, setSelectedMetro] = useState('서울특별시');
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [enableMerger, setEnableMerger] = useState(false);
  const [simYears, setSimYears] = useState(10);
  const [investMultiplier, setInvestMultiplier] = useState(1.0);

  // === Derived ===
  const profile = useMemo(() => getMetroIndustryProfile(selectedMetro), [selectedMetro]);
  const mergerScenario = useMemo(() => getMergerForMetro(selectedMetro), [selectedMetro]);

  // Auto-select existing industries when metro changes
  const handleMetroChange = (metro: string) => {
    setSelectedMetro(metro);
    const p = getMetroIndustryProfile(metro);
    const existingIds = new Set(
      p.industries
        .filter((ind) => ind.industry.category === 'existing')
        .map((ind) => ind.industry.id),
    );
    setSelectedIndustries(existingIds);
    const merger = getMergerForMetro(metro);
    if (!merger) setEnableMerger(false);
  };

  // Initialize selectedIndustries on first render
  useMemo(() => {
    if (selectedIndustries.size === 0) {
      const existingIds = new Set(
        profile.industries
          .filter((ind) => ind.industry.category === 'existing')
          .map((ind) => ind.industry.id),
      );
      setSelectedIndustries(existingIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleIndustry = (id: string) => {
    setSelectedIndustries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const existingIndustries = profile.industries.filter((ind) => ind.industry.category === 'existing');
  const recommendedIndustries = profile.industries.filter((ind) => ind.industry.category === 'recommended');

  // === Simulation ===
  const simResults = useMemo<SimulationYearResult[]>(() => {
    if (selectedIndustries.size === 0) return [];
    return simulateIndustry({
      metroName: selectedMetro,
      selectedIndustryIds: Array.from(selectedIndustries),
      enableMerger,
      years: simYears,
      investmentMultiplier: investMultiplier,
    });
  }, [selectedMetro, selectedIndustries, enableMerger, simYears, investMultiplier]);

  const finalResult = simResults.length > 0 ? simResults[simResults.length - 1] : null;

  // === Merger combined stats ===
  const mergerStats = useMemo(() => {
    if (!mergerScenario) return null;
    let totalPop = 0;
    let totalGrdp = 0;
    for (const mName of mergerScenario.metros) {
      try {
        const p = getMetroIndustryProfile(mName);
        totalPop += p.population;
        totalGrdp += p.grdp;
      } catch { /* skip */ }
    }
    return { totalPop, totalGrdp };
  }, [mergerScenario]);

  // === Chart helpers ===
  const chartW = 700;
  const chartH = 300;
  const padL = 70;
  const padR = 70;
  const padT = 20;
  const padB = 50;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const grdpValues = simResults.map((r) => r.grdp);
  const empValues = simResults.map((r) => r.employmentRate);
  const maxGrdp = Math.max(...grdpValues, profile.grdp + 1);
  const minGrdp = Math.min(...grdpValues, profile.grdp) * 0.95;
  const maxEmp = Math.max(...empValues, profile.employmentRate + 1);
  const minEmp = Math.min(...empValues, profile.employmentRate) * 0.98;

  const scaleX = (year: number) => padL + ((year - 1) / Math.max(simYears - 1, 1)) * plotW;
  const scaleGrdp = (v: number) => padT + plotH - ((v - minGrdp) / (maxGrdp - minGrdp || 1)) * plotH;
  const scaleEmp = (v: number) => padT + plotH - ((v - minEmp) / (maxEmp - minEmp || 1)) * plotH;

  const grdpLine = simResults.map((r, i) => `${i === 0 ? 'M' : 'L'}${scaleX(r.year).toFixed(1)},${scaleGrdp(r.grdp).toFixed(1)}`).join(' ');
  const grdpArea = simResults.length > 0
    ? `${grdpLine} L${scaleX(simResults[simResults.length - 1].year).toFixed(1)},${(padT + plotH).toFixed(1)} L${scaleX(simResults[0].year).toFixed(1)},${(padT + plotH).toFixed(1)} Z`
    : '';
  const empLine = simResults.map((r, i) => `${i === 0 ? 'M' : 'L'}${scaleX(r.year).toFixed(1)},${scaleEmp(r.employmentRate).toFixed(1)}`).join(' ');

  // Industry contribution data
  const industryContributions = useMemo(() => {
    if (!finalResult || selectedIndustries.size === 0) return [];
    const allInd = profile.industries;
    const selected = allInd.filter((ind) => selectedIndustries.has(ind.industry.id));
    const totalGrdp = selected.reduce((sum, ind) => sum + ind.impact.grdpGrowthPct, 0);
    return selected
      .map((ind) => ({
        name: ind.industry.name,
        icon: ind.industry.icon,
        pct: totalGrdp > 0 ? (ind.impact.grdpGrowthPct / totalGrdp) * 100 : 0,
        color: ind.industry.category === 'existing' ? '#3b82f6' : '#10b981',
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [profile.industries, selectedIndustries, finalResult]);

  // Delta helpers
  const delta = (current: number, future: number) => {
    const diff = future - current;
    return { diff, positive: diff >= 0 };
  };

  return (
    <div className="bg-background text-foreground w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-muted-foreground">
          🏭 지역 산업 경쟁력 시뮬레이터
        </h1>
        <span className="text-sm md:text-base text-muted-foreground/60">
          광역시도별 산업 시뮬레이션
        </span>
      </div>

      {/* ====== METRO SELECTOR ====== */}
      <div id="metro-select" className="border border-border p-4 md:p-5">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400 mb-3">
          지역 선택
        </div>
        <select
          className={SELECT_CLASS}
          value={selectedMetro}
          onChange={(e) => handleMetroChange(e.target.value)}
        >
          {metroNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* ====== MERGER TOGGLE ====== */}
      {mergerScenario && (
        <div className="border border-border p-4 md:p-5 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setEnableMerger(!enableMerger)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              enableMerger ? 'bg-blue-500' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={enableMerger}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                enableMerger ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-foreground">{mergerScenario.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              mergerScenario.status.includes('확정')
                ? 'bg-emerald-500/20 text-emerald-400'
                : mergerScenario.status.includes('추진')
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {mergerScenario.status}
            </span>
          </div>
        </div>
      )}

      {/* ====== CURRENT STATUS GRID ====== */}
      <div id="current-status" className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title="📊 현재 현황" color="text-blue-400" />
        <Cell
          label="GRDP"
          value={formatJo(profile.grdp)}
          color="text-blue-400"
          sub="지역총생산"
        />
        <Cell
          label="인구"
          value={formatPop(profile.population)}
          color="text-blue-400"
          sub="주민등록 기준"
        />
        <Cell
          label="고용률"
          value={`${profile.employmentRate.toFixed(1)}%`}
          color={profile.employmentRate >= 62 ? 'text-emerald-400' : 'text-amber-400'}
        />
        <Cell
          label="청년실업률"
          value={`${profile.youthUnemployment.toFixed(1)}%`}
          color={profile.youthUnemployment <= 7 ? 'text-emerald-400' : 'text-red-400'}
        />
        <Cell
          label="재정자립도"
          value={`${profile.fiscalIndependence.toFixed(1)}%`}
          color={profile.fiscalIndependence >= 50 ? 'text-emerald-400' : profile.fiscalIndependence >= 35 ? 'text-amber-400' : 'text-red-400'}
        />
      </div>

      {/* Tags row */}
      <div className="border border-border p-3 md:p-4 flex flex-wrap gap-2">
        {profile.strengths.map((s) => (
          <span key={s} className="text-xs px-2 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
            {s}
          </span>
        ))}
        {profile.resources.map((r) => (
          <span key={r} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
            {r}
          </span>
        ))}
      </div>

      {/* ====== INDUSTRY SELECTION ====== */}
      <div id="industry-select">
      <SectionHeader title="🏭 산업 선택" color="text-blue-400" />
      </div>

      {/* Existing Industries */}
      <div className="border border-border p-4 md:p-5">
        <div className="text-sm font-semibold text-blue-400 mb-3">🔵 기존 강점 산업</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {existingIndustries.map(({ industry, impact }) => {
            const checked = selectedIndustries.has(industry.id);
            return (
              <button
                key={industry.id}
                onClick={() => toggleIndustry(industry.id)}
                className={`text-left border-l-4 border-l-blue-500 border border-border rounded p-3 transition-colors ${
                  checked ? 'bg-blue-500/10 border-blue-500/40' : 'bg-background hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{checked ? '☑' : '☐'}</span>
                    <span className="text-base">{industry.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{industry.name}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  GRDP +{impact.grdpGrowthPct.toFixed(1)}% · 일자리 +{impact.jobCreation.toLocaleString('ko-KR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  투자 {formatEok(impact.investmentEok)}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(impact.employmentDelta * 500, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">고용영향</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Industries */}
      <div className="border border-border p-4 md:p-5">
        <div className="text-sm font-semibold text-emerald-400 mb-3">🟢 도입 추천 산업</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendedIndustries.map(({ industry, impact }) => {
            const checked = selectedIndustries.has(industry.id);
            return (
              <button
                key={industry.id}
                onClick={() => toggleIndustry(industry.id)}
                className={`text-left border-l-4 border-l-emerald-500 border border-border rounded p-3 transition-colors ${
                  checked ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-background hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{checked ? '☑' : '☐'}</span>
                    <span className="text-base">{industry.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{industry.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">추천</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  GRDP +{impact.grdpGrowthPct.toFixed(1)}% · 일자리 +{impact.jobCreation.toLocaleString('ko-KR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  투자 {formatEok(impact.investmentEok)}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(impact.employmentDelta * 500, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">고용영향</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====== SIMULATION PARAMETERS ====== */}
      <div id="sim-params" className="border border-border p-4 md:p-5">
        <SectionHeader title="⚙️ 시뮬레이션 설정" color="text-purple-400" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-3">
          <Slider
            label="시뮬레이션 기간"
            value={simYears}
            min={5}
            max={30}
            step={1}
            unit="년"
            color="text-purple-400"
            onChange={setSimYears}
          />
          <Slider
            label="투자 집중도"
            value={investMultiplier}
            min={0.5}
            max={2.0}
            step={0.1}
            unit="x"
            color="text-amber-400"
            onChange={setInvestMultiplier}
          />
        </div>
      </div>

      {/* ====== SIMULATION RESULTS ====== */}
      <div id="sim-results">
      {finalResult && (
        <>
          <SectionHeader title="📈 시뮬레이션 결과" color="text-emerald-400" />

          {/* Before -> After comparison grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {(() => {
              const metrics: { label: string; current: number; future: number; unit: string; invertDelta?: boolean }[] = [
                { label: 'GRDP', current: profile.grdp, future: finalResult.grdp, unit: '조원' },
                { label: '인구', current: profile.population, future: finalResult.population, unit: '' },
                { label: '고용률', current: profile.employmentRate, future: finalResult.employmentRate, unit: '%' },
                { label: '청년실업률', current: profile.youthUnemployment, future: finalResult.youthUnemployment, unit: '%', invertDelta: true },
                { label: '재정자립도', current: profile.fiscalIndependence, future: finalResult.fiscalIndependence, unit: '%' },
                { label: '총투자유치', current: 0, future: finalResult.totalInvestment, unit: '' },
                { label: '총일자리창출', current: 0, future: finalResult.totalJobs, unit: '' },
              ];
              return metrics.map((m) => {
                const d = delta(m.current, m.future);
                const isGood = m.invertDelta ? !d.positive : d.positive;
                const deltaColor = isGood ? 'text-emerald-400' : 'text-red-400';
                const formatVal = (v: number) => {
                  if (m.label === 'GRDP') return formatJo(v);
                  if (m.label === '인구') return formatPop(v);
                  if (m.label === '총투자유치') return formatEok(v);
                  if (m.label === '총일자리창출') return `${v.toLocaleString('ko-KR')}명`;
                  return `${v.toFixed(1)}${m.unit}`;
                };
                return (
                  <div key={m.label} className="border border-border p-3 md:p-4">
                    <div className="text-xs text-muted-foreground mb-1">{m.label}</div>
                    {m.label === '총투자유치' || m.label === '총일자리창출' ? (
                      <div className="text-base md:text-lg font-mono font-bold tabular-nums text-emerald-400">
                        {formatVal(m.future)}
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-muted-foreground/60">
                          현재 {formatVal(m.current)} → {simYears}년후
                        </div>
                        <div className="text-base md:text-lg font-mono font-bold tabular-nums text-foreground">
                          {formatVal(m.future)}
                        </div>
                        <div className={`text-xs font-mono font-bold ${deltaColor}`}>
                          {d.positive ? '+' : ''}{m.label === 'GRDP' ? (d.diff).toFixed(1) + '조' : m.label === '인구' ? formatPop(Math.abs(Math.round(d.diff))) : d.diff.toFixed(1) + m.unit}
                        </div>
                      </>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* SVG Line Chart */}
          {simResults.length > 1 && (
            <div className="border border-border p-4 md:p-5">
              <div className="text-sm font-semibold text-muted-foreground mb-3">연도별 추이</div>
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[500px]" role="img" aria-label="GRDP and employment rate chart">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = padT + plotH * (1 - frac);
                    return (
                      <line key={frac} x1={padL} y1={y} x2={chartW - padR} y2={y} stroke={CHART_COLORS.gridLine} strokeWidth="0.5" strokeDasharray="4 4" />
                    );
                  })}

                  {/* Merger support period rect */}
                  {enableMerger && mergerScenario && (
                    <rect
                      x={padL}
                      y={padT}
                      width={Math.min(mergerScenario.years / simYears, 1) * plotW}
                      height={plotH}
                      fill={CHART_COLORS.mergerRect}
                      rx="2"
                    />
                  )}

                  {/* GRDP area */}
                  {grdpArea && (
                    <path d={grdpArea} fill={CHART_COLORS.grdpFill} />
                  )}

                  {/* GRDP line */}
                  {grdpLine && (
                    <path d={grdpLine} fill="none" stroke={CHART_COLORS.grdpStroke} strokeWidth="2.5" />
                  )}

                  {/* Employment line */}
                  {empLine && (
                    <path d={empLine} fill="none" stroke={CHART_COLORS.empStroke} strokeWidth="2" strokeDasharray="6 3" />
                  )}

                  {/* Data points */}
                  {simResults.filter((_, i) => i % Math.max(1, Math.floor(simYears / 10)) === 0 || i === simResults.length - 1).map((r) => (
                    <React.Fragment key={r.year}>
                      <circle cx={scaleX(r.year)} cy={scaleGrdp(r.grdp)} r="3.5" fill={CHART_COLORS.grdpStroke} />
                      <circle cx={scaleX(r.year)} cy={scaleEmp(r.employmentRate)} r="3" fill={CHART_COLORS.empStroke} />
                    </React.Fragment>
                  ))}

                  {/* Left Y axis labels (GRDP) */}
                  {[0, 0.5, 1].map((frac) => {
                    const v = minGrdp + (maxGrdp - minGrdp) * frac;
                    const y = padT + plotH * (1 - frac);
                    return (
                      <text key={`gl-${frac}`} x={padL - 8} y={y + 4} textAnchor="end" fill={CHART_COLORS.grdpStroke} fontSize="10" fontFamily="monospace">
                        {v.toFixed(0)}조
                      </text>
                    );
                  })}

                  {/* Right Y axis labels (Employment) */}
                  {[0, 0.5, 1].map((frac) => {
                    const v = minEmp + (maxEmp - minEmp) * frac;
                    const y = padT + plotH * (1 - frac);
                    return (
                      <text key={`er-${frac}`} x={chartW - padR + 8} y={y + 4} textAnchor="start" fill={CHART_COLORS.empStroke} fontSize="10" fontFamily="monospace">
                        {v.toFixed(1)}%
                      </text>
                    );
                  })}

                  {/* X axis labels */}
                  {simResults.filter((_, i) => i === 0 || (i + 1) % Math.max(1, Math.ceil(simYears / 6)) === 0 || i === simResults.length - 1).map((r) => (
                    <text key={`x-${r.year}`} x={scaleX(r.year)} y={padT + plotH + 18} textAnchor="middle" fill={CHART_COLORS.axisText} fontSize="10" fontFamily="monospace">
                      {2026 + r.year}
                    </text>
                  ))}

                  {/* Axis labels */}
                  <text x={padL - 8} y={padT - 6} textAnchor="end" fill={CHART_COLORS.grdpStroke} fontSize="10" fontWeight="bold">
                    GRDP(조원)
                  </text>
                  <text x={chartW - padR + 8} y={padT - 6} textAnchor="start" fill={CHART_COLORS.empStroke} fontSize="10" fontWeight="bold">
                    고용률(%)
                  </text>

                  {/* Legend */}
                  <rect x={padL} y={chartH - 16} width="12" height="3" rx="1" fill={CHART_COLORS.grdpStroke} />
                  <text x={padL + 16} y={chartH - 12} fill={CHART_COLORS.axisText} fontSize="9">GRDP</text>
                  <line x1={padL + 60} y1={chartH - 14} x2={padL + 72} y2={chartH - 14} stroke={CHART_COLORS.empStroke} strokeWidth="2" strokeDasharray="4 2" />
                  <text x={padL + 76} y={chartH - 12} fill={CHART_COLORS.axisText} fontSize="9">고용률</text>
                  {enableMerger && mergerScenario && (
                    <>
                      <rect x={padL + 130} y={chartH - 20} width="12" height="10" rx="1" fill={CHART_COLORS.mergerRect} stroke={CHART_COLORS.grdpStroke} strokeWidth="0.5" />
                      <text x={padL + 146} y={chartH - 12} fill={CHART_COLORS.axisText} fontSize="9">통합지원기간</text>
                    </>
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* Industry contribution bar chart */}
          {industryContributions.length > 0 && (
            <div className="border border-border p-4 md:p-5">
              <div className="text-sm font-semibold text-muted-foreground mb-3">산업별 GRDP 성장 기여도 <span className="font-normal text-xs">(시뮬레이션 기준)</span></div>
              <div className="space-y-2">
                {industryContributions.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{c.icon}</span>
                    <span className="text-sm text-foreground w-28 flex-shrink-0 truncate">{c.name}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground w-14 text-right flex-shrink-0">
                      {c.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {selectedIndustries.size === 0 && (
        <div className="border border-border p-8 text-center text-muted-foreground">
          <div className="text-3xl mb-3">🏭</div>
          <div className="text-base">산업을 선택하면 시뮬레이션 결과가 표시됩니다.</div>
        </div>
      )}
      </div>

      {/* ====== MERGER EFFECT SECTION ====== */}
      {enableMerger && mergerScenario && mergerStats && (
        <div className="border border-blue-500/30 bg-blue-500/5 rounded p-4 md:p-5 space-y-3">
          <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-blue-400">
            🌐 {mergerScenario.name} 통합 효과
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Cell
              label="합산 인구"
              value={formatPop(mergerStats.totalPop)}
              color="text-blue-400"
            />
            <Cell
              label="합산 GRDP"
              value={formatJo(mergerStats.totalGrdp)}
              color="text-blue-400"
            />
            <Cell
              label="특별지원"
              value={`${mergerScenario.years}년간 ${formatEok(mergerScenario.budgetSupportEok)}`}
              color="text-amber-400"
            />
          </div>
          <div className="space-y-1.5 mt-2">
            {mergerScenario.specialBenefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-emerald-400 flex-shrink-0">✅</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground/60 mt-2">
            * 통합특별시 출범 시 20조원 근거의 특별재정지원이 배분됩니다.
          </div>
        </div>
      )}

      {/* ====== METHODOLOGY ====== */}
      <InfoSection title="시뮬레이션 방법론" color="text-purple-400">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-sm mt-0.5 flex-shrink-0">01</span>
            <div>
              <span className="text-foreground font-semibold">복리 성장 모델</span>
              <p className="text-muted-foreground text-sm mt-1">
                선택된 산업의 GRDP 성장률이 복리로 적용됩니다. 각 산업의 영향은 독립적으로 계산되며 투자 집중도 배수가 적용됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-sm mt-0.5 flex-shrink-0">02</span>
            <div>
              <span className="text-foreground font-semibold">수확체감 효과</span>
              <p className="text-muted-foreground text-sm mt-1">
                기존 산업은 연간 0.96배율, 추천 산업은 0.92배율로 수확체감이 적용됩니다. 초기 투자 효과가 가장 크고 점차 감소합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-sm mt-0.5 flex-shrink-0">03</span>
            <div>
              <span className="text-foreground font-semibold">인구 2년 래그</span>
              <p className="text-muted-foreground text-sm mt-1">
                산업 투자에 따른 인구 유입 효과는 2년의 시차를 두고 반영됩니다. 일자리 창출 후 실제 이주까지의 시간 차이를 모델링합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-sm mt-0.5 flex-shrink-0">04</span>
            <div>
              <span className="text-foreground font-semibold">상한선 적용</span>
              <p className="text-muted-foreground text-sm mt-1">
                고용률 상한 75%, 재정자립도 상한 85%, 청년실업률 하한 2%로 비현실적인 결과를 방지합니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-mono text-sm mt-0.5 flex-shrink-0">05</span>
            <div>
              <span className="text-foreground font-semibold">통합 보너스</span>
              <p className="text-muted-foreground text-sm mt-1">
                시도 통합 활성화 시 GRDP +0.8%, 고용률 +0.15%p, 재정자립도 +1.5%p의 추가 보너스가 매년 적용되며, 특별지원금이 지원됩니다.
              </p>
            </div>
          </div>
        </div>
      </InfoSection>

      {/* ====== DATA SOURCES ====== */}
      <DataSources />
    </div>
  );
}
