/**
 * 데이터센터 대시보드 숫자 표기 헬퍼
 *
 * 원보고서가 달러 기준이므로 '억 달러'를 주 단위로 쓰고, 원화는 참고로 병기한다.
 * 환율은 고정 상수이며 [추정] 태그를 달아 노출한다 — 환율 변동을 모델링하지 않는다.
 */

import { USD_KRW } from '@/lib/datacenter/constants';

/** 1억 달러 = 1e8 USD. 보고서 표기(380억 달러)와 코드를 맞추기 위한 기준 단위. */
const EOK_USD = 1e8;

/** 계산 계층과 같은 환율을 쓰도록 재수출한다. */
export { USD_KRW };

export function formatEokUsd(usd: number, digits = 0): string {
  return `${(usd / EOK_USD).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}억 달러`;
}

/** 만 달러 단위. 1억 달러에 못 미치는 값을 '0.54억 달러'로 쓰지 않기 위한 것이다. */
export function formatManUsd(usd: number): string {
  return `${Math.round(usd / 1e4).toLocaleString('ko-KR')}만 달러`;
}

/** 억 원 단위. 조 단위로는 너무 작은 값(일자리 1개당 투자액 등)에 쓴다. */
export function formatEokKrw(usd: number, digits = 0): string {
  const eok = (usd * USD_KRW) / 1e8;
  return `${eok.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}억 원`;
}

/** 조 원 단위. 국가 단위 집계에서 쓴다. */
export function formatJoKrw(usd: number, digits = 1): string {
  const jo = (usd * USD_KRW) / 1e12;
  return `${jo.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}조 원`;
}

/** 회수기간. 분석기간 내 미회수는 큰 숫자로 얼버무리지 않고 명시한다. */
export function formatPayback(years: number | null, horizon: number): string {
  if (years === null) return `${horizon}년 내 미회수`;
  return `${years.toFixed(2)}년`;
}

export function formatPercent(ratio: number | null, digits = 1): string {
  if (ratio === null) return '산출 불가';
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 부호를 명시해 적자를 눈에 띄게 한다. */
export function formatSignedEokUsd(usd: number, digits = 0): string {
  const sign = usd < 0 ? '−' : '';
  return `${sign}${formatEokUsd(Math.abs(usd), digits)}`;
}
