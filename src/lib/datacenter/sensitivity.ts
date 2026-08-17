/**
 * 민감도와 역산 (설계문서 §4.8)
 *
 * 어느 가정이 결과를 지배하는지 보여주고, "GPU 수명 안에 회수하려면 임대료 하락률이
 * 몇 % 이하여야 하는가" 같은 질문에 답한다. 해가 구간 밖이면 null을 내고,
 * 화면은 "어떤 값으로도 달성 불가"로 서술한다 — 억지로 숫자를 만들지 않는다.
 */

import { analyze } from './finance';
import { validateFinance } from './assumptions';
import type { FinanceAssumptions } from './types';

/** 민감도 분석 대상이 되는 수치형 파라미터 */
export type NumericParam =
  | 'capexUsd'
  | 'revenueYear1Usd'
  | 'opexAnnualUsd'
  | 'interestRate'
  | 'debtRatio'
  | 'rentDeclineAnnual'
  | 'utilization'
  | 'gpuLifeYears';

export type Metric = 'paybackYears' | 'recoveryRatioAtGpuEol' | 'npv' | 'irr';

export const PARAM_LABEL: Record<NumericParam, string> = {
  capexUsd: '총 투자비',
  revenueYear1Usd: '연 매출',
  opexAnnualUsd: '운영비',
  interestRate: '금리',
  debtRatio: '부채비율',
  rentDeclineAnnual: '임대료 하락률',
  utilization: '가동률',
  gpuLifeYears: 'GPU 수명',
};

/**
 * 지표를 뽑아낸다. 회수 실패(null)는 0이 아니라 null로 흘려보내
 * "회수 못 함"을 "즉시 회수"로 뒤집지 않는다.
 */
function readMetric(a: FinanceAssumptions, metric: Metric): number | null {
  const { summary } = analyze(a);
  switch (metric) {
    case 'paybackYears':
      return summary.paybackYears;
    case 'recoveryRatioAtGpuEol':
      return summary.recoveryRatioAtGpuEol;
    case 'npv':
      return summary.npv;
    case 'irr':
      return summary.irr;
  }
}

function withParam(
  base: FinanceAssumptions,
  param: NumericParam,
  value: number,
): FinanceAssumptions | null {
  const next = { ...base, [param]: value };
  try {
    validateFinance(next);
    return next;
  } catch {
    // 흔든 값이 유효 범위를 벗어나면 그 지점은 건너뛴다.
    return null;
  }
}

export interface TornadoRow {
  param: NumericParam;
  label: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  /** 파라미터를 낮췄을 때의 지표. 미회수면 null */
  lowMetric: number | null;
  highMetric: number | null;
  /** 흔든 값이 유효 범위를 벗어났는가 (예: 가동률 120%) */
  lowOutOfRange: boolean;
  highOutOfRange: boolean;
  /**
   * 지표 변화폭. 정렬 기준이다.
   * null = 범위 초과로 산출 불가, Infinity = 한쪽이 미회수(실제로 지배적).
   * 둘을 구분하지 않으면 '계산할 수 없는 변수'가 '가장 중요한 변수'로 둔갑한다.
   */
  swing: number | null;
}

/**
 * 각 파라미터를 ±delta만큼 흔들어 지표 변화폭 순으로 정렬한다.
 * 무엇이 결과를 지배하는지 한눈에 보여준다.
 */
