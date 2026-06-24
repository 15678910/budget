import { INDICATOR_TARGETS, type TargetType } from '@/lib/sdg/targets-data';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { SDG_DOMAINS, type IndicatorDirection } from '@/lib/data/local-sdg-data';

const VALID_TYPES: TargetType[] = ['official', 'normative', 'benchmark'];

// 지표 id → direction (SDG_DOMAINS에서 추출)
const direction: Record<string, IndicatorDirection> = {};
for (const d of SDG_DOMAINS) for (const ind of d.indicators) direction[ind.id] = ind.direction;

describe('INDICATOR_TARGETS', () => {
  const mappedIds = Object.keys(INDICATOR_TO_GOAL);

  it('모든 매핑 지표(INDICATOR_TO_GOAL)에 임계값이 존재한다', () => {
    for (const id of mappedIds) {
      expect(INDICATOR_TARGETS[id]).toBeDefined();
    }
  });

  it('모든 항목에 green/floor/type/source가 존재한다', () => {
    for (const [id, t] of Object.entries(INDICATOR_TARGETS)) {
      expect(typeof t.green).toBe('number');
      expect(Number.isFinite(t.green)).toBe(true);
      expect(typeof t.floor).toBe('number');
      expect(Number.isFinite(t.floor)).toBe(true);
      expect(VALID_TYPES).toContain(t.type);
      expect(typeof t.source).toBe('string');
      // 빈 source 금지
      expect(t.source.trim().length).toBeGreaterThan(0);
      // green != floor (분모 0 방어 — 데이터셋 차원에서 금지)
      expect(t.green).not.toBe(t.floor);
      void id;
    }
  });

  it('type은 official|normative|benchmark 집합에 속한다', () => {
    for (const t of Object.values(INDICATOR_TARGETS)) {
      expect(VALID_TYPES).toContain(t.type);
    }
  });

  it('higher_better는 green>floor, lower_better는 green<floor (direction 일관)', () => {
    for (const [id, t] of Object.entries(INDICATOR_TARGETS)) {
      const dir = direction[id];
      expect(dir).toBeDefined();
      if (dir === 'higher_better') {
        expect(t.green).toBeGreaterThan(t.floor);
      } else {
        expect(t.green).toBeLessThan(t.floor);
      }
    }
  });

  it('official 항목은 source에 구체적 출처 문구를 포함한다 (가짜 official 방지 가드)', () => {
    for (const [id, t] of Object.entries(INDICATOR_TARGETS)) {
      if (t.type === 'official') {
        // official은 인용 가능한 문서/기관명을 명시해야 한다.
        expect(t.source.length).toBeGreaterThan(10);
        void id;
      }
    }
  });
});
