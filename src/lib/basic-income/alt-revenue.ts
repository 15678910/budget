/** ⑥ 대안 세입: 로봇세·데이터세·탄소세 (조 원/년) */
import type { CarbonTaxInput, DataTaxInput, RobotTaxInput } from './types';

/** 로봇세: 과세 기반이 해마다 annualDecline만큼 줄어든다(자동화가 끝나면 기반이 사라짐). */
export function robotTax(i: RobotTaxInput, t: number): number {
  return i.base * i.rate * Math.pow(1 - i.annualDecline, Math.max(0, t));
}

/** 데이터세: 과세 기반이 해마다 annualGrowth만큼 는다. */
export function dataTax(i: DataTaxInput, t: number): number {
  return i.base * i.rate * Math.pow(1 + i.annualGrowth, Math.max(0, t));
}

/**
 * 탄소세: 배출량(백만 t) × t당 가격(원) / 1e6 = 조 원.
 * 과세 비율(taxableShare)만큼만 매긴다. 배출은 기준 연도부터 탄소중립 연도까지 직선으로 0이 된다고 본다.
 */
export function carbonTax(i: CarbonTaxInput, year: number, baseYear: number): number {
  const span = i.netZeroYear - baseYear;
  if (span <= 0) return 0;
  const remaining = Math.max(0, (i.netZeroYear - year) / span);
  return ((i.emissionsMt * i.taxableShare * i.pricePerTonWon) / 1e6) * Math.min(1, remaining);
}
