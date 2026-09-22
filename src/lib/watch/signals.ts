/**
 * 재정감시 조기경보 — 법정 기준 신호와 동종단체 백분위 계산.
 *
 * 데이터 원천
 * - 통합재정수지비율·지출 구조 지표 5종: `src/lib/data/local-indicators-official.ts` (지방재정365 결산 공시)
 * - 예산대비 채무비율: `src/lib/data/local-debt-official.ts` (debtEok ÷ budgetEok × 100, 결산 기준)
 * 두 모듈은 key = lafNm(예: '서울본청', '경기수원시')으로 조인한다.
 *
 * 계산하지 않는 것: 종합 점수·등급, 효과·손실액 추정, "낭비" 판정.
 * 기준 충족은 지정이 아니다 — 지정은 지방재정관리위원회 심의를 거친 행정안전부장관의 재량이다.
 */

import {
  OFFICIAL_INDICATORS,
  INDICATOR_YEARS,
  type IndicatorYear,
  type IndicatorEntity,
} from '@/lib/data/local-indicators-official';
import {
  OFFICIAL_LOCAL_DEBT,
  OFFICIAL_DEBT_YEARS,
  type OfficialDebtEntity,
} from '@/lib/data/local-debt-official';
import {
  LEGAL_INDICATORS,
  LEGAL_THRESHOLDS,
  AVAILABLE_LEGAL_INDICATORS,
  evaluateLegal,
  type LegalThreshold,
} from './legal-thresholds';
import {
  WASTE_INDICATORS,
  type CrisisSignal,
  type EntitySummary,
  type LegalIndicator,
  type PercentileRank,
  type WasteIndicator,
} from './signal-types';

export { LEGAL_INDICATORS, LEGAL_THRESHOLDS, AVAILABLE_LEGAL_INDICATORS, evaluateLegal };
export type { LegalThreshold };

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round1 = (n: number): number => Math.round(n * 10) / 10;

const ENTITY_BY_KEY = new Map<string, IndicatorEntity>(
  OFFICIAL_INDICATORS.map((entity) => [entity.key, entity]),
);

const DEBT_BY_KEY = new Map<string, OfficialDebtEntity>(
  OFFICIAL_LOCAL_DEBT.map((entity) => [entity.key, entity]),
);

function indicatorYearIndex(year: IndicatorYear): number {
  return INDICATOR_YEARS.indexOf(year);
}

function debtYearIndex(year: number): number {
  return (OFFICIAL_DEBT_YEARS as readonly number[]).indexOf(year);
}

/** 예산대비 채무비율(%) = 채무잔액 ÷ 최종예산액 × 100, 소수 2자리. 어느 한쪽이라도 없으면 null */
export function debtRatioOf(entityKey: string, year: number): number | null {
  const entity = DEBT_BY_KEY.get(entityKey);
  if (!entity) return null;
  const idx = debtYearIndex(year);
  if (idx < 0) return null;
  const debt = entity.debtEok[idx];
  const budget = entity.budgetEok[idx];
  if (debt === null || debt === undefined) return null;
  if (budget === null || budget === undefined || budget === 0) return null;
  return round2((debt / budget) * 100);
}

/** 채무잔액(억원). 없으면 null */
function debtOf(entityKey: string, year: number): number | null {
  const entity = DEBT_BY_KEY.get(entityKey);
  if (!entity) return null;
  const idx = debtYearIndex(year);
  if (idx < 0) return null;
  const debt = entity.debtEok[idx];
  return debt === null || debt === undefined ? null : debt;
}

/** year-3 → year 채무 순증(억원, 소수 1자리). 어느 한 해라도 자료가 없으면 null */
export function debtDelta3y(entityKey: string, year: IndicatorYear): number | null {
  const now = debtOf(entityKey, year);
  const before = debtOf(entityKey, year - 3);
  if (now === null || before === null) return null;
  return round1(now - before);
}

/**
 * 제65조의3의 6개 지표를 모두 반환한다.
 * 채무상환비 비율·지방세징수액 비율·금고잔액비율·공기업 부채비율은 공개 자료가 없어
 * 계산하지 않고 'no-data'로 둔다.
 */
export function crisisSignals(entityKey: string, year: IndicatorYear): CrisisSignal[] {
  const entity = ENTITY_BY_KEY.get(entityKey);
  const idx = indicatorYearIndex(year);

  return LEGAL_INDICATORS.map((indicator) => {
    let value: number | null = null;

    if (indicator === 'fiscalBalance' && entity && idx >= 0) {
      const raw = entity.values.fiscalBalance[idx];
      value = raw === null || raw === undefined ? null : raw;
    } else if (indicator === 'debtRatio') {
      value = debtRatioOf(entityKey, year);
    }

    return { indicator, level: evaluateLegal(indicator, value), value, year };
  });
}

