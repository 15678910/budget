import { NextRequest, NextResponse } from 'next/server';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getAllDistrictFiscalData,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
  getNationalAverage,
} from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';
import {
  detectPolicyCategory,
  detectMultipleCategories,
  calculateStandardCost,
  calculateCompoundCost,
  type PolicyCategory,
} from '@/lib/data/standard-costs';

// ─── Daily Rate Limiter (separate counter for simulate) ───
const DAILY_LIMIT = 150;
let dailyCount = 0;
let dailyDate = new Date().toISOString().slice(0, 10);

function checkAndIncrementLimit(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyDate) {
    dailyDate = today;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_LIMIT) {
    return false;
  }
  dailyCount++;
  return true;
}

// ─── Simple hash for cache key ───
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ─── In-memory cache (TTL 1h) ───
interface CacheEntry {
  data: PolicySimulationResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (same input → same output)

// ─── Types ───
interface PolicySimulationResult {
  summary: string;
  feasibility: '상' | '중' | '하';
  fiscalImpact: {
    revenue: string;
    expenditure: string;
    netEffect: string;
    independenceChange: number;
    debtChange: number;
  };
  costBreakdown: {
    items: Array<{
      category: string;
      amount: string;
      note: string;
    }>;
    totalInitialCost: string;
    annualOperatingCost: string;
  };
  socialImpact: {
    populationEffect: string;
    migrationRate: string;
    serviceAccessibility: string;
    qualityOfLife: string;
    employmentEffect: string;
  };
  caseComparison: {
    bestCase: {
      name: string;
      region: string;
      description: string;
      keyMetrics: string;
    };
    worstCase: {
      name: string;
      region: string;
      description: string;
      keyMetrics: string;
    };
    lesson: string;
  };
  scaleAnalysis: {
    recommendedScale: string;
    constructionCostPerUnit: string;
    staffingRequirement: string;
    breakEvenPoint: string;
    annualPatientCapacity: string;
  };
  strategicAnalysis: {
    deficitAnalysis: {
      structuralCauses: string;
      operationalCauses: string;
      deficitProjection: string;
    };
    governmentSupport: {
      constructionSupport: string;
      operatingSupport: string;
      subsidyPrograms: string;
      localBurden: string;
    };
    selfSustainability: {
      revenueStrategy: string;
      costOptimization: string;
      partnershipModel: string;
      managementGoals: string;
    };
    alternatives: Array<{
      title: string;
      description: string;
      costComparison: string;
      effectiveness: string;
    }>;
  };
  locationAnalysis: {
    recommendedLocations: Array<{
      rank: number;
      name: string;
      score: number;
      population: number;
      reasoning: string;
      strengths: string[];
      challenges: string[];
      distanceToNearest: string;
      landCostEstimate: string;
    }>;
    selectionCriteria: string;
    accessibilityNote: string;
    medicalDesertAreas: string;
    overallRecommendation: string;
  };
  pros: string[];
  cons: string[];
  similarCases: string;
  recommendation: string;
  projectedGrade: string;
  currentGrade: string;
  currentScore: number;
  timeframe: string;
  regionData: {
    name: string;
    budget: number;
    independence: number;
    autonomy: number;
    debt: number;
    grade: string;
    score: number;
  };
}

interface ResidentPerspective {
  overallSentiment: '긍정' | '중립' | '부정';
  sentimentScore: number; // -100 to +100
  qualityOfLifeChange: string;
  concerns: string[];
  benefits: string[];
  demographicImpact: string;
  publicOpinionForecast: string;
  communityReaction: string;
  vulnerableGroups: string;
  dailyLifeImpact: string;
}

interface PoliticalPerspective {
  feasibility: '높음' | '보통' | '낮음';
  supportingActors: Array<{ name: string; reason: string }>;
  opposingActors: Array<{ name: string; reason: string }>;
  legislativeProcess: string;
  riskFactors: string[];
  politicalTimeline: string;
  intergovernmentalIssues: string;
  electionImpact: string;
  recommendation: string;
}

interface MultiPerspectiveResult {
  fiscal: PolicySimulationResult;
  resident: ResidentPerspective;
  political: PoliticalPerspective;
  synthesis: string;
  isFallback?: boolean;
}

// ─── Extract JSON from Gemini response (may be wrapped in ```json blocks) ───
function extractJSON(text: string): string {
  // Try to extract from ```json ... ``` blocks
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return cleanJSON(jsonBlockMatch[1].trim());
  }
  // Try to extract from ``` ... ``` blocks
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return cleanJSON(codeBlockMatch[1].trim());
  }
  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return cleanJSON(jsonMatch[0].trim());
  }
  return cleanJSON(text.trim());
}

// ─── Clean common JSON issues from Gemini output ───
function cleanJSON(json: string): string {
  let cleaned = json;
  // Remove BOM and zero-width characters
  cleaned = cleaned.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');
  // Remove single-line comments (// ...)
  cleaned = cleaned.replace(/\/\/[^\n]*/g, '');
  // Remove multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // Remove control characters except \n, \r, \t
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  // Fix unescaped newlines inside JSON strings
  cleaned = cleaned.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
  return cleaned;
}

