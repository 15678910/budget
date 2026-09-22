import { LEGAL_THRESHOLDS, LEGAL_INDICATORS, evaluateLegal } from '../legal-thresholds';
import {
  crisisSignals,
  percentiles,
  entitySummaries,
  nationalCounts,
  rankWithinGroup,
} from '../signals';
import { LEGAL_INDICATOR_LABEL, WASTE_INDICATOR_LABEL, WASTE_INDICATORS } from '../signal-types';
import type { LegalIndicator } from '../signal-types';

const NO_DATA_INDICATORS: LegalIndicator[] = [
  'debtService',
  'taxCollection',
  'treasury',
  'publicCorpDebt',
];

describe('법정 기준 상수 (지방재정법 시행령 제65조의3)', () => {
  it('채무비율은 주의 25 초과 40 이하, 위기 40 초과다', () => {
    expect(LEGAL_THRESHOLDS.debtRatio.caution).toEqual([25, 40]);
    expect(LEGAL_THRESHOLDS.debtRatio.critical).toBe(40);
    expect(LEGAL_THRESHOLDS.debtRatio.direction).toBe('above');
  });

  it('통합재정수지비율은 절대값 기준 주의 25 초과 30 이하, 위기 30 초과다', () => {
    expect(LEGAL_THRESHOLDS.fiscalBalance.caution).toEqual([25, 30]);
    expect(LEGAL_THRESHOLDS.fiscalBalance.critical).toBe(30);
    expect(LEGAL_THRESHOLDS.fiscalBalance.direction).toBe('above');
    expect(LEGAL_THRESHOLDS.fiscalBalance.article).toMatch(/제65조의3/);
  });

  it('자료 없는 4개 지표의 기준값도 조문대로 갖는다', () => {
    expect(LEGAL_THRESHOLDS.debtService.caution).toEqual([12, 17]);
    expect(LEGAL_THRESHOLDS.debtService.critical).toBe(17);
    expect(LEGAL_THRESHOLDS.taxCollection.caution).toEqual([70, 80]);
    expect(LEGAL_THRESHOLDS.taxCollection.critical).toBe(70);
    expect(LEGAL_THRESHOLDS.taxCollection.direction).toBe('below');
    expect(LEGAL_THRESHOLDS.treasury.caution).toEqual([10, 20]);
    expect(LEGAL_THRESHOLDS.treasury.critical).toBe(10);
    expect(LEGAL_THRESHOLDS.treasury.direction).toBe('below');
    expect(LEGAL_THRESHOLDS.publicCorpDebt.caution).toEqual([400, 600]);
    expect(LEGAL_THRESHOLDS.publicCorpDebt.critical).toBe(600);
  });

  it('6개 법정 지표와 5개 낭비 지표에 한국어 이름이 있다', () => {
    expect(LEGAL_INDICATORS).toHaveLength(6);
    for (const indicator of LEGAL_INDICATORS) {
      expect(LEGAL_INDICATOR_LABEL[indicator].length).toBeGreaterThan(0);
    }
    expect(WASTE_INDICATORS).toHaveLength(5);
    for (const indicator of WASTE_INDICATORS) {
      expect(WASTE_INDICATOR_LABEL[indicator].length).toBeGreaterThan(0);
    }
  });
});

describe('evaluateLegal — 합성 값 판정', () => {
  it('채무비율 26은 주의, 41은 심각, 10은 해당 없음이다', () => {
    expect(evaluateLegal('debtRatio', 26)).toBe('caution');
    expect(evaluateLegal('debtRatio', 41)).toBe('critical');
    expect(evaluateLegal('debtRatio', 10)).toBe('normal');
  });

  it('채무비율 경계값: 25는 해당 없음, 40은 주의다', () => {
    expect(evaluateLegal('debtRatio', 25)).toBe('normal');
    expect(evaluateLegal('debtRatio', 40)).toBe('caution');
  });

  it('통합재정수지비율 -31은 심각, -26은 주의, +5는 해당 없음이다', () => {
    expect(evaluateLegal('fiscalBalance', -31)).toBe('critical');
    expect(evaluateLegal('fiscalBalance', -26)).toBe('caution');
    expect(evaluateLegal('fiscalBalance', 5)).toBe('normal');
  });

  it('통합재정수지비율은 양수면 흑자이므로 절대값이 커도 해당 없음이다', () => {
    expect(evaluateLegal('fiscalBalance', 31)).toBe('normal');
    expect(evaluateLegal('fiscalBalance', -30)).toBe('caution');
    expect(evaluateLegal('fiscalBalance', -25)).toBe('normal');
  });

  it('below 방향 지표는 값이 작을수록 나쁘다', () => {
    expect(evaluateLegal('taxCollection', 69)).toBe('critical');
    expect(evaluateLegal('taxCollection', 75)).toBe('caution');
    expect(evaluateLegal('taxCollection', 80)).toBe('normal');
    expect(evaluateLegal('treasury', 9)).toBe('critical');
    expect(evaluateLegal('treasury', 15)).toBe('caution');
    expect(evaluateLegal('treasury', 20)).toBe('normal');
  });

  it('값이 없으면 자료 없음이다', () => {
    expect(evaluateLegal('debtRatio', null)).toBe('no-data');
    expect(evaluateLegal('fiscalBalance', null)).toBe('no-data');
  });
});

