/** 화면 표시용 숫자 형식 */
export function fmtJo(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}조 원`;
}

export function fmtWon(n: number): string {
  if (!Number.isFinite(n)) return '-';
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}

export function fmtPct(rate: number, digits = 1): string {
  if (!Number.isFinite(rate)) return '-';
  return `${(rate * 100).toLocaleString('ko-KR', { maximumFractionDigits: digits })}%`;
}

export function fmtPeople(n: number): string {
  if (!Number.isFinite(n)) return '-';
  return `${Math.round(n).toLocaleString('ko-KR')}명`;
}