// ─── Local rule-based fallback when Gemini API is unavailable ───
// Uses NABO/KDI standard unit costs for scientific cost estimation
function generateLocalSimulation(
  regionName: string,
  regionData: { independence: number; autonomy: number; debt: number; population: number; budget: number },
  score: { grade: string; total: number },
  policyText: string,
  natAvg: { independence: number; autonomy: number },
): PolicySimulationResult {
  const budget = regionData.budget;
  const pop = regionData.population;
  const indep = regionData.independence;

  // Use standard cost module for scientific estimation
  const categories = detectMultipleCategories(policyText);
  const isCompound = categories.length > 1;
  const costEstimation = isCompound
    ? calculateCompoundCost(categories, { population: pop, budget, independence: indep })
    : calculateStandardCost(categories[0], { population: pop, budget, independence: indep });

  const { initialCost, annualOperatingCost: annualCost, independenceChange, feasibility, timeframe, costItems, benchmarks, methodology } = costEstimation;

  const debtChange = Math.round(initialCost * 0.7);

  // Grade projection
  const gradeOrder = ['F', 'D', 'C', 'B', 'A'];
  const currentGradeIdx = gradeOrder.indexOf(score.grade);
  let projectedIdx = currentGradeIdx;
  if (independenceChange > 1) projectedIdx = Math.min(4, currentGradeIdx + 1);
  else if (independenceChange < -2) projectedIdx = Math.max(0, currentGradeIdx - 1);
  const projectedGrade = gradeOrder[projectedIdx];

  // Deterministic pseudo-random based on population (no Math.random())
  const popDigit = (pop % 10) / 10; // 0.0 ~ 0.9 deterministic
  const roiValue = 120 + (pop % 30);

  // Build benchmark references string (with URLs for linking)
  const benchmarkStr = benchmarks.length > 0
    ? benchmarks.map(b => `• ${b.description} (${b.source})${b.url ? ` [${b.url}]` : ''}`).join('\n')
    : '참고 사례 없음';

  return {
    summary: `${regionName}에서 "${policyText.slice(0, 30)}${policyText.length > 30 ? '...' : ''}" 정책 시행 시 초기 투자 약 ${initialCost.toLocaleString()}억원, 연간 운영비 약 ${annualCost.toLocaleString()}억원이 소요될 것으로 추정됩니다.${isCompound ? ` (복합정책: ${categories.length}개 분야 통합 분석, 시너지 할인 15% 적용)` : ''} [산출방식: ${methodology}]`,
    feasibility,
    fiscalImpact: {
      revenue: `정책 시행으로 인한 간접 세수 증가 효과는 연간 약 ${Math.round(annualCost * 0.3).toLocaleString()}억원으로 추정됩니다. 지역경제 활성화에 따른 지방세 증가가 주요 세원입니다.`,
      expenditure: `초기 투자 ${initialCost.toLocaleString()}억원, 연간 운영비 ${annualCost.toLocaleString()}억원이 소요됩니다. 예산 대비 ${(initialCost / budget * 100).toFixed(1)}%에 해당합니다.`,
      netEffect: `-${initialCost.toLocaleString()}억원(초기) → 약 +${Math.round(annualCost * 0.3).toLocaleString()}억원/년(${feasibility === '상' ? '3' : '5'}년차 이후)`,
      independenceChange: Number(independenceChange.toFixed(1)),
      debtChange,
    },
    costBreakdown: {
      items: costItems,
      totalInitialCost: `${initialCost.toLocaleString()}억원`,
      annualOperatingCost: `${annualCost.toLocaleString()}억원`,
    },
    socialImpact: {
      populationEffect: `정책 시행 시 약 ${Math.round(pop * 0.002).toLocaleString()}명의 인구 유출 방지 효과가 예상됩니다.`,
      migrationRate: `전입 인구 약 ${(0.1 + popDigit * 0.3).toFixed(1)}% 증가, 전출 인구 ${(0.1 + popDigit * 0.2).toFixed(1)}% 감소 예상`,
      serviceAccessibility: `서비스 이용 가능 인구가 약 ${Math.round(pop * 0.15).toLocaleString()}명 증가할 것으로 예상됩니다.`,
      qualityOfLife: '삶의 질 지표 개선이 예상되며, 주민 만족도 약 5-10% 향상이 기대됩니다.',
      employmentEffect: `직접 고용 약 ${Math.round(annualCost * 2)}명, 간접 고용 약 ${Math.round(annualCost * 5)}명 효과가 예상됩니다.`,
    },
    caseComparison: {
      bestCase: {
        name: benchmarks.length > 0 ? benchmarks[0].description.split('(')[0].trim() : '성공 사례 (표준단가 기반)',
        region: benchmarks.length > 0 ? benchmarks[0].source : '유사 규모 지자체',
        description: '유사한 정책을 시행한 지자체에서 초기 적자를 극복하고 5년 내 흑자 전환에 성공한 사례가 있습니다.',
        keyMetrics: `투자 대비 수익률(ROI) 약 ${roiValue}% (10년 기준)`,
      },
      worstCase: {
        name: '부진 사례 (표준단가 기반)',
        region: '유사 규모 지자체',
        description: '수요 예측 실패와 운영 비효율로 인해 지속적인 적자가 발생한 사례입니다. 사전 수요조사의 중요성을 보여줍니다.',
        keyMetrics: `연간 적자 약 ${Math.round(annualCost * 0.5).toLocaleString()}억원 지속`,
      },
      lesson: `성공의 핵심은 사전 수요조사, 단계적 확장, 민관협력 모델 도입입니다. 참고:\n${benchmarkStr}`,
    },
    scaleAnalysis: {
      recommendedScale: `${regionName} 인구 규모(${pop.toLocaleString()}명)에 적합한 중규모 시설`,
      constructionCostPerUnit: `단위당 약 ${(initialCost / Math.max(1, Math.round(pop / 50000))).toFixed(0)}억원`,
      staffingRequirement: `전문인력 ${Math.round(annualCost * 1.5)}명, 행정인력 ${Math.round(annualCost * 0.5)}명 필요`,
      breakEvenPoint: `개시 후 약 ${costEstimation.breakEvenYears > 0 ? `${costEstimation.breakEvenYears}년` : '수익사업이 아닌 공공서비스'}`,
      annualPatientCapacity: `연간 약 ${Math.round(pop * 0.05).toLocaleString()}명 이용 가능`,
    },
    strategicAnalysis: {
      deficitAnalysis: {
        structuralCauses: `${regionName}의 재정자립도 ${indep}%는 ${indep < natAvg.independence ? '전국 평균보다 낮아' : '전국 평균 수준이나'} 자주재원 확보에 한계가 있습니다.`,
        operationalCauses: '인건비 비중이 높고 초기 이용률이 낮을 경우 운영 적자가 발생할 수 있습니다.',
        deficitProjection: `1년차: -${Math.round(annualCost * 0.8).toLocaleString()}억원 → 3년차: -${Math.round(annualCost * 0.4).toLocaleString()}억원 → 5년차: ${feasibility === '상' ? '흑자 전환' : `약 -${Math.round(annualCost * 0.1).toLocaleString()}억원`}`,
      },
      governmentSupport: {
        constructionSupport: `건설비의 약 50% 국고보조 가능 (약 ${Math.round(initialCost * 0.5).toLocaleString()}억원)`,
        operatingSupport: `운영비의 약 30% 정부 지원 가능 (연간 약 ${Math.round(annualCost * 0.3).toLocaleString()}억원)`,
        subsidyPrograms: '균형발전특별회계, 지역활성화사업, 지방소멸대응기금 등 활용 가능',
        localBurden: `지자체 실질 부담: 건설비 약 ${Math.round(initialCost * 0.5).toLocaleString()}억원, 연간 운영비 약 ${Math.round(annualCost * 0.7).toLocaleString()}억원`,
      },
      selfSustainability: {
        revenueStrategy: '부대시설 임대수입, 유료 서비스 확대, 기업 연계 프로그램 등을 통한 자체 수익 창출',
        costOptimization: '공동구매, 에너지 효율화, 디지털 운영 시스템 도입으로 비용 절감',
        partnershipModel: '민간위탁, BTL/BTO 방식, 대학/연구기관 연계 운영 등 검토',
        managementGoals: `1-2년차: 안정화, 3-5년차: ${feasibility === '상' ? '흑자전환' : '적자 감소'}, 5년 이후: 자립운영 목표`,
      },
      alternatives: [
        {
          title: '소규모 시범사업 후 확대',
          description: `초기 투자를 ${Math.round(initialCost * 0.3).toLocaleString()}억원으로 줄여 시범 운영 후 성과에 따라 확대`,
          costComparison: '원안 대비 약 70% 비용 절감',
          effectiveness: '리스크 최소화, 단 규모의 경제 효과 제한적',
        },
        {
          title: '민간위탁 운영',
          description: '시설은 지자체가 건설하되 운영은 전문 민간업체에 위탁',
          costComparison: '운영비 약 20-30% 절감 가능',
          effectiveness: '전문성 확보 용이, 단 공공성 유지에 주의 필요',
        },
        {
          title: '광역 공동사업 추진',
          description: '인근 지자체와 공동으로 추진하여 비용 분담',
          costComparison: '지자체당 부담 약 50% 감소',
          effectiveness: '규모의 경제 실현, 단 의사결정 지연 가능',
        },
      ],
    },
    locationAnalysis: {
      recommendedLocations: [],
      selectionCriteria: '인구밀도, 교통 접근성, 기존 시설과의 거리, 재정 여력, 부지 확보 용이성을 종합 고려',
      accessibilityNote: `${regionName} 내 주요 교통축을 중심으로 접근성이 높은 지역을 우선 검토해야 합니다.`,
      medicalDesertAreas: `${regionName} 내 서비스 취약 지역에 대한 구체적인 분석은 AI 분석이 필요합니다.`,
      overallRecommendation: `${regionName}의 인구 분포와 교통 여건을 고려하여 중심지 인근에 입지하는 것이 바람직합니다.`,
    },
    pros: [
      `${regionName} 주민 삶의 질 향상 및 서비스 접근성 개선`,
      `지역 경제 활성화 및 직간접 고용 창출 (약 ${Math.round(annualCost * 7)}명)`,
      `인구 유출 방지 효과 (연간 약 ${Math.round(pop * 0.002).toLocaleString()}명)`,
    ],
    cons: [
      `초기 투자비 ${initialCost.toLocaleString()}억원 부담 (예산의 ${(initialCost / budget * 100).toFixed(1)}%)`,
      `재정자립도 ${Math.abs(independenceChange).toFixed(1)}%p ${independenceChange < 0 ? '하락' : '상승'} 예상`,
      `운영 적자 발생 가능성 (초기 ${Math.round(annualCost * 0.8).toLocaleString()}억원/년)`,
    ],
    similarCases: `${benchmarkStr}\n\n일반적으로 중규모 지자체에서 ${feasibility === '상' ? '높은 성공률' : feasibility === '중' ? '보통의 성공률' : '신중한 접근이 필요한'} 정책으로 평가됩니다.`,
    recommendation: `${regionName}(현재 ${score.grade}등급, ${score.total}점)에서 이 정책 시행 시 ${projectedGrade}등급으로의 변화가 예상됩니다. ${independenceChange < 0 ? '단기적으로 재정 부담이 증가하나 장기적으로 지역 발전에 기여할 수 있습니다.' : '재정 건전성 개선에 긍정적 효과가 예상됩니다.'} 단계적 추진과 충분한 사전 조사를 권장합니다. [비용추계 산출근거: ${methodology}]`,
    projectedGrade,
    currentGrade: score.grade,
    currentScore: score.total,
    timeframe,
    regionData: {
      name: regionName,
      budget: regionData.budget,
      independence: regionData.independence,
      autonomy: regionData.autonomy,
      debt: regionData.debt,
      grade: score.grade,
      score: score.total,
    },
  };
}

