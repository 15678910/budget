import { buildMatrix } from '@/lib/sdg/matrix';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

const dir: Record<string, IndicatorDirection> = {
  emp_rate: 'higher_better', emp_unemp: 'lower_better', wel_basic: 'lower_better',
};
// 3개 광역만으로 단순화
const values: Record<string, Record<string, number>> = {
  emp_rate: { 서울: 60, 부산: 50, 경기: 70 },
  emp_unemp: { 서울: 3, 부산: 5, 경기: 2 },
  wel_basic: { 서울: 2, 부산: 4, 경기: 1 },
};

describe('buildMatrix', () => {
  const m = buildMatrix({
    metros: ['서울', '부산', '경기'],
    indicatorToGoal: { emp_rate: 8, emp_unemp: 8, wel_basic: 1 },
    direction: dir,
    valuesByIndicator: values,
  });

  it('goal 8 = emp_rate·emp_unemp 정규화 평균', () => {
    // emp_rate higher {60,50,70}: 서울50 부산0 경기100
    // emp_unemp lower {3,5,2} (range 2~5): 서울67(=100-33) 부산0 경기100
    // 평균: 서울(50+67)/2=58.5→59, 부산0, 경기100
    expect(m['경기'][8]).toBe(100);
    expect(m['부산'][8]).toBe(0);
    expect(m['서울'][8]).toBe(59);
  });
  it('데이터 없는 목표는 null', () => {
    expect(m['서울'][2]).toBeNull();
    expect(m['서울'][17]).toBeNull();
  });
  it('모든 16(여기선 3) 광역 × 17목표 키가 존재한다', () => {
    for (const metro of ['서울', '부산', '경기']) {
      for (let g = 1; g <= 17; g++) expect(g in m[metro]).toBe(true);
    }
  });
});
