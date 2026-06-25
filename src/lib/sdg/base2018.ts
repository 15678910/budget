// base2018 어셈블러 — 추세(2점 CR) 계산의 기준연도(2018) 값을 16광역으로 병합.
//
// ⚠️ 정직성 원칙 (spec D1·D3, CLAUDE.md PART 9 §1):
//   - base2018 = getMetroIndicatorData(metroFullName, indId).history[0].value.
//     history는 generateHistory(base2018, current)로 만들어지며 i=0(t=0, noise=0)에서
//     정확히 RAW base(=실측 2018 끝점)를 반환한다. **중간연도(보간값)는 사용 금지**(날조).
//   - assembleIndicatorValues와 동일 패턴: getAllMetroNames()(17 RAW 정식명) 순회 →
//     SIDO_FULL_TO_SHORT(광주/전남 분리) → mergeToCanon16('ratio', population)로 16광역 병합.
//   - INDICATOR_TO_GOAL에 매핑된 지표만 수집(맥락 지표 fin_*/dem_* 제외).
//
// 인구 가중치 출처/병합 규칙은 board-data.ts와 동일(광주/전남 분리 인구는 주민등록 상수).

import {
  getAllMetroNames,
  getMetroIndicatorData,
} from '@/lib/data/local-sdg-data';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { INDICATOR_TO_GOAL } from './indicator-map';
import { mergeToCanon16 } from './region-normalize';
import { SIDO_FULL_TO_SHORT } from './goals';

// 광주/전남 분리 인구(2026.2 주민등록 기준). board-data.ts GWANGJU_JEONNAM_POP와 동일.
// fiscal은 광주+전남을 통합 제공하므로 ratio 가중치용으로 상수 분리.
const GWANGJU_JEONNAM_POP: Record<string, number> = {
  광주: 1404154,
  전남: 1761628,
};

/** 원시 시도 약칭 → 인구 (ratio 가중치). board-data.ts와 동일 산출. */
function buildPopulation(): Record<string, number> {
  const population: Record<string, number> = { ...GWANGJU_JEONNAM_POP };
  for (const m of getMetroFiscalData()) {
    const short = SIDO_FULL_TO_SHORT[m.name];
    if (short) population[short] = m.population; // 매핑되는 15개만(통합특별시 미매핑)
  }
  return population;
}

/**
 * 매핑 지표별 16광역 base2018 값.
 * @returns 지표 id → (16광역 약칭 → 2018 기준값). 광주+전남은 '광주전남'으로 인구가중 병합.
 */
export function assembleBase2018(): Record<string, Record<string, number>> {
  const metroFullNames = getAllMetroNames();
  const toShort = (name: string) => SIDO_FULL_TO_SHORT[name] ?? name;
  const population = buildPopulation();

  const base2018ByIndicator: Record<string, Record<string, number>> = {};
  for (const indId of Object.keys(INDICATOR_TO_GOAL)) {
    const raw: Record<string, number> = {};
    for (const fullName of metroFullNames) {
      const d = getMetroIndicatorData(fullName, indId);
      const base = d?.history[0]?.value;
      if (base != null && Number.isFinite(base)) raw[toShort(fullName)] = base;
    }
    if (Object.keys(raw).length) {
      base2018ByIndicator[indId] = mergeToCanon16(raw, 'ratio', population);
    }
  }
  return base2018ByIndicator;
}
