import type { FundAccount, GovUnit, Program } from './types';
import { CENTRAL_FUTURE_FUND_PROGRAMS } from './data/central-future-fund';

export const ALL_PROGRAMS: readonly Program[] = [...CENTRAL_FUTURE_FUND_PROGRAMS];

export function programsOf(gov: GovUnit): Program[] {
  return ALL_PROGRAMS.filter((p) => p.gov.level === gov.level && p.gov.code === gov.code);
}

/** 홍보자료 7쪽 계정별 사업지출 (억원). 여유자금 제외 */
export const ACCOUNT_TOTAL_EOK: Record<Exclude<FundAccount, 'none'>, number> = {
  youth: 133_000,
  growth: 142_000,
  regional: 103_000,
  education: 76_000,
};

export * from './types';
export * from './gov';
