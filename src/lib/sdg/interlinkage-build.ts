// ============================================================
// 정책 연계성 데이터 빌더 (서버)
// ------------------------------------------------------------
// 실데이터(board-data)에서 16광역 × 17목표 달성도 행렬을 구성해
// interlinkageMatrix 입력 형태 `{ [goalNum]: { [region]: score } }`로 반환.
// score null(데이터 없는 목표/지역)은 제외한다.
// ============================================================

import { assembleIndicatorValues } from './board-data';
import { regionGoalAchievement } from './achievement';
import { CANON_16 } from './region-normalize';
import { interlinkageMatrix, type InterlinkageResult } from './interlinkage';

/** goal×region 달성도 행렬: `{ [goalNum]: { [region]: score } }` (score 보유분만). */
export function buildAchievementByGoal(): Record<number, Record<string, number>> {
  const { valuesByIndicator, direction } = assembleIndicatorValues();

  const byGoal: Record<number, Record<string, number>> = {};
  for (const region of CANON_16) {
    const achievement = regionGoalAchievement(valuesByIndicator, region, direction);
    for (let goal = 1; goal <= 17; goal++) {
      const a = achievement[goal];
      if (!a || a.score == null || !Number.isFinite(a.score)) continue;
      (byGoal[goal] ??= {})[region] = a.score;
    }
  }
  return byGoal;
}

/** 빌더 + 상관 매트릭스를 한 번에 산출(page.tsx 편의). */
export function buildInterlinkage(): InterlinkageResult {
  return interlinkageMatrix(buildAchievementByGoal());
}
