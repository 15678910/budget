import { NextRequest, NextResponse } from 'next/server';
import {
  getMetroFiscalData,
  getAllDistrictFiscalData,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
} from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import {
  getAllCategories,
  calculateStandardCost,
  calculateCompoundCost,
  getStandardCostProfile,
  type PolicyCategory,
} from '@/lib/data/standard-costs';

// ─── Cache ───
const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 30 * 60 * 1000; // 30 min (results don't change often)

interface PolicyScore {
  policy: string;
  category: PolicyCategory;
  label: string;
  score: number; // composite score (higher = better)
  initialCost: number;
  annualCost: number;
  independenceChange: number;
  feasibility: string;
  timeframe: string;
  costToGDP: number; // cost as % of budget
  roiEstimate: number; // estimated ROI
}

interface CompoundScore {
  policies: string[];
  categories: PolicyCategory[];
  labels: string[];
  score: number;
  initialCost: number;
  annualCost: number;
  independenceChange: number;
  feasibility: string;
  synergyDiscount: string;
}

export async function POST(request: NextRequest) {
  try {
    const { regionType, regionName } = await request.json() as {
      regionType: 'metro' | 'district';
      regionName: string;
    };

    if (!regionType || !regionName) {
      return NextResponse.json({ error: '지역 정보가 필요합니다.' }, { status: 400 });
    }

    const key = `${regionType}:${regionName}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json(cached.data);
    }

    // Load region data
    let regionData: MetroFiscalData | DistrictFiscalData | undefined;
    let score: { grade: string; total: number };

    if (regionType === 'metro') {
      const metros = getMetroFiscalData();
      regionData = metros.find(m => m.name === regionName);
      if (!regionData) return NextResponse.json({ error: '지역을 찾을 수 없습니다.' }, { status: 404 });
      score = calculateFiscalHealthScore(regionData as MetroFiscalData);
    } else {
      const districts = getAllDistrictFiscalData();
      regionData = districts.find(d => d.name === regionName);
      if (!regionData) return NextResponse.json({ error: '지역을 찾을 수 없습니다.' }, { status: 404 });
      score = calculateDistrictHealthScore(regionData as DistrictFiscalData);
    }

    const rd = { population: regionData.population, budget: regionData.budget, independence: regionData.independence };

    // Score each single policy category
    const categories = getAllCategories().filter(c => c !== 'general');
    const singleScores: PolicyScore[] = categories.map(cat => {
      const est = calculateStandardCost(cat, rd);
      const profile = getStandardCostProfile(cat);
      const costRatio = est.initialCost / regionData!.budget;

      // Composite score: balance cost efficiency, independence impact, and feasibility
      const feasibilityScore = est.feasibility === '상' ? 3 : est.feasibility === '중' ? 2 : 1;
      const indepScore = est.independenceChange > 0 ? 2 : est.independenceChange > -1 ? 1 : 0;
      const costScore = costRatio < 0.02 ? 3 : costRatio < 0.05 ? 2 : costRatio < 0.1 ? 1 : 0;
      const roiEstimate = est.breakEvenYears > 0 ? Math.round((est.annualOperatingCost * 0.3 * 10) / est.initialCost * 100) : 0;

      const compositeScore = Math.round(
        (feasibilityScore * 30 + indepScore * 25 + costScore * 25 + (roiEstimate > 0 ? 20 : 0))
      );

      return {
        policy: profile.label,
        category: cat,
        label: profile.label,
        score: compositeScore,
        initialCost: est.initialCost,
        annualCost: est.annualOperatingCost,
        independenceChange: est.independenceChange,
        feasibility: est.feasibility,
        timeframe: est.timeframe,
        costToGDP: Number((costRatio * 100).toFixed(1)),
        roiEstimate,
      };
    }).sort((a, b) => b.score - a.score);

    // Find best compound policies (top 3 combinations of 2)
    const compoundScores: CompoundScore[] = [];
    const topCats = singleScores.slice(0, 6).map(s => s.category);

    for (let i = 0; i < topCats.length; i++) {
      for (let j = i + 1; j < topCats.length; j++) {
        const cats = [topCats[i], topCats[j]];
        const est = calculateCompoundCost(cats, rd);
        const costRatio = est.initialCost / regionData.budget;
        const feasibilityScore = est.feasibility === '상' ? 3 : est.feasibility === '중' ? 2 : 1;
        const indepScore = est.independenceChange > 0 ? 2 : est.independenceChange > -1 ? 1 : 0;
        const costScore = costRatio < 0.05 ? 3 : costRatio < 0.1 ? 2 : 1;
        const compositeScore = Math.round(feasibilityScore * 30 + indepScore * 25 + costScore * 25 + 20);

        compoundScores.push({
          policies: cats.map(c => getStandardCostProfile(c).label),
          categories: cats,
          labels: cats.map(c => getStandardCostProfile(c).label),
          score: compositeScore,
          initialCost: est.initialCost,
          annualCost: est.annualOperatingCost,
          independenceChange: est.independenceChange,
          feasibility: est.feasibility,
          synergyDiscount: '15%',
        });
      }
    }
    compoundScores.sort((a, b) => b.score - a.score);

    const result = {
      region: regionName,
      currentGrade: score.grade,
      currentScore: score.total,
      independence: regionData.independence,
      budget: regionData.budget,
      population: regionData.population,
      topSingle: singleScores.slice(0, 5),
      topCompound: compoundScores.slice(0, 3),
      recommendation: `${regionName}(${score.grade}등급)에 가장 적합한 정책은 "${singleScores[0]?.policy}"(점수 ${singleScores[0]?.score}점)입니다. 복합 정책으로는 "${compoundScores[0]?.labels.join(' + ')}"(시너지 할인 15%)이 최적입니다.`,
    };

    cache.set(key, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Optimize error:', error);
    return NextResponse.json({ error: '최적화 오류' }, { status: 500 });
  }
}
