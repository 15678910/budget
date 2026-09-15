import type { GovUnit, Program } from './types';

export const CENTRAL_GOV: GovUnit = { level: 'central', code: '00', name: '중앙정부' };

const CODE_LENGTH: Record<GovUnit['level'], number> = { central: 2, metro: 2, district: 5 };

export function isValidGovCode(gov: GovUnit): boolean {
  if (!/^\d+$/.test(gov.code)) return false;
  if (gov.level === 'central') return gov.code === '00';
  return gov.code.length === CODE_LENGTH[gov.level];
}

/** 점수·재배분은 한 정부 단위 안에서만 한다. 섞이면 계산 자체를 거부한다 */
export function assertSameGov(programs: readonly Program[]): void {
  const first = programs[0];
  if (!first) return;
  for (const p of programs) {
    if (p.gov.level !== first.gov.level || p.gov.code !== first.gov.code) {
      throw new Error(`서로 다른 gov의 사업을 섞을 수 없다: ${first.gov.code} vs ${p.gov.code}`);
    }
  }
}
