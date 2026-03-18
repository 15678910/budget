import { NextRequest, NextResponse } from 'next/server';
import {
  getMetroFiscalData,
  getAllDistrictFiscalData,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
} from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import { findMatchingCities, generatePolicyRecommendations } from '@/lib/data/global-benchmarks';

// In-memory cache (10 min TTL)
const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const regionType = searchParams.get('regionType') as 'metro' | 'district' | null;
  const regionName = searchParams.get('regionName');

  if (!regionType || !regionName) {
    return NextResponse.json({ error: '지역 유형과 지역명이 필요합니다.' }, { status: 400 });
  }

  const cacheKey = `recommend:${regionType}:${regionName}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  // Load region data
  let regionData: MetroFiscalData | DistrictFiscalData | undefined;
  let score: { grade: string; total: number };

  if (regionType === 'metro') {
    const metros = getMetroFiscalData();
    regionData = metros.find(m => m.name === regionName);
    if (!regionData) return NextResponse.json({ error: '해당 지역을 찾을 수 없습니다.' }, { status: 404 });
    score = calculateFiscalHealthScore(regionData as MetroFiscalData);
  } else {
    const districts = getAllDistrictFiscalData();
    regionData = districts.find(d => d.name === regionName);
    if (!regionData) return NextResponse.json({ error: '해당 지역을 찾을 수 없습니다.' }, { status: 404 });
    score = calculateDistrictHealthScore(regionData as DistrictFiscalData);
  }

  // Get matching cities and recommendations
  const matchingCities = findMatchingCities(regionName, regionData, 10);
  const recommendations = generatePolicyRecommendations(
    regionName,
    { ...regionData, debt: regionData.debt },
    score.grade,
  );

  const result = {
    region: {
      name: regionName,
      population: regionData.population,
      independence: regionData.independence,
      grade: score.grade,
      score: score.total,
    },
    matchingCities: matchingCities.map(m => ({
      name: m.city.name,
      country: m.city.country,
      population: m.city.population,
      gdpPerCapita: m.city.gdpPerCapita,
      similarityScore: m.similarityScore,
      matchReasons: m.matchReasons,
      strengths: m.city.strengths,
      fiscalStrategy: m.city.fiscalStrategy,
      fiscalIndependence: m.city.fiscalIndependence,
      qualityOfLifeRank: m.city.qualityOfLifeRank,
      source: m.city.source,
      policies: m.city.successPolicies.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description,
        impact: p.impact,
        applicability: p.applicability,
        koreanContext: p.koreanContext,
      })),
    })),
    recommendations,
  };

  cache.set(cacheKey, { data: result, ts: Date.now() });
  return NextResponse.json(result);
}