function generateLocalResidentPerspective(
  regionName: string,
  policyText: string,
  regionData: { population: number; independence: number },
): ResidentPerspective {
  const pop = regionData.population;
  const isPositivePolicy = /복지|의료|교육|보육|문화|공원/.test(policyText);
  const isNegativePolicy = /인상|감축|폐지|삭감/.test(policyText);
  const isMixed = /건설|개발|산업|특구/.test(policyText);

  let sentiment: '긍정' | '중립' | '부정' = '중립';
  let sentimentScore = 0;
  if (isPositivePolicy) { sentiment = '긍정'; sentimentScore = 45 + (pop % 30); }
  else if (isNegativePolicy) { sentiment = '부정'; sentimentScore = -(30 + (pop % 25)); }
  else if (isMixed) { sentiment = '중립'; sentimentScore = 10 + (pop % 20); }

  return {
    overallSentiment: sentiment,
    sentimentScore,
    qualityOfLifeChange: isPositivePolicy
      ? `${regionName} 주민의 삶의 질이 향상될 것으로 예상됩니다. 서비스 접근성 개선과 편의시설 확충으로 주민 만족도가 약 ${5 + (pop % 15)}% 상승할 것으로 보입니다.`
      : isNegativePolicy
      ? `단기적으로 주민 불편이 예상됩니다. 특히 저소득층과 고령층의 체감 부담이 클 수 있으며, 약 ${3 + (pop % 8)}%의 만족도 하락이 우려됩니다.`
      : `삶의 질에 복합적 영향이 예상됩니다. 장기적 발전 효과와 단기적 불편이 공존하며, 주민 수용성 확보가 핵심 과제입니다.`,
    concerns: isNegativePolicy
      ? ['세부담 증가에 대한 주민 반발', '취약계층 지원 공백 우려', '주민 이탈 가속화 가능성']
      : isPositivePolicy
      ? ['재정 부담 전가 우려', '시설 운영 효율성 문제', '수혜 형평성 논란 가능']
      : ['개발 이익의 불균등 분배', '환경 영향에 대한 우려', '원주민과 이주민 간 갈등'],
    benefits: isPositivePolicy
      ? ['주민 삶의 질 직접적 향상', '인구 유출 방지 효과', '지역 정주 여건 개선']
      : isNegativePolicy
      ? ['장기적 재정 건전성 확보', '효율적 자원 배분 가능', '미래 세대 부담 경감']
      : ['지역 경제 활성화 기대', '일자리 창출 효과', '지역 브랜드 가치 상승'],
    demographicImpact: `${regionName} 인구 ${pop.toLocaleString()}명 중 약 ${Math.round(pop * 0.6).toLocaleString()}명이 직간접적 영향을 받을 것으로 예상됩니다. 특히 ${isPositivePolicy ? '고령층과 아동이 주요 수혜 대상' : '경제활동인구의 체감도가 높을 것'}입니다.`,
    publicOpinionForecast: `초기 여론은 ${sentiment === '긍정' ? '우호적(찬성 약 60-65%)' : sentiment === '부정' ? '부정적(반대 약 55-60%)' : '분열적(찬성 45%, 반대 40%, 중립 15%)'}일 것으로 예상됩니다. 정책 효과가 가시화되는 ${sentiment === '긍정' ? '1-2년' : '3-5년'} 후 여론이 안정화될 전망입니다.`,
    communityReaction: `지역 시민단체와 주민자치회의 ${sentiment === '부정' ? '반발이 예상되며, 주민설명회와 공청회를 통한 소통이 필수적' : '관심이 높을 것이며, 적극적인 주민 참여 유도가 성공의 열쇠'}입니다.`,
    vulnerableGroups: `${regionName} 내 기초생활수급자, 독거노인, 장애인 등 취약계층(전체 인구의 약 ${8 + (pop % 5)}%)에 대한 ${isNegativePolicy ? '보완 대책 마련이 시급' : '우선적 혜택 설계가 필요'}합니다.`,
    dailyLifeImpact: `주민 일상에 미치는 영향: ${isPositivePolicy ? '통원/통학 시간 단축, 여가 활동 확대, 돌봄 부담 경감' : isNegativePolicy ? '가계 부담 증가, 서비스 이용 불편, 대체 수단 필요' : '건설 기간 소음/교통 불편, 완공 후 생활 편의 향상'}이 예상됩니다.`,
  };
}

