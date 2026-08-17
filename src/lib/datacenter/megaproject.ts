/**
 * 3대 메가프로젝트 국가 단위 집계 (설계문서 §4.6)
 *
 * 집계 방식은 단순 선형 스케일업이다 — 1GW 결과 × N. 규모의 경제, 입지별 전력·용지 비용 차이,
 * 동시 건설로 인한 자재·인력 단가 상승을 반영하지 않는다. 이 한계를 출력에 명시한다.
 * 선형 가정은 보수적이지도 낙관적이지도 않은 중립 기준선이다.
 */

import { USD_KRW } from './constants';
import { estimateJobs } from './employment';
import { carbonImpact, landImpact, powerImpact, waterImpact, type Cooling } from './regional';
import { localTax } from './tax';
import type { Figure } from './types';

const JO = 1e12;

// ─── 메가프로젝트 상수 ────────────────────────────────────────────────────────

export const TOTAL_INVESTMENT: Figure = {
  value: 1500 * JO,
  unit: 'KRW',
  label: '3대 메가프로젝트 총 투자 (10년)',
  kind: 'announced',
  source: '정부 발표',
  date: '2025-06',
};

export const DATACENTER_INVESTMENT: Figure = {
  value: 550 * JO,
  unit: 'KRW',
  label: 'AI 데이터센터 부문 투자',
  kind: 'announced',
  source: '정부 발표',
  date: '2025-06',
};

export const CAPACITY_2029: Figure = {
  value: 8.4,
  unit: 'GW',
  label: '데이터센터 용량 목표 (2029)',
  kind: 'announced',
  source: '정부 발표',
  date: '2025-06',
};

export const CAPACITY_2035: Figure = {
  value: 18.4,
  unit: 'GW',
  label: '데이터센터 용량 목표 (2035 누적)',
  kind: 'announced',
  source: '정부 발표',
  date: '2025-06',
};

export const CAPACITY_CURRENT: Figure = {
  value: 2.0,
  unit: 'GW',
  label: '현재 국내 데이터센터 용량 (325개소)',
  kind: 'announced',
  source: '정부 통계',
  date: '2024-12',
};

export const LARGEST_CURRENT_SITE: Figure = {
  value: 100,
  unit: 'MW',
  label: '국내 최대 데이터센터 용량',
  kind: 'announced',
  source: '정부 통계',
  date: '2024-12',
};

export const MEGAPROJECT_POWER_DEMAND: Figure = {
  value: 24.7,
  unit: 'GW',
  label: '메가프로젝트 전체 전력수요',
  kind: 'announced',
  source: '정부 발표',
  date: '2025-06',
};

export const ALL_MEGA_FIGURES: readonly Figure[] = [
  TOTAL_INVESTMENT,
  DATACENTER_INVESTMENT,
  CAPACITY_2029,
  CAPACITY_2035,
  CAPACITY_CURRENT,
  LARGEST_CURRENT_SITE,
  MEGAPROJECT_POWER_DEMAND,
];

// ─── 입지별 배분 ──────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  name: string;
  capacityGw: number;
  operator: string;
  note?: string;
}

export const SITES: readonly Site[] = [
  { id: 'ulsan', name: '울산', capacityGw: 1.0, operator: 'SK', note: '공랭식 무용수 표방' },
  { id: 'jeonnam-gwangju', name: '전남·광주', capacityGw: 1.0, operator: '미공개' },
  { id: 'donghae', name: '강원 동해안', capacityGw: 2.4, operator: '미공개' },
  {
    id: 'jeonnam-separate',
    name: '전남 (별도)',
    capacityGw: 3.0,
    operator: '미공개',
    note: '투자 50조 원 규모로 별도 발표',
  },
];

// ─── 집계 ─────────────────────────────────────────────────────────────────────

export interface MegaprojectSummary {
  targetYear: number;
  capacityGw: number;
  /** 현재 용량 대비 배수 */
  multipleOfCurrent: number;
  /** 국내 최대 시설(100MW) 몇 개분인가 */
  equivalentLargestSites: number;

