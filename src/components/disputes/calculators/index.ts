import type { ComponentType } from 'react';
import type { CalculatorKey } from '@/lib/disputes/types';
import { GrantFormula } from './GrantFormula';

/**
 * 분쟁별 계산기. 키는 lib/disputes/types.ts가 소유한다.
 * fund-scenario는 다음 태스크에서 추가한다. 그래서 Partial이다.
 */
export const CALCULATORS: Partial<Record<CalculatorKey, ComponentType>> = {
  'grant-formula': GrantFormula,
};