function generateLocalPoliticalPerspective(
  regionName: string,
  policyText: string,
  regionData: { independence: number; population: number },
): PoliticalPerspective {
  const indep = regionData.independence;
  const pop = regionData.population;
  const isLargeScale = /병원|철도|공항|산업단지|특구/.test(policyText);
  const isControversial = /인상|감축|폐지|민영화/.test(policyText);
  const isPopular = /복지|의료|교육|보육|무상/.test(policyText);

  let feasibility: '높음' | '보통' | '낮음' = '보통';
  if (isPopular && indep > 40) feasibility = '높음';
  else if (isControversial || (isLargeScale && indep < 30)) feasibility = '낮음';

  return {
    feasibility,
    supportingActors: [
      { name: `${regionName} 지자체장`, reason: isPopular ? '주민 지지율 확보와 지역 발전 공약 이행' : '지역 경쟁력 강화와 재정 건전화 목표' },
      { name: '관련 부처 (행정안전부/기획재정부)', reason: isLargeScale ? '균형발전 정책 기조와 부합' : '지방재정 건전화 방향과 일치' },
      { name: isPopular ? '지역 시민단체' : '지역 경제단체', reason: isPopular ? '주민 복리 증진 기대' : '지역 경제 활성화 기대' },
    ],
    opposingActors: [
      { name: isPopular ? '야당 지방의회 의원' : '주민 단체', reason: isPopular ? '재원 마련 방안 불투명' : '주민 부담 증가 우려' },
      { name: isLargeScale ? '환경단체' : '납세자 연합', reason: isLargeScale ? '환경 영향 및 과잉투자 우려' : '세금 사용의 효율성 의문' },
      { name: '인접 지자체', reason: '재정 파급효과와 지역 간 형평성 문제' },
    ],
    legislativeProcess: isLargeScale
      ? `조례안 발의 → 상임위 심의(2-3개월) → 예산결산위 심의(1-2개월) → 본회의 의결. 대규모 사업으로 중앙정부 사전 협의 및 타당성 조사(6-12개월)가 선행되어야 합니다.`
      : `조례안 발의 → 해당 상임위 심의(1-2개월) → 본회의 의결. ${regionName} 의회 정기회(매년 11-12월) 또는 임시회에서 처리 가능합니다.`,
    riskFactors: [
      isControversial ? '주민 반발로 인한 정책 지연 또는 후퇴' : '예산 확보 지연으로 인한 사업 착수 지연',
      '지방선거(2026년 6월) 전후 정치적 이슈화 가능성',
      indep < 30 ? '낮은 재정자립도로 인한 중앙정부 의존도 심화' : '타 사업 예산 삭감에 따른 정치적 반발',
      '관련 법령 개정 필요 시 국회 일정에 따른 불확실성',
    ],
    politicalTimeline: `${isLargeScale ? '준비기(6-12개월): 타당성 조사, 주민공청회 → ' : ''}추진기(${isLargeScale ? '1-2년' : '3-6개월'}): 조례안 발의·심의·의결 → 시행기(${isLargeScale ? '2-5년' : '6개월-2년'}): 사업 추진. 2026년 6월 지방선거가 주요 정치 일정입니다.`,
    intergovernmentalIssues: `중앙-지방 관계: ${indep < 30 ? '재정자립도가 낮아 국고보조 의존도가 높으며, 중앙정부 정책 방향과의 정합성 확보가 필수적' : '상대적으로 자체 재원이 확보되어 있으나, 대규모 사업 시 중앙정부 협조가 필요'}합니다. 인접 지자체와의 협력/경쟁 관계도 고려해야 합니다.`,
    electionImpact: `2026년 지방선거를 고려할 때, 이 정책은 ${isPopular ? '현직 단체장에게 긍정적 공약 이행 사례' : isControversial ? '선거 쟁점으로 부상할 가능성이 높으며' : '유권자 관심도가 중간 수준이며'} ${feasibility === '높음' ? '정치적 추진 동력이 충분할 것으로 보입니다.' : '정치적 리스크 관리가 필요합니다.'}`,
    recommendation: `${regionName}에서 이 정책의 정치적 실현가능성은 '${feasibility}'입니다. ${feasibility === '높음' ? '주민 지지와 정치적 동력이 확보되어 있어 조기 추진을 권장합니다.' : feasibility === '낮음' ? '이해관계자 간 갈등 조정과 충분한 사전 합의가 선행되어야 합니다. 단계적 추진을 권장합니다.' : '찬반 여론이 엇갈려 있으므로, 주민 참여형 의사결정 과정(공론화위원회 등)을 거쳐 사회적 합의를 형성할 것을 권장합니다.'}`,
  };
}

