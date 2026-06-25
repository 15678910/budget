// ============================================================
// 다년 실측 추세 통합 빌더 — KOSIS seriesBySido → 16광역 시계열 + 추세
// ============================================================
//
// goal8(고용률)·goal9(GRDP)의 KOSIS 다년 시계열(seriesBySido)을:
//   1) 연도별로 16광역(mergeToCanon16)으로 병합 → 광역별 시계열
//      - 비율 지표(3·5·8·9·11): 'ratio' — 광주전남 인구가중평균, 전국=광역 평균
//      - 절대량 지표(7=toe): 'sum' — 광주전남 합산, 전국=광역 합계
//   2) 선택 광역(또는 전국)의 실측 연도점 → linearTrend / multiYearArrow
//
// ⚠️ 정직성: 실측 연도점만(보간 0). 인과 0. 2점 개략(trend.ts)과 구분되는 "실측 N년 회귀".
//   green은 방어 가능한 지표만 사용(goal8=고용률 70% 정책목표). 없으면 slope 부호 판정.

import { mergeToCanon16, type MergeKind } from './region-normalize';
import { linearTrend, multiYearArrow, type YearPoint, type MultiYearTrend } from './multiyear-trend';
import type { TrendArrow } from './trend';

/**
 * KOSIS 다년 추세를 제공하는 goal과 그 정책목표(green).
 * - green!=null: 방어 가능한 정책/규범 목표(라벨에 명시). null: slope 부호 판정.
 * 표 추가 시 이 맵에 한 줄 추가(사전 검증 통과분만).
 */
/**
 * 절대량(toe 등) 지표 goal 집합 — mergeToCanon16 'sum' 모드 사용.
 * 광주+전남 = 합산(평균 아님), 전국 = 광역 합계.
 * 비율/퍼센트 지표(3·5·8·9·11)는 이 집합에 없으므로 기존 'ratio' + 전국=평균 유지.
 */
export const MULTIYEAR_ABSOLUTE: ReadonlySet<number> = new Set([7]); // 신재생에너지 생산량(toe)

export const MULTIYEAR_GREEN: Record<number, number | null> = {
  3: null, // 자살률: 방어 가능한 단일 목표값 없음 → slope 부호 판정(lower_better=하락 양호).
  5: null, // 여성 경제활동참가율: 단일 목표값 부재 → slope 부호 판정(상승=양호).
  7: null, // 신재생에너지 생산량: 단일 목표값 부재 → slope 부호 판정(상승=양호).
  8: 70, // 고용률 70% 정책목표(aspirational). emp_rate green과 일관.
  9: null, // 1인당 GRDP: 방어 가능한 단일 목표값 없음 → slope 부호 판정(상승=양호).
  11: null, // 주택보급률: 단일 목표값 부재(100% 논쟁적) → slope 부호 판정(상승=양호).
};

export interface RegionSeries {
  /** 16광역 약칭 → 실측 연도점(연도 오름차순). */
  byRegion: Record<string, YearPoint[]>;
  /**
   * 전국 실측 연도점.
   * - mergeKind='ratio': 16광역 평균(비율·퍼센트 지표용)
   * - mergeKind='sum':   16광역 합계(절대량 지표용 — 예: toe)
   */
  national: YearPoint[];
  /** 시계열에 등장한 모든 연도(오름차순). */
  years: number[];
}

/**
 * seriesBySido(원시 17 시도 약칭 → {연도: 값})를 16광역으로 병합한 연도별 시계열로 변환.
 *
 * @param seriesBySido 시도 약칭 → {연도(YYYY): 값}
 * @param pop          ratio 병합 가중치(시도 약칭 → 인구). 선택.
 * @param mergeKind    'ratio'(기본): 광주전남=인구가중평균·전국=평균 (비율·퍼센트 지표).
 *                     'sum': 광주전남=합산·전국=합계 (절대량 지표 — 예: goal7 toe).
 */
export function buildRegionSeries(
  seriesBySido: Record<string, Record<string, number>>,
  pop?: Record<string, number>,
  mergeKind: MergeKind = 'ratio',
): RegionSeries {
  // 등장 연도 수집
  const yearSet = new Set<string>();
  for (const series of Object.values(seriesBySido)) {
    for (const yr of Object.keys(series)) yearSet.add(yr);
  }
  const years = [...yearSet].filter((y) => /^\d{4}$/.test(y)).sort();

  const byRegion: Record<string, YearPoint[]> = {};
  const nationalAcc: { year: number; sum: number; cnt: number }[] = [];
  const yearsWithData: number[] = [];

  for (const yr of years) {
    // 해당 연도의 시도→값 맵
    const valuesThisYear: Record<string, number> = {};
    for (const [short, series] of Object.entries(seriesBySido)) {
      const v = series[yr];
      if (Number.isFinite(v)) valuesThisYear[short] = v;
    }
    if (Object.keys(valuesThisYear).length === 0) continue;

    const merged = mergeToCanon16(valuesThisYear, mergeKind, mergeKind === 'ratio' ? pop : undefined);
    const yearNum = Number(yr);
    yearsWithData.push(yearNum);
    let sum = 0;
    let cnt = 0;
    for (const [region, v] of Object.entries(merged)) {
      (byRegion[region] ||= []).push({ year: yearNum, value: v });
      sum += v;
      cnt += 1;
    }
    if (cnt > 0) nationalAcc.push({ year: yearNum, sum, cnt });
  }

  // 광역별 연도 오름차순 정렬(연도 루프가 정렬돼 있어 이미 정렬되지만 방어).
  for (const region of Object.keys(byRegion)) {
    byRegion[region].sort((a, b) => a.year - b.year);
  }

  // 전국: 절대량은 광역 합계(sum), 비율은 광역 평균(sum/cnt).
  const national: YearPoint[] = nationalAcc
    .sort((a, b) => a.year - b.year)
    .map((a) => ({ year: a.year, value: mergeKind === 'sum' ? a.sum : a.sum / a.cnt }));

  return { byRegion, national, years: yearsWithData.sort((a, b) => a - b) };
}

export interface MultiYearGoalTrend {
  trend: MultiYearTrend | null;
  arrow: TrendArrow | null;
  /** 추세 산정에 사용한 green(정책목표) — 없으면 null(slope 부호 판정). */
  green: number | null;
  /** 실측 연도점(스파크라인용, 보간 아님). */
  points: YearPoint[];
}

/**
 * 한 지역(또는 전국)의 실측 연도점에서 추세 요약+화살표 산출.
 * 연도점 <3이면 trend/arrow=null(신호 없음).
 */
export function regionMultiYearTrend(
  points: YearPoint[],
  goalNum: number,
  higherBetter: boolean,
  targetYear = 2030,
): MultiYearGoalTrend {
  const green = MULTIYEAR_GREEN[goalNum] ?? null;
  const trend = linearTrend(points);
  if (!trend) return { trend: null, arrow: null, green, points };
  const arrow = multiYearArrow(points, green, higherBetter, targetYear);
  return { trend, arrow, green, points };
}
