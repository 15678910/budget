/**
 * 재정감시 조기경보 — 신호·백분위 타입.
 *
 * 법정 신호(CrisisSignal)는 지방재정법 시행령 제65조의3의 기준을 그대로 적용한 결과이고,
 * 백분위(PercentileRank)는 동종단체(typeCd) 안의 순위일 뿐 평가가 아니다.
 * 기준 충족은 지정이 아니다 — 지정은 지방재정관리위원회 심의를 거친 행정안전부장관의 재량이다.
 */

/** 심각(재정위기 기준) / 주의(재정주의 기준) / 해당 없음 / 자료 없음 */
export type SignalLevel = 'critical' | 'caution' | 'normal' | 'no-data';

/** 제65조의3이 열거한 6개 지표 */
export type LegalIndicator =
  | 'fiscalBalance'
  | 'debtRatio'
  | 'debtService'
  | 'taxCollection'
  | 'treasury'
  | 'publicCorpDebt';

export interface CrisisSignal {
  indicator: LegalIndicator;
  level: SignalLevel;
  /** 법정 지표 값(%). 자료가 없으면 null */
  value: number | null;
  year: number;
}

/** 동종단체 백분위를 매기는 지출 구조 지표 5종 */
export type WasteIndicator =
  | 'festival'
  | 'subsidy'
  | 'entertainment'
  | 'yearEnd'
  | 'privateContract';

export const WASTE_INDICATORS: readonly WasteIndicator[] = [
  'festival',
  'subsidy',
  'entertainment',
  'yearEnd',
  'privateContract',
] as const;

export interface PercentileRank {
  indicator: WasteIndicator;
  /** 해당 자치단체 값(%). 자료가 없으면 null */
  value: number | null;
  /**
   * 동종단체 평균(%).
   * 지방재정365 응답의 smkdAvgRt가 비어 있어 typeCd 그룹 평균을 직접 계산한다
   * (같은 typeCd·같은 연도의 null 아닌 값들의 산술평균, 소수 2자리).
   */
  peerAvg: number | null;
  /** 상위 N% — (자기 값보다 큰 값의 개수 / groupSize) × 100 을 반올림. 값이 없으면 null */
  percentile: number | null;
  /** 백분위 모집단 크기. null 값은 제외한다 */
  groupSize: number;
  /** '22' 광역 / '31' 시 / '32' 군 / '33' 자치구 */
  typeCd: string;
}

export interface EntitySummary {
  key: string;
  region: string;
  name: string;
  level: 'metro' | 'basic';
  typeCd: string;
  crisis: CrisisSignal[];
  waste: PercentileRank[];
  /** 최근 3년 채무 순증(억원, 소수 1자리). year 또는 year-3 자료가 없으면 null */
  debtDelta3y: number | null;
}

/** 화면에서 중복 정의하지 않도록 이름을 여기서 한 번만 정의한다 */
export const LEGAL_INDICATOR_LABEL: Record<LegalIndicator, string> = {
  fiscalBalance: '통합재정수지비율',
  debtRatio: '예산대비 채무비율',
  debtService: '채무상환비 비율',
  taxCollection: '지방세징수액 비율',
  treasury: '금고잔액비율',
  publicCorpDebt: '공기업 부채비율',
};

export const WASTE_INDICATOR_LABEL: Record<WasteIndicator, string> = {
  festival: '행사축제경비비율',
  subsidy: '지방보조금비율',
  entertainment: '업무추진비비율',
  yearEnd: '연말지출비율',
  privateContract: '수의계약비율',
};
