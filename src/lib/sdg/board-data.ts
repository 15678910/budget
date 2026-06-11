// 실데이터 어셈블러 — local-sdg-data RAW 광역 실값을 16광역으로 병합.
// 서버 컴포넌트에서 호출(정적 import). 비율 지표라 ratio 병합(인구 가중) 사용.
//
// ⚠️ 데이터 소스 정합성(중요):
//   - 지표 실값/메타: local-sdg-data.ts RAW (17 정식 시도명 키, 광주광역시·전라남도 분리).
//     getMetroIndicatorData(metroName, indId)는 **17 RAW 정식명** 기준으로 조회한다.
//   - 재정(fiscal-health-data.getMetroFiscalData())은 이미 광주+전남이
//     '전남광주통합특별시'로 병합된 16개라 getMetroIndicatorData 키로 쓸 수 없다.
//     따라서 지표 수집은 fiscal이 아니라 getAllMetroNames()(17 RAW 정식명)로 순회한다.
//   - 인구 가중치: fiscal은 광주/전남을 분리 제공하지 못하므로,
//     광주/전남 분리 인구는 주민등록(2026.2 기준) 상수로 둔다. 나머지 15개는 fiscal 사용.

import {
  SDG_DOMAINS,
  getAllMetroNames,
  getMetroIndicatorData,
  type IndicatorDirection,
} from '@/lib/data/local-sdg-data';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { INDICATOR_TO_GOAL } from './indicator-map';
import { mergeToCanon16 } from './region-normalize';
import { SIDO_FULL_TO_SHORT } from './goals';

export interface BoardData {
  /** 지표 id → (16광역 약칭 → 실값). 광주+전남은 '광주전남'으로 병합됨. */
  valuesByIndicator: Record<string, Record<string, number>>;
  /** 지표 id → 해석방향 */
  direction: Record<string, IndicatorDirection>;
  /** 원시 시도 약칭 → 인구 (ratio 병합 가중치) */
  population: Record<string, number>;
}

// 광주/전남 분리 인구(2026.2 주민등록 기준). fiscal은 둘을 합쳐 제공하므로 가중치용 상수로 분리.
// 합(약 3,165,782)은 fiscal '전남광주통합특별시' population과 정합.
const GWANGJU_JEONNAM_POP: Record<string, number> = {
  광주: 1404154,
  전남: 1761628,
};

export function assembleIndicatorValues(): BoardData {
  // direction 맵 (SDG_DOMAINS에서 추출)
  const direction: Record<string, IndicatorDirection> = {};
  for (const d of SDG_DOMAINS) for (const ind of d.indicators) direction[ind.id] = ind.direction;

  // 원시 17 정식 시도명 (RAW 키)
  const metroFullNames = getAllMetroNames();
  const toShort = (name: string) => SIDO_FULL_TO_SHORT[name] ?? name;

  // 원시 시도 약칭 → 인구 (ratio 가중치).
  // 광주/전남은 상수로 분리, 나머지는 fiscal에서 약칭 매칭(전남광주통합특별시는 매칭 안 됨 → 무시).
  const population: Record<string, number> = { ...GWANGJU_JEONNAM_POP };
  for (const m of getMetroFiscalData()) {
    const short = SIDO_FULL_TO_SHORT[m.name];
    if (short) population[short] = m.population; // 매핑되는 15개만(통합특별시는 미매핑)
  }

  // 매핑된 각 지표에 대해 17 RAW 시도값 수집 → 16광역 병합(ratio)
  const valuesByIndicator: Record<string, Record<string, number>> = {};
  for (const indId of Object.keys(INDICATOR_TO_GOAL)) {
    const raw: Record<string, number> = {};
    for (const fullName of metroFullNames) {
      const d = getMetroIndicatorData(fullName, indId);
      if (d && Number.isFinite(d.currentValue)) raw[toShort(fullName)] = d.currentValue;
    }
    if (Object.keys(raw).length) {
      valuesByIndicator[indId] = mergeToCanon16(raw, 'ratio', population);
    }
  }
  return { valuesByIndicator, direction, population };
}
