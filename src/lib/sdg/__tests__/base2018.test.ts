import { assembleBase2018 } from '@/lib/sdg/base2018';
import { CANON_16 } from '@/lib/sdg/region-normalize';
import { getMetroIndicatorData } from '@/lib/data/local-sdg-data';

describe('assembleBase2018', () => {
  const base2018 = assembleBase2018();

  it('매핑 지표마다 키가 16광역(또는 부분집합)이고 광주/전남 분리키가 없다', () => {
    const empRate = base2018['emp_rate'];
    expect(empRate).toBeDefined();
    expect(empRate['광주']).toBeUndefined();
    expect(empRate['전남']).toBeUndefined();
    expect(empRate['광주전남']).toBeDefined();
    for (const k of Object.keys(empRate)) expect(CANON_16).toContain(k as never);
  });

  it('병합 비대상 광역값은 history[0](=RAW base2018)과 정확히 일치한다', () => {
    // 서울 emp_rate RAW base = 60.0 (local-sdg-data RAW emp_rate index 0의 3번째 값)
    const seoulHist = getMetroIndicatorData('서울특별시', 'emp_rate')?.history[0]?.value;
    expect(seoulHist).toBe(60.0);
    expect(base2018['emp_rate']['서울']).toBe(seoulHist);
  });

  it('history[0]은 보간 중간연도가 아니라 2018 실측 끝점이다', () => {
    const seoul = getMetroIndicatorData('서울특별시', 'fin_independence');
    expect(seoul?.history[0]).toEqual({ year: 2018, value: 73.6 });
  });

  it('광주전남 병합값이 인구 가중 평균(base2018 기준)과 일치한다', () => {
    // RAW emp_rate base: 광주광역시(index 4) = 58.0, 전라남도(index 13) = 63.0
    const gwangju = getMetroIndicatorData('광주광역시', 'emp_rate')?.history[0]?.value ?? NaN;
    const jeonnam = getMetroIndicatorData('전라남도', 'emp_rate')?.history[0]?.value ?? NaN;
    expect(gwangju).toBe(58.0);
    expect(jeonnam).toBe(63.0);
    const popGwangju = 1404154;
    const popJeonnam = 1761628;
    const expected = (gwangju * popGwangju + jeonnam * popJeonnam) / (popGwangju + popJeonnam);
    expect(base2018['emp_rate']['광주전남']).toBeCloseTo(expected, 6);
  });

  it('맥락 지표(fin_*/dem_*)는 수집하지 않는다', () => {
    expect(base2018['fin_independence']).toBeUndefined();
    expect(base2018['dem_migration']).toBeUndefined();
  });
});
