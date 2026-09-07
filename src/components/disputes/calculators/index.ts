import type { ComponentType } from 'react';
import type { CalculatorKey } from '@/lib/disputes/types';
import { GrantFormula } from './GrantFormula';
import { FundScenario } from './FundScenario';

/**
 * 분쟁별 계산기. 키는 lib/disputes/types.ts가 소유한다.
 *
 * Partial이 아니라 전 키를 강제한다. 키만 있고 컴포넌트가 없으면 상세 페이지의
 * '숫자로 보기' 절이 타입·테스트가 모두 통과한 채로 조용히 사라지기 때문이다.
 */
export const CALCULATORS: Record<CalculatorKey, ComponentType> = {
  'grant-formula': GrantFormula,
  'fund-scenario': FundScenario,
};
