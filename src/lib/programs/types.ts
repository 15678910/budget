/**
 * 사업 검토 시뮬레이터 데이터 모델 (설계문서 §3).
 * 효과·성과 필드는 없다. 추가하려면 설계문서를 먼저 고친다.
 */
export type ProgramArea = 'mega-ai' | 'growth-engine' | 'youth' | 'k-shape' | 'safety' | 'other';
export type FundAccount = 'youth' | 'growth' | 'regional' | 'education' | 'none';
/** new 신규 / expanded 확대 / transferred 기존 급여·사업의 재원 이관 / tax-converted 조세지출→재정 전환 */
export type ProgramNature = 'new' | 'expanded' | 'transferred' | 'tax-converted' | 'unknown';
/** cash 개인 현금·바우처·장학금 / matched-saving 기여금 / grant 기관 보조·출연 / equity 출자 / rnd / infra / service */
export type SpendType =
  | 'cash' | 'matched-saving' | 'grant' | 'equity' | 'rnd' | 'infra' | 'service' | 'unknown';
/** 중앙: budget 본예산 / fund 기금. 지방: budget 일반회계 / special-account 특별회계 / fund 기금 */
export type ReviewRoute = 'budget' | 'fund' | 'special-account' | 'unknown';

export type GovLevel = 'central' | 'metro' | 'district';
/** 행정표준코드. 중앙 '00', 시도 2자리, 시군구 5자리 */
export interface GovUnit { level: GovLevel; code: string; name: string }

export interface ProgramUnit {
  price: string;
  count: string;
  /** 억원 */
  product: number;
  /** amount27Eok와 ±1% 안이면 true */
  matches: boolean;
  note?: string;
}

export interface ProgramEvidence {
  field: 'spendType' | 'nature' | 'route' | 'unit' | 'beneficiaries' | 'amount27Eok';
  /** 원자료 문장 그대로 */
  quote: string;
  source: string;
}

export interface Program {
  id: string;
  name: string;
  gov: GovUnit;
  ministry: string;
  area: ProgramArea;
  account: FundAccount;
  /** 억원. 신규면 null */
  amount26Eok: number | null;
  /** 억원 */
  amount27Eok: number;
  nature: ProgramNature;
  spendType: SpendType;
  route: ReviewRoute;
  unit?: ProgramUnit;
  beneficiaries?: { value: number; unit: string; source: string };
  evidence: ProgramEvidence[];
  sources: string[];
  /** 계정 「기타」 잔여 행. 점수 없음, 총액에는 포함 */
  isRemainder?: boolean;
}

export const LENS_KEYS = ['capital', 'netNew', 'execution', 'route', 'reach', 'check'] as const;
export type LensKey = (typeof LENS_KEYS)[number];
/** 가중치 0~3 정수 */
export type Weights = Record<LensKey, 0 | 1 | 2 | 3>;
export interface Preset { id: string; name: string; note: string; weights: Weights }
