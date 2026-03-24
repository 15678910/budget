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
  generateLocalSimulation,
  generateLocalResidentPerspective,
  generateLocalPoliticalPerspective,
  generateLocalSynthesis,
  type PolicySimulationResult,
  type ResidentPerspective,
  type PoliticalPerspective,
  type MultiPerspectiveResult,
} from '@/lib/simulation/local-fallback';
import { extractJSON } from '@/lib/simulation/json-parser';

// ─── Daily Rate Limiter (separate counter for simulate) ───
// Gemini free tier: 1,500 RPD total, we reserve 1,000 for simulate
const DAILY_LIMIT = 1000;
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

// ─── In-memory cache (TTL 24h) ───
interface CacheEntry {
  data: MultiPerspectiveResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (same input → same output)


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

    // ─── Call Gemini API (with 429 retry) ───
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

    // Retry helper: attempt up to 3 times with 5s delays on 429
    async function fetchGeminiWithRetry(maxRetries = 3): Promise<Response> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        markGeminiCall();
        try {
          const resp = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: geminiBody,
          });
          if (resp.status === 429 && attempt < maxRetries) {
            const waitSec = 3 + attempt * 2; // 5s, 7s, 9s
            console.warn(`Gemini 429 - retry ${attempt}/${maxRetries}, waiting ${waitSec}s...`);
            await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
            continue;
          }
          return resp;
        } catch (err) {
          if (attempt < maxRetries) {
            console.warn(`Gemini fetch error - retry ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          throw err;
        }
      }
      throw new Error('Gemini max retries exceeded');
    }

    let geminiResponse: Response;
    try {
      geminiResponse = await fetchGeminiWithRetry(3);
    } catch (fetchErr) {
      console.error('Gemini fetch error after retries:', fetchErr);
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
        console.warn('Gemini 429 after all retries - falling back');
        const fallbackResult = generateLocalSimulation(regionName, regionData, score, enrichedPolicyText, natAvg);
        const fallbackResident = generateLocalResidentPerspective(regionName, enrichedPolicyText, regionData);
        const fallbackPolitical = generateLocalPoliticalPerspective(regionName, enrichedPolicyText, regionData);
        const fallbackSynthesis = generateLocalSynthesis(regionName, enrichedPolicyText, fallbackResult, fallbackResident, fallbackPolitical);
        const fallbackMultiResult: MultiPerspectiveResult = {
          fiscal: fallbackResult,
          resident: fallbackResident,
          political: fallbackPolitical,
          synthesis: fallbackSynthesis,
        };
        if (cache.size > 100) cache.clear();
        cache.set(cacheKey, { data: fallbackMultiResult, timestamp: Date.now() });
        return NextResponse.json({
          ...fallbackMultiResult,
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
    if (cache.size > 100) cache.clear();
    cache.set(cacheKey, { data: multiResult, timestamp: Date.now() });

    return NextResponse.json(multiResult);
  } catch (error) {
    console.error('Simulate API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
