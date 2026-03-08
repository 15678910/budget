import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Formats an amount given in 백만원 (millions of KRW) into a human-readable Korean won string.
 *
 * Thresholds:
 *   - Under 100 백만원 (< 1억):     "X,XXX백만원"
 *   - 100 ~ 999,999 백만원 (1억~1조): "X,XXX억원"  (divide by 100)
 *   - 1,000,000+ 백만원 (≥ 1조):    "X.X조원"    (divide by 1,000,000)
 */
export function formatKoreanWon(amountInMillions: number): string {
  if (!isFinite(amountInMillions) || isNaN(amountInMillions)) return '0백만원';

  const abs = Math.abs(amountInMillions);
  const sign = amountInMillions < 0 ? '-' : '';

  // 1조 = 1,000,000 백만원
  if (abs >= 1_000_000) {
    const jo = abs / 1_000_000;
    return `${sign}${jo.toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}조원`;
  }

  // 1억 = 100 백만원
  if (abs >= 100) {
    const eok = Math.round(abs / 100);
    return `${sign}${eok.toLocaleString('ko-KR')}억원`;
  }

  // Under 1억
  return `${sign}${Math.round(abs).toLocaleString('ko-KR')}백만원`;
}

/**
 * Returns the full number formatted with commas, suffixed with "백만원".
 * Useful for tooltips and detail views.
 */
export function formatKoreanWonFull(amountInMillions: number): string {
  if (!isFinite(amountInMillions) || isNaN(amountInMillions)) return '0백만원';
  const rounded = Math.round(amountInMillions);
  return `${rounded.toLocaleString('ko-KR')}백만원`;
}

/**
 * Calculates per-capita amount from a total budget in 백만원 and a population count,
 * returning a formatted string in "원" (e.g. "1,234,567원/인").
 *
 * Steps:
 *   amountInMillions * 1,000,000 → total in 원
 *   divide by population → per-capita in 원
 */
export function formatPerCapita(amountInMillions: number, population: number): string {
  if (!population || population === 0) return '0원/인';
  if (!isFinite(amountInMillions) || isNaN(amountInMillions)) return '0원/인';

  const totalWon = amountInMillions * 1_000_000;
  const perPerson = Math.round(totalWon / population);
  return `${perPerson.toLocaleString('ko-KR')}원/인`;
}

/**
 * Formats a numeric value as a percentage string with one decimal place.
 * Prepends "+" for positive values.
 *
 * Examples:
 *   5.678  → "+5.7%"
 *   -3.2   → "-3.2%"
 *   0      → "0.0%"
 */
export function formatPercent(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0.0%';
  const fixed = value.toFixed(1);
  return value > 0 ? `+${fixed}%` : `${fixed}%`;
}

/**
 * Utility for combining class names with Tailwind CSS deduplication.
 * Wraps clsx + tailwind-merge.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(...classes));
}
