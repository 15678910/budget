import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

/** 지표 id → SDG 목표 번호 (재정/인구는 맥락이라 제외) */
export const INDICATOR_TO_GOAL: Record<string, number> = {
  // Goal 1 빈곤
  wel_basic: 1, wel_budget: 1,
  // Goal 3 건강
  hlt_life: 3, hlt_doctor: 3, hlt_suicide: 3, hlt_obesity: 3,
  // Goal 4 교육
  edu_student: 4, edu_private: 4, edu_univ: 4,
  // Goal 5 성평등
  emp_female: 5,
  // Goal 8 일자리
  emp_rate: 8, emp_unemp: 8, emp_youth: 8,
  // Goal 9 인프라
  trn_road: 9,
  // Goal 10 불평등
  wel_pension: 10, wel_elderly: 10,
  // Goal 11 도시
  hou_supply: 11, hou_area: 11, hou_pir: 11, hou_rental: 11,
  env_park: 11, trn_public: 11, cul_facility: 11, cul_sports: 11,
  // Goal 13 기후 (env_pm25 RAW 보유, env_recycle·env_sewage 포함 3개 지표 모두 반영)
  env_pm25: 13, env_recycle: 13, env_sewage: 13,
  // Goal 16 제도
  saf_crime: 16, saf_traffic: 16, saf_fire: 16,
};

/** 16광역 분포에서 0~100 정규화. lower_better면 반전. 단일값이면 50. */
export function normalizeMinMax(
  values: Record<string, number>,
  direction: IndicatorDirection,
): Record<string, number> {
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(values)) {
    if (max === min) { out[k] = 50; continue; }
    let t = ((v - min) / (max - min)) * 100;
    if (direction === 'lower_better') t = 100 - t;
    out[k] = Math.round(t);
  }
  return out;
}
