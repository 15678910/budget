// 공약 분석 — 비용추계(기존 엔진 재사용) + 효율 지표
// 원칙: 비용은 추계, 효용은 단정 금지. 모든 후보 동일 방법론.

import {
  detectMultipleCategories,
  calculateCompoundCost,
  type PolicyCategory,
  type CostEstimation,
} from '@/lib/data/standard-costs';
import type { Pledge } from './types';

/** 지역 추계 입력 (시도/시군구 단위) */
export interface RegionData {
  population: number;   // 인구(명)
  budget: number;       // 가용예산(억원)
  independence: number; // 재정자립도(%)
}

/** 단일 공약 분석 결과 */
export interface PledgeAnalysis {
  categories: PolicyCategory[]; // 감지된 정책 카테고리(12종)
  cost: CostEstimation;         // 비용추계(초기/운영/방법론/벤치마크)
  fiveYearCost: number;         // 5년 총비용(억): 초기 + 운영×5
}

/** 후보 단위 집계 */
export interface CandidateAnalysis {
  totalInitial: number;   // 공약 초기비용 합(억)
  totalFiveYear: number;  // 5년 총비용 합(억)
  fiscalLoad: number;     // 재정부담률 = 연운영비합 ÷ 가용예산 (%)
  pledgeCount: number;
  perPledge: { pledge: Pledge; analysis: PledgeAnalysis }[];
}

/** 공약 1건 분석 (텍스트 → 카테고리 → 비용) */
export function analyzePledge(pledge: Pledge, region: RegionData): PledgeAnalysis {
  const text = `${pledge.title} ${pledge.content}`.trim();
  const cats = detectMultipleCategories(text);
  const categories = cats.length ? cats : (['general'] as PolicyCategory[]);
  const cost = calculateCompoundCost(categories, region);
  const fiveYearCost = cost.initialCost + cost.annualOperatingCost * 5;
  return { categories, cost, fiveYearCost };
}

/** 후보 전체 공약 분석 + 재정부담 집계 (전 후보 동일 기준) */
export function analyzeCandidate(pledges: Pledge[], region: RegionData): CandidateAnalysis {
  const perPledge = pledges.map((p) => ({ pledge: p, analysis: analyzePledge(p, region) }));
  const totalInitial = perPledge.reduce((s, x) => s + x.analysis.cost.initialCost, 0);
  const totalAnnual = perPledge.reduce((s, x) => s + x.analysis.cost.annualOperatingCost, 0);
  const totalFiveYear = perPledge.reduce((s, x) => s + x.analysis.fiveYearCost, 0);
  const fiscalLoad = region.budget > 0 ? +((totalAnnual / region.budget) * 100).toFixed(1) : 0;
  return { totalInitial, totalFiveYear, fiscalLoad, pledgeCount: pledges.length, perPledge };
}