function generateLocalSynthesis(
  regionName: string,
  policyText: string,
  fiscal: PolicySimulationResult,
  resident: ResidentPerspective,
  political: PoliticalPerspective,
): string {
  const fiscalPositive = Number(fiscal.fiscalImpact.independenceChange) >= 0;
  const residentPositive = resident.overallSentiment === '긍정';
  const politicalFeasible = political.feasibility !== '낮음';

  const positiveCount = [fiscalPositive, residentPositive, politicalFeasible].filter(Boolean).length;

  if (positiveCount === 3) {
    return `[종합 평가] ${regionName}의 "${policyText.slice(0, 20)}..." 정책은 재정·주민·정치 3개 관점 모두에서 긍정적입니다. 재정자립도 개선(${fiscal.fiscalImpact.independenceChange}%p), 주민 지지(${resident.overallSentiment}), 정치적 실현가능성(${political.feasibility})이 조화를 이루어 적극 추진을 권장합니다.`;
  } else if (positiveCount === 0) {
    return `[종합 평가] ${regionName}의 "${policyText.slice(0, 20)}..." 정책은 재정 부담(${fiscal.fiscalImpact.independenceChange}%p), 주민 반발(${resident.overallSentiment}), 정치적 난항(${political.feasibility}) 등 3개 관점 모두에서 도전적입니다. 근본적인 재검토 또는 대안 정책 모색을 권장합니다.`;
  } else {
    const positive: string[] = [];
    const negative: string[] = [];
    if (fiscalPositive) positive.push('재정 효율성'); else negative.push('재정 부담');
    if (residentPositive) positive.push('주민 지지'); else negative.push('주민 수용성');
    if (politicalFeasible) positive.push('정치적 동력'); else negative.push('정치적 리스크');
    return `[종합 평가] ${regionName}의 "${policyText.slice(0, 20)}..." 정책은 ${positive.join(', ')} 측면은 긍정적이나, ${negative.join(', ')} 측면에서 과제가 있습니다. ${negative.join(', ')} 리스크를 최소화하는 보완 대책과 함께 단계적 추진을 권장합니다.`;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Gemini API key is required; if missing, no data to even build a fallback context
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API 키가 필요합니다. 정책 시뮬레이션은 AI가 필수입니다.' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { regionType, regionName, policyText } = body as {
      regionType: 'metro' | 'district';
      regionName: string;
      policyText: string;
    };

    // ─── Input validation ───
    if (!regionType || !regionName) {
      return NextResponse.json(
        { error: '지역 유형과 지역명을 입력해주세요.' },
        { status: 400 },
      );
    }

    if (!policyText || typeof policyText !== 'string') {
      return NextResponse.json(
        { error: '정책 내용을 입력해주세요.' },
        { status: 400 },
      );
    }

    const trimmedPolicy = policyText.trim();
    if (trimmedPolicy.length < 2) {
      return NextResponse.json(
        { error: '정책 내용은 최소 2자 이상 입력해주세요.' },
        { status: 400 },
      );
    }

    if (trimmedPolicy.length > 500) {
      return NextResponse.json(
        { error: '정책 내용은 최대 500자까지 입력 가능합니다.' },
        { status: 400 },
      );
    }

    if (regionType !== 'metro' && regionType !== 'district') {
      return NextResponse.json(
        { error: "지역 유형은 'metro' 또는 'district'이어야 합니다." },
        { status: 400 },
      );
    }

    // ─── Check cache (includes policyText hash) ───
    const policyHash = simpleHash(trimmedPolicy);
    const cacheKey = `simulate:${regionType}:${regionName}:${policyHash}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // ─── Load region data ───
    let regionData: MetroFiscalData | DistrictFiscalData | undefined;
    let score: ReturnType<typeof calculateFiscalHealthScore>;

    if (regionType === 'metro') {
      const metros = getMetroFiscalData();
      regionData = metros.find((m) => m.name === regionName);
      if (!regionData) {
        return NextResponse.json({ error: '해당 광역시도를 찾을 수 없습니다.' }, { status: 404 });
      }
      score = calculateFiscalHealthScore(regionData as MetroFiscalData);
    } else {
      const allDistricts = getAllDistrictFiscalData();
      regionData = allDistricts.find((d) => d.name === regionName);
      if (!regionData) {
        return NextResponse.json({ error: '해당 시군구를 찾을 수 없습니다.' }, { status: 404 });
      }
      score = calculateDistrictHealthScore(regionData as DistrictFiscalData);
    }

    // ─── Load district data for location analysis (when metro selected) ───
    let districtDataText = '';
    if (regionType === 'metro') {
      const districts = getDistrictFiscalData(regionName);
      if (districts.length > 0) {
        districtDataText = districts.map(d =>
          `${d.name}: 인구 ${d.population.toLocaleString()}명, 재정자립도 ${d.independence}%, 재정자주도 ${d.autonomy}%, 채무 ${d.debt}억원, 예산 ${d.budget}억원`
        ).join('\n');
      }
    }

    // ─── National averages ───
    const natAvg = getNationalAverage();

    // ─── Detect bill name / question input and enrich with NABO data ───
    let enrichedPolicyText = trimmedPolicy;
    let naboContext = '';

    // Known bill name patterns (법안 별칭 → 정식명칭 매핑)
    const BILL_ALIASES: Record<string, string> = {
      '노란봉투법': '노동조합 및 노동관계조정법 일부개정법률안 (파업 시 손해배상 청구 제한, 하청노동자 원청 교섭 의무화)',
      '김영란법': '부정청탁 및 금품등 수수의 금지에 관한 법률',
      '타다금지법': '여객자동차 운수사업법 일부개정법률안 (플랫폼 운송사업 규제)',
      '중대재해법': '중대재해 처벌 등에 관한 법률 (사업주 안전의무 위반 시 처벌 강화)',
      '전세사기방지법': '전세사기피해자 지원 및 주거안정에 관한 특별법',
      '민식이법': '도로교통법 일부개정법률안 (어린이보호구역 내 과속 처벌 강화)',
      '하준이법': '어린이제품 안전 특별법 일부개정법률안',
      '윤창호법': '도로교통법 일부개정법률안 (음주운전 처벌 강화)',
      '이석기법': '공직선거법 일부개정법률안',
      '공공은행법': '지방공공은행 설립 및 운영에 관한 법률안 (지역 공공은행 설립 근거)',
      '기본소득법': '기본소득에 관한 법률안 (전 국민 기본소득 지급)',
      '플랫폼노동법': '플랫폼 종사자 보호 및 지원 등에 관한 법률안',
      '상가임대차보호법': '상가건물 임대차보호법 일부개정법률안',
      '데이터기본법': '데이터 산업진흥 및 이용촉진에 관한 기본법',
      '탄소중립법': '기후위기 대응을 위한 탄소중립·녹색성장 기본법',
    };

    // Check if input matches a known bill alias
    const matchedAlias = Object.entries(BILL_ALIASES).find(([alias]) =>
      trimmedPolicy.includes(alias)
    );

    if (matchedAlias) {
      const [alias, fullName] = matchedAlias;
      enrichedPolicyText = fullName;
      naboContext = `\n\n[법안 정보]\n사용자 입력: "${alias}"\n정식명칭: ${fullName}\n이 법안의 지역 재정 영향을 분석하세요. 법안 시행 시 해당 지역에 미치는 직간접 비용과 효과를 추정하세요.`;
    }

    // Try to look up from NABO API if it looks like a bill name (ends with 법, 법안, 조례)
    const isBillName = /법$|법안$|조례$|특별법$|기본법$/.test(trimmedPolicy) || matchedAlias;
    if (isBillName && !matchedAlias) {
      // Try NABO API lookup
      const naboKey = process.env.NABO_API_KEY;
      if (naboKey) {
        try {
          const naboUrl = new URL('https://open.assembly.go.kr/portal/openapi/nzmimeepazxkubdpn');
          naboUrl.searchParams.set('KEY', naboKey);
          naboUrl.searchParams.set('Type', 'json');
          naboUrl.searchParams.set('pIndex', '1');
          naboUrl.searchParams.set('pSize', '3');
          naboUrl.searchParams.set('AGE', '22');
          naboUrl.searchParams.set('BILL_NAME', trimmedPolicy);

          const naboRes = await fetch(naboUrl.toString(), { signal: AbortSignal.timeout(5000) });
          if (naboRes.ok) {
            const naboData = await naboRes.json();
            const rows = naboData?.nzmimeepazxkubdpn?.[1]?.row;
            if (rows && rows.length > 0) {
              const bill = rows[0];
              naboContext = `\n\n[국회 법률안 정보 - 열린국회정보 API]\n법안명: ${bill.BILL_NAME}\n발의자: ${bill.PROPOSER || bill.RST_PROPOSER}\n발의일: ${bill.PROPOSE_DT}\n상태: ${bill.PROC_RESULT || '계류 중'}\n이 법안의 지역 재정 영향을 분석하세요.`;
              enrichedPolicyText = bill.BILL_NAME;
            }
          }
        } catch {
          // NABO API lookup failed, continue without it
        }
      }
    }

    // Detect question-type inputs (질문형)
    const isQuestion = /\?$|은\?$|는\?$|할까|인가|뭐가|최고|추천|어떤|무엇/.test(trimmedPolicy);
    if (isQuestion && !isBillName) {
      naboContext = `\n\n[주의: 질문형 입력]\n사용자가 질문형으로 입력했습니다: "${trimmedPolicy}"\n이 질문에 대해 먼저 구체적인 정책을 제안한 후, 그 정책의 재정 영향을 분석하세요.\nsummary 필드에 "추천 정책: [정책명]" 형태로 시작하세요.`;
    }

    // ─── Rate limit check (only when cache miss) ── falls back to local simulation ───
    if (!checkAndIncrementLimit()) {
      console.warn('Daily limit exceeded - falling back to local simulation');
      const fallbackResult = generateLocalSimulation(regionName, regionData, score, enrichedPolicyText, natAvg);
      const fallbackResident = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
      const fallbackPolitical = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
      const fallbackSynthesis = generateLocalSynthesis(regionName, enrichedPolicyText, fallbackResult, fallbackResident, fallbackPolitical);
      return NextResponse.json({
        fiscal: fallbackResult,
        resident: fallbackResident,
        political: fallbackPolitical,
        synthesis: fallbackSynthesis,
        isFallback: true,
      } as MultiPerspectiveResult & { isFallback: boolean });
    }

    // ─── Build Gemini prompt ───
    const geminiPrompt = `당신은 대한민국 지방재정 정책 시뮬레이터이자 공공정책 분석 전문가입니다.
사용자가 제안한 정책을 해당 지역의 실제 재정 데이터와 과학적 근거를 바탕으로 심도 있게 분석하세요.

[지역 데이터]
지역명: ${regionName}
재정자립도: ${regionData.independence}% (전국평균: ${natAvg.independence}%)
재정자주도: ${regionData.autonomy}% (전국평균: ${natAvg.autonomy}%)
지역채무: ${regionData.debt}억원
인구: ${regionData.population.toLocaleString()}명
예산규모: ${regionData.budget}억원
건전성 등급: ${score.grade} (${score.total}/100)

[사용자 제안 정책]
${enrichedPolicyText}${naboContext}
${districtDataText ? `
[하위 시군구 재정 데이터]
${districtDataText}
` : ''}
[분석 지침]
1. 비용은 2024-2025년 기준 실제 한국 시장 데이터를 반영하세요
2. 공공병원/공공시설의 경우 실제 운영 중인 한국 사례를 인용하세요
3. 인구 이동, 사망률, 삶의 질 등 사회과학적 지표를 포함하세요
4. 규모별(소/중/대) 시나리오를 고려하되, 해당 지역에 가장 적합한 규모를 추천하세요
5. recommendation에 현재 등급(${score.grade})에서 정책 시행 후 예상 등급으로의 변화를 반드시 포함하세요
6. 적자 발생 시 구조적 원인(의료수가, 공공성)과 운영적 원인(인건비, 환자수)을 구분 분석하세요
7. 중앙정부 지원은 건설비와 운영비를 분리하여 실제 보조금 기준으로 분석하세요
8. 지자체 자립 경영을 위한 수익 다각화, 비용 절감, 민관협력 모델을 구체적으로 제시하세요
9. 원안보다 비용 효율적인 대안 정책을 최소 3개 제시하세요
10. locationAnalysis에서 해당 지역 내 시군구 중 정책 시행에 가장 적합한 위치 3~5곳을 추천하세요. 인구, 접근성, 의료 취약성, 재정 여력, 토지비용을 종합 고려하세요.

[중요: 숫자 단위 규칙]
- independenceChange: 재정자립도 변화를 %p 단위 숫자로 (예: -2.5, +1.2). 소수점 1자리까지.
- debtChange: 채무 변화를 억원 단위 숫자로 (예: 1500, -200). 절대 원(₩) 단위로 쓰지 마세요.
- locationAnalysis의 score: 0~100 사이 정수.
- locationAnalysis의 population: 순수 숫자 (예: 360000).
- feasibility: 반드시 "상", "중", "하" 중 하나만.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "정책 요약 (1문장, 구체적 수치 포함)",
  "feasibility": "상 또는 중 또는 하 중 하나",
  "fiscalImpact": {
    "revenue": "세수 변화 분석 (구체적 세목별 금액 포함, 2-3문장)",
    "expenditure": "지출 변화 분석 (항목별 금액 포함, 2-3문장)",
    "netEffect": "순 재정효과 (예: -1,500억원(초기) → +200억원/년(5년차 이후))",
    "independenceChange": -2.5,
    "debtChange": 1500
  },
  "costBreakdown": {
    "items": [
      {"category": "항목명1", "amount": "금액", "note": "산출 근거"},
      {"category": "항목명2", "amount": "금액", "note": "산출 근거"},
      {"category": "항목명3", "amount": "금액", "note": "산출 근거"},
      {"category": "항목명4", "amount": "금액", "note": "산출 근거"}
    ],
    "totalInitialCost": "초기 투자 총액",
    "annualOperatingCost": "연간 운영비"
  },
  "socialImpact": {
    "populationEffect": "인구 변화 영향 (이탈 방지 효과 등, 수치 포함)",
    "migrationRate": "전입/전출 비율 변화 예측",
    "serviceAccessibility": "서비스 접근성 변화 (이용 가능 인구, 이동시간 등)",
    "qualityOfLife": "삶의 질 지표 변화 (기대수명, 만족도 등)",
    "employmentEffect": "직접/간접 고용 효과 (직종별 인원수)"
  },
  "caseComparison": {
    "bestCase": {
      "name": "성공 사례 기관명",
      "region": "소재 지역",
      "description": "성공 요인 분석 (2-3문장)",
      "keyMetrics": "핵심 성과 지표 (매출, 이용자 수, 흑자/적자 등)"
    },
    "worstCase": {
      "name": "실패/부진 사례 기관명",
      "region": "소재 지역",
      "description": "실패 요인 분석 (2-3문장)",
      "keyMetrics": "핵심 지표 (적자 규모, 폐업 연도 등)"
    },
    "lesson": "두 사례에서 도출된 핵심 교훈 (2-3문장)"
  },
  "scaleAnalysis": {
    "recommendedScale": "이 지역에 적합한 추천 규모",
    "constructionCostPerUnit": "단위당 건설비 (예: 1병상당 1.5억원)",
    "staffingRequirement": "필요 인력 상세 (직종별 인원수)",
    "breakEvenPoint": "손익분기점 도달 예상 시점",
    "annualPatientCapacity": "연간 서비스 이용 가능 인원/용량"
  },
  "strategicAnalysis": {
    "deficitAnalysis": {
      "structuralCauses": "구조적 적자 원인 분석 (예: 의료수가 체계, 공공의료 특성상 비급여 수익 제한 등)",
      "operationalCauses": "운영적 적자 원인 분석 (예: 인건비 비중, 환자 수 부족, 장비 유지비 등)",
      "deficitProjection": "연도별 적자 규모 예측 (개원 1년차~5년차, 흑자전환 시점 포함)"
    },
    "governmentSupport": {
      "constructionSupport": "건설비 중앙정부 지원 범위와 비율 (예: 국고보조 50%, 지방비 50% 등 실제 기준)",
      "operatingSupport": "운영비 중앙정부 지원 여부와 범위 (예: 공공의료기관 운영비 보조, 필수의료 지원금 등)",
      "subsidyPrograms": "활용 가능한 정부 보조금/지원사업 목록 (사업명, 지원규모, 신청요건)",
      "localBurden": "중앙정부 지원 제외 후 지자체 실질 부담액 (건설비, 운영비 각각)"
    },
    "selfSustainability": {
      "revenueStrategy": "자체 수익 창출 전략 3가지 이상 (예: 건강검진센터, 장례식장, 주차장, 임대사업 등)",
      "costOptimization": "비용 최적화 방안 (예: 공동구매, 에너지 효율화, 인력 운영 최적화 등)",
      "partnershipModel": "민관협력 모델 (예: BTL, BTO, 위탁운영, 대학병원 연계 등)",
      "managementGoals": "단계별 경영 목표 (1-2년차: 안정화, 3-5년차: 흑자전환, 5년 이후: 자립운영 등)"
    },
    "alternatives": [
      {
        "title": "대안 정책명 1",
        "description": "설명 (2문장)",
        "costComparison": "원안 대비 비용 비교",
        "effectiveness": "효과성 평가 (원안 대비 장단점)"
      },
      {
        "title": "대안 정책명 2",
        "description": "설명",
        "costComparison": "비용 비교",
        "effectiveness": "효과성"
      },
      {
        "title": "대안 정책명 3",
        "description": "설명",
        "costComparison": "비용 비교",
        "effectiveness": "효과성"
      }
    ]
  },
  "locationAnalysis": {
    "recommendedLocations": [
      {
        "rank": 1,
        "name": "추천 시군구명",
        "score": 85,
        "population": 360000,
        "reasoning": "추천 이유 (2-3문장, 인구밀도, 의료 접근성, 교통, 재정 여력 등)",
        "strengths": ["입지 강점1", "입지 강점2"],
        "challenges": ["입지 도전과제1", "입지 도전과제2"],
        "distanceToNearest": "가장 가까운 유사 시설까지 거리/시간",
        "landCostEstimate": "예상 토지 비용 (3.3㎡당)"
      }
    ],
    "selectionCriteria": "입지 선정 기준 설명 (인구밀도, 교통 접근성, 의료 공백 지역, 재정 여력, 부지 확보 용이성 등의 가중치)",
    "accessibilityNote": "교통 접근성 분석 (도로, KTX/철도, 버스 노선 등)",
    "medicalDesertAreas": "해당 지역 내 의료 취약 지역/의료 공백 분석",
    "overallRecommendation": "최종 입지 추천 요약 (1순위 추천지와 그 이유를 2-3문장으로)"
  },
  "pros": ["장점1 (구체적 수치 포함)", "장점2", "장점3"],
  "cons": ["리스크1 (구체적 수치 포함)", "리스크2", "리스크3"],
  "similarCases": "국내외 유사 정책 시행 사례 3개 이상 (지역명, 시행년도, 결과 포함)",
  "recommendation": "종합 평가 (3-4문장). 반드시 현재 ${score.grade}등급(${score.total}점)에서 정책 시행 후 예상 등급/점수 변화를 포함하고, 이 지역 특성에 맞는 맞춤 조언을 제시하세요.",
  "projectedGrade": "예상 등급 (A/B/C/D/F)",
  "timeframe": "효과 발현 기간 (구체적: 단기 1-2년/중기 3-5년/장기 5-10년 등)"
}`;

    // ─── Rate limit check (shared across all Gemini endpoints) ───
    // Instead of immediately falling back, wait up to 10s for the rate limit to clear
    const rateCheck = checkGeminiRateLimit();
    if (!rateCheck.allowed) {
      const waitMs = Math.min(rateCheck.retryAfter * 1000, 10000);
      console.log(`Rate limit - waiting ${waitMs}ms before Gemini call`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    // ─── Call Gemini API (single attempt, no retry) ───
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const geminiBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: '당신은 대한민국 지방재정 정책 분석 전문가이자 공공정책 시뮬레이터입니다. 실제 한국 공공기관 운영 데이터, 건설 비용, 인구통계학적 영향을 기반으로 과학적이고 정량적인 분석을 제공합니다. 요청된 JSON 형식으로만 응답하세요. 숫자 필드(independenceChange, debtChange, score, population)는 반드시 순수 숫자로 출력하세요.' }],
      },
      contents: [{ parts: [{ text: geminiPrompt }] }],
      generationConfig: {
        maxOutputTokens: 12000,
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    markGeminiCall(); // Record call time BEFORE fetch

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiBody,
      });
    } catch (fetchErr) {
      console.error('Gemini fetch error:', fetchErr);
      const fallbackResult = generateLocalSimulation(regionName, regionData, score, enrichedPolicyText, natAvg);
      const fallbackResident = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
      const fallbackPolitical = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
      const fallbackSynthesis = generateLocalSynthesis(regionName, enrichedPolicyText, fallbackResult, fallbackResident, fallbackPolitical);
      return NextResponse.json({
        fiscal: fallbackResult,
        resident: fallbackResident,
        political: fallbackPolitical,
        synthesis: fallbackSynthesis,
        isFallback: true,
      } as MultiPerspectiveResult & { isFallback: boolean });
    }

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error(`Gemini API error ${geminiResponse.status}:`, errText.slice(0, 300));
      if (geminiResponse.status === 429) {
        console.warn('Gemini 429 - falling back to local simulation');
        const fallbackResult = generateLocalSimulation(regionName, regionData, score, enrichedPolicyText, natAvg);
        cache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
        const fallbackResident = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
        const fallbackPolitical = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
        const fallbackSynthesis = generateLocalSynthesis(regionName, enrichedPolicyText, fallbackResult, fallbackResident, fallbackPolitical);
        return NextResponse.json({
          fiscal: fallbackResult,
          resident: fallbackResident,
          political: fallbackPolitical,
          synthesis: fallbackSynthesis,
          isFallback: true,
        } as MultiPerspectiveResult & { isFallback: boolean });
      }
      return NextResponse.json(
        { error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText: string =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      console.error('Gemini returned empty response:', JSON.stringify(geminiData));
      return NextResponse.json(
        { error: 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.' },
        { status: 502 },
      );
    }

    const finishReason = geminiData.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.error('Gemini response truncated (MAX_TOKENS)');
      return NextResponse.json(
        { error: 'AI 응답이 너무 길어 잘렸습니다. 다시 시도해주세요.' },
        { status: 502 },
      );
    }

    // ─── Parse JSON from Gemini response ───
    let analysisResult: Omit<PolicySimulationResult, 'regionData' | 'currentGrade' | 'currentScore'>;
    try {
      const jsonStr = extractJSON(rawText);
      try {
        analysisResult = JSON.parse(jsonStr);
      } catch {
        // Second attempt: more aggressive cleaning
        // Replace unescaped control chars within strings
        const aggressiveCleaned = jsonStr
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\t/g, '\\t')
          .replace(/\n/g, '\\n');
        analysisResult = JSON.parse(aggressiveCleaned);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response. First 800 chars:', rawText.slice(0, 800));
      console.error('Last 200 chars:', rawText.slice(-200));
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { error: 'AI 응답을 파싱하는 데 실패했습니다. 다시 시도해주세요.' },
        { status: 502 },
      );
    }

    // ─── Build fiscal result ───
    const fiscalResult: PolicySimulationResult = {
      ...analysisResult,
      currentGrade: score.grade,
      currentScore: score.total,
      regionData: {
        name: regionName,
        budget: regionData.budget,
        independence: regionData.independence,
        autonomy: regionData.autonomy,
        debt: regionData.debt,
        grade: score.grade,
        score: score.total,
      },
    };

    // ─── Perspective calls (parallel, best-effort) ───
    let residentPerspective: ResidentPerspective;
    let politicalPerspective: PoliticalPerspective;

    const rateCheck2 = checkGeminiRateLimit();
    if (rateCheck2.allowed) {
      markGeminiCall();
      try {
        const [residentRes, politicalRes] = await Promise.all([
          fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `당신은 대한민국 지역 주민 여론 분석 전문가입니다.

