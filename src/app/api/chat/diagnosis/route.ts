import { NextRequest, NextResponse } from 'next/server';
import {
  getMetroFiscalData,
  getDistrictFiscalData,
  getAllDistrictFiscalData,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
  getNationalAverage,
} from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData, FiscalHealthScore } from '@/lib/data/fiscal-health-data';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';

// ─── Daily Rate Limiter (independent counter for diagnosis) ───
const DAILY_LIMIT = 230;
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

// ─── In-memory cache (TTL 24h) ───
interface CacheEntry {
  data: DiagnosisResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ───
interface Prescription {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  simulatorPath: string;
  simulatorTab?: string;
}

interface DiagnosisResponse {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  breakdown: {
    independence: number;
    autonomy: number;
    debtRatio: number;
    debtPerCapita: number;
  };
  diagnosis: string;
  prescriptions: Prescription[];
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

// ─── Prescription generator ───
function generatePrescriptions(
  data: { independence: number; autonomy: number; debt: number; budget: number; population: number },
  score: FiscalHealthScore,
): Prescription[] {
  const prescriptions: Prescription[] = [];

  if (data.independence < 30) {
    prescriptions.push({
      title: '공공은행 설립으로 자주재원 확보',
      description:
        '재정자립도가 30% 미만으로 외부 의존도가 매우 높습니다. 공공은행을 설립하여 자체 수익을 창출하고 지역 내 자금 순환을 강화할 필요가 있습니다.',
      severity: 'critical',
      simulatorPath: '/public-bank',
      simulatorTab: 'roadmap',
    });
  }

  if ((data.debt / data.budget) * 100 > 25) {
    prescriptions.push({
      title: '채무 구조 개선 필요',
      description:
        '예산 대비 채무비율이 25%를 초과했습니다. 채무 상환 계획 수립과 신규 채무 발행 억제가 필요합니다.',
      severity: 'critical',
      simulatorPath: '/fiscal-health',
    });
  }

  if (data.autonomy < 60) {
    prescriptions.push({
      title: '지역화폐 순환경제 도입',
      description:
        '재정자주도가 60% 미만입니다. 지역화폐를 통해 지역 내 소비를 촉진하고 세수 기반을 확대할 수 있습니다.',
      severity: 'warning',
      simulatorPath: '/public-bank',
      simulatorTab: 'currency',
    });
  }

  if (data.independence < 50) {
    prescriptions.push({
      title: '아파트 건설 세수 확보 검토',
      description:
        '재정자립도 강화를 위해 신규 아파트 건설을 통한 취득세/재산세/지방소득세 확보 방안을 검토하세요.',
      severity: 'warning',
      simulatorPath: '/public-bank',
      simulatorTab: 'apartment-tax',
    });
  }

  const perCapitaDebt = (data.debt * 100000000) / data.population / 10000; // 만원
  if (perCapitaDebt > 200) {
    prescriptions.push({
      title: 'AI 효율화로 재정 절감',
      description: `1인당 채무가 ${Math.round(perCapitaDebt)}만원으로 높습니다. AI 기반 행정 효율화를 통해 불필요한 지출을 절감하세요.`,
      severity: 'warning',
      simulatorPath: '/ai-efficiency',
    });
  }

  if ((data.independence >= 50 && score.grade === 'A') || score.grade === 'B') {
    prescriptions.push({
      title: '주권부기금 설립 검토',
      description:
        '재정 건전성이 양호합니다. 여유 재원을 주권부기금에 적립하여 장기적 자산을 축적하세요.',
      severity: 'info',
      simulatorPath: '/simulator',
    });
  }

  prescriptions.push({
    title: '자본조달 다각화',
    description:
      '민간 투자, 사회적 채권 등 다양한 자본 조달 방식을 검토하여 재정 유연성을 확보하세요.',
    severity: 'info',
    simulatorPath: '/public-bank',
    simulatorTab: 'capital',
  });

  return prescriptions;
}

// ─── Rank calculation ───
function calculateRank(
  regionName: string,
  regionType: 'metro' | 'district',
): { rank: number; totalRegions: number } {
  if (regionType === 'metro') {
    const allMetros = getMetroFiscalData(); // already sorted by independence desc
    const rank = allMetros.findIndex((m) => m.name === regionName) + 1;
    return { rank: rank > 0 ? rank : allMetros.length, totalRegions: allMetros.length };
  } else {
    const allDistricts = getAllDistrictFiscalData(); // already sorted by independence desc
    const rank = allDistricts.findIndex((d) => d.name === regionName) + 1;
    return { rank: rank > 0 ? rank : allDistricts.length, totalRegions: allDistricts.length };
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const { regionType, regionName } = await request.json();

    if (!regionType || !regionName) {
      return NextResponse.json(
        { error: '지역 유형과 지역명을 입력해주세요.' },
        { status: 400 },
      );
    }

    // ─── Check cache ───
    const cacheKey = `${regionType}:${regionName}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // ─── Rate limit check (only when cache miss AND API key exists) ───
    if (apiKey && !checkAndIncrementLimit()) {
      return NextResponse.json(
        { error: '오늘의 AI 진단 사용량을 초과했습니다. 내일 다시 이용해주세요.' },
        { status: 429 },
      );
    }

    // ─── Load region data ───
    let regionData: MetroFiscalData | DistrictFiscalData | undefined;
    let score: FiscalHealthScore;

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

    // ─── Generate prescriptions ───
    const prescriptions = generatePrescriptions(
      {
        independence: regionData.independence,
        autonomy: regionData.autonomy,
        debt: regionData.debt,
        budget: regionData.budget,
        population: regionData.population,
      },
      score,
    );

    // ─── National average & rank ───
    const nationalAvg = getNationalAverage();
    const { rank, totalRegions } = calculateRank(regionName, regionType);

    // ─── Gemini AI diagnosis (optional - falls back to rule-based) ───
    let diagnosis: string;

    if (apiKey) {
      const prescriptionText = prescriptions
        .map((p, i) => `${i + 1}. [${p.severity}] ${p.title}: ${p.description}`)
        .join('\n');

      const geminiPrompt = `당신은 대한민국 지방재정 전문 진단의(財政醫)입니다.
아래 지역의 재정 데이터를 분석하고, 건전성 진단 보고서를 한국어로 작성하세요.

[지역 데이터]
지역명: ${regionName}
재정자립도: ${regionData.independence}% (전국평균: ${nationalAvg.independence}%)
재정자주도: ${regionData.autonomy}% (전국평균: ${nationalAvg.autonomy}%)
지역채무: ${regionData.debt}억원
인구: ${regionData.population}명
예산규모: ${regionData.budget}억원
건전성 등급: ${score.grade} (${score.total}/100)
세부점수: 자립도 ${score.breakdown.independence}/30, 자주도 ${score.breakdown.autonomy}/25, 채무비율 ${score.breakdown.debtRatio}/25, 1인당채무 ${score.breakdown.debtPerCapita}/20

[처방 목록]
${prescriptionText}

위 데이터를 바탕으로:
1. 이 지역의 재정 상태를 3~4문장으로 진단하세요 (강점과 약점 모두 포함)
2. 전국 평균과 비교하여 상대적 위치를 설명하세요
3. 처방 목록의 우선순위를 재조정하고, 지역 특성에 맞는 추가 인사이트를 1~2개 덧붙이세요`;

      const rateCheck = checkGeminiRateLimit();
      // If rate limited, fall through to rule-based fallback instead of failing
      if (!rateCheck.allowed) {
        console.log(`Diagnosis: rate limited, using fallback (retry in ${rateCheck.retryAfter}s)`);
        diagnosis =
          `${regionName}의 재정 건전성 등급은 ${score.grade}(${score.total}/100점)입니다. ` +
          `재정자립도 ${regionData.independence}%(전국평균 ${nationalAvg.independence}%), ` +
          `재정자주도 ${regionData.autonomy}%(전국평균 ${nationalAvg.autonomy}%)로 ` +
          `${regionData.independence >= nationalAvg.independence ? '전국 평균 이상' : '전국 평균 이하'}의 재정 자립 수준을 보이고 있습니다. ` +
          `지역채무는 ${regionData.debt.toLocaleString()}억원이며, 인구 대비 1인당 채무 수준을 고려할 때 ${score.total >= 60 ? '양호한' : '주의가 필요한'} 상태입니다.`;

        return NextResponse.json({
          grade: score.grade,
          score: score.total,
          breakdown: score.breakdown,
          diagnosis,
          prescriptions,
          regionData: {
            name: regionName,
            budget: regionData.budget,
            population: regionData.population,
            independence: regionData.independence,
            autonomy: regionData.autonomy,
            debt: regionData.debt,
          },
          comparisons: {
            nationalAvgIndependence: nationalAvg.independence,
            nationalAvgAutonomy: nationalAvg.autonomy,
            rank,
            totalRegions,
          },
        });
      }

      markGeminiCall();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: '당신은 대한민국 지방재정 전문 진단의(財政醫)입니다. 정확한 데이터 기반으로 명확하고 실용적인 진단을 제공합니다.',
                },
              ],
            },
            contents: [{ parts: [{ text: geminiPrompt }] }],
            generationConfig: { maxOutputTokens: 2000, temperature: 0 },
          }),
        },
      );

      if (!response.ok) {
        console.error('Gemini API error:', response.status, await response.text());
        diagnosis =
          `${regionName}의 재정 건전성 등급은 ${score.grade}(${score.total}/100점)입니다. ` +
          `재정자립도 ${regionData.independence}%(전국평균 ${nationalAvg.independence}%), ` +
          `재정자주도 ${regionData.autonomy}%(전국평균 ${nationalAvg.autonomy}%)로 ` +
          `${regionData.independence >= nationalAvg.independence ? '전국 평균 이상' : '전국 평균 이하'}의 재정 자립 수준을 보이고 있습니다.`;
      } else {
        const data = await response.json();
        diagnosis =
          data.candidates?.[0]?.content?.parts?.[0]?.text ??
          `${regionName}의 재정 건전성 등급은 ${score.grade}(${score.total}/100점)입니다.`;
      }
    } else {
      // Rule-based fallback when no API key
      const indepCompare = regionData.independence >= nationalAvg.independence ? '전국 평균 이상' : '전국 평균 이하';
      const autoCompare = regionData.autonomy >= nationalAvg.autonomy ? '전국 평균 이상' : '전국 평균 이하';
      diagnosis =
        `${regionName}의 재정 건전성 등급은 ${score.grade}(${score.total}/100점)입니다. ` +
        `재정자립도 ${regionData.independence}%(전국평균 ${nationalAvg.independence}%)로 ${indepCompare}, ` +
        `재정자주도 ${regionData.autonomy}%(전국평균 ${nationalAvg.autonomy}%)로 ${autoCompare}의 재정 수준을 보이고 있습니다. ` +
        `지역채무는 ${regionData.debt}억원이며, 1인당 채무는 약 ${Math.round((regionData.debt * 100000000) / regionData.population / 10000)}만원입니다.`;
    }

    // ─── Build response ───
    const result: DiagnosisResponse = {
      grade: score.grade,
      score: score.total,
      breakdown: score.breakdown,
      diagnosis,
      prescriptions,
      regionData: {
        name: regionName,
        budget: regionData.budget,
        population: regionData.population,
        independence: regionData.independence,
        autonomy: regionData.autonomy,
        debt: regionData.debt,
      },
      comparisons: {
        nationalAvgIndependence: nationalAvg.independence,
        nationalAvgAutonomy: nationalAvg.autonomy,
        rank,
        totalRegions,
      },
    };

    // ─── Save to cache ───
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Diagnosis API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
