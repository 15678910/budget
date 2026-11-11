/** ④ 지출 규칙: 노르웨이식 원금 보존 인출 */

export const EPS = 1e-9;

/** 그해 기금에서 꺼낼 수 있는 상한(조 원). 기금이 음수면 0. */
export function withdrawalCap(fundPrev: number, rate: number): number {
  if (fundPrev <= 0 || rate <= 0) return 0;
  return fundPrev * rate;
}

/** 해마다 annualNet을 원금 손상 없이 꺼내려면 필요한 기금(조 원). */
export function perpetualFund(annualNet: number, rate: number): number {
  if (annualNet <= 0) return 0;
  if (rate <= 0) return Infinity;
  return annualNet / rate;
}
