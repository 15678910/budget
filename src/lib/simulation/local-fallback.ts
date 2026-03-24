import {
  detectMultipleCategories,
  calculateStandardCost,
  calculateCompoundCost,
} from '@/lib/data/standard-costs';

// ─── Types used by the simulation route ───
export interface PolicySimulationResult {
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

export interface ResidentPerspective {
  overallSentiment: '긍정' | '중립' | '부정';
  sentimentScore: number;
  qualityOfLifeChange: string;
  concerns: string[];
  benefits: string[];
  demographicImpact: string;
  publicOpinionForecast: string;
  communityReaction: string;
  vulnerableGroups: string;
  dailyLifeImpact: string;
}

export interface PoliticalPerspective {
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

export interface MultiPerspectiveResult {
  fiscal: PolicySimulationResult;
  resident: ResidentPerspective;
  political: PoliticalPerspective;
  synthesis: string;
  isFallback?: boolean;
}

// ─── Local rule-based fallback when Gemini API is unavailable ───
// Uses NABO/KDI standard unit costs for scientific cost estimation
export function generateLocalSimulation(
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

export function generateLocalResidentPerspective(
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

export function generateLocalPoliticalPerspective(
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

export function generateLocalSynthesis(
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