/**
 * 같은 그룹 안의 백분위를 계산한다.
 * percentile = round((자기 값보다 "큰" 값의 개수 + 1) ÷ groupSize × 100) → "상위 N% 이내".
 * 값이 가장 큰 자치단체가 1등이므로 N은 1 이상 100 이하가 되고, "상위 0%"는 나오지 않는다.
 * 동일한 값은 같은 순위(최소 순위)를 공유하고, null은 계산에서 빠지며 groupSize에도 들어가지 않는다.
 */
export function rankWithinGroup(values: readonly (number | null)[]): (number | null)[] {
  const present = values.filter((v): v is number => v !== null && Number.isFinite(v));
  const groupSize = present.length;
  if (groupSize === 0) return values.map(() => null);

  return values.map((value) => {
    if (value === null || !Number.isFinite(value)) return null;
    const greater = present.reduce((count, other) => (other > value ? count + 1 : count), 0);
    return Math.round(((greater + 1) / groupSize) * 100);
  });
}

/**
 * 동종단체 평균(%). 지방재정365 응답의 smkdAvgRt가 비어 있어 typeCd 그룹 평균을 직접 계산한다.
 * null은 제외한 산술평균, 소수 2자리.
 */
function meanOf(values: readonly (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (present.length === 0) return null;
  return round2(present.reduce((sum, v) => sum + v, 0) / present.length);
}

/**
 * 연도별 동종단체 백분위표. key = 자치단체 key, 값은 낭비 지표 5종의 백분위.
 * 그룹은 typeCd('22' 광역 / '31' 시 / '32' 군 / '33' 자치구).
 * 백분위는 순위일 뿐 평가가 아니다.
 */
export function percentiles(year: IndicatorYear): Map<string, PercentileRank[]> {
  const idx = indicatorYearIndex(year);
  const result = new Map<string, PercentileRank[]>();
  if (idx < 0) return result;

  const groups = new Map<string, IndicatorEntity[]>();
  for (const entity of OFFICIAL_INDICATORS) {
    const group = groups.get(entity.typeCd);
    if (group) group.push(entity);
    else groups.set(entity.typeCd, [entity]);
  }

  for (const [typeCd, members] of groups) {
    const perIndicator = new Map<
      WasteIndicator,
      { values: (number | null)[]; ranks: (number | null)[]; peerAvg: number | null; groupSize: number }
    >();

    for (const indicator of WASTE_INDICATORS) {
      const values = members.map((entity) => {
        const raw = entity.values[indicator][idx];
        return raw === null || raw === undefined ? null : raw;
      });
      const groupSize = values.filter((v) => v !== null).length;
      perIndicator.set(indicator, {
        values,
        ranks: rankWithinGroup(values),
        peerAvg: meanOf(values),
        groupSize,
      });
    }

    members.forEach((entity, memberIdx) => {
      const ranks: PercentileRank[] = WASTE_INDICATORS.map((indicator) => {
        const computed = perIndicator.get(indicator);
        return {
          indicator,
          value: computed ? computed.values[memberIdx] : null,
          peerAvg: computed ? computed.peerAvg : null,
          percentile: computed ? computed.ranks[memberIdx] : null,
          groupSize: computed ? computed.groupSize : 0,
          typeCd,
        };
      });
      result.set(entity.key, ranks);
    });
  }

  return result;
}

/** 243개 자치단체의 연도별 요약 */
export function entitySummaries(year: IndicatorYear): EntitySummary[] {
  const rankMap = percentiles(year);

  return OFFICIAL_INDICATORS.map((entity) => ({
    key: entity.key,
    region: entity.region,
    name: entity.name,
    level: entity.level,
    typeCd: entity.typeCd,
    crisis: crisisSignals(entity.key, year),
    waste: rankMap.get(entity.key) ?? [],
    debtDelta3y: debtDelta3y(entity.key, year),
  }));
}

/** 전국 집계: 지표별 「주의 이상」 자치단체 수와 통합재정수지 적자 자치단체 수 */
export function nationalCounts(year: IndicatorYear): {
  cautionOrWorse: Record<LegalIndicator, number>;
  deficitCount: number;
} {
  const cautionOrWorse = LEGAL_INDICATORS.reduce(
    (acc, indicator) => {
      acc[indicator] = 0;
      return acc;
    },
    {} as Record<LegalIndicator, number>,
  );
  let deficitCount = 0;

  for (const entity of OFFICIAL_INDICATORS) {
    for (const signal of crisisSignals(entity.key, year)) {
      if (signal.level === 'caution' || signal.level === 'critical') {
        cautionOrWorse[signal.indicator] += 1;
      }
      if (signal.indicator === 'fiscalBalance' && signal.value !== null && signal.value < 0) {
        deficitCount += 1;
      }
    }
  }

  return { cautionOrWorse, deficitCount };
}
