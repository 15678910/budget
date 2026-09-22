/**
 * 지방재정법 시행령 제65조의3 (재정위기단체 등의 지정·해제의 기준 및 절차 등)
 * <개정 2024. 1. 9., 2025. 12. 2.> — 국가법령정보센터 2026-09-23 확인.
 *
 * 조문 원문(연구 문서 `docs/research/2026-09-23-waste-cases-verification.md` § 법정 기준에서 그대로 옮김):
 *
 *   지방재정법 시행령 제65조의3(재정위기단체 등의 지정·해제의 기준 및 절차 등) <개정 2024. 1. 9., 2025. 12. 2.>
 *   - 재정위기단체(①): 1. 통합재정수지비율이 음의 값이고 절대값이 100분의 30 초과 / 2. 예산대비 채무비율 100분의 40 초과
 *     / 3. 채무상환비 비율 100분의 17 초과 / 4. 지방세징수액 비율 100분의 70 미만 / 5. 금고잔액비율 100분의 10 미만
 *     / 6. 공기업 부채비율 100분의 600 초과
 *   - 재정주의단체(②): 1. 통합재정수지비율 절대값 25 초과 30 이하 / 2. 채무비율 25 초과 40 이하 / 3. 채무상환비 12 초과 17 이하
 *     / 4. 지방세징수액 비율 70 이상 80 미만 / 5. 금고잔액비율 10 이상 20 미만 / 6. 공기업 부채비율 400 초과 600 이하
 *   - 지정은 지방재정관리위원회 심의를 거친 행정안전부장관의 재량("지정할 수 있다"). 기준 충족 = 지정이 아니다. 화면에 반드시 적을 것.
 *
 * 따라서 이 파일의 상수는 "기준 충족" 여부만 계산한다. 지정 여부를 뜻하지 않는다.
 */

import type { LegalIndicator, SignalLevel } from './signal-types';
import { LEGAL_INDICATOR_LABEL } from './signal-types';

export interface LegalThreshold {
  /**
   * 재정주의단체(②) 구간의 두 경계.
   * direction 'above'  → (caution[0], caution[1]] 즉 caution[0] 초과 caution[1] 이하
   * direction 'below'  → [caution[0], caution[1]) 즉 caution[0] 이상 caution[1] 미만
   */
  caution: [number, number];
  /**
   * 재정위기단체(①) 경계.
   * direction 'above' → critical 초과, direction 'below' → critical 미만
   */
  critical: number;
  /** 값이 클수록 나쁜 지표는 'above', 작을수록 나쁜 지표는 'below' */
  direction: 'above' | 'below';
  label: string;
  /** 조문 인용 */
  article: string;
}

/** 화면·집계 순서 */
export const LEGAL_INDICATORS: readonly LegalIndicator[] = [
  'fiscalBalance',
  'debtRatio',
  'debtService',
  'taxCollection',
  'treasury',
  'publicCorpDebt',
] as const;

/** 지방재정365 결산 공시로 값을 채울 수 있는 지표. 나머지 4종은 자료가 없어 계산하지 않는다 */
export const AVAILABLE_LEGAL_INDICATORS: readonly LegalIndicator[] = [
  'fiscalBalance',
  'debtRatio',
] as const;

export const LEGAL_THRESHOLDS: Record<LegalIndicator, LegalThreshold> = {
  fiscalBalance: {
    caution: [25, 30],
    critical: 30,
    // 음의 값의 절대값에 적용한다. 양수(흑자)는 기준 대상이 아니다.
    direction: 'above',
    label: LEGAL_INDICATOR_LABEL.fiscalBalance,
    article: '시행령 제65조의3 ① 1호(절대값 30 초과) · ② 1호(절대값 25 초과 30 이하)',
  },
  debtRatio: {
    caution: [25, 40],
    critical: 40,
    direction: 'above',
    label: LEGAL_INDICATOR_LABEL.debtRatio,
    article: '시행령 제65조의3 ① 2호(40 초과) · ② 2호(25 초과 40 이하)',
  },
  debtService: {
    caution: [12, 17],
    critical: 17,
    direction: 'above',
    label: LEGAL_INDICATOR_LABEL.debtService,
    article: '시행령 제65조의3 ① 3호(17 초과) · ② 3호(12 초과 17 이하)',
  },
  taxCollection: {
    caution: [70, 80],
    critical: 70,
    direction: 'below',
    label: LEGAL_INDICATOR_LABEL.taxCollection,
    article: '시행령 제65조의3 ① 4호(70 미만) · ② 4호(70 이상 80 미만)',
  },
  treasury: {
    caution: [10, 20],
    critical: 10,
    direction: 'below',
    label: LEGAL_INDICATOR_LABEL.treasury,
    article: '시행령 제65조의3 ① 5호(10 미만) · ② 5호(10 이상 20 미만)',
  },
  publicCorpDebt: {
    caution: [400, 600],
    critical: 600,
    direction: 'above',
    label: LEGAL_INDICATOR_LABEL.publicCorpDebt,
    article: '시행령 제65조의3 ① 6호(600 초과) · ② 6호(400 초과 600 이하)',
  },
};

/**
 * 값 하나를 법정 기준에 대어 본다. 데이터 조회 없이 순수 계산만 한다.
 * 통합재정수지비율은 "음의 값이고 절대값이 …"이므로 양수(흑자)면 'normal',
 * 음수면 절대값을 기준에 적용한다.
 */
export function evaluateLegal(indicator: LegalIndicator, value: number | null): SignalLevel {
  if (value === null || !Number.isFinite(value)) return 'no-data';

  const threshold = LEGAL_THRESHOLDS[indicator];
  const target = indicator === 'fiscalBalance' ? (value < 0 ? Math.abs(value) : 0) : value;

  if (threshold.direction === 'above') {
    if (target > threshold.critical) return 'critical';
    if (target > threshold.caution[0] && target <= threshold.caution[1]) return 'caution';
    return 'normal';
  }

  if (target < threshold.critical) return 'critical';
  if (target >= threshold.caution[0] && target < threshold.caution[1]) return 'caution';
  return 'normal';
}
