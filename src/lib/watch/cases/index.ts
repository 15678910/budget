import type { WatchCase } from '../case-types';
import { DAEJEON_ARTICULATED_BUS } from './daejeon-articulated-bus';
import { INCHEON_SANGSANG_PLATFORM } from './incheon-sangsang-platform';
import { INCHEON_DONGINCHEON } from './incheon-dongincheon';
import { BUSAN_NAKDONG_BRIDGES } from './busan-nakdong-bridges';
import { BUSAN_POMPIDOU_OPERA } from './busan-pompidou-opera';
import { ULSAN_SKYWALK } from './ulsan-skywalk';
import { ULSAN_FOOD_HALL } from './ulsan-food-hall';

export type { WatchCase };

/** 제9회 전국동시지방선거일. 타임라인에 사실로 넣고 간격(일수)만 표시한다 */
export const ELECTION_DAY = '2026-06-03';

export const WATCH_CASES: readonly WatchCase[] = [
  DAEJEON_ARTICULATED_BUS,
  INCHEON_SANGSANG_PLATFORM,
  INCHEON_DONGINCHEON,
  BUSAN_NAKDONG_BRIDGES,
  BUSAN_POMPIDOU_OPERA,
  ULSAN_SKYWALK,
  ULSAN_FOOD_HALL,
];

export function getWatchCase(slug: string): WatchCase | undefined {
  return WATCH_CASES.find((c) => c.slug === slug);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_DATE = /^\d{4}-\d{2}$/;

/** 'YYYY-MM-DD'면 true. 'YYYY-MM'(월 단위 자료)이면 false */
export function hasDayPrecision(date: string): boolean {
  return FULL_DATE.test(date);
}

/** 타임라인에 쓸 수 있는 날짜인지 — 'YYYY-MM-DD' 또는 'YYYY-MM' */
export function isCaseDate(date: string): boolean {
  return FULL_DATE.test(date) || MONTH_DATE.test(date);
}

/**
 * 정렬용 키. 'YYYY-MM'은 그 달의 1일로 본다(순서에만 쓰고 간격 계산에는 쓰지 않는다).
 * 같은 달의 'YYYY-MM'과 'YYYY-MM-01'은 문자열 비교로도 앞뒤가 갈리지 않도록 자리수를 맞춘다.
 */
export function sortKeyOf(date: string): string {
  return MONTH_DATE.test(date) ? `${date}-01` : date;
}

/**
 * 달력 일수 b − a. 'YYYY-MM-DD'를 UTC로 읽어 시간대 영향을 받지 않는다.
 * 어느 한쪽이라도 일(day)이 없는 'YYYY-MM'이면 일수를 지어내지 않고 null을 돌려준다.
 */
export function daysBetween(a: string, b: string): number | null {
  if (!hasDayPrecision(a) || !hasDayPrecision(b)) return null;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_PER_DAY);
}
