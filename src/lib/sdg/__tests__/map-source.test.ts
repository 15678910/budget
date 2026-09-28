import { buildMapSource, type IndicatorMeta } from '@/lib/sdg/map-source';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import type { SDGIndicator } from '@/lib/sdg/goals';

// INDICATOR_TO_GOAL 선언순서상 goal1=wel_basic, goal8=emp_rate 이 대표지표.
const direction: Record<string, IndicatorDirection> = {
  wel_basic: 'lower_better',
  emp_rate: 'higher_better',
};
const indicatorMeta: Record<string, IndicatorMeta> = {
  wel_basic: { label: '기초생활수급자 비율', unit: '%', source: 'KOSIS' },
  emp_rate: { label: '고용률', unit: '%', source: '통계청' },
};

function kosisIndicator(overrides: Partial<SDGIndicator> = {}): SDGIndicator {
  return {
    label: '자살률(인구 10만명당)',
    source: '통계청 사망원인통계',
    year: '2024',
    unit: '명(10만명당)',
    higherBetter: false,
    bySido: { 서울: 24.1, 부산: 30.3 },
    ...overrides,
  };
}

describe('buildMapSource', () => {
  it('KOSIS 항목이 있으면 board보다 우선한다', () => {
    const out = buildMapSource({
      kosisGoals: { '8': kosisIndicator({ label: '15-64세 고용률' }) },
      valuesByIndicator: { emp_rate: { 서울: 60, 광주전남: 55 } },
      direction,
      indicatorMeta,
    });
    expect(out[8]?.origin).toBe('kosis');
    expect(out[8]?.label).toBe('15-64세 고용률');
  });

  it('KOSIS가 없으면 상황판 대표지표(goal1=wel_basic)로 폴백하고 광주전남을 광주·전남에 동일 적용한다', () => {
    const valuesByIndicator = {
      wel_basic: { 서울: 3.8, 부산: 4.2, 세종: 1.5, 광주전남: 4.0 },
    };
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator,
      direction,
      indicatorMeta,
    });
    expect(out[1]?.origin).toBe('board');
    expect(out[1]?.label).toBe('기초생활수급자 비율');
    expect(out[1]?.unit).toBe('%');
    expect(out[1]?.higherBetter).toBe(false);
    // 광주전남 병합값이 광주·전남 양쪽에 동일하게 적용(발명 아님, 병합값 재사용)
    expect(out[1]?.bySido['광주']).toBe(4.0);
    expect(out[1]?.bySido['전남']).toBe(4.0);
    // 원래 있던 키(세종 포함)는 그대로 통과
    expect(out[1]?.bySido['서울']).toBe(3.8);
    expect(out[1]?.bySido['부산']).toBe(4.2);
    expect(out[1]?.bySido['세종']).toBe(1.5);
    // valuesByIndicator와 동일한 원천값(변형 없음) — 16→17 확장만 발생
    expect(Object.keys(out[1]!.bySido).sort()).toEqual(
      ['광주', '부산', '서울', '세종', '전남'].sort(),
    );
  });

  it('KOSIS도 board 대표지표도 없는 goal은 null', () => {
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator: {},
      direction,
      indicatorMeta,
    });
    expect(out[2]).toBeNull(); // goal2(기아)는 매핑 지표 없음
    expect(out[14]).toBeNull(); // goal14(해양)도 없음
  });

  it('17개 goal 키가 모두 존재한다', () => {
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator: {},
      direction,
      indicatorMeta,
    });
    for (let g = 1; g <= 17; g++) expect(g in out).toBe(true);
  });

  it('Goal4는 nationalByGoal과 동일하게 edu_admission을 대표지표로 쓴다(오버라이드 재사용)', () => {
    const dir: Record<string, IndicatorDirection> = {
      edu_student: 'lower_better',
      edu_admission: 'higher_better',
    };
    const meta: Record<string, IndicatorMeta> = {
      edu_student: { label: '교원1인당학생수', unit: '명', source: '교육부' },
      edu_admission: { label: '대학 진학률(KEDI)', unit: '%', source: '한국교육개발원' },
    };
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator: {
        edu_student: { 서울: 15 },
        edu_admission: { 서울: 72 },
      },
      direction: dir,
      indicatorMeta: meta,
    });
    expect(out[4]?.label).toBe('대학 진학률(KEDI)');
    expect(out[4]?.bySido['서울']).toBe(72);
  });

  it('rawValuesByIndicator가 있으면 그것을 그대로 쓴다(광주≠전남, 병합값 재사용 안 함)', () => {
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator: { wel_basic: { 서울: 3.8, 광주전남: 4.0 } },
      rawValuesByIndicator: { wel_basic: { 서울: 3.8, 광주: 4.5, 전남: 3.6 } },
      direction,
      indicatorMeta,
    });
    expect(out[1]?.origin).toBe('board');
    // 원시값을 그대로 써서 광주와 전남이 서로 달라야 한다(병합값 4.0을 복제하지 않음)
    expect(out[1]?.bySido['광주']).toBe(4.5);
    expect(out[1]?.bySido['전남']).toBe(3.6);
    expect(out[1]?.bySido['광주']).not.toBe(out[1]?.bySido['전남']);
    expect(out[1]?.bySido['서울']).toBe(3.8);
    // 17개 원시 키(여기선 3개) 그대로 노출 — canon16 키('광주전남')는 없어야 함
    expect(out[1]?.bySido['광주전남']).toBeUndefined();
  });

  it('rawValuesByIndicator가 없으면 canon16 값을 광주·전남에 동일 적용하는 폴백을 쓴다', () => {
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator: { wel_basic: { 서울: 3.8, 광주전남: 4.0 } },
      direction,
      indicatorMeta,
    });
    expect(out[1]?.bySido['광주']).toBe(4.0);
    expect(out[1]?.bySido['전남']).toBe(4.0);
  });

  it('rawSeriesByIndicator가 있으면 board 기원 지표에도 다년 실측 시계열을 싣는다', () => {
    const series = { 서울: { '2022': 60, '2023': 62 }, 광주: { '2022': 80, '2023': 81 } };
    const out = buildMapSource({
      kosisGoals: {},
      valuesByIndicator: { edu_admission: { 서울: 62, 광주전남: 80.5 } },
      rawValuesByIndicator: { edu_admission: { 서울: 62, 광주: 80, 전남: 81 } },
      rawSeriesByIndicator: { edu_admission: series },
      direction: { edu_admission: 'higher_better' },
      indicatorMeta: { edu_admission: { label: '대학 진학률(KEDI)', unit: '%', source: '한국교육개발원' } },
    });
    expect(out[4]?.seriesBySido).toBe(series);
  });

  it('KOSIS 지표의 nationalAggregate/proxyNote가 지도 소스로 그대로 전달된다', () => {
    const out = buildMapSource({
      kosisGoals: {
        '14': kosisIndicator({
          label: '연안습지(갯벌) 면적',
          unit: 'k㎡',
          bySido: { 인천: 688.6, 전남: 1070.8 },
          nationalAggregate: 'none',
          proxyNote: '갯벌 면적은 해안 시도에만 있고, 크기는 지형 차이라 순위가 성과를 뜻하지 않습니다.',
        }),
      },
      valuesByIndicator: {},
      direction,
      indicatorMeta,
    });
    expect(out[14]?.origin).toBe('kosis');
    expect(out[14]?.nationalAggregate).toBe('none');
    expect(out[14]?.proxyNote).toBe('갯벌 면적은 해안 시도에만 있고, 크기는 지형 차이라 순위가 성과를 뜻하지 않습니다.');
  });

  it('nationalAggregate/proxyNote가 없는 일반 KOSIS 지표는 undefined다', () => {
    const out = buildMapSource({
      kosisGoals: { '8': kosisIndicator({ label: '15-64세 고용률' }) },
      valuesByIndicator: {},
      direction,
      indicatorMeta,
    });
    expect(out[8]?.nationalAggregate).toBeUndefined();
    expect(out[8]?.proxyNote).toBeUndefined();
  });
});
