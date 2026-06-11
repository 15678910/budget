import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { normalizeMinMax } from './indicator-map';

export interface BuildMatrixArgs {
  metros: readonly string[];
  indicatorToGoal: Record<string, number>;
  direction: Record<string, IndicatorDirection>;
  valuesByIndicator: Record<string, Record<string, number>>; // 이미 광역 병합된 실값
}

export type MatrixCell = number | null;
export type Matrix = Record<string, Record<number, MatrixCell>>;

/**
 * 16광역 × 17목표 매트릭스 빌드.
 * 셀 = 해당 goal에 매핑된 지표들의 정규화 점수를 광역별로 평균(반올림).
 * 매핑 지표가 없거나 데이터가 없는 목표는 null(준비중).
 */
export function buildMatrix(args: BuildMatrixArgs): Matrix {
  const { metros, indicatorToGoal, direction, valuesByIndicator } = args;
  // goal → 지표 id[]
  const goalIndicators: Record<number, string[]> = {};
  for (const [ind, goal] of Object.entries(indicatorToGoal)) {
    (goalIndicators[goal] ??= []).push(ind);
  }
  // 지표별 정규화 결과 캐시
  const norm: Record<string, Record<string, number>> = {};
  for (const ind of Object.keys(indicatorToGoal)) {
    const vals = valuesByIndicator[ind];
    if (vals && Object.keys(vals).length) {
      norm[ind] = normalizeMinMax(vals, direction[ind]);
    }
  }
  const matrix: Matrix = {};
  for (const metro of metros) {
    matrix[metro] = {};
    for (let goal = 1; goal <= 17; goal++) {
      const inds = (goalIndicators[goal] ?? []).filter((i) => norm[i]?.[metro] != null);
      if (inds.length === 0) { matrix[metro][goal] = null; continue; }
      const avg = inds.reduce((s, i) => s + norm[i][metro], 0) / inds.length;
      matrix[metro][goal] = Math.round(avg);
    }
  }
  return matrix;
}
