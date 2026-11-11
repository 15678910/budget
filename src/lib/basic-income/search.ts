/** 탐색: 같은 엔진을 여러 번 돌려 '지금 최대 액수'와 '목표 액수의 첫 통과 연도'를 찾는다. */
import { sanitizeInput, simulate } from './engine';
import type { SimInput } from './types';

const START_HI = 1_000_000;
const MAX_HI = 1_000_000_000;

function passes(i: SimInput, monthlyPerPerson: number): boolean {
  return simulate({ ...i, monthlyPerPerson }).verdict.sustainable;
}

/** 기준 연도에 바로 시작할 때 기간 내내 지속가능한 최대 1인당 월액(원). */
export function maxSustainableNow(raw: SimInput): { monthlyWon: number; annualWon: number; impossible: boolean } {
  const clean = sanitizeInput(raw);
  const i = { ...clean, payStartYear: clean.baseYear };
  if (!passes(i, 0)) return { monthlyWon: 0, annualWon: 0, impossible: true };
  let lo = 0;
  let hi = START_HI;
  while (hi < MAX_HI && passes(i, hi)) {
    lo = hi;
    hi *= 2;
  }
  if (passes(i, hi)) lo = hi;
  else {
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (passes(i, mid)) lo = mid;
      else hi = mid;
    }
  }
  return { monthlyWon: lo, annualWon: lo * 12, impossible: false };
}

/** 입력 액수로 처음 지속가능해지는 지급 시작 연도. 기간 안에 없으면 null. */
export function firstPassingYear(raw: SimInput): number | null {
  const i = sanitizeInput(raw);
  for (let k = 0; k <= i.horizonYears; k++) {
    const payStartYear = i.baseYear + k;
    if (simulate({ ...i, payStartYear }).verdict.sustainable) return payStartYear;
  }
  return null;
}
