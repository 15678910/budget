/** ① 초과세수 적립(칠레식 규칙) */
import type { SurplusInput } from './types';

/** 기준선을 넘은 세수 중 saveRatio만큼 기금에 넣는다. 모자란 해(음수)는 0. */
export function surplusToFund(i: SurplusInput): number {
  return Math.max(0, i.annualExcess) * i.saveRatio;
}
