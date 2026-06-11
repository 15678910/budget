import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { CANON_16 } from '@/lib/sdg/region-normalize';

describe('assembleIndicatorValues', () => {
  const { valuesByIndicator, direction } = assembleIndicatorValues();

  it('매핑된 지표마다 16광역(또는 그 부분집합) 값이 광주전남 통합 키를 쓴다', () => {
    const empRate = valuesByIndicator['emp_rate'];
    expect(empRate).toBeDefined();
    // 광주/전남 분리 키가 없어야 함
    expect(empRate['광주']).toBeUndefined();
    expect(empRate['전남']).toBeUndefined();
    // 광주전남 통합 키가 존재해야 함
    expect(empRate['광주전남']).toBeDefined();
    // 키는 CANON_16 부분집합
    for (const k of Object.keys(empRate)) expect(CANON_16).toContain(k as never);
  });

  it('direction 맵이 채워진다', () => {
    expect(direction['emp_rate']).toBe('higher_better');
    expect(direction['saf_crime']).toBe('lower_better');
  });
});
