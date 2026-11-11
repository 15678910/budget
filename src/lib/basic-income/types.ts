/**
 * AI 기본소득 기금 시뮬레이터 타입.
 * 금액은 2027년 불변가격 실질 조 원(number). 1인당 금액만 원(정수).
 * 수익률·세율·비율은 0~1 소수.
 */

export type ValueKind = 'source' | 'derived' | 'assumption';

export interface SourcedValue {
  label: string;
  value: number;
  unit: string;
  kind: ValueKind;
  source?: string;
  url?: string;
  note?: string;
  /** 칼럼 「AI 기본사회를 준비하자」 참고 자료 번호 */
  columnRef?: number;
}

/** 지급용(그해 바로 나눔) / 적립용(기금 원금으로) */
export type FlowMode = 'pay' | 'save';

export interface RobotTaxInput {
  base: number;
  rate: number;
  annualDecline: number;
  mode: FlowMode;
}

export interface DataTaxInput {
  base: number;
  rate: number;
  annualGrowth: number;
  mode: FlowMode;
}

export interface CarbonTaxInput {
  emissionsMt: number;
  pricePerTonWon: number;
  /** 총배출 중 과세하는 비율(0~1). K-ETS 대상과 겹치지 않게 고르는 정책 손잡이 */
  taxableShare: number;
  netZeroYear: number;
  mode: FlowMode;
}

export interface AltRevenueInput {
  robot: RobotTaxInput;
  data: DataTaxInput;
  carbon: CarbonTaxInput;
}

export interface BequestInput {
  eligibleEstate: number;
  uptake: number;
  shareToFund: number;
  effectiveTaxRate: number;
  /** 특례를 고른 상속에서 기금 몫을 뺀 나머지에 매기는 단일 세율 */
  specialRate: number;
}

export interface SurplusInput {
  annualExcess: number;
  saveRatio: number;
}

export interface SharedAsset {
  id: string;
  label: string;
  stake: number;
  yieldRate: number;
  mode: FlowMode;
  /** true면 아직 공유 자산이 아닌 후보 산업 */
  candidate: boolean;
}

export interface SimInput {
  baseYear: number;
  payStartYear: number;
  horizonYears: number;
  /** 원 */
  monthlyPerPerson: number;
  population0: number;
  populationGrowth: number;
  realReturn: number;
  withdrawalRate: number;
  /** 조 원 */
  initialFund: number;
  /** ③ 연금·건보 보전, 조 원 */
  socialInsuranceTopUp: { enabled: boolean; annual: number };
  alt: AltRevenueInput;
  bequest: BequestInput;
  surplus: SurplusInput;
  sharedAssets: SharedAsset[];
}

export interface RevenueBreakdown {
  robot: number;
  data: number;
  carbon: number;
  bequest: number;
  surplus: number;
  shared: number;
}

export interface YearRow {
  year: number;
  paying: boolean;
  population: number;
  need: number;
  payRevenue: number;
  saveInflow: number;
  withdrawal: number;
  shortfall: number;
  fundEnd: number;
  principal: number;
  revenues: RevenueBreakdown;
}

export type FailReason = 'shortfall' | 'principal';

export interface Verdict {
  sustainable: boolean;
  firstFailYear: number | null;
  reason: FailReason | null;
}

export interface SimResult {
  rows: YearRow[];
  verdict: Verdict;
}

export interface ChildScenarioResult {
  perChildAnnualWon: number;
  annualCostSteady: number;
  coveredShare: number;
  /** 해마다 새로 여는 계좌 수 = 출생아 수(인구 변화율과 따로 넣음) */
  births: number;
  /** 여유자금 인출로 모든 아이가 18세 목표에 닿는가 */
  reachesTarget: boolean;
}

export type ScenarioId = 'S1' | 'S2' | 'S3' | 'S4';

export interface FutureFundInput {
  totalFund: number;
  surplusFund: number;
  depositRate: number;
  consignReturn: number;
  child: { births: number; targetWon: number; rate: number; years: number };
}

export interface ScenarioRow {
  id: ScenarioId;
  label: string;
  seed: number;
  nowAnnualWon: number;
  targetYear: number | null;
  sustainable: boolean;
  extraReturnToGeneral: number | null;
  child: ChildScenarioResult | null;
  control: string;
  futureGeneration: string;
}

export interface BudgetSector {
  id: string;
  label: string;
  amount: number;
  source: SourcedValue;
}

export interface BudgetComparison {
  id: string;
  label: string;
  amount: number;
  ratio: number;
}

/** 화면 입력칸과 출처 목록이 함께 쓰는 기본값 이름 */
export type SourceKey =
  | 'monthlyPerPerson' | 'population0' | 'populationGrowth' | 'realReturn' | 'withdrawalRate' | 'horizonYears'
  | 'initialFund' | 'socialInsuranceTopUp'
  | 'robotBase' | 'robotRate' | 'robotDecline'
  | 'dataBase' | 'dataRate' | 'dataGrowth'
  | 'carbonEmissions' | 'carbonTaxableShare' | 'carbonPrice' | 'netZeroYear'
  | 'bequestEstate' | 'bequestUptake' | 'bequestShare' | 'bequestTaxRate' | 'bequestSpecialRate'
  | 'surplusExcess' | 'surplusSaveRatio' | 'sharedYield'
  | 'futureFundTotal' | 'futureFundSurplus' | 'depositRate' | 'consignReturn'
  | 'childBirths' | 'childTarget' | 'childRate' | 'childYears'
  /* 아래는 입력칸 없이 출처 목록에만 보이는 참고 값 */
  | 'budgetTotal2027' | 'inheritanceTaxPaid' | 'swissCo2Levy' | 'canadaCarbonRepeal';

export interface ExcludedRevenue {
  label: string;
  reason: string;
  source: string;
  url?: string;
}