[지역] ${regionName} (인구: ${regionData.population.toLocaleString()}명, 재정자립도: ${regionData.independence}%)
[정책] ${trimmedPolicy}

주민 관점에서 이 정책을 분석하세요. 반드시 아래 JSON으로만 응답:
{
  "overallSentiment": "긍정 또는 중립 또는 부정",
  "sentimentScore": 숫자(-100~+100),
  "qualityOfLifeChange": "삶의 질 변화 분석 (2문장)",
  "concerns": ["주민 우려사항1", "우려사항2", "우려사항3"],
  "benefits": ["주민 혜택1", "혜택2", "혜택3"],
  "demographicImpact": "영향받는 인구층 분석 (2문장)",
  "publicOpinionForecast": "여론 변화 예측 (2문장)",
  "communityReaction": "지역사회 반응 예측 (2문장)",
  "vulnerableGroups": "취약계층 영향 (2문장)",
  "dailyLifeImpact": "일상생활 변화 (2문장)"
}` }] }],
              generationConfig: { maxOutputTokens: 3000, responseMimeType: "application/json", temperature: 0 },
            }),
          }),
          fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `당신은 대한민국 지방정치 및 입법과정 전문가입니다.

[지역] ${regionName} (재정자립도: ${regionData.independence}%, 인구: ${regionData.population.toLocaleString()}명)
[정책] ${trimmedPolicy}

