// ============================================================
// 지도(SDGMapDashboard)용 goal별 단일 대표지표 소스
// ============================================================
//
// 배경: 지도는 KOSIS(public/data/sdg-sido.json)만 읽고, 전국 목록/상황판은
//   valuesByIndicator(board 실데이터)로 만든 nationalByGoal을 읽어 서로 다른 goal
//   집합을 갖고 있었다(goal1 등은 목록엔 있는데 지도엔 없음, goal7은 반대).
//   이 모듈은 두 소스를 한 곳에서 병합해 지도가 "board에만 있는 goal"도 그리게 한다.
//
// 우선순위: KOSIS(실측 다년 보유, 더 권위 있는 출처) > 상황판 대표지표(board).
//   board 대표지표 선택은 national.ts의 pickRepresentativeIndicators를 그대로 재사용한다
//   (전국 목록과 다른 지표를 고르지 않기 위함 — 중복 로직 금지).
//
// board→지도 변환 시 주의: valuesByIndicator는 이미 16광역(광주+전남='광주전남' 병합)이다.
//   지도는 TopoJSON 17개 원시 시도(광주·전남 분리)를 그리므로, '광주전남' 값을 광주·전남
//   두 시도에 동일하게 적용한다(병합값 재사용 — 새 값 발명 아님). 그 외 시도(세종 포함)는
//   이미 원시 키와 동일하므로 그대로 통과시킨다.

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import type { SDGIndicator } from './goals';
import { pickRepresentativeIndicators } from './national';
import { TREND_CURRENT_YEAR } from './trend';

export type MapSourceOrigin = 'kosis' | 'board';

export interface MapGoalSource {
  label: string;
  source: string;
  year: string;
  unit: string;
  higherBetter: boolean;
  /** 시도 약칭(17개 원시, 광주·전남 분리) → 값. 미보유 시도는 키 자체가 없음(값 발명 금지). */
  bySido: Record<string, number>;
  /** KOSIS 다년 실측 시계열(보유 goal만). board 대표지표는 없음. */
  seriesBySido?: Record<string, Record<string, number>>;
  origin: MapSourceOrigin;
}

export type MapSourceByGoal = Record<number, MapGoalSource | null>;

export interface IndicatorMeta {
  label: string;
  unit: string;
  source: string;
}

/**
 * CANON_16 키('광주전남' 포함)를 지도용 17개 원시 시도 키로 펼친다.
 * '광주전남'은 이미 인구가중평균(또는 합산)된 값이므로 광주·전남에 동일하게 적용한다
 * (두 시도의 실제 개별값을 board 파이프라인이 보존하지 않기 때문 — 새 값을 지어내지 않음).
 * 그 외 키(세종 포함)는 이미 원시 약칭과 동일하므로 그대로 통과.
 */
function explodeCanonToRaw(values: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === '광주전남') {
      out['광주'] = v;
      out['전남'] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export interface BuildMapSourceParams {
  /** public/data/sdg-sido.json의 goals (goal번호 문자열 → KOSIS 지표). */
  kosisGoals: Record<string, SDGIndicator>;
  /** 상황판 실데이터: 지표 id → (16광역 약칭 → 값). assembleIndicatorValues() 결과. */
  valuesByIndicator: Record<string, Record<string, number>>;
  /** 지표 id → 해석방향. */
  direction: Record<string, IndicatorDirection>;
  /** 지표 id → {label, unit, source}. SDG_DOMAINS에서 추출. */
  indicatorMeta: Record<string, IndicatorMeta>;
}

/**
 * goal(1~17)별 지도 대표지표를 KOSIS 우선 · 상황판 대표지표 폴백으로 만든다.
 * 둘 다 없으면 null(아직 시도별 공식 지표를 확보하지 못한 목표).
 */
export function buildMapSource(params: BuildMapSourceParams): MapSourceByGoal {
  const { kosisGoals, valuesByIndicator, direction, indicatorMeta } = params;
  const repByGoal = pickRepresentativeIndicators(valuesByIndicator);

  const out: MapSourceByGoal = {};
  for (let goal = 1; goal <= 17; goal++) {
    const kosis = kosisGoals[String(goal)];
    if (kosis) {
      out[goal] = { ...kosis, origin: 'kosis' };
      continue;
    }

    const ind = repByGoal[goal];
    const vals = ind ? valuesByIndicator[ind] : undefined;
    if (!ind || !vals || Object.keys(vals).length === 0) {
      out[goal] = null;
      continue;
    }

    const meta = indicatorMeta[ind];
    out[goal] = {
      label: meta?.label ?? ind,
      source: meta?.source ?? '',
      year: String(TREND_CURRENT_YEAR),
      unit: meta?.unit ?? '',
      higherBetter: (direction[ind] ?? 'higher_better') === 'higher_better',
      bySido: explodeCanonToRaw(vals),
      origin: 'board',
    };
  }
  return out;
}
