// ============================================================
// 정책 연계성(시너지/상충) — 데이터 상관 (탐색적)
// ------------------------------------------------------------
// 16광역 SDG 목표별 달성도 점수의 Spearman 순위상관으로
// 목표 간 시너지(+) / 상충(-) 경향을 **탐색적으로** 관측한다.
//
// ⚠️ 정직성: 상관 ≠ 인과. 표본 n≤16(광역)으로 검정력 낮음.
//    공통요인 간접경로 가능. 정책효과를 단정하지 않는다.
//    근거: Nilsson(2016) SDG 상호작용, IGES SDG Interlinkages(Spearman).
// ============================================================

/** 동순위 평균순위 변환. 입력 길이만큼의 순위 배열 반환(1-based). */
function rankWithTies(v: number[]): number[] {
  const n = v.length;
  const idx = v.map((value, i) => ({ value, i }));
  idx.sort((a, b) => a.value - b.value);

  const ranks = new Array<number>(n);
  let k = 0;
  while (k < n) {
    let j = k;
    // 동일 값 묶음 [k, j] 탐색
    while (j + 1 < n && idx[j + 1].value === idx[k].value) j++;
    // 1-based 평균순위 = ((k+1) + (j+1)) / 2
    const avgRank = (k + 1 + (j + 1)) / 2;
    for (let m = k; m <= j; m++) ranks[idx[m].i] = avgRank;
    k = j + 1;
  }
  return ranks;
}

/** Pearson 상관. 표준편차 0 또는 길이<2면 null. */
function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 2 || y.length !== n) return null;

  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i];
    sy += y[i];
  }
  const mx = sx / n;
  const my = sy / n;

  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null; // 표준편차 0 → 정의 불가
  const r = sxy / Math.sqrt(sxx * syy);
  // 부동소수 오차 보정 후 클램프
  return Math.max(-1, Math.min(1, r));
}

/**
 * Spearman 순위상관계수.
 * 동순위는 평균순위로 변환 후 Pearson 상관 적용.
 * 길이 불일치 또는 n<2 → null. 순위 변환 후 표준편차 0(전부 동순위) → null.
 */
export function spearman(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null;
  const rx = rankWithTies(x);
  const ry = rankWithTies(y);
  return pearson(rx, ry);
}

/** 목표 쌍 상관 결과(a<b 단방향). */
export interface InterlinkagePair {
  a: number;
  b: number;
  /** Spearman r (-1~1) */
  r: number;
  /** 공통 지역 표본 수 */
  n: number;
}

export interface InterlinkageResult {
  /** 데이터(점수) 보유 목표 번호, 오름차순 */
  goals: number[];
  /** 공통 지역 ≥5 이고 r 산출된 목표 쌍(a<b) */
  pairs: InterlinkagePair[];
}

/** 공통 지역 최소 표본 수(미만이면 표본부족으로 제외). */
export const MIN_COMMON_REGIONS = 5;

/**
 * goal×region 달성도 행렬에서 목표 간 Spearman 상관 매트릭스 산출.
 *
 * @param achievementByGoal `{ [goalNum]: { [region]: score } }` (점수 없는 항목은 미포함 가정)
 * @returns goals(데이터 보유 목표 오름차순) + pairs(a<b, 공통지역≥5, r 산출분만)
 *
 * 규칙:
 *  - 점수가 1개 이상 있는 목표만 goals 에 포함.
 *  - 각 목표 쌍에 대해 두 목표 모두 점수가 있는 **공통 지역**의 벡터로 spearman.
 *  - 공통 지역 n<MIN_COMMON_REGIONS → 제외(표본부족).
 *  - spearman 이 null(상수벡터 등) → 제외.
 */
export function interlinkageMatrix(
  achievementByGoal: Record<number, Record<string, number>>,
): InterlinkageResult {
  // 점수 보유 목표만(오름차순)
  const goals = Object.keys(achievementByGoal)
    .map(Number)
    .filter((g) => {
      const byRegion = achievementByGoal[g];
      return byRegion && Object.keys(byRegion).length > 0;
    })
    .sort((a, b) => a - b);

  const pairs: InterlinkagePair[] = [];
  for (let i = 0; i < goals.length; i++) {
    for (let j = i + 1; j < goals.length; j++) {
      const a = goals[i];
      const b = goals[j];
      const va = achievementByGoal[a];
      const vb = achievementByGoal[b];

      // 공통 지역 점수 벡터(키 순서 일관)
      const xs: number[] = [];
      const ys: number[] = [];
      for (const region of Object.keys(va)) {
        const sa = va[region];
        const sb = vb[region];
        if (sa == null || sb == null || !Number.isFinite(sa) || !Number.isFinite(sb)) continue;
        xs.push(sa);
        ys.push(sb);
      }

      if (xs.length < MIN_COMMON_REGIONS) continue; // 표본부족
      const r = spearman(xs, ys);
      if (r == null) continue; // 상수벡터 등

      pairs.push({ a, b, r, n: xs.length });
    }
  }

  return { goals, pairs };
}
