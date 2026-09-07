import type { ComponentType } from 'react';
import type { CalculatorKey } from '@/lib/disputes/types';
import { GrantFormula } from './GrantFormula';
import { FundScenario } from './FundScenario';

/** 분쟁별 계산기. 키는 lib/disputes/types.ts가 소유한다. */
export const CALCULATORS: Partial<Record<CalculatorKey, ComponentType>> = {
  'grant-formula': GrantFormula,
  'fund-scenario': FundScenario,
};
