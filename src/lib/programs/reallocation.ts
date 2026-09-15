// src/lib/programs/reallocation.ts
import type { FundAccount } from './types';
import type { RankedProgram } from './scoring';

/** 정부 추산 교부금 차액(기존 연동 대비) 약 21조원 — 기획예산처 2026~2030 국가재정운용계획 */
export const GRANT_GAP_CAP_EOK = 210_000;

export interface ReallocationInput {
  bottomN: number;
  /** 0~1 */
  cutRate: number;
  /** 합이 1. 상위 사업 / 교부금 차액 보전 / 국채 상환 / 적립 */
  split: { top: number; grant: number; debt: number; reserve: number };
}

export interface Move { id: string; fromEok: number; toEok: number }

export interface ReallocationResult {
  freedEok: number;
  cuts: Move[];
  adds: Move[];
  grantEok: number;
  debtEok: number;
  reserveEok: number;
  totalBeforeEok: number;
  totalAfterEok: number;
  byAccount: Partial<Record<FundAccount, { before: number; after: number }>>;
}

export function reallocate(ranked: RankedProgram[], input: ReallocationInput): ReallocationResult {
  const scorable = ranked.filter((r) => !r.program.isRemainder);
  const n = Math.max(0, Math.min(input.bottomN, Math.floor(scorable.length / 2)));
  const bottom = scorable.slice(scorable.length - n);
  const top = scorable.slice(0, n);
  const rate = Math.min(1, Math.max(0, input.cutRate));

  const cuts: Move[] = bottom.map((r) => ({
    id: r.program.id,
    fromEok: r.program.amount27Eok,
    toEok: r.program.amount27Eok * (1 - rate),
  }));
  const freedEok = cuts.reduce((s, c) => s + (c.fromEok - c.toEok), 0);

  const toTop = freedEok * input.split.top;
  let grantEok = freedEok * input.split.grant;
  const debtEok = freedEok * input.split.debt;
  let reserveEok = freedEok * input.split.reserve;
  if (grantEok > GRANT_GAP_CAP_EOK) {
    reserveEok += grantEok - GRANT_GAP_CAP_EOK;
    grantEok = GRANT_GAP_CAP_EOK;
  }

  const topBase = top.reduce((s, r) => s + r.program.amount27Eok, 0);
  const adds: Move[] = top.map((r) => ({
    id: r.program.id,
    fromEok: r.program.amount27Eok,
    toEok: r.program.amount27Eok + (topBase > 0 ? (toTop * r.program.amount27Eok) / topBase : 0),
  }));

  const after = new Map<string, number>();
  for (const r of ranked) after.set(r.program.id, r.program.amount27Eok);
  for (const c of cuts) after.set(c.id, c.toEok);
  for (const a of adds) after.set(a.id, a.toEok);

  const byAccount: ReallocationResult['byAccount'] = {};
  for (const r of ranked) {
    const acc = r.program.account;
    const cur = byAccount[acc] ?? { before: 0, after: 0 };
    cur.before += r.program.amount27Eok;
    cur.after += after.get(r.program.id) ?? 0;
    byAccount[acc] = cur;
  }

  const totalBeforeEok = ranked.reduce((s, r) => s + r.program.amount27Eok, 0);
  const totalAfterEok = [...after.values()].reduce((s, v) => s + v, 0);
  return { freedEok, cuts, adds, grantEok, debtEok, reserveEok, totalBeforeEok, totalAfterEok, byAccount };
}
