import type { Dispute } from './types';
import { educationGrant } from './education-grant';
import { futureFund } from './future-fund';
import { pension } from './pension';

/**
 * 목록 화면의 표시 순서이기도 하다. 금액순이 아니라 편집 우선순위 —
 * 지금 국회에서 결론이 가장 임박한 것부터 둔다.
 */
export const ALL_DISPUTES: readonly Dispute[] = [educationGrant, futureFund, pension];

export function getDispute(slug: string): Dispute | undefined {
  return ALL_DISPUTES.find((d) => d.slug === slug);
}

export * from './types';
