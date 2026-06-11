import { nationalByGoal } from '@/lib/sdg/national';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

// 3개 광역으로 단순화한 인구가중 평균 검증.
// INDICATOR_TO_GOAL 선언순서상 goal8 대표지표=emp_rate, goal1=wel_basic.
const direction: Record<string, IndicatorDirection> = {
  emp_rate: 'higher_better',
  wel_basic: 'lower_better',
};
const labels: Record<string, { label: string; unit: string }> = {
  emp_rate: { label: '고용률', unit: '%' },
  wel_basic: { label: '기초생활수급자 비율', unit: '%' },
};

describe('nationalByGoal', () => {
  it('대표지표 인구가중 평균이 정확하다 (goal8 = emp_rate)', () => {
    const values = {
      emp_rate: { 서울: 60, 부산: 50, 경기: 70 },
      wel_basic: { 서울: 2, 부산: 4, 경기: 1 },
    };
    const pop = { 서울: 100, 부산: 100, 경기: 200 };
    const out = nationalByGoal(values, pop, direction, labels);
    // emp_rate 가중평균 = (60*100 + 50*100 + 70*200)/(400) = (6000+5000+14000)/400 = 62.5
    expect(out[8]).not.toBeNull();
    expect(out[8]!.indicatorId).toBe('emp_rate');
    expect(out[8]!.value).toBeCloseTo(62.5, 5);
    expect(out[8]!.unit).toBe('%');
    expect(out[8]!.label).toBe('고용률');
    expect(out[8]!.hasData).toBe(true);
  });

  it('단순평균이 아닌 인구가중임을 구분한다', () => {
    const values = { wel_basic: { 서울: 10, 부산: 0 } };
    const pop = { 서울: 300, 부산: 100 };
    const out = nationalByGoal(values, pop, direction, labels);
    // 가중 = (10*300 + 0*100)/400 = 7.5 (단순평균이면 5.0)
    expect(out[1]).not.toBeNull();
    expect(out[1]!.value).toBeCloseTo(7.5, 5);
    expect(out[1]!.indicatorId).toBe('wel_basic');
  });

  it('대표지표 데이터가 없는 goal은 null', () => {
    const values = { emp_rate: { 서울: 60 } };
    const pop = { 서울: 100 };
    const out = nationalByGoal(values, pop, direction, labels);
    expect(out[2]).toBeNull(); // goal2 매핑 지표 없음
    expect(out[14]).toBeNull(); // goal14 매핑 지표 없음
    expect(out[8]).not.toBeNull(); // emp_rate 있음
  });

  it('17개 goal 키가 모두 존재한다', () => {
    const out = nationalByGoal({}, {}, direction, labels);
    for (let g = 1; g <= 17; g++) expect(g in out).toBe(true);
  });

  it('인구 가중치가 없으면 단순평균으로 폴백', () => {
    const values = { emp_rate: { 서울: 60, 부산: 40 } };
    const out = nationalByGoal(values, {}, direction, labels);
    // 가중치 없음 → 단순평균 50
    expect(out[8]!.value).toBeCloseTo(50, 5);
  });

  it('Goal4 대표지표는 edu_univ(대학진학률)이어야 한다 (edu_student 대신)', () => {
    const values = {
      edu_student: { 서울: 15, 부산: 16 },
      edu_univ: { 서울: 72, 부산: 68 },
    };
    const dir: Record<string, IndicatorDirection> = {
      edu_student: 'lower_better',
      edu_univ: 'higher_better',
    };
    const lbl: Record<string, { label: string; unit: string }> = {
      edu_student: { label: '교원1인당학생수', unit: '명' },
      edu_univ: { label: '대학진학률', unit: '%' },
    };
    const pop = { 서울: 200, 부산: 100 };
    const out = nationalByGoal(values, pop, dir, lbl);
    // REP_INDICATOR_BY_GOAL 오버라이드: goal4 → edu_univ
    expect(out[4]).not.toBeNull();
    expect(out[4]!.indicatorId).toBe('edu_univ');
    expect(out[4]!.label).toBe('대학진학률');
    // 가중평균: (72*200 + 68*100) / 300 = (14400 + 6800) / 300 = 70.667
    expect(out[4]!.value).toBeCloseTo(70.667, 2);
  });
});
