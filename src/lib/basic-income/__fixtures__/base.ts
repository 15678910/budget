import type { SimInput } from '@/lib/basic-income/types';

/** 시험용 기준 입력: 100만 명, 월 10만 원 → 해마다 1.2조 원. 세입 0. */
export const base: SimInput = {
  baseYear: 2027,
  payStartYear: 2027,
  horizonYears: 50,
  monthlyPerPerson: 100_000,
  population0: 1_000_000,
  populationGrowth: 0,
  realReturn: 0.03,
  withdrawalRate: 0.03,
  initialFund: 0,
  socialInsuranceTopUp: { enabled: false, annual: 0 },
  alt: {
    robot: { base: 0, rate: 0, annualDecline: 0, mode: 'save' },
    data: { base: 0, rate: 0, annualGrowth: 0, mode: 'pay' },
    carbon: { emissionsMt: 0, pricePerTonWon: 0, netZeroYear: 2050, taxableShare: 1, mode: 'save' },
  },
  bequest: { eligibleEstate: 0, uptake: 0, shareToFund: 0, effectiveTaxRate: 0, specialRate: 0 },
  surplus: { annualExcess: 0, saveRatio: 0 },
  sharedAssets: [],
};
