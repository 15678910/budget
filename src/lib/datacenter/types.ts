/**
 * AI 데이터센터 경제성 진단 — 공통 타입
 *
 * 설계 근거: docs/superpowers/specs/2026-08-17-datacenter-economics-diagnosis-design.md
 * 원 설계는 Python CLI 기준(§3~5)이며, 이 파일은 웹 기준으로 재작성한 것이다.
 */

// ─── 출처 추적 (§3.3) ─────────────────────────────────────────────────────────

/**
 * 수치의 성격. 출력 시 태그로 찍혀 사용자가 "누가 말한 숫자인지"를 구분할 수 있게 한다.
 * 이 도구의 목적은 결론을 내리는 것이 아니라 발표치와 실측치를 나란히 놓는 것이므로,
 * kind는 장식이 아니라 핵심 기능이다.
 */
export type FigureKind = 'measured' | 'announced' | 'derived' | 'estimated';

export const FIGURE_KIND_LABEL: Record<FigureKind, string> = {
  measured: '[실측]',
  announced: '[발표]',
  derived: '[역산]',
  estimated: '[추정]',
};

/** 외부에서 인용한 모든 수치는 이 형태로 저장한다. 출처 없는 숫자는 테스트가 막는다. */
export interface Figure {
  value: number;
  unit: string;
  /** 사람이 읽는 설명. 예: "1GW 데이터센터 상시 고용" */
  label: string;
  kind: FigureKind;
  /** 발표 주체 */
  source: string;
  url: string;
  /** YYYY-MM */
  date: string;
  note?: string;
}

/** 범위로만 알려진 수치 (예: 100MW당 30~50명) */
export interface FigureRange extends Omit<Figure, 'value'> {
  low: number;
  high: number;
}

// ─── 재무 (§4.2) ──────────────────────────────────────────────────────────────

/**
 * interestOnly: 원금 상환 없음. 분석기간 말에 잔액이 남는다 — 원보고서와 동일한 처리.
 * amortizing: GPU 수명에 걸쳐 원리금 균등 상환.
 */
export type LoanType = 'interestOnly' | 'amortizing';

export interface FinanceAssumptions {
  /** 총 투자비 (USD). 보고서 380억~470억 [발표] */
  capexUsd: number;
  /** CAPEX 구성비. 합이 1이어야 한다. [발표] */
  capexSplitServer: number;
  capexSplitBuilding: number;
  capexSplitOther: number;

  /** 연간 운영비 (USD). 보고서 9억 [발표] */
  opexAnnualUsd: number;
  /** 연 매출 1년차 (USD). 보고서 장기계약 기준 120억 [발표] */
  revenueYear1Usd: number;
  /** 가동률 조정 파라미터 */
  utilization: number;

  /** 부채비율. 보고서 명시값이 아니라 이자액에서 역산한 값 [역산] — 설계문서 §2.2 */
  debtRatio: number;
  /** 금리. 빅테크 5~7% / 네오클라우드 10~15% [발표] */
  interestRate: number;
  loanType: LoanType;

  /**
   * 보고서 재현 전용 장치.
   *
   * 원보고서의 비관 시나리오는 CAPEX를 470억으로 잡으면서 이자는 380억 기준으로 계산했다
   * (설계문서 §2.2b). 이 값을 지정하면 이자만 다른 CAPEX 기준으로 계산해 그 불일치를
   * 그대로 재현한다. 지정하지 않으면 capexUsd에 일관되게 적용된다.
   */
  interestBasisCapexUsd?: number;

  /** 임대료 연간 하락률. $9/h → $4/h, 3년 [역산]. 보고서 재현 시에는 0을 써야 한다. */
  rentDeclineAnnual: number;
  /** GPU 수명. 보고서 3~5년 [발표] */
  gpuLifeYears: number;
  /** GPU 수명 도래 시 서버·GPU 잔존가치 비율. 보수적 기본값 0 [추정] */
  salvageRate: number;

  discountRate: number;
  horizonYears: number;
  opexInflation: number;

  /**
   * 가동 개시 지연 (년). 송전망 지연 시나리오용 (설계문서 §4.4).
   * 해당 연차의 매출을 0으로 만들되 이자와 운영비는 계속 발생시킨다.
   */
  commissioningDelayYears: number;
}

/** 연도별 현금흐름 한 줄 */
export interface YearRow {
  year: number;
  revenue: number;
  opex: number;
  ebitda: number;
  interest: number;
  principal: number;
  /** 잔존가치 회수액 (GPU 수명 도래 연도에만 발생) */
  salvage: number;
  netCash: number;
  cumulative: number;
  /** 연말 부채 잔액 */
  debtBalance: number;
}

export interface FinanceSummary {
  /** 누적 순현금이 CAPEX를 처음 넘는 시점 (선형보간, 소수). 분석기간 내 미회수 시 null */
  paybackYears: number | null;
  npv: number;
  /** 이분법 탐색. 부호 변화가 없으면 null */
  irr: number | null;
  /** GPU 수명 시점 누적 순현금 ÷ CAPEX. 이 도구의 핵심 지표 */
  recoveryRatioAtGpuEol: number;
  totalNetCash: number;
  /** 분석기간 말 미상환 부채 잔액 */
  remainingDebt: number;
}
