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

/** 달력 일수 b − a. 'YYYY-MM-DD'를 UTC로 읽어 시간대 영향을 받지 않는다 */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_PER_DAY);
}
