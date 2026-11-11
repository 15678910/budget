/** AI 기본소득 기금 시뮬레이터 공개 함수·값 */
export { carbonTax, dataTax, robotTax } from './alt-revenue';
export { bequestFlow } from './bequest';
export { compareToBudget } from './budget-compare';
export { rowsToCsv } from './export-csv';
export { childScenario } from './child-account';
export { perpetualTarget, sanitizeInput, simulate } from './engine';
export { runFutureFundScenarios } from './future-fund-scenarios';
export { firstPassingYear, maxSustainableNow } from './search';
export { sharedAssetFlows } from './shared-assets';
export { surplusToFund } from './surplus-tax';
export { BUDGET_2027, BUDGET_2027_URL } from './data/budget-2027';
export {
  DEFAULT_FUTURE_FUND, DEFAULT_INPUT, DEFAULT_SOURCES, EXCLUDED_REVENUES, SHARED_ASSET_CANDIDATES,
} from './defaults';
export type * from './types';
