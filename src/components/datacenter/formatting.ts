/**
 * 데이터센터 대시보드 숫자 표기 헬퍼
 *
 * 원보고서가 달러 기준이므로 '억 달러'를 주 단위로 쓰고, 원화는 참고로 병기한다.
 * 환율은 고정 상수이며 [추정] 태그를 달아 노출한다 — 환율 변동을 모델링하지 않는다.
 */

/** 1억 달러 = 1e8 USD. 보고서 표기(380억 달러)와 코드를 맞추기 위한 기준 단위. */
const EOK_USD = 1e8;

/** 원/달러 환율 [추정]. 화면에 근거와 함께 표시한다. */
export const USD_KRW = 1350;

export function formatEokUsd(usd: number, digits = 0): string {
  return `${(usd / EOK_USD).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}억 달러`;
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
