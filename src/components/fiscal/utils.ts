import { DEBT_BASE_DATE, SECONDS_PER_YEAR, METRO_YEARLY_DEBT_INCREASE } from './types';

// ============================================================
// Color helpers
// ============================================================

export function independenceColor(value: number): string {
  if (value >= 50) return 'text-emerald-400';
  if (value >= 30) return 'text-amber-400';
  if (value >= 15) return 'text-red-400';
  return 'text-red-600';
}

export function independenceBarColor(value: number): string {
  if (value >= 50) return 'bg-emerald-500';
  if (value >= 30) return 'bg-amber-500';
  if (value >= 15) return 'bg-red-500';
  return 'bg-red-700';
}

export function autonomyBarColor(value: number): string {
  if (value >= 70) return 'bg-blue-500';
  if (value >= 60) return 'bg-blue-400';
  return 'bg-blue-300';
}

export function debtColor(debtPerCapita: number): string {
  if (debtPerCapita >= 150) return 'text-red-400';
  if (debtPerCapita >= 80) return 'text-amber-400';
  return 'text-emerald-400';
}

// ============================================================
// Formatting helpers
// ============================================================

export function formatDebt(eokWon: number): string {
  if (eokWon >= 10000) {
    return `${(eokWon / 10000).toFixed(1)}조원`;
  }
  return `${eokWon.toLocaleString('ko-KR')}억원`;
}

export function formatPopulation(pop: number): string {
  if (pop >= 10000) {
    return `${(pop / 10000).toFixed(0)}만명`;
  }
  return `${pop.toLocaleString('ko-KR')}명`;
}

export function formatDebtPerCapita(debt: number, population: number): string {
  if (!population) return '-';
  const perCapita = (debt * 100000000) / population;
  const manWon = perCapita / 10000;
  return `${Math.round(manWon).toLocaleString('ko-KR')}만원`;
}

export function getDebtPerCapitaManWon(debt: number, population: number): number {
  if (!population) return 0;
  return (debt * 100000000) / population / 10000;
}

// ============================================================
// 실시간 채무 계산 helpers
// ============================================================

export function getElapsedFraction(): number {
  const now = new Date();
  return (now.getTime() - DEBT_BASE_DATE.getTime()) / 1000 / SECONDS_PER_YEAR;
}

/** Get current ticking debt for a metro (in 억원) */
export function getCurrentMetroDebt(name: string, baseDebt: number): number {
  const yearlyIncrease = METRO_YEARLY_DEBT_INCREASE[name] ?? baseDebt * 0.06;
  return baseDebt + getElapsedFraction() * yearlyIncrease;
}

/** Get current ticking debt for a district (in 억원) - uses 6% annual growth */
export function getCurrentDistrictDebt(baseDebt: number): number {
  const yearlyIncrease = baseDebt * 0.06;
  return baseDebt + getElapsedFraction() * yearlyIncrease;
}

/** Format raw won with commas (e.g., "1,154,400,000,000원") */
export function formatRawWon(eokWon: number): string {
  const won = Math.floor(eokWon * 100_000_000);
  return won.toLocaleString('ko-KR') + '원';
}

/** Per-second increase rate formatted */
export function formatPerSecond(yearlyEok: number): string {
  const perSec = (yearlyEok * 100_000_000) / SECONDS_PER_YEAR;
  if (perSec >= 100_000_000) return `${(perSec / 100_000_000).toFixed(1)}억원/초`;
  if (perSec >= 10_000) return `${Math.round(perSec / 10_000).toLocaleString('ko-KR')}만원/초`;
  return `${Math.round(perSec).toLocaleString('ko-KR')}원/초`;
}
