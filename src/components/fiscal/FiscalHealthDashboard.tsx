'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  getMetroFiscalData,
  getAllDistrictFiscalData,
  getDistrictFiscalData,
  getNationalAverage,
  getMetroNames,
  getNationalDebtHistory,
  getMetroDebtHistory,
  generateDistrictDebtHistory,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
  gradeColor,
  gradeBgColor,
  gradeEmoji,
  METRO_PREV_YEAR,
  getChangeRate,
  getPopulationGroup,
  getPopulationGroupLabel,
  getPeerGroupMetros,
  getPeerGroupStats,
  getDistrictRevenueExpenditure,
  getMetroHouseholdDebt,
  getNationalAvgHouseholdDebt,
  type MetroFiscalData,
  type DistrictFiscalData,
  type NationalDebtHistoryEntry,
  type MetroDebtHistoryEntry,
  type DistrictDebtHistoryEntry,
  type PopulationGroup,
  type MetroHouseholdDebt,
} from '@/lib/data/fiscal-health-data';
import { DataSources } from '@/components/shared/DataSources';
import { DataDownload } from '@/components/shared/DataDownload';

// ============================================================
// Types
// ============================================================

type ViewMode = 'fiscalStatus' | 'ranking' | 'debtRatio' | 'healthScore' | 'compare' | 'peerBench';

type SortKey = 'independence' | 'autonomy' | 'debtPerCapita';

// ============================================================
// Constants
// ============================================================

const GLOSSARY: Record<string, string> = {
  '재정자립도':
    '(자체수입 / 자치단체 예산규모) x 100. 자체수입은 지역세수입과 세외수입의 합계. 높을수록 중앙정부 의존도가 낮음.',
  '재정자주도':
    '((자체수입 + 자주재원) / 자치단체 예산규모) x 100. 자주재원은 지역교부세, 재정보전금 등. 자립도보다 넓은 재원 자율성 지표.',
  '지역채무':
    '지역자치단체가 발행한 지역채와 차입금 등의 합계. 지역개발, 인프라 투자 등의 재원으로 사용.',
  '1인당 지역채무':
    '지역채무 / 주민등록인구. 지역 주민 1인이 부담하는 지역정부 부채 규모.',
};

// ============================================================
// 지역채무 실시간 시계 상수
// ============================================================
const DEBT_BASE_DATE = new Date('2025-01-01T00:00:00+09:00');
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

// 광역별 연간 채무 증가 추정 (억원/년, 약 5~7% 성장률 기반)
const METRO_YEARLY_DEBT_INCREASE: Record<string, number> = {
  '서울특별시': 577,       // 11544 * 5%
  '부산광역시': 2211,      // 31586 * 7%
  '대구광역시': 1110,      // 18500 * 6%
  '인천광역시': 1540,      // 22000 * 7%
  '광주광역시': 768,       // 12800 * 6%
  '대전광역시': 672,       // 11200 * 6%
  '울산광역시': 425,       // 8500 * 5%
  '세종특별자치시': 364,   // 5200 * 7%
  '경기도': 3491,          // 49847 * 7%
  '강원특별자치도': 912,   // 15200 * 6%
  '충청북도': 744,         // 12400 * 6%
  '충청남도': 876,         // 14600 * 6%
  '전북특별자치도': 708,   // 11800 * 6%
  '전라남도': 792,         // 13200 * 6%
  '경상북도': 1068,        // 17800 * 6%
  '경상남도': 1290,        // 21500 * 6%
  '제주특별자치도': 450,   // 7500 * 6%
};

const MODE_TABS: { key: ViewMode; label: string }[] = [
  { key: 'fiscalStatus', label: '재정현황' },
  { key: 'ranking', label: '시군구 순위' },
  { key: 'debtRatio', label: '채무비율 추이' },
  { key: 'healthScore', label: '건전성 점수' },
  { key: 'compare', label: '시군구 비교' },
  { key: 'peerBench', label: '규모별 비교' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'independence', label: '재정자립도 \u2193' },
  { key: 'autonomy', label: '재정자주도 \u2193' },
  { key: 'debtPerCapita', label: '1인당채무 \u2193' },
];

const SELECT_CLASS =
  'bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1.5 text-base focus:outline-none focus:ring-1 focus:ring-blue-500';

// ============================================================
// Color helpers
// ============================================================

function independenceColor(value: number): string {
  if (value >= 50) return 'text-emerald-400';
  if (value >= 30) return 'text-amber-400';
  if (value >= 15) return 'text-red-400';
  return 'text-red-600';
}

function independenceBarColor(value: number): string {
  if (value >= 50) return 'bg-emerald-500';
  if (value >= 30) return 'bg-amber-500';
  if (value >= 15) return 'bg-red-500';
  return 'bg-red-700';
}

function autonomyBarColor(value: number): string {
  if (value >= 70) return 'bg-blue-500';
  if (value >= 60) return 'bg-blue-400';
  return 'bg-blue-300';
}

function debtColor(debtPerCapita: number): string {
  if (debtPerCapita >= 150) return 'text-red-400';
  if (debtPerCapita >= 80) return 'text-amber-400';
  return 'text-emerald-400';
}

// ============================================================
// Formatting helpers
// ============================================================

function formatDebt(eokWon: number): string {
  if (eokWon >= 10000) {
    return `${(eokWon / 10000).toFixed(1)}조원`;
  }
  return `${eokWon.toLocaleString('ko-KR')}억원`;
}

function formatPopulation(pop: number): string {
  if (pop >= 10000) {
    return `${(pop / 10000).toFixed(0)}만명`;
  }
  return `${pop.toLocaleString('ko-KR')}명`;
}

function formatDebtPerCapita(debt: number, population: number): string {
  if (!population) return '-';
  const perCapita = (debt * 100000000) / population; // 억원 -> 원
  const manWon = perCapita / 10000;
  return `${Math.round(manWon).toLocaleString('ko-KR')}만원`;
}

function getDebtPerCapitaManWon(debt: number, population: number): number {
  if (!population) return 0;
  return (debt * 100000000) / population / 10000;
}

// ============================================================
// 실시간 채무 계산 helpers
// ============================================================

function getElapsedFraction(): number {
  const now = new Date();
  return (now.getTime() - DEBT_BASE_DATE.getTime()) / 1000 / SECONDS_PER_YEAR;
}

/** Get current ticking debt for a metro (in 억원) */
function getCurrentMetroDebt(name: string, baseDebt: number): number {
  const yearlyIncrease = METRO_YEARLY_DEBT_INCREASE[name] ?? baseDebt * 0.06;
  return baseDebt + getElapsedFraction() * yearlyIncrease;
}

/** Get current ticking debt for a district (in 억원) - uses 6% annual growth */
function getCurrentDistrictDebt(baseDebt: number): number {
  const yearlyIncrease = baseDebt * 0.06;
  return baseDebt + getElapsedFraction() * yearlyIncrease;
}

/** Format raw won with commas (e.g., "1,154,400,000,000원") */
function formatRawWon(eokWon: number): string {
  const won = Math.floor(eokWon * 100_000_000);
  return won.toLocaleString('ko-KR') + '원';
}

/** Per-second increase rate formatted */
function formatPerSecond(yearlyEok: number): string {
  const perSec = (yearlyEok * 100_000_000) / SECONDS_PER_YEAR;
  if (perSec >= 100_000_000) return `${(perSec / 100_000_000).toFixed(1)}억원/초`;
  if (perSec >= 10_000) return `${Math.round(perSec / 10_000).toLocaleString('ko-KR')}만원/초`;
  return `${Math.round(perSec).toLocaleString('ko-KR')}원/초`;
}

// ============================================================
// Sub-components
// ============================================================

interface CellProps {
  label: string;
  value: string;
  color: string;
  sub?: string;
  glossaryKey?: string;
}

