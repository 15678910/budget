/**
 * 시뮬레이션 비용추계 정확도 평가 프레임워크
 *
 * NABO/KDI 실제 사례와 비교하여 표준단가 모듈의 정확도를 검증합니다.
 *
 * 사용법:
 *   const results = runAccuracyEvaluation();
 *   results.forEach(r => console.log(`${r.case}: ${r.pass ? 'PASS' : 'FAIL'} (오차 ${r.errorPercent}%)`));
 */

import {
  calculateStandardCost,
  calculateCompoundCost,
  type PolicyCategory,
} from '@/lib/data/standard-costs';

// ─── 검증 데이터: NABO/KDI 실제 사례 ─────────────────────────────────────

interface BenchmarkCase {
  name: string;
  source: string;
  category: PolicyCategory | PolicyCategory[];
  region: { population: number; budget: number; independence: number };
  expectedCost: { min: number; max: number }; // 억원
  expectedAnnualCost?: { min: number; max: number };
}

const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    name: '진주의료원 신축 (300병상)',
    source: 'NABO 비용추계 2023',
    category: 'hospital',
    region: { population: 340000, budget: 12000, independence: 25 },
    expectedCost: { min: 800, max: 1500 }, // 실제 약 1,200억
  },
  {
    name: '인천e음 플랫폼 개발',
    source: '인천광역시',
    category: 'digitalCurrency',
    region: { population: 2900000, budget: 120000, independence: 55 },
    expectedCost: { min: 20, max: 80 }, // 실제 약 30억
  },
  {
    name: '인터넷전문은행 설립',
    source: '금융위원회 인가 사례',
    category: 'bank',
    region: { population: 500000, budget: 30000, independence: 40 },
    expectedCost: { min: 400, max: 1200 }, // 실제 500-1,000억
  },
  {
    name: '초등학교 신설 (24학급)',
    source: '교육부 학교시설 기준',
    category: 'education',
    region: { population: 300000, budget: 15000, independence: 35 },
    expectedCost: { min: 200, max: 400 }, // 실제 약 250-350억
  },
  {
    name: '종합사회복지관 건립',
    source: '보건복지부',
    category: 'welfare',
    region: { population: 200000, budget: 10000, independence: 28 },
    expectedCost: { min: 80, max: 250 }, // 실제 약 100-200억
  },
  {
    name: '세종시 스마트시티 AI 플랫폼',
    source: '국토교통부',
    category: 'ai',
    region: { population: 380000, budget: 27000, independence: 45 },
    expectedCost: { min: 50, max: 250 }, // 실제 약 200억
  },
  {
    name: '블록체인 지역화폐 + 공공은행 복합',
    source: '복합정책 추정',
    category: ['digitalCurrency', 'bank'],
    region: { population: 1500000, budget: 83000, independence: 29 },
    expectedCost: { min: 500, max: 1000 }, // 시너지 할인 후 추정
  },
  {
    name: '태양광 발전소 (1MW급)',
    source: '한국에너지공단',
    category: 'environment',
    region: { population: 100000, budget: 5000, independence: 20 },
    expectedCost: { min: 100, max: 300 }, // 실제 약 150억
  },
];

// ─── 평가 실행 ───────────────────────────────────────────────────────────

interface EvaluationResult {
  case: string;
  source: string;
  estimatedCost: number;
  expectedRange: string;
  errorPercent: number;
  pass: boolean; // within ±30% of expected range midpoint
  grade: 'A' | 'B' | 'C' | 'F'; // A: ±10%, B: ±20%, C: ±30%, F: >30%
}

export function runAccuracyEvaluation(): EvaluationResult[] {
  return BENCHMARK_CASES.map((bc) => {
    const est = Array.isArray(bc.category)
      ? calculateCompoundCost(bc.category, bc.region)
      : calculateStandardCost(bc.category, bc.region);

    const midpoint = (bc.expectedCost.min + bc.expectedCost.max) / 2;
    const errorPercent = Math.round(Math.abs(est.initialCost - midpoint) / midpoint * 100);

    const withinRange = est.initialCost >= bc.expectedCost.min && est.initialCost <= bc.expectedCost.max;
    const grade = errorPercent <= 10 ? 'A' : errorPercent <= 20 ? 'B' : errorPercent <= 30 ? 'C' : 'F';

    return {
      case: bc.name,
      source: bc.source,
      estimatedCost: est.initialCost,
      expectedRange: `${bc.expectedCost.min}-${bc.expectedCost.max}억원`,
      errorPercent,
      pass: withinRange || errorPercent <= 30,
      grade,
    };
  });
}

// ─── 요약 보고서 ─────────────────────────────────────────────────────────

export function getAccuracySummary(): {
  totalCases: number;
  passCount: number;
  passRate: number;
  averageError: number;
  gradeDistribution: Record<string, number>;
  results: EvaluationResult[];
} {
  const results = runAccuracyEvaluation();
  const passCount = results.filter(r => r.pass).length;
  const averageError = Math.round(results.reduce((sum, r) => sum + r.errorPercent, 0) / results.length);
  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, F: 0 };
  results.forEach(r => { gradeDistribution[r.grade]++; });

  return {
    totalCases: results.length,
    passCount,
    passRate: Math.round(passCount / results.length * 100),
    averageError,
    gradeDistribution,
    results,
  };
}
