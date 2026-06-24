// ============================================================
// benchmark 지표 분포 회귀 테스트
// ============================================================
//
// 목적: INDICATOR_TARGETS에서 type==='benchmark'인 모든 지표에 대해,
//   assembleIndicatorValues()의 실제 16광역 분포(min/max)를 구하고
//   green·floor가 [min, max] 범위 내(±0.5 허용오차)인지 검증한다.
//
// 이 테스트가 실패하면 "분포 상위/하위" 사실주장이 거짓임을 의미한다.
// normative/official 항목은 분포 밖 aspirational이 허용되므로 이 테스트 대상이 아니다.
//
// direction 반영:
//   higher_better: green=max(best), floor=min(worst) 이어야 한다.
//   lower_better:  green=min(best), floor=max(worst) 이어야 한다.
// ============================================================

import { INDICATOR_TARGETS } from '@/lib/sdg/targets-data';
import { assembleIndicatorValues } from '@/lib/sdg/board-data';

const TOLERANCE = 0.5;

describe('benchmark 지표: green/floor가 실제 16광역 분포 끝값과 일치한다 (±0.5 허용오차)', () => {
  // assembleIndicatorValues()는 무거우므로 describe 스코프에서 한 번만 호출
  const { valuesByIndicator, direction } = assembleIndicatorValues();

  const benchmarkEntries = Object.entries(INDICATOR_TARGETS).filter(
    ([, t]) => t.type === 'benchmark',
  );

  // benchmark 항목이 존재하는지 sanity check
  it('benchmark 항목이 1개 이상 존재한다', () => {
    expect(benchmarkEntries.length).toBeGreaterThan(0);
  });

  describe.each(benchmarkEntries)('지표 %s', (indId, target) => {
    it(`${indId}: 16광역 실값이 존재한다`, () => {
      expect(valuesByIndicator[indId]).toBeDefined();
      const vals = Object.values(valuesByIndicator[indId]);
      expect(vals.length).toBeGreaterThan(0);
    });

    it(`${indId}: green이 실제 best 값(±${TOLERANCE})과 일치한다`, () => {
      const values = valuesByIndicator[indId];
      if (!values) return; // 위 테스트에서 이미 fail
      const nums = Object.values(values);
      const dir = direction[indId];
      expect(dir).toBeDefined();

      // higher_better: best=max, lower_better: best=min
      const actualBest = dir === 'higher_better' ? Math.max(...nums) : Math.min(...nums);
      expect(Math.abs(target.green - actualBest)).toBeLessThanOrEqual(
        TOLERANCE,
        `${indId} green=${target.green} vs 실제 best=${actualBest} (direction=${dir}) — 허용오차 ±${TOLERANCE} 초과. ` +
          `분포: ${JSON.stringify(values)}`,
      );
    });

    it(`${indId}: floor가 실제 worst 값(±${TOLERANCE})과 일치한다`, () => {
      const values = valuesByIndicator[indId];
      if (!values) return;
      const nums = Object.values(values);
      const dir = direction[indId];
      expect(dir).toBeDefined();

      // higher_better: worst=min, lower_better: worst=max
      const actualWorst = dir === 'higher_better' ? Math.min(...nums) : Math.max(...nums);
      expect(Math.abs(target.floor - actualWorst)).toBeLessThanOrEqual(
        TOLERANCE,
        `${indId} floor=${target.floor} vs 실제 worst=${actualWorst} (direction=${dir}) — 허용오차 ±${TOLERANCE} 초과. ` +
          `분포: ${JSON.stringify(values)}`,
      );
    });
  });
});
