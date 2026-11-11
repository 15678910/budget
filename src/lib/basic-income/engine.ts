/**
 * ⑦ 해마다 한 칸씩 도는 기금 엔진.
 * 한 해: 지급용 세입으로 먼저 나누고, 모자라면 기금에서 인출률 상한까지 꺼내고,
 * 그래도 모자라면 '부족'. 지급하고 남은 지급용 세입과 적립용 세입은 기금 원금에 넣는다.
 */
import { carbonTax, dataTax, robotTax } from './alt-revenue';
import { bequestFlow } from './bequest';
import { sharedAssetFlows } from './shared-assets';
import { EPS, perpetualFund, withdrawalCap } from './spending-rule';
import { surplusToFund } from './surplus-tax';
import type { FailReason, RevenueBreakdown, SimInput, SimResult, Verdict, YearRow } from './types';

const MAX_HORIZON = 200;

function num(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}
function clamp(v: number, lo: number, hi: number, fallback = 0): number {
  return Math.min(hi, Math.max(lo, num(v, fallback)));
}
const rate01 = (v: number) => clamp(v, 0, 1);
const nonNeg = (v: number) => Math.max(0, num(v, 0));

/** 화면에서 들어온 입력을 엔진이 다룰 수 있는 범위로 다듬는다. */
export function sanitizeInput(i: SimInput): SimInput {
  const baseYear = Math.round(num(i.baseYear, 2027));
  const payStartYear = Math.round(clamp(i.payStartYear, baseYear, baseYear + MAX_HORIZON, baseYear));
  const horizonYears = Math.round(clamp(i.horizonYears, 1, MAX_HORIZON, 1));
  const { robot, data, carbon } = i.alt;
  return {
    baseYear,
    payStartYear,
    horizonYears,
    monthlyPerPerson: nonNeg(i.monthlyPerPerson),
    population0: nonNeg(i.population0),
    populationGrowth: clamp(i.populationGrowth, -0.5, 1),
    realReturn: clamp(i.realReturn, -0.5, 1),
    withdrawalRate: rate01(i.withdrawalRate),
    initialFund: nonNeg(i.initialFund),
    socialInsuranceTopUp: { enabled: i.socialInsuranceTopUp.enabled, annual: nonNeg(i.socialInsuranceTopUp.annual) },
    alt: {
      robot: { base: nonNeg(robot.base), rate: rate01(robot.rate), annualDecline: rate01(robot.annualDecline), mode: robot.mode },
      data: { base: nonNeg(data.base), rate: rate01(data.rate), annualGrowth: rate01(data.annualGrowth), mode: data.mode },
      carbon: {
        emissionsMt: nonNeg(carbon.emissionsMt),
        pricePerTonWon: nonNeg(carbon.pricePerTonWon),
        netZeroYear: Math.round(num(carbon.netZeroYear, baseYear)),
        taxableShare: rate01(carbon.taxableShare),
        mode: carbon.mode,
      },
    },
    bequest: {
      eligibleEstate: nonNeg(i.bequest.eligibleEstate),
      uptake: rate01(i.bequest.uptake),
      shareToFund: rate01(i.bequest.shareToFund),
      effectiveTaxRate: rate01(i.bequest.effectiveTaxRate),
      specialRate: rate01(i.bequest.specialRate),
    },
    surplus: { annualExcess: num(i.surplus.annualExcess, 0), saveRatio: rate01(i.surplus.saveRatio) },
    sharedAssets: i.sharedAssets.map((a) => ({ ...a, stake: nonNeg(a.stake), yieldRate: rate01(a.yieldRate) })),
  };
}

function populationAt(i: SimInput, year: number): number {
  return i.population0 * Math.pow(1 + i.populationGrowth, year - i.baseYear);
}

function needFor(i: SimInput, population: number): number {
  const top = i.socialInsuranceTopUp.enabled ? i.socialInsuranceTopUp.annual : 0;
  return (i.monthlyPerPerson * 12 * population) / 1e12 + top;
}

/** 그해 세입을 지급용·적립용으로 나눈다. 유산·초과세수는 늘 적립. */
function revenuesFor(i: SimInput, year: number): { breakdown: RevenueBreakdown; pay: number; save: number } {
  const t = year - i.baseYear;
  const robot = robotTax(i.alt.robot, t);
  const data = dataTax(i.alt.data, t);
  const carbon = carbonTax(i.alt.carbon, year, i.baseYear);
  const bequest = bequestFlow(i.bequest).toFund;
  const surplus = surplusToFund(i.surplus);
  const shared = sharedAssetFlows(i.sharedAssets);
  let pay = shared.pay;
  let save = shared.save + bequest + surplus;
  for (const [amount, mode] of [
    [robot, i.alt.robot.mode],
    [data, i.alt.data.mode],
    [carbon, i.alt.carbon.mode],
  ] as const) {
    if (mode === 'pay') pay += amount;
    else save += amount;
  }
  return { breakdown: { robot, data, carbon, bequest, surplus, shared: shared.pay + shared.save }, pay, save };
}

export function simulate(raw: SimInput): SimResult {
  const i = sanitizeInput(raw);
  const lastYear = i.payStartYear + i.horizonYears - 1;
  const rows: YearRow[] = [];
  let fund = i.initialFund;
  let principal = i.initialFund;
  let firstFailYear: number | null = null;
  let reason: FailReason | null = null;

  for (let year = i.baseYear; year <= lastYear; year++) {
    const paying = year >= i.payStartYear;
    const population = populationAt(i, year);
    const need = paying ? needFor(i, population) : 0;
    const rev = revenuesFor(i, year);
    const fromRevenue = Math.min(need, rev.pay);
    const withdrawal = Math.min(withdrawalCap(fund, i.withdrawalRate), need - fromRevenue);
    const shortfall = Math.max(0, need - fromRevenue - withdrawal);
    const saveInflow = rev.save + (rev.pay - fromRevenue);
    fund = fund * (1 + i.realReturn) - withdrawal + saveInflow;
    principal += saveInflow;
    rows.push({
      year, paying, population, need, payRevenue: rev.pay, saveInflow,
      withdrawal, shortfall, fundEnd: fund, principal, revenues: rev.breakdown,
    });
    if (paying && firstFailYear === null) {
      if (shortfall > EPS) reason = 'shortfall';
      else if (fund < principal - EPS) reason = 'principal';
      if (reason) firstFailYear = year;
    }
  }
  const verdict: Verdict = { sustainable: firstFailYear === null, firstFailYear, reason };
  return { rows, verdict };
}

/** A 목표선: 지금 액수를 원금 손상 없이 영구 지급하려면 필요한 기금과 현재 기금의 달성률. */
/** 영구 목표에서 뺄 지급용 세입: 줄지 않는 것만. 탄소세와 줄어드는 로봇세는 언젠가 사라지므로 빼지 않는다. */
function durablePay(i: SimInput): number {
  const { robot, data } = i.alt;
  let pay = sharedAssetFlows(i.sharedAssets).pay;
  if (data.mode === 'pay') pay += dataTax(data, 0);
  if (robot.mode === 'pay' && robot.annualDecline === 0) pay += robotTax(robot, 0);
  return pay;
}

export function perpetualTarget(raw: SimInput): { target: number; progress: number } {
  const i = sanitizeInput(raw);
  const need = needFor(i, populationAt(i, i.baseYear));
  const net = need - durablePay(i);
  const target = perpetualFund(net, i.withdrawalRate);
  const progress = target > 0 ? Math.min(1, i.initialFund / target) : 1;
  return { target, progress };
}
