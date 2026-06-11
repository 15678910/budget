// 17 원시 시도 → 16 광역 병합 (광주광역시 + 전라남도 → 광주전남)
// 비율 지표(ratio)는 인구 가중 평균, 절대 지표(sum)는 합산.
// 병합은 오직 이 모듈에서만 수행한다(SIDO_FULL_TO_SHORT는 분리 유지).

export const CANON_16 = [
  '서울', '부산', '대구', '인천', '대전', '울산', '세종', '경기',
  '강원', '충북', '충남', '전북', '광주전남', '경북', '경남', '제주',
] as const;

export type MergeKind = 'ratio' | 'sum';
const MERGED = { from: ['광주', '전남'] as const, to: '광주전남' };

/**
 * 원시 시도 약칭→값 맵을 16 캐논 광역으로 병합.
 * @param values 시도 약칭(예: '광주','전남','서울')→값
 * @param kind   'ratio'=인구가중평균, 'sum'=합산
 * @param pop    ratio일 때 시도 약칭→인구(가중치). 미제공 시 단순평균.
 */
export function mergeToCanon16(
  values: Record<string, number>,
  kind: MergeKind,
  pop?: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  // 병합 비대상 그대로 통과
  for (const [k, v] of Object.entries(values)) {
    if (k === '광주' || k === '전남') continue;
    out[k] = v;
  }
  // 광주+전남 병합
  const parts = MERGED.from.filter((k) => values[k] != null);
  if (parts.length === 1) {
    out[MERGED.to] = values[parts[0]];
  } else if (parts.length === 2) {
    if (kind === 'sum') {
      out[MERGED.to] = values['광주'] + values['전남'];
    } else {
      const w1 = pop?.['광주'] ?? 1;
      const w2 = pop?.['전남'] ?? 1;
      out[MERGED.to] = (values['광주'] * w1 + values['전남'] * w2) / (w1 + w2);
    }
  }
  return out;
}