describe('rankWithinGroup — 동종단체 백분위', () => {
  it('동일값은 같은 순위를 갖는다: [5,5,3] → [33,33,100]', () => {
    expect(rankWithinGroup([5, 5, 3])).toEqual([33, 33, 100]);
  });

  it('null은 제외하고 groupSize에도 넣지 않는다', () => {
    expect(rankWithinGroup([5, null, 5, 3])).toEqual([33, null, 33, 100]);
  });

  it('가장 큰 값도 상위 0%가 아니다 (1등은 1/groupSize)', () => {
    expect(rankWithinGroup([9, 8, 7, 6])).toEqual([25, 50, 75, 100]);
    expect(rankWithinGroup(Array.from({ length: 100 }, (_, i) => 100 - i))[0]).toBe(1);
  });

  it('값이 하나뿐이면 그룹 전체가 자기 자신이므로 상위 100%다', () => {
    expect(rankWithinGroup([7])).toEqual([100]);
  });

  it('값이 없으면 전부 null이다', () => {
    expect(rankWithinGroup([null, null])).toEqual([null, null]);
  });
});

describe('crisisSignals — 실데이터', () => {
  it('2024 서울본청 채무비율은 21.53%로 해당 없음이다', () => {
    const signals = crisisSignals('서울본청', 2024);
    const debtRatio = signals.find((s) => s.indicator === 'debtRatio');
    expect(debtRatio?.value).toBe(21.53);
    expect(debtRatio?.level).toBe('normal');
    expect(debtRatio?.year).toBe(2024);
  });

  it('2024 서울본청 통합재정수지비율은 -3.16%로 해당 없음이다', () => {
    const fiscalBalance = crisisSignals('서울본청', 2024).find(
      (s) => s.indicator === 'fiscalBalance',
    );
    expect(fiscalBalance?.value).toBe(-3.16);
    expect(fiscalBalance?.level).toBe('normal');
  });

  it('6개 법정 지표를 모두 반환하고, 자료 없는 4개는 no-data다', () => {
    const signals = crisisSignals('서울본청', 2024);
    expect(signals).toHaveLength(6);
    expect(signals.map((s) => s.indicator)).toEqual(LEGAL_INDICATORS);
    for (const indicator of NO_DATA_INDICATORS) {
      const signal = signals.find((s) => s.indicator === indicator);
      expect(signal?.level).toBe('no-data');
      expect(signal?.value).toBeNull();
    }
  });

  it('없는 자치단체는 전부 자료 없음이다', () => {
    const signals = crisisSignals('없는자치단체', 2024);
    expect(signals).toHaveLength(6);
    expect(signals.every((s) => s.level === 'no-data' && s.value === null)).toBe(true);
  });
});

describe('percentiles — 동종단체 백분위', () => {
  const map = percentiles(2024);

  it('243개 자치단체 전부에 대해 5개 낭비 지표를 반환한다', () => {
    expect(map.size).toBe(243);
    const jongno = map.get('서울종로구');
    expect(jongno).toHaveLength(5);
    expect(jongno?.map((p) => p.indicator)).toEqual(WASTE_INDICATORS);
  });

  it('서울종로구 행사축제경비 백분위는 1~100이고 groupSize는 자치구 69개다', () => {
    const festival = map.get('서울종로구')?.find((p) => p.indicator === 'festival');
    expect(festival).toBeDefined();
    expect(festival?.typeCd).toBe('33');
    expect(festival?.groupSize).toBe(69);
    expect(festival?.percentile).not.toBeNull();
    expect(festival?.percentile).toBeGreaterThanOrEqual(1);
    expect(festival?.percentile).toBeLessThanOrEqual(100);
  });

  it('동종단체 평균은 같은 typeCd 그룹의 산술평균이다', () => {
    const festival = map.get('서울종로구')?.find((p) => p.indicator === 'festival');
    expect(festival?.peerAvg).not.toBeNull();
    expect(festival?.peerAvg).toBeGreaterThan(0);
    // 같은 그룹의 모든 자치단체는 같은 평균·groupSize를 공유한다
    const jung = map.get('서울중구')?.find((p) => p.indicator === 'festival');
    expect(jung?.peerAvg).toBe(festival?.peerAvg);
    expect(jung?.groupSize).toBe(festival?.groupSize);
  });
});

describe('entitySummaries / nationalCounts', () => {
  it('243개 자치단체 요약을 반환한다', () => {
    expect(entitySummaries(2024)).toHaveLength(243);
  });

  it('요약에는 위기 신호 6개·낭비 백분위 5개가 들어 있다', () => {
    const seoul = entitySummaries(2024).find((e) => e.key === '서울본청');
    expect(seoul?.crisis).toHaveLength(6);
    expect(seoul?.waste).toHaveLength(5);
    expect(seoul?.typeCd).toBe('22');
    expect(typeof seoul?.debtDelta3y).toBe('number');
  });

  it('nationalCounts의 채무비율 주의 이상 수는 0 이상의 정수다', () => {
    const counts = nationalCounts(2024);
    expect(Number.isInteger(counts.cautionOrWorse.debtRatio)).toBe(true);
    expect(counts.cautionOrWorse.debtRatio).toBeGreaterThanOrEqual(0);
    expect(counts.cautionOrWorse.debtRatio).toBeLessThanOrEqual(243);
    for (const indicator of NO_DATA_INDICATORS) {
      expect(counts.cautionOrWorse[indicator]).toBe(0);
    }
  });

  it('적자 자치단체 수는 0 이상의 정수다', () => {
    const counts = nationalCounts(2024);
    expect(Number.isInteger(counts.deficitCount)).toBe(true);
    expect(counts.deficitCount).toBeGreaterThanOrEqual(0);
    expect(counts.deficitCount).toBeLessThanOrEqual(243);
  });
});