정치적 관점에서 이 정책의 실현가능성을 분석하세요. 반드시 아래 JSON으로만 응답:
{
  "feasibility": "높음 또는 보통 또는 낮음",
  "supportingActors": [{"name": "지지세력명", "reason": "지지 이유"}],
  "opposingActors": [{"name": "반대세력명", "reason": "반대 이유"}],
  "legislativeProcess": "입법/조례 절차 설명 (3문장)",
  "riskFactors": ["정치적 리스크1", "리스크2", "리스크3"],
  "politicalTimeline": "정치적 일정 및 타임라인 (2문장)",
  "intergovernmentalIssues": "중앙-지방 관계 이슈 (2문장)",
  "electionImpact": "선거 영향 분석 (2문장)",
  "recommendation": "정치적 추진 전략 권고 (3문장)"
}` }] }],
              generationConfig: { maxOutputTokens: 3000, responseMimeType: "application/json", temperature: 0 },
            }),
          }),
        ]);

        if (residentRes.ok && politicalRes.ok) {
          const [residentData, politicalData] = await Promise.all([residentRes.json(), politicalRes.json()]);
          const residentText = residentData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          const politicalText = politicalData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          try {
            residentPerspective = JSON.parse(extractJSON(residentText));
            politicalPerspective = JSON.parse(extractJSON(politicalText));
          } catch {
            // Parse failed, use fallback
            residentPerspective = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
            politicalPerspective = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
          }
        } else {
          residentPerspective = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
          politicalPerspective = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
        }
      } catch {
        residentPerspective = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
        politicalPerspective = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
      }
    } else {
      // Rate limited - use local fallback
      residentPerspective = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
      politicalPerspective = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
    }

    const synthesis = generateLocalSynthesis(regionName, enrichedPolicyText, fiscalResult, residentPerspective, politicalPerspective);

    const multiResult: MultiPerspectiveResult = {
      fiscal: fiscalResult,
      resident: residentPerspective,
      political: politicalPerspective,
      synthesis,
    };

    // ─── Save to cache ───
    cache.set(cacheKey, { data: fiscalResult, timestamp: Date.now() });

    return NextResponse.json(multiResult);
  } catch (error) {
    console.error('Simulate API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