function Cell({ label, value, color, sub, glossaryKey }: CellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = glossaryKey ? GLOSSARY[glossaryKey] : undefined;

  return (
    <div
      className="border border-gray-800 p-2 md:p-3 min-w-0 relative"
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="text-sm md:text-base text-gray-500 leading-tight truncate flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-600 text-[9px] text-gray-500 cursor-help flex-shrink-0">
            ?
          </span>
        )}
      </div>
      <div
        className={`text-lg md:text-xl font-mono font-bold tabular-nums leading-tight truncate ${color}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs md:text-sm text-gray-600 leading-tight truncate">
          {sub}
        </div>
      )}
      {showTooltip && tooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 md:w-72 p-2.5 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed pointer-events-none">
          <div className="font-semibold text-gray-100 mb-1 text-sm">{glossaryKey}</div>
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800" />
        </div>
      )}
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

/** Horizontal bar with percentage width */
function Bar({
  value,
  max,
  colorClass,
  height = 'h-3',
}: {
  value: number;
  max: number;
  colorClass: string;
  height?: string;
}) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full ${height} bg-gray-800 rounded-full overflow-hidden`}>
      <div
        className={`${height} rounded-full ${colorClass} transition-all duration-300`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ============================================================
// Metro Card (for grid view)
// ============================================================

function MetroCard({ metro, onClick }: { metro: MetroFiscalData; onClick: () => void }) {
  const perCapita = getDebtPerCapitaManWon(metro.debt, metro.population);

  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0 space-y-2 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors" onClick={onClick}>
      {/* Name */}
      <div className={`text-base md:text-lg font-bold truncate ${independenceColor(metro.independence)}`}>
        {metro.name}
      </div>

      {/* 재정자립도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자립도</span>
          <span className={`text-base md:text-base font-mono font-bold tabular-nums ${independenceColor(metro.independence)}`}>
            {metro.independence.toFixed(1)}%
          </span>
        </div>
        <Bar value={metro.independence} max={100} colorClass={independenceBarColor(metro.independence)} height="h-3" />
      </div>

      {/* 재정자주도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자주도</span>
          <span className="text-base md:text-base font-mono font-bold tabular-nums text-blue-400">
            {metro.autonomy.toFixed(1)}%
          </span>
        </div>
        <Bar value={metro.autonomy} max={100} colorClass={autonomyBarColor(metro.autonomy)} height="h-3" />
      </div>

      {/* 지역채무 (실시간) */}
      <div className="pt-1 border-t border-gray-800">
        <div className="text-sm text-gray-500 mb-1">지역채무 (실시간)</div>
        <div className={`text-sm md:text-base font-mono font-bold tabular-nums leading-tight ${debtColor(perCapita)}`}>
          {formatRawWon(getCurrentMetroDebt(metro.name, metro.debt))}
        </div>
        <div className="text-xs text-gray-600">
          ≈ {formatDebt(getCurrentMetroDebt(metro.name, metro.debt))}
        </div>
      </div>

      {/* 1인당 채무 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">1인당 채무</span>
        <span className={`text-base md:text-base font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
          {formatDebtPerCapita(getCurrentMetroDebt(metro.name, metro.debt), metro.population)}
        </span>
      </div>

      {/* Mini comparison bar (자립도 vs 자주도) */}
      <div className="pt-1 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>자립도</span>
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={`absolute left-0 top-0 h-full rounded-full ${independenceBarColor(metro.independence)} opacity-80`}
              style={{ width: `${metro.independence}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-blue-500 opacity-40"
              style={{ width: `${metro.autonomy}%` }}
            />
          </div>
          <span>자주도</span>
        </div>
      </div>

      {/* 전년 대비 증감률 (g0v 스타일) */}
      {(() => {
        const prev = METRO_PREV_YEAR[metro.name];
        if (!prev) return null;
        const indChange = getChangeRate(metro.independence, prev.independence);
        const debtChange = getChangeRate(metro.debt, prev.debt);
        return (
          <div className="pt-1 border-t border-gray-800 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">전년比</span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${indChange >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              자립 {indChange >= 0 ? '▲' : '▼'}{Math.abs(indChange).toFixed(1)}%
            </span>
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${debtChange <= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
              채무 {debtChange >= 0 ? '▲' : '▼'}{Math.abs(debtChange).toFixed(1)}%
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ============================================================
// District Card (for grid view)
// ============================================================

function DistrictCard({ district, onClick }: { district: DistrictFiscalData; onClick: () => void }) {
  const currentDebt = getCurrentDistrictDebt(district.debt);
  const perCapita = getDebtPerCapitaManWon(currentDebt, district.population);

  return (
    <div className="border border-gray-800 p-3 md:p-4 min-w-0 space-y-2 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors" onClick={onClick}>
      {/* Name */}
      <div className={`text-base md:text-lg font-bold truncate ${independenceColor(district.independence)}`}>
        {district.name}
      </div>
      <div className="text-xs text-gray-600 truncate">{district.metro}</div>

      {/* 재정자립도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자립도</span>
          <span className={`text-base md:text-base font-mono font-bold tabular-nums ${independenceColor(district.independence)}`}>
            {district.independence.toFixed(1)}%
          </span>
        </div>
        <Bar value={district.independence} max={100} colorClass={independenceBarColor(district.independence)} height="h-3" />
      </div>

      {/* 재정자주도 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">재정자주도</span>
          <span className="text-base md:text-base font-mono font-bold tabular-nums text-blue-400">
            {district.autonomy.toFixed(1)}%
          </span>
        </div>
        <Bar value={district.autonomy} max={100} colorClass={autonomyBarColor(district.autonomy)} height="h-3" />
      </div>

      {/* 지역채무 (실시간) */}
      <div className="pt-1 border-t border-gray-800">
        <div className="text-sm text-gray-500 mb-1">지역채무 (실시간)</div>
        <div className={`text-sm md:text-base font-mono font-bold tabular-nums leading-tight ${debtColor(perCapita)}`}>
          {formatRawWon(currentDebt)}
        </div>
        <div className="text-xs text-gray-600">
          ≈ {formatDebt(currentDebt)}
        </div>
      </div>

      {/* 1인당 채무 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">1인당 채무</span>
        <span className={`text-base md:text-base font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
          {formatDebtPerCapita(currentDebt, district.population)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Ranking Row
// ============================================================

function RankingRow({
  rank,
  district,
  total,
}: {
  rank: number;
  district: DistrictFiscalData;
  total: number;
}) {
  const perCapita = getDebtPerCapitaManWon(district.debt, district.population);
  const isTop10 = rank <= 10;
  const isBottom10 = rank > total - 10;

  let rowBg = '';
  if (isTop10) rowBg = 'bg-emerald-950/30';
  else if (isBottom10) rowBg = 'bg-red-950/30';

  return (
    <div className={`grid grid-cols-12 items-center gap-1 px-2 md:px-3 py-2 border-b border-gray-800/50 ${rowBg}`}>
      {/* Rank */}
      <div className="col-span-1 text-center">
        <span className={`text-base font-mono font-bold tabular-nums ${isTop10 ? 'text-emerald-400' : isBottom10 ? 'text-red-400' : 'text-gray-500'}`}>
          {rank}
        </span>
      </div>

      {/* Name */}
      <div className="col-span-3 truncate">
        <div className={`text-base font-bold truncate ${independenceColor(district.independence)}`}>
          {district.name}
        </div>
        <div className="text-xs text-gray-600 truncate">{district.metro}</div>
      </div>

      {/* 자립도 + bar */}
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <span className={`text-base font-mono font-bold tabular-nums w-14 text-right ${independenceColor(district.independence)}`}>
            {district.independence.toFixed(1)}%
          </span>
          <div className="flex-1 hidden md:block">
            <Bar value={district.independence} max={80} colorClass={independenceBarColor(district.independence)} height="h-2" />
          </div>
        </div>
      </div>

      {/* 자주도 */}
      <div className="col-span-2">
        <span className="text-base font-mono font-bold tabular-nums text-blue-400">
          {district.autonomy.toFixed(1)}%
        </span>
      </div>

      {/* 1인당 채무 */}
      <div className="col-span-2">
        <span className={`text-base font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
          {formatDebtPerCapita(district.debt, district.population)}
        </span>
      </div>

      {/* 지역채무 */}
      <div className="col-span-2">
        <span className="text-sm font-mono tabular-nums text-gray-400">
          {formatDebt(district.debt)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Compare Side
// ============================================================

function CompareSide({
  label,
  data,
  color,
}: {
  label: string;
  data: DistrictFiscalData | null;
  color: string;
}) {
  if (!data) {
    return (
      <div className="flex-1 border border-gray-800 p-4 text-center text-gray-600">
        {label}을 선택하세요
      </div>
    );
  }

  const perCapita = getDebtPerCapitaManWon(data.debt, data.population);

  return (
    <div className="flex-1 space-y-1">
      <div className={`text-center text-lg md:text-xl font-bold ${color} py-2 border border-gray-800`}>
        {data.metro} {data.name}
      </div>

      {/* Metrics */}
      <div className="border border-gray-800 p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base text-gray-500">재정자립도</span>
            <span className={`text-lg md:text-xl font-mono font-bold tabular-nums ${independenceColor(data.independence)}`}>
              {data.independence.toFixed(1)}%
            </span>
          </div>
          <Bar value={data.independence} max={100} colorClass={independenceBarColor(data.independence)} height="h-4" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base text-gray-500">재정자주도</span>
            <span className="text-lg md:text-xl font-mono font-bold tabular-nums text-blue-400">
              {data.autonomy.toFixed(1)}%
            </span>
          </div>
          <Bar value={data.autonomy} max={100} colorClass={autonomyBarColor(data.autonomy)} height="h-4" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <span className="text-sm md:text-base text-gray-500">지역채무</span>
          <span className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatDebt(data.debt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-gray-500">1인당 채무</span>
          <span className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatDebtPerCapita(data.debt, data.population)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm md:text-base text-gray-500">인구</span>
          <span className="text-lg md:text-xl font-mono font-bold tabular-nums text-gray-300">
            {formatPopulation(data.population)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Metro Detail Modal (확대 보기)
// ============================================================

function MetroDetailModal({
  metro,
  nationalAvg,
  onClose,
}: {
  metro: MetroFiscalData;
  nationalAvg: { independence: number; autonomy: number; totalDebt: number };
  onClose: () => void;
}) {
  // ESC key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const currentDebt = getCurrentMetroDebt(metro.name, metro.debt);
  const perCapita = getDebtPerCapitaManWon(currentDebt, metro.population);
  const yearlyIncrease = METRO_YEARLY_DEBT_INCREASE[metro.name] ?? metro.debt * 0.06;
  const indDiff = metro.independence - nationalAvg.independence;
  const autDiff = metro.autonomy - nationalAvg.autonomy;
  const debtBudgetRatio = ((currentDebt / metro.budget) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-gray-700 rounded-lg max-w-lg w-full p-5 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className={`text-xl md:text-2xl font-bold ${independenceColor(metro.independence)}`}>
            {metro.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none px-2"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        {/* 재정자립도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base md:text-base text-gray-400">재정자립도</span>
            <span className={`text-xl md:text-2xl font-mono font-bold tabular-nums ${independenceColor(metro.independence)}`}>
              {metro.independence.toFixed(1)}%
            </span>
          </div>
          <Bar value={metro.independence} max={100} colorClass={independenceBarColor(metro.independence)} height="h-5" />
          <div className="text-sm md:text-base text-gray-500">
            전국 평균 {nationalAvg.independence}% 대비{' '}
            <span className={indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {indDiff >= 0 ? '+' : ''}{indDiff.toFixed(1)}%p
            </span>
          </div>
        </div>

        {/* 재정자주도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base md:text-base text-gray-400">재정자주도</span>
            <span className="text-xl md:text-2xl font-mono font-bold tabular-nums text-blue-400">
              {metro.autonomy.toFixed(1)}%
            </span>
          </div>
          <Bar value={metro.autonomy} max={100} colorClass={autonomyBarColor(metro.autonomy)} height="h-5" />
          <div className="text-sm md:text-base text-gray-500">
            전국 평균 {nationalAvg.autonomy}% 대비{' '}
            <span className={autDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {autDiff >= 0 ? '+' : ''}{autDiff.toFixed(1)}%p
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800" />

        {/* 지역채무 실시간 */}
        <div className="space-y-1">
          <div className="text-base md:text-base text-gray-400">지역채무 (실시간)</div>
          <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatRawWon(currentDebt)}
          </div>
          <div className="flex items-center gap-3 text-sm md:text-base text-gray-500">
            <span>≈ {formatDebt(currentDebt)}</span>
            <span>|</span>
            <span>초당 +{formatPerSecond(yearlyIncrease)}</span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800" />

        {/* 상세 지표 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">1인당 채무</div>
            <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
              {formatDebtPerCapita(currentDebt, metro.population)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">예산규모</div>
            <div className="text-lg md:text-xl font-mono font-bold tabular-nums text-cyan-400">
              {formatDebt(metro.budget)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">인구</div>
            <div className="text-lg md:text-xl font-mono font-bold tabular-nums text-gray-300">
              {formatPopulation(metro.population)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">채무/예산 비율</div>
            <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtBudgetRatio > 20 ? 'text-red-400' : debtBudgetRatio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {debtBudgetRatio.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 세입 vs 세출 */}
        <div className="border-t border-gray-800 pt-3">
          <div className="text-sm md:text-base text-gray-500 mb-2">세입 vs 세출</div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-10">세입</span>
              <div className="flex-1">
                <Bar value={metro.revenue} max={Math.max(metro.revenue, metro.expenditure) * 1.1} colorClass="bg-cyan-500" height="h-4" />
              </div>
              <span className="text-base font-mono font-bold tabular-nums w-20 text-right text-cyan-400">
                {formatDebt(metro.revenue)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-10">세출</span>
              <div className="flex-1">
                <Bar value={metro.expenditure} max={Math.max(metro.revenue, metro.expenditure) * 1.1} colorClass="bg-amber-500" height="h-4" />
              </div>
              <span className="text-base font-mono font-bold tabular-nums w-20 text-right text-amber-400">
                {formatDebt(metro.expenditure)}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            차액(세계잉여금): <span className="text-emerald-400 font-mono">{formatDebt(metro.revenue - metro.expenditure)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// District Detail Modal (시군구 확대 보기)
// ============================================================

function DistrictDetailModal({
  district,
  nationalAvg,
  onClose,
}: {
  district: DistrictFiscalData;
  nationalAvg: { independence: number; autonomy: number; totalDebt: number };
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const currentDebt = getCurrentDistrictDebt(district.debt);
  const perCapita = getDebtPerCapitaManWon(currentDebt, district.population);
  const yearlyIncrease = district.debt * 0.06;
  const indDiff = district.independence - nationalAvg.independence;
  const autDiff = district.autonomy - nationalAvg.autonomy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-gray-700 rounded-lg max-w-lg w-full p-5 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl md:text-2xl font-bold ${independenceColor(district.independence)}`}>
              {district.name}
            </h2>
            <div className="text-base text-gray-500">{district.metro}</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none px-2"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        {/* 재정자립도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base md:text-base text-gray-400">재정자립도</span>
            <span className={`text-xl md:text-2xl font-mono font-bold tabular-nums ${independenceColor(district.independence)}`}>
              {district.independence.toFixed(1)}%
            </span>
          </div>
          <Bar value={district.independence} max={100} colorClass={independenceBarColor(district.independence)} height="h-5" />
          <div className="text-sm md:text-base text-gray-500">
            전국 평균 {nationalAvg.independence}% 대비{' '}
            <span className={indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {indDiff >= 0 ? '+' : ''}{indDiff.toFixed(1)}%p
            </span>
          </div>
        </div>

        {/* 재정자주도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base md:text-base text-gray-400">재정자주도</span>
            <span className="text-xl md:text-2xl font-mono font-bold tabular-nums text-blue-400">
              {district.autonomy.toFixed(1)}%
            </span>
          </div>
          <Bar value={district.autonomy} max={100} colorClass={autonomyBarColor(district.autonomy)} height="h-5" />
          <div className="text-sm md:text-base text-gray-500">
            전국 평균 {nationalAvg.autonomy}% 대비{' '}
            <span className={autDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {autDiff >= 0 ? '+' : ''}{autDiff.toFixed(1)}%p
            </span>
          </div>
        </div>

        <div className="border-t border-gray-800" />

        {/* 지역채무 실시간 */}
        <div className="space-y-1">
          <div className="text-base md:text-base text-gray-400">지역채무 (실시간)</div>
          <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
            {formatRawWon(currentDebt)}
          </div>
          <div className="flex items-center gap-3 text-sm md:text-base text-gray-500">
            <span>≈ {formatDebt(currentDebt)}</span>
            <span>|</span>
            <span>초당 +{formatPerSecond(yearlyIncrease)}</span>
          </div>
        </div>

        <div className="border-t border-gray-800" />

        {/* 상세 지표 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">1인당 채무</div>
            <div className={`text-lg md:text-xl font-mono font-bold tabular-nums ${debtColor(perCapita)}`}>
              {formatDebtPerCapita(currentDebt, district.population)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm md:text-base text-gray-500">인구</div>
            <div className="text-lg md:text-xl font-mono font-bold tabular-nums text-gray-300">
              {formatPopulation(district.population)}
            </div>
          </div>
        </div>

        {/* 세입 vs 세출 */}
        {(() => {
          const { revenue, expenditure } = getDistrictRevenueExpenditure(district);
          const maxVal = Math.max(revenue, expenditure) * 1.1;
          return (
            <div className="border-t border-gray-800 pt-3">
              <div className="text-sm md:text-base text-gray-500 mb-2">세입 vs 세출</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-10">세입</span>
                  <div className="flex-1">
                    <Bar value={revenue} max={maxVal} colorClass="bg-cyan-500" height="h-4" />
                  </div>
                  <span className="text-base font-mono font-bold tabular-nums w-20 text-right text-cyan-400">
                    {formatDebt(revenue)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-10">세출</span>
                  <div className="flex-1">
                    <Bar value={expenditure} max={maxVal} colorClass="bg-amber-500" height="h-4" />
                  </div>
                  <span className="text-base font-mono font-bold tabular-nums w-20 text-right text-amber-400">
                    {formatDebt(expenditure)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                차액(세계잉여금): <span className="text-emerald-400 font-mono">{formatDebt(revenue - expenditure)}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ============================================================
// National Debt Ratio Chart (SVG)
// ============================================================

function NationalDebtChart({ data }: { data: NationalDebtHistoryEntry[] }) {
  // Chart dimensions
  const W = 800;
  const H = 320;
  const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const minY = Math.floor(Math.min(...data.map((d) => d.ratio)) / 5) * 5;
  const maxY = Math.ceil(Math.max(...data.map((d) => d.ratio)) / 5) * 5 + 5;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  // Build line path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.ratio).toFixed(1)}`)
    .join(' ');

  // Area fill path
  const areaPath = linePath + ` L ${xScale(data.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;

  // Y-axis grid lines
  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 5) yTicks.push(v);

  return (
    <div className="border border-gray-800 p-3 md:p-5">
      <div className="text-base md:text-base font-bold text-gray-300 mb-3">
        GDP 대비 국가채무비율 (D1 기준, 2013~2025)
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ maxHeight: '360px' }}>
          {/* Grid lines */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={yScale(v)}
                x2={W - PAD.right}
                y2={yScale(v)}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray={v === minY ? 'none' : '4,4'}
              />
              <text
                x={PAD.left - 8}
                y={yScale(v) + 4}
                textAnchor="end"
                fill="#6b7280"
                fontSize="12"
                fontFamily="monospace"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#debtGradient)" opacity="0.3" />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Data points and labels */}
          {data.map((d, i) => (
            <g key={d.year}>
              {/* Dot */}
              <circle
                cx={xScale(i)}
                cy={yScale(d.ratio)}
                r="5"
                fill="#ef4444"
                stroke="#1f2937"
                strokeWidth="2"
              />
              {/* Value label */}
              <text
                x={xScale(i)}
                y={yScale(d.ratio) - 12}
                textAnchor="middle"
                fill="#f87171"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {d.ratio.toFixed(1)}%
              </text>
              {/* Year label */}
              <text
                x={xScale(i)}
                y={H - PAD.bottom + 20}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="11"
                fontFamily="monospace"
              >
                {d.year}
              </text>
              {/* Debt amount (below year) */}
              <text
                x={xScale(i)}
                y={H - PAD.bottom + 35}
                textAnchor="middle"
                fill="#4b5563"
                fontSize="9"
                fontFamily="monospace"
              >
                {d.debt.toFixed(0)}조
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-600">
        <span>● 국가채무비율 (GDP 대비 %)</span>
        <span>|</span>
        <span>출처: e-나라지표, 기획재정부</span>
      </div>
    </div>
  );
}

// ============================================================
// Metro Debt Ratio Trend (mini SVG chart per metro)
// ============================================================

function MetroDebtRatioMiniChart({ name, history, onClick }: { name: string; history: MetroDebtHistoryEntry[]; onClick: () => void }) {
  if (history.length === 0) return null;

  const W = 200;
  const H = 80;
  const PAD = { top: 5, right: 5, bottom: 15, left: 5 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios)) - 1;
  const maxY = Math.ceil(Math.max(...ratios)) + 1;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;

  // Short name for display
  const shortName = name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');

  return (
    <div
      className="border border-gray-800 p-3 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-base font-bold text-gray-300 truncate">{shortName}</span>
        <span className={`text-base font-mono font-bold tabular-nums ${change > 2 ? 'text-red-400' : change > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {latest.ratio.toFixed(1)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '60px' }}>
        <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2" strokeLinejoin="round" />
        {history.map((h, i) => (
          <circle
            key={h.year}
            cx={xScale(i)}
            cy={yScale(h.ratio)}
            r="3"
            fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'}
          />
        ))}
        {/* Start and end year labels */}
        <text x={xScale(0)} y={H - 2} textAnchor="start" fill="#6b7280" fontSize="9" fontFamily="monospace">{first.year}</text>
        <text x={xScale(history.length - 1)} y={H - 2} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">{latest.year}</text>
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">채무/예산</span>
        <span className={change > 0 ? 'text-red-400' : 'text-emerald-400'}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%p ({first.year}→{latest.year})
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Metro Debt Ratio Detail Modal
// ============================================================

function MetroDebtRatioModal({
  name,
  history,
  onClose,
}: {
  name: string;
  history: MetroDebtHistoryEntry[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (history.length === 0) return null;

  const W = 600;
  const H = 280;
  const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios) / 2) * 2;
  const maxY = Math.ceil(Math.max(...ratios) / 2) * 2 + 2;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const areaPath = linePath + ` L ${xScale(history.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;

  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 2) yTicks.push(v);

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border border-gray-700 rounded-lg max-w-2xl w-full p-5 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-200">{name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none px-2"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>

        <div className="text-base text-gray-400">예산 대비 채무비율 추이 ({first.year}~{latest.year})</div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '300px' }}>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#374151" strokeWidth="1" strokeDasharray={v === minY ? 'none' : '4,4'} />
                <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill="#6b7280" fontSize="12" fontFamily="monospace">{v}%</text>
              </g>
            ))}
            <path d={areaPath} fill="url(#metroGrad)" opacity="0.3" />
            <defs>
              <linearGradient id="metroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={change > 2 ? '#ef4444' : '#fbbf24'} stopOpacity="0.6" />
                <stop offset="100%" stopColor={change > 2 ? '#ef4444' : '#fbbf24'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {history.map((h, i) => (
              <g key={h.year}>
                <circle cx={xScale(i)} cy={yScale(h.ratio)} r="5" fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} stroke="#1f2937" strokeWidth="2" />
                <text x={xScale(i)} y={yScale(h.ratio) - 12} textAnchor="middle" fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} fontSize="11" fontWeight="bold" fontFamily="monospace">{h.ratio.toFixed(1)}%</text>
                <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">{h.year}</text>
                <text x={xScale(i)} y={H - PAD.bottom + 33} textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="monospace">{(h.debt / 10000).toFixed(1)}조</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-gray-800 pt-3">
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 채무비율</div>
            <div className={`text-lg font-mono font-bold ${latest.ratio > 15 ? 'text-red-400' : latest.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{latest.ratio.toFixed(1)}%</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">변동폭 ({first.year}→{latest.year})</div>
            <div className={`text-lg font-mono font-bold ${change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%p</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 채무</div>
            <div className="text-lg font-mono font-bold text-gray-300">{(latest.debt / 10000).toFixed(1)}조원</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 예산</div>
            <div className="text-lg font-mono font-bold text-cyan-400">{(latest.budget / 10000).toFixed(1)}조원</div>
          </div>
        </div>

        {/* Year-by-year table */}
        <div className="border-t border-gray-800 pt-3">
          <div className="text-sm text-gray-500 mb-2">연도별 상세</div>
          <div className="grid grid-cols-4 gap-1 text-sm text-gray-500 mb-1 px-1">
            <span>연도</span>
            <span className="text-right">채무(억원)</span>
            <span className="text-right">예산(억원)</span>
            <span className="text-right">비율</span>
          </div>
          {history.map((h) => (
            <div key={h.year} className="grid grid-cols-4 gap-1 text-sm px-1 py-0.5 border-t border-gray-800/50">
              <span className="text-gray-400 font-mono">{h.year}</span>
              <span className="text-right text-gray-400 font-mono tabular-nums">{h.debt.toLocaleString('ko-KR')}</span>
              <span className="text-right text-gray-400 font-mono tabular-nums">{h.budget.toLocaleString('ko-KR')}</span>
              <span className={`text-right font-mono font-bold tabular-nums ${h.ratio > 15 ? 'text-red-400' : h.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{h.ratio.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// District Debt Ratio Mini Chart
// ============================================================

function DistrictDebtRatioMiniChart({
  district,
  history,
  onClick,
}: {
  district: DistrictFiscalData;
  history: DistrictDebtHistoryEntry[];
  onClick: () => void;
}) {
  if (history.length === 0) return null;

  const W = 200;
  const H = 80;
  const PAD = { top: 5, right: 5, bottom: 15, left: 5 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios)) - 1;
  const maxY = Math.ceil(Math.max(...ratios)) + 1;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;

  return (
    <div
      className="border border-gray-800 p-2.5 cursor-pointer hover:border-gray-600 hover:bg-gray-900/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-300 truncate">{district.name}</span>
        <span className={`text-sm font-mono font-bold tabular-nums ${change > 2 ? 'text-red-400' : change > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {latest.ratio.toFixed(1)}%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '50px' }}>
        <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2" strokeLinejoin="round" />
        {history.map((h, i) => (
          <circle
            key={h.year}
            cx={xScale(i)}
            cy={yScale(h.ratio)}
            r="2.5"
            fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'}
          />
        ))}
        <text x={xScale(0)} y={H - 2} textAnchor="start" fill="#6b7280" fontSize="9" fontFamily="monospace">{first.year}</text>
        <text x={xScale(history.length - 1)} y={H - 2} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">{latest.year}</text>
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 italic">추정</span>
        <span className={change > 0 ? 'text-red-400' : 'text-emerald-400'}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%p
        </span>
      </div>
    </div>
  );
}

// ============================================================
// District Debt Ratio Detail Modal
// ============================================================

function DistrictDebtRatioModal({
  district,
  history,
  onClose,
}: {
  district: DistrictFiscalData;
  history: DistrictDebtHistoryEntry[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (history.length === 0) return null;

  const W = 600;
  const H = 280;
  const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const ratios = history.map((h) => h.ratio);
  const minY = Math.floor(Math.min(...ratios) / 2) * 2;
  const maxY = Math.ceil(Math.max(...ratios) / 2) * 2 + 2;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const linePath = history
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`)
    .join(' ');

  const areaPath = linePath + ` L ${xScale(history.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;

  const yTicks: number[] = [];
  for (let v = minY; v <= maxY; v += 2) yTicks.push(v);

  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest.ratio - first.ratio;
  const perCapita = getDebtPerCapitaManWon(district.debt, district.population);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-950 border border-gray-700 rounded-lg max-w-2xl w-full p-5 md:p-7 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-200">{district.name}</h2>
            <div className="text-sm text-gray-600 mt-0.5">{district.metro}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-2xl leading-none px-2" aria-label="닫기">&times;</button>
        </div>

        <div className="bg-amber-950/30 border border-amber-900/50 rounded px-3 py-2 text-xs text-amber-400/80">
          이 추이는 {district.metro} 광역의 실제 채무비율 변동 패턴을 기반으로 추정한 값입니다.
          시군구별 예산 데이터가 공개되어 있지 않아 실제 결산값과 차이가 있을 수 있습니다.
        </div>

        <div className="text-base text-gray-400">채무비율 추이 추정 ({first.year}~{latest.year})</div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '300px' }}>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#374151" strokeWidth="1" strokeDasharray={v === minY ? 'none' : '4,4'} />
                <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill="#6b7280" fontSize="12" fontFamily="monospace">{v}%</text>
              </g>
            ))}
            <defs>
              <linearGradient id="districtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={change > 2 ? '#ef4444' : '#fbbf24'} stopOpacity="0.6" />
                <stop offset="100%" stopColor={change > 2 ? '#ef4444' : '#fbbf24'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#districtGrad)" opacity="0.3" />
            <path d={linePath} fill="none" stroke={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {history.map((h, i) => (
              <g key={h.year}>
                <circle cx={xScale(i)} cy={yScale(h.ratio)} r="5" fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} stroke="#1f2937" strokeWidth="2" />
                <text x={xScale(i)} y={yScale(h.ratio) - 12} textAnchor="middle" fill={change > 2 ? '#f87171' : change > 0 ? '#fbbf24' : '#34d399'} fontSize="11" fontWeight="bold" fontFamily="monospace">{h.ratio.toFixed(1)}%</text>
                <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="monospace">{h.year}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-gray-800 pt-3">
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">{latest.year} 채무비율 (추정)</div>
            <div className={`text-lg font-mono font-bold ${latest.ratio > 15 ? 'text-red-400' : latest.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{latest.ratio.toFixed(1)}%</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">변동폭 ({first.year}→{latest.year})</div>
            <div className={`text-lg font-mono font-bold ${change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%p</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-sm text-gray-500">1인당 채무 (실측)</div>
            <div className="text-lg font-mono font-bold text-cyan-400">{Math.round(perCapita).toLocaleString('ko-KR')}만원</div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-3">
          <div className="text-sm text-gray-500 mb-2">연도별 채무 추이 (추정)</div>
          <div className="grid grid-cols-3 gap-1 text-sm text-gray-500 mb-1 px-1">
            <span>연도</span>
            <span className="text-right">채무 추정(억원)</span>
            <span className="text-right">비율 추정</span>
          </div>
          {history.map((h) => (
            <div key={h.year} className="grid grid-cols-3 gap-1 text-sm px-1 py-0.5 border-t border-gray-800/50">
              <span className="text-gray-400 font-mono">{h.year}</span>
              <span className="text-right text-gray-400 font-mono tabular-nums">{h.debt.toLocaleString('ko-KR')}</span>
              <span className={`text-right font-mono font-bold tabular-nums ${h.ratio > 15 ? 'text-red-400' : h.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{h.ratio.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function FiscalHealthDashboard() {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastUpdate = 0;
    function loop(timestamp: number) {
      if (timestamp - lastUpdate >= 100) {
        setTick((t) => t + 1);
        lastUpdate = timestamp;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  void tick;

  const [mode, setMode] = useState<ViewMode>('fiscalStatus');
  const [fiscalSubMode, setFiscalSubMode] = useState<'metro' | 'district'>('metro');
  const [sortKey, setSortKey] = useState<SortKey>('independence');

  // Compare mode state
  const [metroA, setMetroA] = useState('서울특별시');
  const [metroB, setMetroB] = useState('경기도');
  const [districtA, setDistrictA] = useState('강남구');
  const [districtB, setDistrictB] = useState('성남시');

  // Expanded metro modal
  const [expandedMetro, setExpandedMetro] = useState<MetroFiscalData | null>(null);

  // Expanded district modal
  const [expandedDistrict, setExpandedDistrict] = useState<DistrictFiscalData | null>(null);

  // District grid filter
  const [districtMetroFilter, setDistrictMetroFilter] = useState<string>('전체');

  // Health score district filter
  const [healthScoreMetroFilter, setHealthScoreMetroFilter] = useState<string>('전체');

  // Debt ratio modal state
  const [debtRatioMetro, setDebtRatioMetro] = useState<string | null>(null);
  const [debtRatioDistrict, setDebtRatioDistrict] = useState<DistrictFiscalData | null>(null);
  const [debtRatioDistrictFilter, setDebtRatioDistrictFilter] = useState<string>('전체');

  // Global region filter
  const [globalMetro, setGlobalMetro] = useState<string>('전체');
  const [globalDistrict, setGlobalDistrict] = useState<string>('전체');

  // Data
  const metroData = useMemo(() => getMetroFiscalData(), []);
  const allDistricts = useMemo(() => getAllDistrictFiscalData(), []);
  const nationalAvg = useMemo(() => getNationalAverage(), []);
  const metroNameList = useMemo(() => getMetroNames(), []);
  const nationalDebtHistory = useMemo(() => getNationalDebtHistory(), []);

  const globalDistrictList = useMemo(() => {
    if (globalMetro === '전체') return [];
    return allDistricts.filter(d => d.metro === globalMetro);
  }, [allDistricts, globalMetro]);

  useEffect(() => {
    setGlobalDistrict('전체');
  }, [globalMetro]);

  // Total population and debt from metro data
  const totals = useMemo(() => {
    const totalPop = metroData.reduce((sum, m) => sum + m.population, 0);
    const totalDebt = metroData.reduce((sum, m) => sum + m.debt, 0);
    return { totalPop, totalDebt };
  }, [metroData]);

  // Filtered districts for grid view
  const filteredDistricts = useMemo(() => {
    const list = districtMetroFilter === '전체' ? allDistricts : allDistricts.filter((d) => d.metro === districtMetroFilter);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [allDistricts, districtMetroFilter]);

  // Filtered districts for debt ratio trend view
  const filteredDistrictsForDebtRatio = useMemo(() => {
    const list = debtRatioDistrictFilter === '전체'
      ? allDistricts
      : allDistricts.filter((d) => d.metro === debtRatioDistrictFilter);
    return list.map((d) => ({ district: d, history: generateDistrictDebtHistory(d) }));
  }, [allDistricts, debtRatioDistrictFilter]);

  // Districts for compare dropdowns
  const districtsA = useMemo(() => getDistrictFiscalData(metroA), [metroA]);
  const districtsB = useMemo(() => getDistrictFiscalData(metroB), [metroB]);

  // Reset district selection when metro changes
  const selectedA = useMemo(() => {
    const found = districtsA.find((d) => d.name === districtA);
    if (!found && districtsA.length > 0) return districtsA[0];
    return found ?? null;
  }, [districtsA, districtA]);

  const selectedB = useMemo(() => {
    const found = districtsB.find((d) => d.name === districtB);
    if (!found && districtsB.length > 0) return districtsB[0];
    return found ?? null;
  }, [districtsB, districtB]);

  // Sorted districts for ranking mode (filtered by globalMetro)
  const sortedDistricts = useMemo(() => {
    const base = globalMetro === '전체' ? allDistricts : allDistricts.filter(d => d.metro === globalMetro);
    const sorted = [...base];
    switch (sortKey) {
      case 'independence':
        sorted.sort((a, b) => b.independence - a.independence);
        break;
      case 'autonomy':
        sorted.sort((a, b) => b.autonomy - a.autonomy);
        break;
      case 'debtPerCapita':
        sorted.sort(
          (a, b) =>
            getDebtPerCapitaManWon(b.debt, b.population) -
            getDebtPerCapitaManWon(a.debt, a.population),
        );
        break;
    }
    return sorted;
  }, [allDistricts, sortKey, globalMetro]);

  function handleGlobalMetroChange(metro: string) {
    setGlobalMetro(metro);
    if (metro !== '전체') {
      setDistrictMetroFilter(metro);
      setHealthScoreMetroFilter(metro);
      setDebtRatioDistrictFilter(metro);
      setMetroA(metro);
      if (mode === 'fiscalStatus') {
        setFiscalSubMode('district');
      }
    } else {
      setDistrictMetroFilter('전체');
      setHealthScoreMetroFilter('전체');
      setDebtRatioDistrictFilter('전체');
    }
  }

  function handleGlobalDistrictChange(districtName: string) {
    setGlobalDistrict(districtName);
    if (districtName !== '전체') {
      const d = allDistricts.find(dd => dd.metro === globalMetro && dd.name === districtName);
      if (d) {
        setExpandedDistrict(d);
        setDistrictA(districtName);
      }
    }
  }

  return (
    <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1 font-mono">
      {/* ====== TITLE BAR ====== */}
      <div className="border border-gray-800 px-3 py-2 text-center">
        <h1 className="text-base md:text-base font-bold tracking-[0.3em] uppercase text-gray-400">
          지역재정 건전성 대시보드
        </h1>
        <p className="text-xs md:text-sm text-gray-600 mt-0.5">
          재정자립도 &middot; 재정자주도 &middot; 지역채무 &mdash; 2025 당초예산 기준
        </p>
      </div>

      {/* ====== HERO: 지역채무 총액 실시간 ====== */}
      {(() => {
        const totalCurrentDebt = metroData.reduce(
          (sum, m) => sum + getCurrentMetroDebt(m.name, m.debt),
          0,
        );
        const totalYearlyIncrease = metroData.reduce(
          (sum, m) => sum + (METRO_YEARLY_DEBT_INCREASE[m.name] ?? m.debt * 0.06),
          0,
        );
        return (
          <div className="border border-gray-800 p-3 md:p-5 text-center">
            <div className="text-xs md:text-sm text-gray-500 uppercase tracking-widest mb-1">
              전국 지역채무 총액 &middot; Total Local Government Debt
            </div>
            <div
              className="text-2xl sm:text-3xl md:text-5xl font-mono font-bold text-red-500 tabular-nums leading-none tracking-tight"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatRawWon(totalCurrentDebt)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1.5 space-x-3">
              <span>≈ {formatDebt(totalCurrentDebt)}</span>
              <span>|</span>
              <span>초당 +{formatPerSecond(totalYearlyIncrease)}</span>
            </div>
          </div>
        );
      })()}

      {/* ====== REGION FILTER ====== */}
      <div className="flex items-center gap-3 border border-gray-800 px-3 py-2">
        <span className="text-xs text-gray-500 mr-1">지역 필터</span>
        <select
          value={globalMetro}
          onChange={(e) => handleGlobalMetroChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="전체">전체 광역시도</option>
          {metroNameList.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {globalMetro !== '전체' && (
          <select
            value={globalDistrict}
            onChange={(e) => handleGlobalDistrictChange(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="전체">전체 시군구</option>
            {globalDistrictList.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        )}

        {globalMetro !== '전체' && (
          <button
            onClick={() => {
              setGlobalMetro('전체');
              setGlobalDistrict('전체');
              setDistrictMetroFilter('전체');
              setHealthScoreMetroFilter('전체');
              setDebtRatioDistrictFilter('전체');
            }}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* ====== MODE TABS ====== */}
      <div className="flex items-center gap-2 border border-gray-800 px-3 py-2">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`px-4 py-1.5 rounded-full text-base font-medium transition-colors ${
              mode === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== SECTION: 전국 현황 요약 ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="전국 현황 요약 National Summary" color="text-cyan-400" />
        <Cell
          label="전국 평균 재정자립도"
          value={`${nationalAvg.independence}%`}
          color={independenceColor(nationalAvg.independence)}
          glossaryKey="재정자립도"
        />
        <Cell
          label="전국 평균 재정자주도"
          value={`${nationalAvg.autonomy}%`}
          color="text-blue-400"
          glossaryKey="재정자주도"
        />
        {(() => {
          const totalCurrentDebt = metroData.reduce(
            (sum, m) => sum + getCurrentMetroDebt(m.name, m.debt),
            0,
          );
          return (
            <Cell
              label="전국 지역채무 합계"
              value={formatDebt(totalCurrentDebt)}
              color="text-red-400"
              sub={`${formatRawWon(totalCurrentDebt)}`}
              glossaryKey="지역채무"
            />
          );
        })()}
        {(() => {
          const totalCurrentDebt = metroData.reduce(
            (sum, m) => sum + getCurrentMetroDebt(m.name, m.debt),
            0,
          );
          return (
            <Cell
              label="1인당 지역채무"
              value={formatDebtPerCapita(totalCurrentDebt, totals.totalPop)}
              color="text-amber-400"
              sub={`인구 ${formatPopulation(totals.totalPop)}`}
              glossaryKey="1인당 지역채무"
            />
          );
        })()}
      </div>

      {/* ====== MODE: 재정현황 (광역시도 + 시군구 통합) ====== */}
      {mode === 'fiscalStatus' && (
        <div className="space-y-1">
          {/* globalMetro가 '전체'이면 광역시도 그리드, 아니면 해당 시군구 그리드 */}
          {globalMetro === '전체' ? (
            <>
              <div className="flex items-center gap-2 border border-gray-800 px-3 py-2">
                <div className="ml-auto">
                  <DataDownload
                    data={metroData.map(m => ({
                      광역시도: m.name,
                      재정자립도: m.independence,
                      재정자주도: m.autonomy,
                      '지역채무(억원)': m.debt,
                      인구: m.population,
                      '예산규모(억원)': m.budget,
                    }))}
                    filename="광역시도_재정현황_2025"
                    label=""
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                {metroData.map((metro) => (
                  <MetroCard key={metro.name} metro={metro} onClick={() => setExpandedMetro(metro)} />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* 선택된 광역 재정현황 카드 */}
              {(() => {
                const selected = metroData.find(m => m.name === globalMetro);
                if (!selected) return null;
                return (
                  <div className="grid grid-cols-1 gap-1">
                    <MetroCard metro={selected} onClick={() => setExpandedMetro(selected)} />
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                <SectionHeader
                  title={`${globalMetro} 시군구 재정현황 (${filteredDistricts.length}개)`}
                  color="text-purple-400"
                />
                {filteredDistricts.map((d) => (
                  <DistrictCard
                    key={`${d.metro}-${d.name}`}
                    district={d}
                    onClick={() => setExpandedDistrict(d)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ====== MODE 3: 시군구 순위 ====== */}
      {mode === 'ranking' && (
        <div>
          {/* Sort controls + Download */}
          <div className="flex items-center gap-2 border border-gray-800 px-3 py-2 flex-wrap">
            <span className="text-sm text-gray-500">정렬:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  sortKey === opt.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Header row */}
          <div className="grid grid-cols-12 items-center gap-1 px-2 md:px-3 py-2 border border-gray-800 bg-gray-900">
            <div className="col-span-1 text-center text-xs md:text-sm text-gray-500">#</div>
            <div className="col-span-3 text-xs md:text-sm text-gray-500">시군구</div>
            <div className="col-span-2 text-xs md:text-sm text-gray-500">재정자립도</div>
            <div className="col-span-2 text-xs md:text-sm text-gray-500">재정자주도</div>
            <div className="col-span-2 text-xs md:text-sm text-gray-500">1인당 채무</div>
            <div className="col-span-2 text-xs md:text-sm text-gray-500">지역채무</div>
          </div>

          {/* Rows */}
          <div className="border border-gray-800 border-t-0 max-h-[70vh] overflow-y-auto">
            {sortedDistricts.map((d, i) => (
              <RankingRow
                key={`${d.metro}-${d.name}`}
                rank={i + 1}
                district={d}
                total={sortedDistricts.length}
              />
            ))}
          </div>

          {/* Legend + Download */}
          <div className="flex items-center justify-between border border-gray-800 border-t-0 px-3 py-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-950/50 border border-emerald-800" />
                <span className="text-xs text-gray-500">TOP 10</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-950/50 border border-red-800" />
                <span className="text-xs text-gray-500">BOTTOM 10</span>
              </div>
            </div>
            <DataDownload
              data={sortedDistricts.map((d, i) => ({
                순위: i + 1,
                시군구: d.name,
                광역시도: d.metro,
                재정자립도: d.independence,
                재정자주도: d.autonomy,
                '지역채무(억원)': d.debt,
                인구: d.population,
              }))}
              filename="시군구_순위_2025"
              label=""
            />
          </div>
        </div>
      )}

      {/* ====== MODE 3: 시군구 비교 ====== */}
      {mode === 'compare' && (
        <div className="space-y-1">
          <SectionHeader title="시군구 비교 District Comparison" color="text-purple-400" />

          {/* Picker row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 border border-gray-800 px-3 py-3">
            {/* Side A */}
            <div className="flex-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0" />
              <select
                value={metroA}
                onChange={(e) => {
                  setMetroA(e.target.value);
                  const dists = getDistrictFiscalData(e.target.value);
                  if (dists.length > 0) setDistrictA(dists[0].name);
                }}
                className={SELECT_CLASS}
                aria-label="비교 A 시도"
              >
                {metroNameList.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                value={selectedA?.name ?? ''}
                onChange={(e) => setDistrictA(e.target.value)}
                className={SELECT_CLASS}
                aria-label="비교 A 시군구"
              >
                {districtsA.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <span className="text-gray-500 text-lg font-bold text-center">vs</span>

            {/* Side B */}
            <div className="flex-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <select
                value={metroB}
                onChange={(e) => {
                  setMetroB(e.target.value);
                  const dists = getDistrictFiscalData(e.target.value);
                  if (dists.length > 0) setDistrictB(dists[0].name);
                }}
                className={SELECT_CLASS}
                aria-label="비교 B 시도"
              >
                {metroNameList.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                value={selectedB?.name ?? ''}
                onChange={(e) => setDistrictB(e.target.value)}
                className={SELECT_CLASS}
                aria-label="비교 B 시군구"
              >
                {districtsB.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* No data message if metro has no districts */}
          {districtsA.length === 0 && (
            <div className="border border-gray-800 px-4 py-3 text-base text-gray-600 text-center">
              {metroA}의 시군구 데이터가 없습니다.
            </div>
          )}
          {districtsB.length === 0 && (
            <div className="border border-gray-800 px-4 py-3 text-base text-gray-600 text-center">
              {metroB}의 시군구 데이터가 없습니다.
            </div>
          )}

          {/* Side-by-side comparison */}
          {selectedA && selectedB && (
            <>
              <div className="flex flex-col md:flex-row gap-1">
                <CompareSide label="A" data={selectedA} color="text-cyan-400" />
                <CompareSide label="B" data={selectedB} color="text-amber-400" />
              </div>

              {/* Difference summary */}
              <div className="grid grid-cols-2 md:grid-cols-4">
                <SectionHeader title="비교 결과" color="text-gray-400" />
                {(() => {
                  const indDiff = selectedA.independence - selectedB.independence;
                  const autDiff = selectedA.autonomy - selectedB.autonomy;
                  const pcA = getDebtPerCapitaManWon(selectedA.debt, selectedA.population);
                  const pcB = getDebtPerCapitaManWon(selectedB.debt, selectedB.population);
                  const pcDiff = pcA - pcB;

                  return (
                    <>
                      <Cell
                        label="재정자립도 차이"
                        value={`${indDiff >= 0 ? '+' : ''}${indDiff.toFixed(1)}%p`}
                        color={indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}
                        sub={`${selectedA.name} vs ${selectedB.name}`}
                      />
                      <Cell
                        label="재정자주도 차이"
                        value={`${autDiff >= 0 ? '+' : ''}${autDiff.toFixed(1)}%p`}
                        color={autDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}
                      />
                      <Cell
                        label="1인당 채무 차이"
                        value={`${pcDiff >= 0 ? '+' : ''}${Math.round(pcDiff).toLocaleString('ko-KR')}만원`}
                        color={pcDiff <= 0 ? 'text-emerald-400' : 'text-red-400'}
                        sub="A 기준 차이"
                      />
                      <Cell
                        label="인구 비율"
                        value={
                          selectedA.population > selectedB.population
                            ? `${(selectedA.population / selectedB.population).toFixed(1)}배`
                            : `${(selectedB.population / selectedA.population).toFixed(1)}배`
                        }
                        color="text-gray-300"
                        sub={`${formatPopulation(selectedA.population)} vs ${formatPopulation(selectedB.population)}`}
                      />
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      )}

      {/* ====== MODE 5: 채무비율 추이 ====== */}
      {mode === 'debtRatio' && (
        <div className="space-y-1">
          {/* National Chart (전체일 때만) */}
          {globalMetro === '전체' && <NationalDebtChart data={nationalDebtHistory} />}

          {/* 선택된 광역/시군구 채무비율 상세 (인라인) */}
          {globalMetro !== '전체' && (() => {
            const metro = metroData.find(m => m.name === globalMetro);
            if (!metro) return null;

            // 시군구 선택 시 시군구 추정 데이터 사용, 아니면 광역 데이터 사용
            const selectedDistrict = globalDistrict !== '전체'
              ? allDistricts.find(d => d.metro === globalMetro && d.name === globalDistrict)
              : null;

            const chartLabel = selectedDistrict ? `${globalMetro} ${selectedDistrict.name}` : globalMetro;
            const chartSubLabel = selectedDistrict ? '예산 대비 채무비율 추이 (광역 패턴 기반 추정)' : '예산 대비 채무비율 추이';

            // 시군구 선택 → 추정 데이터, 광역만 선택 → 광역 실제 데이터
            type ChartEntry = { year: number; ratio: number };
            let history: ChartEntry[];
            if (selectedDistrict) {
              history = generateDistrictDebtHistory(selectedDistrict).map(h => ({ year: h.year, ratio: h.ratio }));
            } else {
              history = getMetroDebtHistory(globalMetro).map(h => ({ year: h.year, ratio: h.ratio }));
            }
            if (history.length === 0) return null;

            const infoEntity = selectedDistrict ?? metro;
            const latest = history[history.length - 1];
            const first = history[0];
            const change = latest.ratio - first.ratio;
            const W = 800, H = 320;
            const PAD = { top: 30, right: 30, bottom: 50, left: 55 };
            const plotW = W - PAD.left - PAD.right;
            const plotH = H - PAD.top - PAD.bottom;
            const ratios = history.map(h => h.ratio);
            const minY = Math.floor(Math.min(...ratios) / 2) * 2;
            const maxY = Math.ceil(Math.max(...ratios) / 2) * 2 + 2;
            const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * plotW;
            const yScale = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY)) * plotH;
            const linePath = history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(h.ratio).toFixed(1)}`).join(' ');
            const areaPath = linePath + ` L ${xScale(history.length - 1).toFixed(1)} ${yScale(minY).toFixed(1)} L ${xScale(0).toFixed(1)} ${yScale(minY).toFixed(1)} Z`;
            const yTicks: number[] = [];
            for (let v = minY; v <= maxY; v += 2) yTicks.push(v);
            return (
              <div className="border border-gray-800 p-3 md:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-200">{chartLabel}</span>
                    <span className="text-sm text-gray-500">{chartSubLabel} ({first.year}~{latest.year})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-mono font-bold ${latest.ratio > 15 ? 'text-red-400' : latest.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{latest.ratio.toFixed(1)}%</span>
                    <span className={`text-sm ${change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%p ({first.year}→{latest.year})</span>
                  </div>
                </div>
                {selectedDistrict && (
                  <div className="text-xs text-gray-600">※ 광역시도 실제 채무비율 변동 패턴을 시군구에 적용한 추정치입니다</div>
                )}
                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ maxHeight: '360px' }}>
                    {yTicks.map(v => (
                      <g key={v}>
                        <line x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)} stroke="#374151" strokeWidth="1" strokeDasharray={v === minY ? 'none' : '4,4'} />
                        <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fill="#6b7280" fontSize="12" fontFamily="monospace">{v}%</text>
                      </g>
                    ))}
                    <defs>
                      <linearGradient id="inlineMetroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={latest.ratio > 15 ? '#ef4444' : latest.ratio > 10 ? '#f59e0b' : '#10b981'} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={latest.ratio > 15 ? '#ef4444' : latest.ratio > 10 ? '#f59e0b' : '#10b981'} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#inlineMetroGrad)" opacity="0.3" />
                    <path d={linePath} fill="none" stroke={latest.ratio > 15 ? '#ef4444' : latest.ratio > 10 ? '#f59e0b' : '#10b981'} strokeWidth="2.5" />
                    {history.map((h, i) => (
                      <g key={h.year}>
                        <circle cx={xScale(i)} cy={yScale(h.ratio)} r="4" fill={h.ratio > 15 ? '#ef4444' : h.ratio > 10 ? '#f59e0b' : '#10b981'} />
                        <text x={xScale(i)} y={yScale(h.ratio) - 10} textAnchor="middle" fill={h.ratio > 15 ? '#ef4444' : h.ratio > 10 ? '#f59e0b' : '#10b981'} fontSize="11" fontFamily="monospace" fontWeight="bold">
                          {h.ratio.toFixed(1)}%
                        </text>
                        <text x={xScale(i)} y={H - PAD.bottom + 18} textAnchor="middle" fill="#6b7280" fontSize="11">{h.year}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="border border-gray-800 p-2 text-center">
                    <div className="text-gray-500 text-xs">재정자립도</div>
                    <div className={`font-bold ${independenceColor(infoEntity.independence)}`}>{infoEntity.independence}%</div>
                  </div>
                  <div className="border border-gray-800 p-2 text-center">
                    <div className="text-gray-500 text-xs">재정자주도</div>
                    <div className="font-bold text-blue-400">{infoEntity.autonomy}%</div>
                  </div>
                  <div className="border border-gray-800 p-2 text-center">
                    <div className="text-gray-500 text-xs">지역채무</div>
                    <div className="font-bold text-red-400">{formatDebt(infoEntity.debt)}</div>
                  </div>
                  <div className="border border-gray-800 p-2 text-center">
                    <div className="text-gray-500 text-xs">1인당 채무</div>
                    <div className="font-bold text-amber-400">{formatDebtPerCapita(infoEntity.debt, infoEntity.population)}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Metro comparison: current debt/budget ratio bar chart */}
          <div className="border border-gray-800 p-3 md:p-5">
            <div className="text-base md:text-base font-bold text-gray-300 mb-1">
              광역시도별 예산 대비 채무비율 (2025 기준)
            </div>
            <div className="text-xs text-gray-600 mb-4">
              클릭하면 연도별 추이를 확인할 수 있습니다
            </div>

            {/* Horizontal bar chart sorted by ratio */}
            <div className="space-y-1.5">
              {[...(globalMetro === '전체' ? metroData : metroData.filter(m => m.name === globalMetro))]
                .map((m) => ({
                  name: m.name,
                  ratio: (m.debt / m.budget) * 100,
                  debt: m.debt,
                  budget: m.budget,
                }))
                .sort((a, b) => b.ratio - a.ratio)
                .map((m) => {
                  const shortName = m.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
                  return (
                    <div
                      key={m.name}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-900/50 px-2 py-1 rounded transition-colors"
                      onClick={() => setDebtRatioMetro(m.name)}
                    >
                      <span className="text-sm text-gray-400 w-16 truncate text-right">{shortName}</span>
                      <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                        <div
                          className={`h-full rounded ${m.ratio > 15 ? 'bg-red-500' : m.ratio > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min((m.ratio / 20) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-base font-mono font-bold tabular-nums w-16 text-right ${m.ratio > 15 ? 'text-red-400' : m.ratio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {m.ratio.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
              <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500" /> &gt;15%</div>
              <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-500" /> 10~15%</div>
              <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-500" /> &lt;10%</div>
            </div>
          </div>

          {/* District top/bottom by per-capita debt */}
          <div className="border border-gray-800 p-3 md:p-5">
            <div className="text-base md:text-base font-bold text-gray-300 mb-2">
              시군구별 1인당 채무 비교
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-red-400 font-bold mb-2">1인당 채무 상위 10</div>
                {[...(globalMetro === '전체' ? allDistricts : allDistricts.filter(d => d.metro === globalMetro))]
                  .sort((a, b) =>
                    getDebtPerCapitaManWon(b.debt, b.population) - getDebtPerCapitaManWon(a.debt, a.population)
                  )
                  .slice(0, 10)
                  .map((d, i) => {
                    const pc = getDebtPerCapitaManWon(d.debt, d.population);
                    return (
                      <div key={`${d.metro}-${d.name}`} className="flex items-center gap-2 py-0.5">
                        <span className="text-sm text-gray-600 w-5 text-right">{i + 1}</span>
                        <span className="text-sm text-gray-400 w-28 truncate">{d.name} <span className="text-gray-600 text-xs">({d.metro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')})</span></span>
                        <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full rounded bg-red-500/70" style={{ width: `${Math.min((pc / 200) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-mono font-bold tabular-nums text-red-400 w-16 text-right">{Math.round(pc)}만원</span>
                      </div>
                    );
                  })}
              </div>
              <div>
                <div className="text-sm text-emerald-400 font-bold mb-2">1인당 채무 하위 10</div>
                {[...(globalMetro === '전체' ? allDistricts : allDistricts.filter(d => d.metro === globalMetro))]
                  .sort((a, b) =>
                    getDebtPerCapitaManWon(a.debt, a.population) - getDebtPerCapitaManWon(b.debt, b.population)
                  )
                  .slice(0, 10)
                  .map((d, i) => {
                    const pc = getDebtPerCapitaManWon(d.debt, d.population);
                    return (
                      <div key={`${d.metro}-${d.name}`} className="flex items-center gap-2 py-0.5">
                        <span className="text-sm text-gray-600 w-5 text-right">{i + 1}</span>
                        <span className="text-sm text-gray-400 w-28 truncate">{d.name} <span className="text-gray-600 text-xs">({d.metro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')})</span></span>
                        <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full rounded bg-emerald-500/70" style={{ width: `${Math.min((pc / 200) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-mono font-bold tabular-nums text-emerald-400 w-16 text-right">{Math.round(pc)}만원</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ─── 광역시도별 가계부채 (2025 가계금융복지조사) ─── */}
          {(() => {
            const householdDebtData = getMetroHouseholdDebt();
            const nationalAvg = getNationalAvgHouseholdDebt();
            const filtered = globalMetro === '전체'
              ? householdDebtData
              : householdDebtData.filter(h => h.name === globalMetro);
            const sorted = [...filtered].sort((a, b) => b.avgDebt - a.avgDebt);
            const maxDebt = Math.max(...householdDebtData.map(h => h.avgDebt));

            return (
              <div className="border border-gray-800 p-3 md:p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-base font-bold text-gray-300">
                      광역시도별 가계부채 (2025 가계금융복지조사)
                    </div>
                    <DataDownload
                      data={sorted.map(h => ({
                        광역시도: h.name,
                        '가구당 평균부채(만원)': h.avgDebt,
                        '금융부채(만원)': h.avgFinDebt,
                        '임대보증금(만원)': h.avgDeposit,
                        '부채보유가구비율(%)': h.debtHoldingRate,
                        '가구당 평균자산(만원)': h.avgAsset,
                      }))}
                      filename="metro-household-debt-2025"
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    출처: 통계청·한국은행·금융감독원 | 2025년 3월말 기준 | 가구당 평균 부채 (만원)
                  </div>
                </div>

                {/* Horizontal bar chart */}
                <div className="space-y-1.5">
                  {sorted.map((h) => {
                    const shortName = h.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
                    const aboveAvg = h.avgDebt >= nationalAvg;
                    return (
                      <div key={h.name} className="flex items-center gap-2 px-2 py-1">
                        <span className="text-sm text-gray-400 w-16 truncate text-right">{shortName}</span>
                        <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                          <div
                            className={`h-full rounded ${aboveAvg ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(h.avgDebt / maxDebt) * 100}%` }}
                          />
                          {/* National average dashed line */}
                          <div
                            className="absolute top-0 h-full border-l-2 border-dashed border-gray-500"
                            style={{ left: `${(nationalAvg / maxDebt) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-mono font-bold tabular-nums w-24 text-right ${aboveAvg ? 'text-red-400' : 'text-emerald-400'}`}>
                          {h.avgDebt.toLocaleString()}만원
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-600 flex-wrap">
                  <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500" /> 전국 평균 이상</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-emerald-500" /> 전국 평균 미만</div>
                  <div className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed border-gray-500" /> 전국 평균 ({nationalAvg.toLocaleString()}만원)</div>
                </div>

                {/* Debt composition breakdown */}
                <div className="border-t border-gray-800 pt-3">
                  <div className="text-sm font-bold text-gray-400 mb-2">부채 구성 (금융부채 vs 임대보증금)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sorted.map((h) => {
                      const shortName = h.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '');
                      const finPct = ((h.avgFinDebt / h.avgDebt) * 100).toFixed(0);
                      const depPct = ((h.avgDeposit / h.avgDebt) * 100).toFixed(0);
                      const aboveAvg = h.avgDebt >= nationalAvg;
                      // Find matching metro fiscal data for regional debt comparison
                      const metroFiscal = metroData.find(m => m.name === h.name);
                      return (
                        <div key={h.name} className="border border-gray-800 p-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-300">{shortName}</span>
                            <span className={`text-sm font-mono font-bold ${aboveAvg ? 'text-red-400' : 'text-emerald-400'}`}>
                              {h.avgDebt.toLocaleString()}만원
                            </span>
                          </div>
                          {/* Stacked bar showing composition */}
                          <div className="flex h-3 rounded overflow-hidden">
                            <div className="bg-blue-500" style={{ width: `${finPct}%` }} title={`금융부채 ${finPct}%`} />
                            <div className="bg-amber-500" style={{ width: `${depPct}%` }} title={`임대보증금 ${depPct}%`} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>금융 {h.avgFinDebt.toLocaleString()}만 ({finPct}%)</span>
                            <span>보증금 {h.avgDeposit.toLocaleString()}만 ({depPct}%)</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">부채보유가구</span>
                            <span className="text-gray-400 font-mono">{h.debtHoldingRate}%</span>
                          </div>
                          {metroFiscal && (
                            <div className="flex justify-between text-xs border-t border-gray-800 pt-1">
                              <span className="text-gray-600">지역채무</span>
                              <span className="text-gray-400 font-mono">{formatDebt(metroFiscal.debt)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stacked bar legend */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-500" /> 금융부채</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-amber-500" /> 임대보증금</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== MODE 6: 재정건전성 점수 (100점 만점) ====== */}
      {mode === 'healthScore' && (
        <div className="space-y-1">
          <SectionHeader title="재정건전성 점수 Fiscal Health Score" color="text-emerald-400" />
          <div className="border border-gray-800 p-3 md:p-5">
            <div className="text-sm text-gray-500 mb-3">
              재정자립도(30점) + 재정자주도(25점) + 채무비율(25점) + 1인당채무(20점) = 100점 만점
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(globalMetro === '전체' ? metroData : metroData.filter(m => m.name === globalMetro)).map((metro) => {
                const score = calculateFiscalHealthScore(metro);
                return (
                  <div key={metro.name} className="border border-gray-800 p-3 space-y-2 hover:border-gray-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-300 truncate">{metro.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')}</span>
                      <span className="text-lg">{gradeEmoji(score.grade)}</span>
                    </div>
                    {/* 총점 + 등급 */}
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-mono font-bold ${gradeColor(score.grade)}`}>{score.total}</span>
                      <span className="text-sm text-gray-500">/ 100점</span>
                      <span className={`px-2 py-0.5 rounded text-sm font-bold ${gradeBgColor(score.grade)} text-gray-950`}>
                        {score.grade}등급
                      </span>
                    </div>
                    {/* 점수 바 */}
                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${gradeBgColor(score.grade)} transition-all`} style={{ width: `${score.total}%` }} />
                    </div>
                    {/* 세부 점수 */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">자립도</span>
                        <span className="font-mono text-gray-300">{score.breakdown.independence}/30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">자주도</span>
                        <span className="font-mono text-gray-300">{score.breakdown.autonomy}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">채무비율</span>
                        <span className="font-mono text-gray-300">{score.breakdown.debtRatio}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">1인당채무</span>
                        <span className="font-mono text-gray-300">{score.breakdown.debtPerCapita}/20</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 등급 범례 */}
          <div className="flex items-center justify-center gap-4 border border-gray-800 px-3 py-2 flex-wrap">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
              <div key={g} className="flex items-center gap-1.5">
                <span className="text-base">{gradeEmoji(g)}</span>
                <span className={`text-sm font-bold ${gradeColor(g)}`}>{g}</span>
                <span className="text-xs text-gray-600">
                  {g === 'A' ? '80+' : g === 'B' ? '65~79' : g === 'C' ? '50~64' : g === 'D' ? '35~49' : '~34'}
                </span>
              </div>
            ))}
          </div>

          {/* 다운로드 */}
          <div className="flex justify-end border border-gray-800 px-3 py-2">
            <DataDownload
              data={metroData.map((m) => {
                const s = calculateFiscalHealthScore(m);
                return {
                  광역시도: m.name,
                  총점: s.total,
                  등급: s.grade,
                  '자립도점수': s.breakdown.independence,
                  '자주도점수': s.breakdown.autonomy,
                  '채무비율점수': s.breakdown.debtRatio,
                  '1인당채무점수': s.breakdown.debtPerCapita,
                };
              })}
              filename="재정건전성점수_2025"
            />
          </div>

          {/* ── 시군구 건전성 점수 ── */}
          <div className="border-t-2 border-gray-700 mt-4 pt-3">
            <SectionHeader title="시군구 건전성 점수 District Health Score" color="text-teal-400" />
          </div>

          {/* 시군구 건전성 점수는 상단 지역 필터와 연동 */}

          {/* 시군구 점수 그리드 */}
          <div className="border border-gray-800 p-3 md:p-5">
            <div className="text-sm text-gray-500 mb-3">
              광역시도와 동일한 4지표 산출: 재정자립도(30) + 재정자주도(25) + 채무비율(25) + 1인당채무(20)
            </div>
            {(() => {
              const filtered = globalMetro === '전체'
                ? allDistricts
                : allDistricts.filter((d) => d.metro === globalMetro);
              const scored = filtered
                .map((d) => ({ district: d, score: calculateDistrictHealthScore(d) }))
                .sort((a, b) => b.score.total - a.score.total);
              const gradeStats = { A: 0, B: 0, C: 0, D: 0, F: 0 };
              scored.forEach(({ score }) => { gradeStats[score.grade]++; });
              const avgTotal = scored.length > 0
                ? Math.round(scored.reduce((sum, s) => sum + s.score.total, 0) / scored.length)
                : 0;
              return (
                <>
                  {/* 요약 통계 */}
                  <div className="flex items-center gap-4 mb-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-500">평균</span>
                      <span className="text-lg font-mono font-bold text-teal-400">{avgTotal}점</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
                        <span key={g} className={`text-xs font-mono px-1.5 py-0.5 rounded ${gradeBgColor(g)} text-gray-950 font-bold`}>
                          {g}: {gradeStats[g]}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">총 {scored.length}개 자치단체</span>
                  </div>

                  {/* 카드 그리드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {scored.map(({ district: d, score }, idx) => (
                      <div key={`${d.metro}-${d.name}`} className="border border-gray-800 p-2.5 space-y-1.5 hover:border-gray-600 transition-colors">
                        {/* 순위 + 이름 + 등급 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs text-gray-600 font-mono w-5 text-right shrink-0">{idx + 1}</span>
                            <span className="text-sm font-bold text-gray-300 truncate">{d.name}</span>
                          </div>
                          <span className="text-base shrink-0">{gradeEmoji(score.grade)}</span>
                        </div>
                        {/* 소속 광역 */}
                        {globalMetro === '전체' && (
                          <div className="text-xs text-gray-600 truncate pl-6">
                            {d.metro.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')}
                          </div>
                        )}
                        {/* 점수 + 등급 */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xl font-mono font-bold ${gradeColor(score.grade)}`}>{score.total}</span>
                          <span className="text-xs text-gray-500">/ 100</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${gradeBgColor(score.grade)} text-gray-950`}>
                            {score.grade}
                          </span>
                        </div>
                        {/* 점수 바 */}
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${gradeBgColor(score.grade)} transition-all`} style={{ width: `${score.total}%` }} />
                        </div>
                        {/* 세부 점수 */}
                        <div className="grid grid-cols-2 gap-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">자립</span>
                            <span className="font-mono text-gray-400">{score.breakdown.independence}/30</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">자주</span>
                            <span className="font-mono text-gray-400">{score.breakdown.autonomy}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">채무율</span>
                            <span className="font-mono text-gray-400">{score.breakdown.debtRatio}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">인당</span>
                            <span className="font-mono text-gray-400">{score.breakdown.debtPerCapita}/20</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* 시군구 등급 범례 */}
          <div className="flex items-center justify-center gap-4 border border-gray-800 px-3 py-2 flex-wrap">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
              <div key={g} className="flex items-center gap-1.5">
                <span className="text-base">{gradeEmoji(g)}</span>
                <span className={`text-sm font-bold ${gradeColor(g)}`}>{g}</span>
                <span className="text-xs text-gray-600">
                  {g === 'A' ? '80+' : g === 'B' ? '65~79' : g === 'C' ? '50~64' : g === 'D' ? '35~49' : '~34'}
                </span>
              </div>
            ))}
          </div>

          {/* 시군구 다운로드 */}
          <div className="flex justify-end border border-gray-800 px-3 py-2">
            <DataDownload
              data={allDistricts.map((d) => {
                const s = calculateDistrictHealthScore(d);
                return {
                  광역시도: d.metro,
                  시군구: d.name,
                  총점: s.total,
                  등급: s.grade,
                  '자립도점수': s.breakdown.independence,
                  '자주도점수': s.breakdown.autonomy,
                  '채무비율점수': s.breakdown.debtRatio,
                  '1인당채무점수': s.breakdown.debtPerCapita,
                };
              })}
              filename="시군구_재정건전성점수_2025"
            />
          </div>
        </div>
      )}

      {/* ====== MODE: 인구 규모별 비교 (Peer Benchmarking) ====== */}
      {mode === 'peerBench' && (
        <div className="space-y-1">
          <SectionHeader title="인구 규모별 비교 Peer Benchmarking" color="text-purple-400" />

          <div className="border border-gray-800 p-3 md:p-5">
            <div className="text-sm text-gray-500 mb-4">
              인구 규모가 비슷한 광역시도끼리 비교하면 더 의미 있는 벤치마킹이 가능합니다
            </div>

            {/* 그룹별 카드 */}
            {(['mega', 'large', 'medium', 'small'] as PopulationGroup[]).map((groupKey) => {
              const peerGroups = getPeerGroupMetros();
              const group = peerGroups[groupKey];
              if (group.length === 0) return null;
              const stats = getPeerGroupStats(group);
              return (
                <div key={groupKey} className="mb-4">
                  {/* 그룹 헤더 */}
                  <div className="flex items-center justify-between bg-gray-900 px-3 py-2 rounded-t border border-gray-800">
                    <div>
                      <span className="text-base font-bold text-gray-200">{getPopulationGroupLabel(groupKey)}</span>
                      <span className="text-xs text-gray-500 ml-2">{group.length}개 광역시도</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>평균 자립도 <span className={`font-mono font-bold ${independenceColor(stats.avgIndependence)}`}>{stats.avgIndependence.toFixed(1)}%</span></span>
                      <span>평균 1인당채무 <span className="font-mono font-bold text-gray-300">{Math.round(stats.avgDebtPerCapita)}만원</span></span>
                    </div>
                  </div>

                  {/* 그룹 내 멤버 테이블 */}
                  <div className="border border-gray-800 border-t-0">
                    <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-xs text-gray-500 bg-gray-950">
                      <div className="col-span-3">광역시도</div>
                      <div className="col-span-2 text-right">재정자립도</div>
                      <div className="col-span-2 text-right">재정자주도</div>
                      <div className="col-span-2 text-right">1인당 채무</div>
                      <div className="col-span-3 text-right">인구</div>
                    </div>
                    {group.map((m) => {
                      const pc = (m.debt * 100000000 / m.population) / 10000;
                      const indDiff = m.independence - stats.avgIndependence;
                      return (
                        <div key={m.name} className="grid grid-cols-12 gap-1 px-3 py-1.5 border-t border-gray-800/50 items-center">
                          <div className="col-span-3 text-sm font-bold text-gray-300 truncate">
                            {m.name.replace(/특별시|광역시|특별자치시|특별자치도|도$/, '')}
                          </div>
                          <div className="col-span-2 text-right">
                            <span className={`text-sm font-mono font-bold ${independenceColor(m.independence)}`}>{m.independence.toFixed(1)}%</span>
                            <span className={`text-xs font-mono ml-1 ${indDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {indDiff >= 0 ? '+' : ''}{indDiff.toFixed(1)}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-mono font-bold text-blue-400">{m.autonomy.toFixed(1)}%</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className={`text-sm font-mono font-bold ${debtColor(pc)}`}>{Math.round(pc)}만원</span>
                          </div>
                          <div className="col-span-3 text-right">
                            <span className="text-sm font-mono text-gray-400">{(m.population / 10000).toFixed(0)}만명</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 그룹 간 비교 요약 */}
          <div className="border border-gray-800 p-3 md:p-5">
            <div className="text-base font-bold text-gray-300 mb-3">그룹 간 비교 요약</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['mega', 'large', 'medium', 'small'] as PopulationGroup[]).map((groupKey) => {
                const group = getPeerGroupMetros()[groupKey];
                if (group.length === 0) return null;
                const stats = getPeerGroupStats(group);
                return (
                  <div key={groupKey} className="border border-gray-800 p-3 space-y-1">
                    <div className="text-sm font-bold text-gray-300">{getPopulationGroupLabel(groupKey)}</div>
                    <div className="text-xs text-gray-500">{group.length}개 지역</div>
                    <div className="space-y-0.5 pt-1 border-t border-gray-800">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">평균 자립도</span>
                        <span className={`font-mono font-bold ${independenceColor(stats.avgIndependence)}`}>{stats.avgIndependence.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">평균 자주도</span>
                        <span className="font-mono font-bold text-blue-400">{stats.avgAutonomy.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">평균 1인당채무</span>
                        <span className="font-mono font-bold text-gray-300">{Math.round(stats.avgDebtPerCapita)}만원</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====== FOOTER ====== */}
      <div className="border border-gray-800 px-3 py-2">
        <div className="text-[9px] md:text-xs text-gray-600 text-center space-y-0.5">
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-[8px] md:text-[9px] mb-1">
            데이터 출처 Sources
          </p>
          <p>
            행정안전부 지역재정365 (lofin.mois.go.kr) &middot; 통계청 인구통계 (kosis.kr) &middot; 지역재정연감 2025
          </p>
          <p className="text-gray-700">
            * 재정자립도 = (자체수입 / 자치단체예산규모) x 100 &nbsp;|&nbsp;
            재정자주도 = ((자체수입 + 자주재원) / 자치단체예산규모) x 100
          </p>
          <p className="text-gray-700">
            * 재정자립도·자주도는 2025 당초예산 기준, 지역채무·인구·예산규모는 2024 기준이며 실제 결산액과 차이가 있을 수 있습니다.
          </p>
          <p className="text-gray-700">
            * 실시간 카운터는 연간 채무 증가 추정치를 선형 보간하여 표시합니다. 실제 집행 시점과 차이가 있을 수 있습니다.
          </p>
        </div>
      </div>

      {/* DataSources component */}
      <DataSources />

      {/* ====== Metro Detail Modal ====== */}
      {expandedMetro && (
        <MetroDetailModal
          metro={expandedMetro}
          nationalAvg={nationalAvg}
          onClose={() => setExpandedMetro(null)}
        />
      )}

      {/* ====== District Detail Modal ====== */}
      {expandedDistrict && (
        <DistrictDetailModal
          district={expandedDistrict}
          nationalAvg={nationalAvg}
          onClose={() => setExpandedDistrict(null)}
        />
      )}

      {/* ====== Metro Debt Ratio Detail Modal ====== */}
      {debtRatioMetro && (
        <MetroDebtRatioModal
          name={debtRatioMetro}
          history={getMetroDebtHistory(debtRatioMetro)}
          onClose={() => setDebtRatioMetro(null)}
        />
      )}

      {/* ====== District Debt Ratio Detail Modal ====== */}
      {debtRatioDistrict && (
        <DistrictDebtRatioModal
          district={debtRatioDistrict}
          history={generateDistrictDebtHistory(debtRatioDistrict)}
          onClose={() => setDebtRatioDistrict(null)}
        />
      )}
    </div>
  );
}
