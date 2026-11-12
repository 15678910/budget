/**
 * 기금 규칙 비교: 같은 돈을 세 규칙에 따로 넣고 해마다 국민에게 가는 돈과 잔액을 계산한다.
 * ① 정부안: 들어온 해에 사업비 몫만 쓰고 나머지는 국채 축소·공자기금 예탁(이자는 일반회계).
 * ② 노르웨이: 잔액 × 인출률(기본 3%)을 해마다 쓴다. 인출률 ≤ 실질수익률이면 원금이 지켜진다.
 * ③ 칠레: 평소에는 쌓고, 위기 해에만 잔액 × 위기 인출 상한까지 꺼낸다.
 * 설계: docs/superpowers/specs/2026-11-12-fund-rules-compare-design.md
 */
import type { FundRuleId, FundRuleInput, FundRuleResult, FundRuleYear } from './types';

const nonNeg = (x: number): number => (Number.isFinite(x) && x > 0 ? x : 0);
const finite = (x: number): number => (Number.isFinite(x) ? x : 0);

interface RuleText {
  id: FundRuleId;
  label: string;
  rule: string;
  crisisNote: string;
}

const TEXT: readonly RuleText[] = [
  {
    id: 'GOV',
    label: '① 미래대응기금 정부안',
    rule: '들어온 해에 사업비로 쓰고, 일부로 국채 발행을 줄이고, 나머지는 공자기금에 예탁',
    crisisNote: '위기 때 꺼내는 규칙이 없어 추경·국채 발행이 필요하다',
  },
  {
    id: 'NORWAY',
    label: '② 노르웨이 국부펀드 규칙',
    rule: '',
    crisisNote: '',
  },
  {
    id: 'CHILE',
    label: '③ 칠레 구리 펀드 규칙',
    rule: '평소에는 쌓아 두고, 위기 해에만 정해진 상한까지 꺼낸다',
    crisisNote: '위기 해에 크게 꺼내지만 평소에는 국민에게 가는 돈이 없다',
  },
];

interface Clean {
  i: FundRuleInput;
  years: number;
  r: number;
  programShare: number;
  depositShare: number;
}

function clean(i: FundRuleInput): Clean {
  const seed = nonNeg(i.seed);
  const program = Math.min(nonNeg(i.programSpend), seed);
  const bond = Math.min(nonNeg(i.bondCut), seed - program);
  return {
    i: { ...i, seed, annualInflow: nonNeg(i.annualInflow), population0: nonNeg(i.population0) },
    years: Math.max(1, Math.floor(nonNeg(i.years))),
    r: finite(i.realReturn),
    programShare: seed > 0 ? program / seed : 0,
    depositShare: seed > 0 ? (seed - program - bond) / seed : 0,
  };
}

function perPerson(payout: number, c: Clean, t: number): number {
  const pop = c.i.population0 * (1 + finite(c.i.populationGrowth)) ** t;
  return pop > 0 ? Math.round((payout * 1e12) / pop) : 0;
}

function runOne(id: FundRuleId, c: Clean): { rows: FundRuleYear[]; interest: number } {
  const { i } = c;
  const crisisSet = new Set([i.crisisYears.aiUnemployment, i.crisisYears.mortgage]);
  const rows: FundRuleYear[] = [];
  let balance = 0;
  let interest = 0;
  for (let t = 0; t < c.years; t += 1) {
    const year = i.baseYear + t;
    const inflow = t === 0 ? i.seed : i.annualInflow;
    const crisis = crisisSet.has(year);
    let payout: number;
    if (id === 'GOV') {
      payout = inflow * c.programShare;
      balance += inflow * c.depositShare;
      interest += balance * nonNeg(i.depositRate);
    } else {
      balance += inflow;
      const rate = id === 'NORWAY' ? nonNeg(i.withdrawalRate) : crisis ? nonNeg(i.crisisDrawRate) : 0;
      payout = Math.min(balance, balance * rate);
      balance = Math.max(0, (balance - payout) * (1 + c.r));
    }
    rows.push({ year, inflow, payout, balance, perPersonWon: perPerson(payout, c, t), crisis });
  }
  return { rows, interest };
}

const pct = (x: number): string => `${Math.round(x * 1000) / 10}%`;

/** 노르웨이 문구는 입력한 인출률로 만든다. 인출률이 실질수익률보다 크면 원금이 줄어든다. */
function norwayText(c: Clean): Pick<RuleText, 'rule' | 'crisisNote'> {
  const w = nonNeg(c.i.withdrawalRate);
  const keeps = w <= c.r;
  return {
    rule: keeps
      ? `원금을 지키고 잔액의 ${pct(w)}만 해마다 쓴다`
      : `잔액의 ${pct(w)}를 해마다 쓴다(실질수익률 ${pct(c.r)}보다 커서 원금이 줄어든다)`,
    crisisNote: `위기에도 ${pct(w)}만 반영했다(실제 노르웨이는 2020년처럼 일시적으로 넘겨 쓸 수 있다)`,
  };
}

export function runFundRules(input: FundRuleInput): FundRuleResult[] {
  const c = clean(input);
  return TEXT.map((base) => {
    const text = base.id === 'NORWAY' ? { ...base, ...norwayText(c) } : base;
    const { rows, interest } = runOne(text.id, c);
    const at = (n: number): FundRuleYear | null => rows[n - 1] ?? null;
    const crisisWon = (year: number) => rows.find((y) => y.year === year)?.perPersonWon ?? null;
    return {
      ...text,
      rows,
      paidTotal: rows.reduce((s, y) => s + y.payout, 0),
      nominal: text.id === 'GOV',
      balanceAt10: at(10)?.balance ?? null,
      balanceAt30: at(30)?.balance ?? null,
      perPersonWon: { first: rows[0].perPersonWon, y10: at(10)?.perPersonWon ?? null, y30: at(30)?.perPersonWon ?? null },
      crisisPerPersonWon: {
        aiUnemployment: crisisWon(input.crisisYears.aiUnemployment),
        mortgage: crisisWon(input.crisisYears.mortgage),
      },
      generalAccountInterestTotal: interest,
    };
  });
}
