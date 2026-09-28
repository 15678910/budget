import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { CANON_16 } from '@/lib/sdg/region-normalize';
import { ADMISSION_SIDO } from '@/lib/data/admission-rate';

describe('assembleIndicatorValues', () => {
  const { valuesByIndicator, rawValuesByIndicator, rawSeriesByIndicator, direction } = assembleIndicatorValues();

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

  it('광주전남 emp_rate 병합값이 인구 가중 평균과 일치한다', () => {
    // RAW 실값: 광주광역시 emp_rate currentValue = 60.5, 전라남도 = 65.5
    // (local-sdg-data.ts RAW emp_rate 배열, METRO_NAMES 순서 index 4·13)
    const gwangju = 60.5;
    const jeonnam = 65.5;
    // board-data.ts GWANGJU_JEONNAM_POP 상수와 동일한 행정안전부 주민등록(2026.2) 값
    const popGwangju = 1404154;
    const popJeonnam = 1761628;
    const expected = (gwangju * popGwangju + jeonnam * popJeonnam) / (popGwangju + popJeonnam);
    expect(valuesByIndicator['emp_rate']['광주전남']).toBeCloseTo(expected, 1);
  });

  it('rawValuesByIndicator는 원시 17개 시도(광주·전남 분리) 값을 보존한다', () => {
    const rawEmpRate = rawValuesByIndicator['emp_rate'];
    expect(rawEmpRate).toBeDefined();
    expect(rawEmpRate['광주']).toBeCloseTo(60.5, 5);
    expect(rawEmpRate['전남']).toBeCloseTo(65.5, 5);
    // canon16 병합 키('광주전남')는 원시값에 없어야 함
    expect(rawEmpRate['광주전남']).toBeUndefined();
  });

  it('edu_admission(KEDI 실측 진학률)이 ADMISSION_SIDO에서 직접 병합된다', () => {
    expect(valuesByIndicator['edu_admission']).toBeDefined();
    expect(direction['edu_admission']).toBe('higher_better');
    // 원시값은 ADMISSION_SIDO의 시도별 latest와 정확히 일치(변형 없음)
    for (const s of ADMISSION_SIDO) {
      expect(rawValuesByIndicator['edu_admission'][s.sido]).toBe(s.latest);
    }
    // 광주+전남은 인구가중 병합된 '광주전남' 키로 존재
    expect(valuesByIndicator['edu_admission']['광주전남']).toBeDefined();
    expect(valuesByIndicator['edu_admission']['광주']).toBeUndefined();
    // 다년 실측 시계열도 원시 시도별로 보존된다(연도 2022~2025)
    const series = rawSeriesByIndicator['edu_admission'];
    expect(series['서울']['2025']).toBeDefined();
  });
});
