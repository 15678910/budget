export interface DiagnosisResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  breakdown: {
    independence: number;
    autonomy: number;
    debtRatio: number;
    debtPerCapita: number;
  };
  diagnosis: string;
  regionData: {
    name: string;
    budget: number;
    population: number;
    independence: number;
    autonomy: number;
    debt: number;
  };
  comparisons: {
    nationalAvgIndependence: number;
    nationalAvgAutonomy: number;
    rank: number;
    totalRegions: number;
  };
}

export interface PolicySimResult {
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
  locationAnalysis?: {
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
  isFallback?: boolean;
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
  fiscal: PolicySimResult;
  resident: ResidentPerspective;
  political: PoliticalPerspective;
  synthesis: string;
  isFallback?: boolean;
}
