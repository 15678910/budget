import { CANON_16, mergeToCanon16 } from '@/lib/sdg/region-normalize';

describe('region-normalize', () => {
  it('16개 캐논 광역을 노출한다', () => {
    expect(CANON_16).toHaveLength(16);
    expect(CANON_16).toContain('광주전남');
    expect(CANON_16).not.toContain('광주');
    expect(CANON_16).not.toContain('전남');
  });

  it('ratio 지표는 인구 가중 평균으로 광주+전남을 병합한다', () => {
    const raw = { 광주: 60, 전남: 40 };
    const pop = { 광주: 100, 전남: 300 };
    const out = mergeToCanon16(raw, 'ratio', pop);
    // (60*100 + 40*300) / (100+300) = 18000/400 = 45
    expect(out['광주전남']).toBe(45);
  });

  it('sum 지표는 광주+전남을 합산한다', () => {
    const raw = { 광주: 100, 전남: 250 };
    const out = mergeToCanon16(raw, 'sum');
    expect(out['광주전남']).toBe(350);
  });

  it('병합 대상이 아닌 시도는 그대로 통과한다', () => {
    const raw = { 서울: 70, 경기: 65 };
    const out = mergeToCanon16(raw, 'ratio', { 서울: 1, 경기: 1 });
    expect(out['서울']).toBe(70);
    expect(out['경기']).toBe(65);
  });

  it('한쪽 값만 있으면 그 값을 사용한다', () => {
    expect(mergeToCanon16({ 광주: 50 }, 'ratio', { 광주: 100 })['광주전남']).toBe(50);
    expect(mergeToCanon16({ 전남: 30 }, 'sum')['광주전남']).toBe(30);
  });
});
