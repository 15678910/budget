import { nationalByGoal, fillNationalFromKosis, weightedMean, type KosisIndicatorLike } from '@/lib/sdg/national';
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

  it('Goal4 대표지표는 edu_admission(KEDI 실측 대학진학률)이어야 한다 (edu_student 대신)', () => {
    const values = {
      edu_student: { 서울: 15, 부산: 16 },
      edu_admission: { 서울: 72, 부산: 68 },
    };
    const dir: Record<string, IndicatorDirection> = {
      edu_student: 'lower_better',
      edu_admission: 'higher_better',
    };
    const lbl: Record<string, { label: string; unit: string }> = {
      edu_student: { label: '교원1인당학생수', unit: '명' },
      edu_admission: { label: '대학 진학률(KEDI)', unit: '%' },
    };
    const pop = { 서울: 200, 부산: 100 };
    const out = nationalByGoal(values, pop, dir, lbl);
    // REP_INDICATOR_BY_GOAL 오버라이드: goal4 → edu_admission
    expect(out[4]).not.toBeNull();
    expect(out[4]!.indicatorId).toBe('edu_admission');
    expect(out[4]!.label).toBe('대학 진학률(KEDI)');
    // 가중평균: (72*200 + 68*100) / 300 = (14400 + 6800) / 300 = 70.667
    expect(out[4]!.value).toBeCloseTo(70.667, 2);
  });
});

describe('fillNationalFromKosis', () => {
  it('board 대표지표가 없는 goal(예: 7)을 KOSIS 인구가중평균으로 채운다', () => {
    const national = nationalByGoal({}, {}, direction, labels); // 전부 null
    const kosisGoals: Record<string, KosisIndicatorLike> = {
      7: {
        label: '신재생에너지 생산량',
        unit: 'toe',
        higherBetter: true,
        bySido: { 서울: 100, 경기: 300 },
      },
    };
    const rawPopulation = { 서울: 100, 경기: 200 };
    const out = fillNationalFromKosis(national, kosisGoals, rawPopulation);
    expect(out[7]).not.toBeNull();
    expect(out[7]!.label).toBe('신재생에너지 생산량');
    expect(out[7]!.unit).toBe('toe');
    expect(out[7]!.direction).toBe('higher_better');
    // 가중평균 = (100*100 + 300*200) / 300 = (10000+60000)/300 = 233.33
    expect(out[7]!.value).toBeCloseTo(weightedMean(kosisGoals[7].bySido, rawPopulation), 5);
    expect(out[7]!.value).toBeCloseTo(233.333, 2);
  });

  it('board 대표지표가 이미 있는 goal은 KOSIS로 덮어쓰지 않는다', () => {
    const values = { emp_rate: { 서울: 60, 부산: 50 } };
    const pop = { 서울: 100, 부산: 100 };
    const national = nationalByGoal(values, pop, direction, labels);
    const kosisGoals: Record<string, KosisIndicatorLike> = {
      8: { label: 'KOSIS 고용률', unit: '%', higherBetter: true, bySido: { 서울: 999 } },
    };
    const out = fillNationalFromKosis(national, kosisGoals, pop);
    // board 값(55)이 유지되어야 함 — KOSIS(999)로 덮어쓰지 않음
    expect(out[8]!.indicatorId).toBe('emp_rate');
    expect(out[8]!.value).toBeCloseTo(55, 5);
  });

  it('KOSIS bySido가 비어있으면 null 유지', () => {
    const national = nationalByGoal({}, {}, direction, labels);
    const out = fillNationalFromKosis(national, { 7: { label: 'x', unit: '', higherBetter: true, bySido: {} } }, {});
    expect(out[7]).toBeNull();
  });

  it("nationalAggregate:'none'인 지표(예: 갯벌 면적)는 value=null·regionalOnly=true로 채운다(전국 집계 금지)", () => {
    const national = nationalByGoal({}, {}, direction, labels);
    const kosisGoals: Record<string, KosisIndicatorLike> = {
      14: {
        label: '연안습지(갯벌) 면적',
        unit: 'k㎡',
        higherBetter: true,
        bySido: { 인천: 688.6, 전남: 1070.8 },
        nationalAggregate: 'none',
        proxyNote: '갯벌 면적은 해안 시도에만 있고, 크기는 지형 차이라 순위가 성과를 뜻하지 않습니다.',
      },
    };
    const out = fillNationalFromKosis(national, kosisGoals, { 인천: 100, 전남: 100 });
    expect(out[14]).not.toBeNull();
    expect(out[14]!.value).toBeNull(); // 인구가중평균을 만들지 않음(면적은 지형 특성)
    expect(out[14]!.regionalOnly).toBe(true);
    expect(out[14]!.proxyNote).toBe(kosisGoals[14].proxyNote);
    expect(out[14]!.hasData).toBe(true); // "데이터 보유" 카운트에는 포함
    expect(out[14]!.label).toBe('연안습지(갯벌) 면적');
  });

  it("nationalAggregate 미지정(기본 weightedMean)은 기존처럼 숫자를 채운다", () => {
    const national = nationalByGoal({}, {}, direction, labels);
    const kosisGoals: Record<string, KosisIndicatorLike> = {
      7: { label: '신재생에너지 생산량', unit: 'toe', higherBetter: true, bySido: { 서울: 100 } },
    };
    const out = fillNationalFromKosis(national, kosisGoals, { 서울: 100 });
    expect(out[7]!.value).toBe(100);
    expect(out[7]!.regionalOnly).toBeUndefined();
  });

  it('proxyNote가 있으면 그대로 전달되고, 없으면 undefined', () => {
    const national = nationalByGoal({}, {}, direction, labels);
    const kosisGoals: Record<string, KosisIndicatorLike> = {
      17: { label: '재정자립도', unit: '%', higherBetter: true, bySido: { 서울: 74 }, proxyNote: '지방정부 재정 여력을 보는 대리지표입니다.' },
      7: { label: '신재생에너지 생산량', unit: 'toe', higherBetter: true, bySido: { 서울: 100 } },
    };
    const out = fillNationalFromKosis(national, kosisGoals, { 서울: 100 });
    expect(out[17]!.proxyNote).toBe('지방정부 재정 여력을 보는 대리지표입니다.');
    expect(out[7]!.proxyNote).toBeUndefined();
  });
});
