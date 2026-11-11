/** ② 아동 기본자산(18세 1억 원) */
import type { ChildScenarioResult } from './types';

/** 연말 납입 적립식으로 years년 뒤 targetWon을 만드는 해마다 납입액(원, 반올림). */
export function childAnnualContribution(targetWon: number, rate: number, years: number): number {
  if (years <= 0) return 0;
  if (rate === 0) return Math.round(targetWon / years);
  return Math.round((targetWon * rate) / (Math.pow(1 + rate, years) - 1));
}

/** 정상 상태에서는 years개 코호트가 동시에 납입받는다. */
export function childScenario(i: {
  births: number;
  targetWon: number;
  rate: number;
  years: number;
  fund: number;
  withdrawalRate: number;
}): ChildScenarioResult {
  const perChildAnnualWon = childAnnualContribution(i.targetWon, i.rate, i.years);
  const annualCostSteady = (i.births * perChildAnnualWon * i.years) / 1e12;
  const available = Math.max(0, i.fund) * Math.max(0, i.withdrawalRate);
  const coveredShare = annualCostSteady > 0 ? Math.min(1, available / annualCostSteady) : 1;
  return { perChildAnnualWon, annualCostSteady, coveredShare, births: i.births, reachesTarget: coveredShare >= 1 };
}
