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

/**
 * 실현가능성 지수 (Feasibility Index) — 0~100
 * ⚠️ 비용·재정·집행 '실현가능성' 지표일 뿐, 공약의 가치·효과(효용)·"질" 평가가 아님.
 *    교육 환경 질 등 효과는 효용 영역이라 객관 점수화하지 않음(단정 금지 원칙).
 * 투명 공식(전 후보 동일):
 *   - 재정 실현성 40%: 재정부담률 낮을수록 ↑ (부담 15%에서 0점)
 *   - 집행 실현성 40%: 공약 feasibility 등급 평균 (상100/중60/하30)
 *   - 공약 구체성 20%: 평균 내용길이(600자 만점) + 이행방법 명시 비율
 */
export interface FeasibilityScore {
  total: number;     // 0~100
  fiscal: number;    // 재정 실현성 0~100
  exec: number;      // 집행 실현성 0~100
  concrete: number;  // 구체성 0~100
}
export function scoreFeasibility(ca: CandidateAnalysis): FeasibilityScore {
  // 재정: 부담률 0%→100, 15%↑→0
  const fiscal = Math.max(0, Math.min(100, 100 - (ca.fiscalLoad / 15) * 100));
  // 집행: feasibility 등급 평균
  const fMap: Record<string, number> = { 상: 100, 중: 60, 하: 30 };
  const exec = ca.perPledge.length
    ? ca.perPledge.reduce((s, x) => s + (fMap[x.analysis.cost.feasibility] ?? 60), 0) / ca.perPledge.length
    : 0;
  // 구체성: 내용 길이 + 이행방법 명시
  const concrete = ca.perPledge.length
    ? ca.perPledge.reduce((s, x) => {
        const len = Math.min(1, (x.pledge.content?.length ?? 0) / 600);
        const hasMethod = /이행\s*방법|추진\s*계획|재원/.test(x.pledge.content ?? '') ? 1 : 0;
        return s + (len * 0.7 + hasMethod * 0.3) * 100;
      }, 0) / ca.perPledge.length
    : 0;
  const total = +(fiscal * 0.4 + exec * 0.4 + concrete * 0.2).toFixed(1);
  return { total, fiscal: +fiscal.toFixed(0), exec: +exec.toFixed(0), concrete: +concrete.toFixed(0) };
}
