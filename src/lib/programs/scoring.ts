// src/lib/programs/scoring.ts
import { LENS_KEYS, type LensKey, type Preset, type Program, type Weights } from './types';
import { assertSameGov } from './gov';

export const ZERO_WEIGHTS: Weights = { capital: 0, netNew: 0, execution: 0, route: 0, reach: 0, check: 0 };

/** 설계문서 §4 프리셋. 「정부 기준」은 NEXT 중 데이터로 표현되는 N·X만 반영 */
export const PRESETS: Preset[] = [
  { id: 'government', name: '정부 기준 (NEXT 원칙)', note: 'N 자본축적·X 탄력 집행만 데이터로 표현된다', weights: { capital: 3, netNew: 1, execution: 2, route: 0, reach: 1, check: 1 } },
  { id: 'parliament', name: '국회 통제 우선', note: '본예산 경로와 순증 여부를 무겁게 본다', weights: { capital: 1, netNew: 2, execution: 1, route: 3, reach: 0, check: 1 } },
  { id: 'assets', name: '자산형성 우선', note: '출자·R&D·기여금을 현금 지급보다 앞세운다', weights: { capital: 3, netNew: 2, execution: 1, route: 0, reach: 1, check: 0 } },
];

const CAPITAL: Partial<Record<Program['spendType'], number>> = {
  equity: 1, rnd: 1, infra: 1, 'matched-saving': 1, service: 0.5, grant: 0.5, cash: 0,
};
const NET_NEW: Partial<Record<Program['nature'], number>> = {
  new: 1, expanded: 1, 'tax-converted': 0.5, transferred: 0,
};
const EXEC_LOW = 1.5;
const EXEC_HIGH = 10;

function executionLens(p: Program): number | undefined {
  if (p.nature === 'unknown') return undefined;
  if (p.amount26Eok === null || p.amount26Eok <= 0) return 0.5; // 신규
  const r = p.amount27Eok / p.amount26Eok;
  if (r <= EXEC_LOW) return 1;
  if (r >= EXEC_HIGH) return 0;
  return 1 - (Math.log(r) - Math.log(EXEC_LOW)) / (Math.log(EXEC_HIGH) - Math.log(EXEC_LOW));
}

export interface LensContext { maxBeneficiaries: number }

export function lensValues(p: Program, ctx: LensContext): Partial<Record<LensKey, number>> {
  const v: Partial<Record<LensKey, number>> = {};
  const c = CAPITAL[p.spendType];
  if (c !== undefined) v.capital = c;
  const n = NET_NEW[p.nature];
  if (n !== undefined) v.netNew = n;
  const e = executionLens(p);
  if (e !== undefined) v.execution = e;
  if (p.route === 'budget') v.route = 1;
  else if (p.route === 'fund' || p.route === 'special-account') v.route = 0;
  if (p.beneficiaries && ctx.maxBeneficiaries > 1) {
    v.reach = Math.log(1 + p.beneficiaries.value) / Math.log(1 + ctx.maxBeneficiaries);
  }
  if (p.unit) v.check = p.unit.matches ? 1 : 0;
  return v;
}

export function scoreProgram(p: Program, w: Weights, ctx: LensContext): number | undefined {
  if (p.isRemainder) return undefined;
  const v = lensValues(p, ctx);
  let num = 0;
  let den = 0;
  for (const k of LENS_KEYS) {
    const x = v[k];
    if (x === undefined || w[k] === 0) continue;
    num += w[k] * x;
    den += w[k];
  }
  return den === 0 ? undefined : num / den;
}

export interface RankedProgram {
  program: Program;
  score?: number;
  lenses: Partial<Record<LensKey, number>>;
}

export function rankPrograms(programs: readonly Program[], w: Weights): RankedProgram[] {
  assertSameGov(programs);
  const ctx: LensContext = {
    maxBeneficiaries: Math.max(1, ...programs.map((p) => p.beneficiaries?.value ?? 0)),
  };
  const allZero = LENS_KEYS.every((k) => w[k] === 0);
  const ranked = programs.map((p) => ({
    program: p,
    score: allZero ? undefined : scoreProgram(p, w, ctx),
    lenses: lensValues(p, ctx),
  }));
  return ranked.sort((a, b) => {
    if (a.score !== undefined && b.score !== undefined && a.score !== b.score) return b.score - a.score;
    if (a.score !== undefined && b.score === undefined) return -1;
    if (a.score === undefined && b.score !== undefined) return 1;
    return b.program.amount27Eok - a.program.amount27Eok;
  });
}
