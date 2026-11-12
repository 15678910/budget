import { DEFAULT_FUND_RULES, DEFAULT_SOURCES } from '@/lib/basic-income/defaults';
import { runFundRules } from '@/lib/basic-income/fund-rules';
import type { FundRuleInput } from '@/lib/basic-income/types';

/** 시험용: 종잣돈 100조, 100만 명, 실질 5%, 위기 2030·2032 */
const input: FundRuleInput = {
  baseYear: 2027,
  years: 30,
  seed: 100,
  annualInflow: 0,
  programSpend: 30,
  bondCut: 10,
  depositRate: 0.03,
  realReturn: 0.05,
  withdrawalRate: 0.03,
  crisisDrawRate: 0.25,
  population0: 1_000_000,
  populationGrowth: 0,
  crisisYears: { aiUnemployment: 2032, mortgage: 2030 },
};

const byId = (i: FundRuleInput) => {
  const [gov, norway, chile] = runFundRules(i);
  return { gov, norway, chile };
};

describe('runFundRules', () => {
  it('세 규칙을 정부안·노르웨이·칠레 순서로 30년씩 계산한다', () => {
    const rows = runFundRules(input);
    expect(rows.map((r) => r.id)).toEqual(['GOV', 'NORWAY', 'CHILE']);
    rows.forEach((r) => {
      expect(r.rows).toHaveLength(30);
      expect(r.rows[0].year).toBe(2027);
      expect(r.rows[29].year).toBe(2056);
    });
  });

  it('정부안: 첫해 사업비만 국민에게, 나머지는 예탁 원금, 이자는 일반회계', () => {
    const { gov } = byId(input);
    expect(gov.perPersonWon.first).toBe(30_000_000);
    expect(gov.perPersonWon.y10).toBe(0);
    expect(gov.paidTotal).toBeCloseTo(30, 9);
    expect(gov.balanceAt10).toBeCloseTo(60, 9);
    expect(gov.balanceAt30).toBeCloseTo(60, 9);
    expect(gov.generalAccountInterestTotal).toBeCloseTo(60 * 0.03 * 30, 9);
    expect(gov.crisisPerPersonWon).toEqual({ aiUnemployment: 0, mortgage: 0 });
  });

  it('노르웨이: 해마다 잔액의 3%, 잔액은 (1-3%)×(1+5%)씩 불어난다', () => {
    const { norway } = byId(input);
    const g = 0.97 * 1.05;
    expect(norway.perPersonWon.first).toBe(3_000_000);
    expect(norway.perPersonWon.y10).toBe(Math.round(0.03 * 100 * g ** 9 * 1e6));
    expect(norway.balanceAt10).toBeCloseTo(100 * g ** 10, 9);
    expect(norway.balanceAt30).toBeCloseTo(100 * g ** 30, 9);
    expect(norway.generalAccountInterestTotal).toBe(0);
  });

  it('칠레: 평소 0, 위기 해에만 잔액의 25%를 꺼낸다', () => {
    const { chile } = byId(input);
    const b2030 = 100 * 1.05 ** 3;
    const b2032 = (b2030 * 0.75) * 1.05 ** 2;
    expect(chile.perPersonWon.first).toBe(0);
    expect(chile.crisisPerPersonWon.mortgage).toBe(Math.round(b2030 * 0.25 * 1e6));
    expect(chile.crisisPerPersonWon.aiUnemployment).toBe(Math.round(b2032 * 0.25 * 1e6));
    expect(chile.rows.filter((r) => r.crisis).map((r) => r.year)).toEqual([2030, 2032]);
    expect(chile.paidTotal).toBeCloseTo((b2030 + b2032) * 0.25, 9);
  });

  it('해마다 초과 세수가 들어오면 정부안은 그해 사업비 몫만 쓰고 예탁에 쌓는다', () => {
    const { gov } = byId({ ...input, annualInflow: 10 });
    expect(gov.rows[1].inflow).toBe(10);
    expect(gov.rows[1].payout).toBeCloseTo(3, 9);
    expect(gov.balanceAt10).toBeCloseTo(60 + 6 * 9, 9);
  });

  it('위기 연도가 기간 밖이면 null', () => {
    const { chile } = byId({ ...input, crisisYears: { aiUnemployment: 2020, mortgage: 2100 } });
    expect(chile.crisisPerPersonWon).toEqual({ aiUnemployment: null, mortgage: null });
    expect(chile.paidTotal).toBe(0);
  });

  it('종잣돈 0·음수·NaN에도 NaN이 나오지 않는다', () => {
    const bad = { ...input, seed: 0, annualInflow: -5, realReturn: Number.NaN, population0: 0 };
    for (const r of runFundRules(bad)) {
      expect(Number.isFinite(r.paidTotal)).toBe(true);
      expect(Number.isFinite(r.balanceAt30)).toBe(true);
      r.rows.forEach((y) => expect(Number.isFinite(y.perPersonWon)).toBe(true));
    }
  });
});

describe('runFundRules 리뷰 수정', () => {
  it('노르웨이 문구는 입력한 인출률을 쓰고, 인출률이 수익률보다 크면 원금을 지킨다고 하지 않는다', () => {
    expect(byId(input).norway.rule).toMatch(/3%/);
    expect(byId(input).norway.rule).toMatch(/원금을 지키/);
    const high = byId({ ...input, withdrawalRate: 0.06 }).norway.rule;
    expect(high).toMatch(/6%/);
    expect(high).not.toMatch(/원금을 지키/);
  });

  it('기간이 10·30년보다 짧으면 그 해 값은 null', () => {
    const { norway } = byId({ ...input, years: 5 });
    expect(norway.balanceAt10).toBeNull();
    expect(norway.balanceAt30).toBeNull();
    expect(norway.perPersonWon.y10).toBeNull();
    expect(norway.perPersonWon.y30).toBeNull();
    expect(norway.perPersonWon.first).toBe(3_000_000);
  });

  it('정부안 잔액만 명목 기준으로 표시한다', () => {
    const { gov, norway, chile } = byId(input);
    expect([gov.nominal, norway.nominal, chile.nominal]).toEqual([true, false, false]);
  });
});

describe('DEFAULT_FUND_RULES', () => {
  it('2027년 미래대응기금 162.3조(사업비 45.4·국채 축소 12.5)와 노르웨이 3%를 쓴다', () => {
    expect(DEFAULT_FUND_RULES).toMatchObject({
      seed: 162.3, programSpend: 45.4, bondCut: 12.5, withdrawalRate: 0.03, years: 30, baseYear: 2027,
    });
    expect(DEFAULT_FUND_RULES.annualInflow).toBe(DEFAULT_SOURCES.surplusExcess.value);
  });

  it('사업비·국채 축소는 1차 자료, 위기 인출 상한·위기 연도는 가정', () => {
    expect(DEFAULT_SOURCES.ffProgramSpend.kind).toBe('source');
    expect(DEFAULT_SOURCES.ffBondCut.kind).toBe('source');
    expect(DEFAULT_SOURCES.chileCrisisDraw).toMatchObject({ kind: 'assumption', value: 0.25 });
    expect(DEFAULT_SOURCES.aiShockYear).toMatchObject({ kind: 'assumption', value: 2032 });
    expect(DEFAULT_SOURCES.mortgageShockYear).toMatchObject({ kind: 'assumption', value: 2030 });
  });
});