export function tornado(
  base: FinanceAssumptions,
  params: readonly NumericParam[],
  delta = 0.2,
  metric: Metric = 'paybackYears',
): TornadoRow[] {
  if (delta <= 0 || delta >= 1) throw new Error(`변동폭은 0~1 사이여야 합니다: ${delta}`);

  const rows = params.map((param) => {
    const baseValue = base[param] as number;
    const lowValue = baseValue * (1 - delta);
    const highValue = baseValue * (1 + delta);

    const lowA = withParam(base, param, lowValue);
    const highA = withParam(base, param, highValue);
    const lowMetric = lowA ? readMetric(lowA, metric) : null;
    const highMetric = highA ? readMetric(highA, metric) : null;

    let swing: number | null;
    if (!lowA || !highA) {
      // 흔든 값 자체가 유효하지 않으면 변화폭을 알 수 없다. 0도 무한대도 아니다.
      swing = null;
    } else if (lowMetric === null || highMetric === null) {
      // 유효한 입력인데 지표가 없다 = 한쪽에서 회수 실패. 실제로 지배적인 변수다.
      swing = Number.POSITIVE_INFINITY;
    } else {
      swing = Math.abs(highMetric - lowMetric);
    }

    return {
      param,
      label: PARAM_LABEL[param],
      baseValue,
      lowValue,
      highValue,
      lowMetric,
      highMetric,
      lowOutOfRange: !lowA,
      highOutOfRange: !highA,
      swing,
    };
  });

  // 산출 불가(null)는 맨 아래로 보낸다 — 모른다는 것을 크다는 것으로 표시하지 않는다.
  return rows.sort((a, b) => {
    if (a.swing === null && b.swing === null) return 0;
    if (a.swing === null) return 1;
    if (b.swing === null) return -1;
    return b.swing - a.swing;
  });
}

export interface Grid2D {
  xParam: NumericParam;
  yParam: NumericParam;
  xValues: readonly number[];
  yValues: readonly number[];
  /** [y][x] 순서. 계산 불가 지점은 null */
  cells: (number | null)[][];
}

/** 2변수 격자. 금리 × 임대료 하락률 → 회수기간 같은 조합을 본다. */
export function grid2d(
  base: FinanceAssumptions,
  xParam: NumericParam,
  yParam: NumericParam,
  xValues: readonly number[],
  yValues: readonly number[],
  metric: Metric = 'paybackYears',
): Grid2D {
  const cells = yValues.map((y) =>
    xValues.map((x) => {
      const a = withParam(base, xParam, x);
      const b = a ? withParam(a, yParam, y) : null;
      return b ? readMetric(b, metric) : null;
    }),
  );

  return { xParam, yParam, xValues, yValues, cells };
}

/**
 * 이분법으로 목표 지표를 만족하는 파라미터 값을 찾는다.
 *
 * 예: "GPU 수명 5년 안에 회수하려면 임대료 하락률이 몇 % 이하여야 하나?"
 * 해가 구간 밖이면 null — 억지로 경계값을 반환하지 않는다.
 */
export function solveFor(
  base: FinanceAssumptions,
  param: NumericParam,
  metric: Metric,
  targetValue: number,
  lo: number,
  hi: number,
): number | null {
  if (lo >= hi) throw new Error(`탐색 구간이 잘못됐습니다: ${lo} ~ ${hi}`);

  /**
   * 회수기간에서의 null은 "정보 없음"이 아니라 "분석기간 내 미회수", 즉 무한대를 뜻한다.
   * 이를 그대로 null로 흘리면 구간 끝이 미회수인 순간 탐색을 포기하게 되는데,
   * 정작 해는 그 사이에 있다. 회수기간에 한해 무한대로 치환해 단조성을 유지한다.
   * 다른 지표의 null(예: 부호 변화 없는 IRR)은 치환하지 않는다.
   */
  const evaluate = (v: number): number | null => {
    const a = withParam(base, param, v);
    if (!a) return null;
    const raw = readMetric(a, metric);
    if (raw === null && metric === 'paybackYears') return Number.POSITIVE_INFINITY;
    return raw;
  };

  const fLo = evaluate(lo);
  const fHi = evaluate(hi);
  if (fLo === null || fHi === null) return null;

  const gLo = fLo - targetValue;
  const gHi = fHi - targetValue;
  if (gLo === 0) return lo;
  if (gHi === 0) return hi;
  // 부호 변화가 없으면 구간 안에 해가 없다.
  if (gLo * gHi > 0) return null;

  let low = lo;
  let high = hi;
  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const fMid = evaluate(mid);
    if (fMid === null) return null;
    const gMid = fMid - targetValue;
    if (Math.abs(gMid) < 1e-9 || (high - low) / 2 < 1e-9) return mid;
    if (gLo * gMid < 0) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}
