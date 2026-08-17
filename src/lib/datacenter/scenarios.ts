/**
 * 프리셋 시나리오 (설계문서 §4.7)
 *
 * 원보고서의 수치를 그대로 재현하는 프리셋과, 같은 보고서가 지적한 리스크를
 * 실제로 반영한 프리셋을 나란히 둔다. 둘의 차이가 이 도구의 첫 번째 교육 포인트다.
 */

import { withFinance } from './assumptions';
import type { FinanceAssumptions } from './types';

const BILLION = 1e9;

/**
 * 보고서가 제시한 이자액에서 역산한 금리 (설계문서 §2.2).
 * 보고서는 부채비율을 밝히지 않고 이자 금액만 제시했다.
 */
export const OPTIMISTIC_RATE = 1.96 / (38 * 0.7); // ≈ 7.37%
export const PESSIMISTIC_RATE = 2.8 / (38 * 0.7); // ≈ 10.53%

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  assumptions: FinanceAssumptions;
}

/**
 * 재현 모드 공통 설정.
 * 보고서는 임대료 하락도 물가상승도 회수기간 계산에 넣지 않았으므로 둘 다 0으로 고정한다.
 */
const REPLICATION_BASE = {
  rentDeclineAnnual: 0,
  opexInflation: 0,
  loanType: 'interestOnly' as const,
  horizonYears: 10,
};

/** 보고서 낙관 시나리오 재현 — 보고서 표기 4.13년, 이 공식으로는 4.16년 */
export const reportOptimistic: ScenarioPreset = {
  id: 'report-optimistic',
  label: '보고서 낙관 (재현)',
  description:
    '보고서가 제시한 낙관 시나리오를 그대로 재현한다. 임대료가 10년간 일정하다고 가정한 계산이다.',
  assumptions: withFinance({
    ...REPLICATION_BASE,
    capexUsd: 38 * BILLION,
    interestRate: OPTIMISTIC_RATE,
  }),
};

/**
 * 보고서 비관 시나리오 재현 — 5.66년.
 *
 * CAPEX는 470억으로 늘리면서 이자는 380억 기준을 그대로 쓴 보고서의 불일치를
 * interestBasisCapexUsd로 재현한다 (설계문서 §2.2b).
 */
export const reportPessimistic: ScenarioPreset = {
  id: 'report-pessimistic',
  label: '보고서 비관 (재현)',
  description:
    '보고서의 비관 시나리오. 이자를 CAPEX 380억 기준으로 계산한 보고서의 불일치를 그대로 재현한다.',
  assumptions: withFinance({
    ...REPLICATION_BASE,
    capexUsd: 47 * BILLION,
    interestBasisCapexUsd: 38 * BILLION,
    interestRate: PESSIMISTIC_RATE,
  }),
};

/** 같은 금리를 CAPEX 470억에 일관 적용 — 5.66년이 아니라 6.16년이 된다 */
export const consistentPessimistic: ScenarioPreset = {
  id: 'consistent-pessimistic',
  label: '비관 (이자 일관 적용)',
  description:
    '보고서와 같은 금리를 실제 CAPEX 470억에 일관되게 적용한 결과. 보고서의 비관 시나리오는 실제보다 0.5년 낙관적이다.',
  assumptions: withFinance({
    ...REPLICATION_BASE,
    capexUsd: 47 * BILLION,
    interestRate: PESSIMISTIC_RATE,
  }),
};

/** 보고서가 스스로 지적한 임대료 하락 리스크를 회수기간 계산에 반영한 경우 */
export const rentDeclineApplied: ScenarioPreset = {
  id: 'rent-decline-applied',
  label: '낙관 + 임대료 하락 반영',
  description:
    '보고서의 낙관 시나리오에 같은 보고서가 리스크로 지적한 임대료 하락(연 23.5%)을 반영한다.',
  assumptions: withFinance({
    ...REPLICATION_BASE,
    capexUsd: 38 * BILLION,
    interestRate: OPTIMISTIC_RATE,
    rentDeclineAnnual: 0.235,
  }),
};

export const PRESETS: readonly ScenarioPreset[] = [
  reportOptimistic,
  reportPessimistic,
  consistentPessimistic,
  rentDeclineApplied,
];