  investmentKrw: number;
  permanentJobs: { low: number; mid: number; high: number };
  /** 상시 일자리 1개당 투자액 */
  investmentPerJobKrw: number;

  annualTwh: number;
  nuclearUnits: number;
  dailyWaterTons: number;
  annualCarbonTons: number;
  landPyeong: number;

  /** 지방세 — 전국 합계 */
  annualTaxKrw: number;
  oneTimeTaxKrw: number;
  /** 투자액 대비 연간 세수 비율 */
  annualTaxPerInvestment: number;
}

/**
 * 목표 연도의 국가 단위 집계.
 *
 * 투자액은 데이터센터 부문 550조 원을 목표 용량에 배분한다 — 2029년 8.4GW 시점에는
 * 그 비율만큼만 집행된 것으로 본다.
 */
export function megaprojectSummary(
  targetYear: number,
  cooling: Cooling = 'water',
): MegaprojectSummary {
  const capacityGw = targetYear >= 2035 ? CAPACITY_2035.value : CAPACITY_2029.value;
  const investmentKrw = DATACENTER_INVESTMENT.value * (capacityGw / CAPACITY_2035.value);
  const investmentUsd = investmentKrw / USD_KRW;

  const jobs = estimateJobs(capacityGw * 1000, investmentUsd);
  const power = powerImpact(capacityGw, cooling);
  const water = waterImpact(capacityGw, cooling);
  const carbon = carbonImpact(capacityGw, cooling);
  const land = landImpact(capacityGw);
  const tax = localTax(investmentUsd, 0.55, 0.3, capacityGw, jobs.permanent.mid);

  return {
    targetYear,
    capacityGw,
    multipleOfCurrent: capacityGw / CAPACITY_CURRENT.value,
    equivalentLargestSites: (capacityGw * 1000) / LARGEST_CURRENT_SITE.value,

    investmentKrw,
    permanentJobs: jobs.permanent,
    investmentPerJobKrw: investmentKrw / jobs.permanent.mid,

    annualTwh: power.annualTwh,
    nuclearUnits: power.nuclearUnits,
    dailyWaterTons: water.dailyTons,
    annualCarbonTons: carbon.annualTons,
    landPyeong: land.pyeongHigh,

    annualTaxKrw: tax.annualTotalKrw,
    oneTimeTaxKrw: tax.acquisitionTaxKrw,
    annualTaxPerInvestment: tax.annualTotalKrw / investmentKrw,
  };
}

export interface SiteSummary extends Site {
  annualTwh: number;
  nuclearUnits: number;
  dailyWaterTons: number;
  landPyeong: number;
  permanentJobsMid: number;
  /** 전체 계획 용량에서 차지하는 비중 */
  shareOfPlan: number;
}

/** 발표된 입지별 배분을 같은 계산으로 환산한다. */
export function bySite(cooling: Cooling = 'water'): SiteSummary[] {
  const investmentPerGwUsd = DATACENTER_INVESTMENT.value / CAPACITY_2035.value / USD_KRW;

  return SITES.map((site) => {
    // 울산은 공랭식을 표방하므로 전체 설정과 무관하게 공랭으로 계산한다.
    const siteCooling: Cooling = site.id === 'ulsan' ? 'air' : cooling;
    const power = powerImpact(site.capacityGw, siteCooling);
    const water = waterImpact(site.capacityGw, siteCooling);
    const land = landImpact(site.capacityGw);
    const jobs = estimateJobs(site.capacityGw * 1000, investmentPerGwUsd * site.capacityGw);

    return {
      ...site,
      annualTwh: power.annualTwh,
      nuclearUnits: power.nuclearUnits,
      dailyWaterTons: water.dailyTons,
      landPyeong: land.pyeongHigh,
      permanentJobsMid: jobs.permanent.mid,
      shareOfPlan: site.capacityGw / CAPACITY_2035.value,
    };
  });
}

/** 발표된 입지 배분의 합계. 계획 총량과의 차이가 곧 미발표 물량이다. */
export function announcedCapacityGw(): number {
  return SITES.reduce((acc, s) => acc + s.capacityGw, 0);
}
