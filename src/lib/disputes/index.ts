import type { Dispute } from './types';
import { educationGrant } from './education-grant';

/** 목록 화면의 표시 순서이기도 하다. 규모가 큰 것부터 둔다. */
export const ALL_DISPUTES: readonly Dispute[] = [educationGrant];

export function getDispute(slug: string): Dispute | undefined {
  return ALL_DISPUTES.find((d) => d.slug === slug);
}

export * from './types';
