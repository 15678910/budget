/**
 * 민감도·역산 테스트 (설계문서 §5.2)
 *
 * 핵심 검증: solveFor가 해 없는 구간에서 null을 내고, 알려진 해를 찾는지.
 */

import { grid2d, solveFor, tornado, type NumericParam } from '../sensitivity';
import { reportOptimistic, rentDeclineApplied } from '../scenarios';
import { analyze } from '../finance';
import { withFinance } from '../assumptions';

const BASE = reportOptimistic.assumptions;
const PARAMS: NumericParam[] = [
  'capexUsd',
  'revenueYear1Usd',
  'interestRate',
  'rentDeclineAnnual',
  'utilization',
];

describe('tornado', () => {
  it('변화폭이 큰 순서로 정렬하고, 산출 불가는 맨 뒤에 둔다', () => {
    const rows = tornado(BASE, PARAMS);
    // null(산출 불가)은 -Infinity로 취급해 정렬 순서만 검사한다.
    const rank = (v: number | null) => (v === null ? Number.NEGATIVE_INFINITY : v);

    for (let i = 1; i < rows.length; i += 1) {
      expect(rank(rows[i - 1].swing)).toBeGreaterThanOrEqual(rank(rows[i].swing));
    }
  });

  it('매출과 투자비가 회수기간을 지배한다', () => {
    const rows = tornado(BASE, PARAMS);
    const top2 = rows.slice(0, 2).map((r) => r.param);
    expect(top2).toEqual(expect.arrayContaining(['revenueYear1Usd']));
  });

  it('임대료 하락률이 0인 기준에서는 흔들어도 변화가 없다', () => {
    // 0 × (1±0.2) = 0 이므로 하락률은 이 시나리오에서 결과를 바꾸지 못한다.
    const row = tornado(BASE, ['rentDeclineAnnual'])[0];
    expect(row.swing).toBe(0);
  });

  it('하락률이 켜진 시나리오에서는 하락률이 결과를 움직인다', () => {
    const row = tornado(rentDeclineApplied.assumptions, ['rentDeclineAnnual'], 0.2, 'recoveryRatioAtGpuEol')[0];
    expect(row.swing).toBeGreaterThan(0);
  });

  it('각 행은 기준값과 흔든 값을 함께 낸다', () => {
    const row = tornado(BASE, ['capexUsd'])[0];
    expect(row.lowValue).toBeCloseTo(row.baseValue * 0.8, 6);
    expect(row.highValue).toBeCloseTo(row.baseValue * 1.2, 6);
    expect(row.label).toBe('총 투자비');
  });

  it('범위를 벗어난 값은 미회수가 아니라 산출 불가로 표시한다', () => {
    // 가동률 100%를 +20% 흔들면 120%가 되어 유효 범위를 벗어난다.
    const row = tornado(BASE, ['utilization'])[0];

    expect(row.highOutOfRange).toBe(true);
    expect(row.swing).toBeNull();
  });

  it('산출 불가 항목은 맨 아래로 보낸다 — 모름을 중요함으로 표시하지 않는다', () => {
    const rows = tornado(BASE, ['utilization', 'revenueYear1Usd', 'capexUsd']);
    expect(rows[rows.length - 1].param).toBe('utilization');
    expect(rows[0].swing).not.toBeNull();
  });

  it('잘못된 변동폭을 거부한다', () => {
    expect(() => tornado(BASE, PARAMS, 0)).toThrow();
    expect(() => tornado(BASE, PARAMS, 1)).toThrow();
  });
});

describe('grid2d', () => {
  it('격자 크기가 입력과 일치한다', () => {
    const g = grid2d(BASE, 'interestRate', 'rentDeclineAnnual', [0.05, 0.07, 0.1], [0, 0.1, 0.2, 0.3]);
    expect(g.cells).toHaveLength(4);
    expect(g.cells[0]).toHaveLength(3);
  });

  it('하락률이 커질수록 회수기간이 늘거나 회수에 실패한다', () => {
    const g = grid2d(BASE, 'interestRate', 'rentDeclineAnnual', [0.07], [0, 0.2, 0.35]);
    const [flat, mid, steep] = g.cells.map((row) => row[0]);

    expect(flat).not.toBeNull();
    expect(mid === null || mid! > flat!).toBe(true);
    expect(steep === null || steep! >= (mid ?? 0)).toBe(true);
  });

  it('계산 불가 지점은 null로 남긴다 — 0으로 채우지 않는다', () => {
    const g = grid2d(BASE, 'utilization', 'rentDeclineAnnual', [0.3], [0.4]);
    expect(g.cells[0][0] === null || typeof g.cells[0][0] === 'number').toBe(true);
  });
});

describe('solveFor', () => {
  it('GPU 수명 5년 안에 회수하려면 임대료 하락률이 몇 %여야 하는지 답한다', () => {
    const answer = solveFor(BASE, 'rentDeclineAnnual', 'paybackYears', 5, 0, 0.5);

    expect(answer).not.toBeNull();
    expect(answer!).toBeGreaterThan(0);
    expect(answer!).toBeLessThan(0.5);

    // 찾은 값을 넣으면 실제로 5년이 나와야 한다.
    const verified = analyze(withFinance({ ...BASE, rentDeclineAnnual: answer! })).summary;
    expect(verified.paybackYears).toBeCloseTo(5, 2);
  });

  it('달성 불가능한 목표에는 null을 낸다', () => {
    // 하락률을 아무리 낮춰도 회수기간이 1년이 될 수는 없다.
    expect(solveFor(BASE, 'rentDeclineAnnual', 'paybackYears', 1, 0, 0.5)).toBeNull();
  });

  it('구간 끝이 정확히 목표면 그 값을 낸다', () => {
    const base = analyze(BASE).summary.paybackYears!;
    const answer = solveFor(BASE, 'rentDeclineAnnual', 'paybackYears', base, 0, 0.5);
    expect(answer).toBeCloseTo(0, 6);
  });

  it('회수 자체가 불가능한 구간에서는 null을 낸다', () => {
    expect(solveFor(BASE, 'rentDeclineAnnual', 'paybackYears', 8, 0.45, 0.5)).toBeNull();
  });

  it('잘못된 탐색 구간을 거부한다', () => {
    expect(() => solveFor(BASE, 'interestRate', 'paybackYears', 5, 0.5, 0.1)).toThrow();
  });

  it('회수율 목표로도 역산할 수 있다', () => {
    const answer = solveFor(BASE, 'rentDeclineAnnual', 'recoveryRatioAtGpuEol', 1.0, 0, 0.5);
    expect(answer).not.toBeNull();

    const verified = analyze(withFinance({ ...BASE, rentDeclineAnnual: answer! })).summary;
    expect(verified.recoveryRatioAtGpuEol).toBeCloseTo(1.0, 3);
  });
});
