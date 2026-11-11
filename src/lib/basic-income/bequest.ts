/** ⑤ 유산 기부: 미래 세대에 남기는 유산 */
import type { BequestInput } from './types';

/**
 * toFund: 기금으로 들어오는 돈(조 원/년).
 * generalAccountLoss: 특례로 줄어드는 일반회계 상속세(조 원/년). 지금 세금 − 나머지 몫에 매기는 특례 세금.
 *   칼럼 예시: 100억 원, 실효 45.4%, 기금 30%·특례 20% → 45.4억이 14억으로, 31.4억 감소.
 */
export function bequestFlow(i: BequestInput): { toFund: number; generalAccountLoss: number } {
  const pledged = Math.max(0, i.eligibleEstate) * i.uptake;
  return { toFund: pledged * i.shareToFund, generalAccountLoss: pledged * Math.max(0, i.effectiveTaxRate - i.specialRate * (1 - i.shareToFund)) };
}
