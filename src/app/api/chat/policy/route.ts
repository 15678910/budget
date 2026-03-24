import { NextRequest, NextResponse } from 'next/server';
import {
  getMetroFiscalData,
  getAllDistrictFiscalData,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
  getNationalAverage,
} from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';

// ─── Response Cache (10 min TTL) ─────────────────────────────────────────────
interface CacheEntry { answer: string; timestamp: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return entry.answer;
}

function setCache(key: string, answer: string): void {
  cache.set(key, { answer, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) cache.delete(oldest[i][0]);
  }
}

function simpleCacheKey(question: string, regionName?: string): string {
  return `${regionName || 'none'}:${question.trim().toLowerCase().slice(0, 100)}`;
}

// ─── Local Fallback Knowledge Base ───────────────────────────────────────────
interface FallbackRule {
  keywords: RegExp;
  answer: (regionName: string, regionData?: { independence: number; budget: number; population: number; debt: number; autonomy: number }, grade?: string) => string;
}

const FALLBACK_RULES: FallbackRule[] = [
  {
    keywords: /공공은행|지방은행|마을은행/,
    answer: (r, d, g) => `[규칙 기반 답변]\n\n공공은행 도입 분석 (${r})\n\n공공은행은 지역 금융 자립을 위한 핵심 정책입니다.\n\n장점:\n- 지역 내 자금 순환 촉진 (예금의 70% 이상 지역 대출)\n- 서민·소상공인 금융 접근성 향상\n- 지자체 재정 수익원 확보 가능\n\n단점:\n- 최소 자본금 250억원 필요 (은행법 제8조)\n- 금융위원회 인가 과정 (6-12개월)\n- 초기 5-7년 적자 가능성\n\n${d ? `${r}의 재정자립도 ${d.independence}%${d.independence < 40 ? '로 자립도가 낮아 중앙정부 지원이 필수적입니다' : '로 자체 출자 가능성이 있습니다'}. 현재 등급 ${g || '미평가'}.` : ''}\n\n참고 사례: 독일 슈파카세(지역저축은행), 브라질 파우마스 은행\n\n⚠️ AI 분석이 아닌 규칙 기반 답변입니다. 잠시 후 다시 질문하시면 AI가 더 상세한 분석을 제공합니다.`,
  },
  {
    keywords: /지역화폐|블록체인|디지털화폐|CBDC/,
    answer: (r, d, g) => `[규칙 기반 답변]\n\n지역화폐/블록체인 분석 (${r})\n\n현황:\n- 전국 243개 지자체 중 230개 이상이 지역화폐 운영 중\n- 연간 발행 규모 약 20조원 (2024년 기준)\n\n블록체인 전환 시 장점:\n- 위변조 방지, 투명한 유통 추적\n- 스마트 컨트랙트로 자동 인센티브\n- 타 지역화폐와 호환 가능\n\n비용: 플랫폼 구축 30-50억원, 연간 운영 발행액의 5-8%\n\n${d ? `${r} 예산 ${d.budget.toLocaleString()}억원 규모에서 발행액 ${Math.round(d.budget * 0.03).toLocaleString()}억원(예산의 3%) 수준이 적정합니다.` : ''}\n\n참고: 경기도 지역화폐(연 3조원), 인천e음\n\n⚠️ 규칙 기반 답변입니다.`,
  },
  {
    keywords: /병원|의료|보건|공공의료/,
    answer: (r, d, g) => `[규칙 기반 답변]\n\n공공의료 분석 (${r})\n\n공공병원 현황:\n- 전국 공공병원 비율 약 5.7% (OECD 평균 53%)\n- 지방의료원 34개소 운영 중\n\n신설 시 비용:\n- 200-300병상: 약 500-900억원 (1병상당 1.5억원)\n- 연간 운영비: 건설비의 12-15%\n- 대부분 구조적 적자 (평균 연 100-200억원)\n\n정부 지원: 건설비 50% 국고보조, 운영비 30% 지원 가능\n\n${d ? `${r} 인구 ${d.population.toLocaleString()}명 기준 200-300병상 규모가 적정합니다. 재정자립도 ${d.independence}%${d.independence < 30 ? '로 자체 부담이 큰 편입니다' : '로 부담 가능한 수준입니다'}.` : ''}\n\n⚠️ 규칙 기반 답변입니다.`,
  },
  {
    keywords: /재정자립|자립도|건전성|등급/,
    answer: (r, d, g) => `[규칙 기반 답변]\n\n${r} 재정 건전성 분석\n\n${d ? `현재 상태:\n- 재정자립도: ${d.independence}% (전국평균 대비 ${d.independence < 43 ? '이하' : '이상'})\n- 재정자주도: ${d.autonomy}%\n- 지역채무: ${d.debt.toLocaleString()}억원\n- 예산규모: ${d.budget.toLocaleString()}억원\n- 건전성 등급: ${g || '미평가'}\n\n개선 방안:\n1. 자체세입 확대 (지방세 신세원 발굴)\n2. 세외수입 확대 (공유재산 활용, 사용료 현실화)\n3. 경상경비 절감 (인건비 비중 관리)\n4. 지방채 관리 강화` : `해당 지역의 재정 데이터를 확인할 수 없습니다.`}\n\n⚠️ 규칙 기반 답변입니다.`,
  },
  {
    keywords: /노란봉투|파업|노동|근로/,
    answer: (r, d) => `[규칙 기반 답변]\n\n노란봉투법 (노동조합법 개정안)\n\n핵심 내용:\n- 정식명칭: 노동조합 및 노동관계조정법 일부개정법률안\n- 파업 시 사용자의 손해배상 청구 범위 제한\n- 하청 노동자의 원청 교섭 참여 보장\n\n재정 영향 (${r}):\n- 직접적 지자체 예산 영향은 제한적\n- 간접 영향: 지역 내 노사관계 안정화 → 기업 투자 환경 개선\n- 공공부문 노사관계에 영향 가능\n\n참고: 22대 국회에서 "인공지능" 또는 "노동" 키워드로 법률안 검색 가능\n\n⚠️ 규칙 기반 답변입니다. AI 분석은 잠시 후 다시 시도해주세요.`,
  },
  {
    keywords: /추천|적합|최고|좋은 정책|어떤 정책/,
    answer: (r, d, g) => `[규칙 기반 답변]\n\n${r}에 적합한 정책 추천\n\n${d ? (d.independence < 30
      ? `재정자립도가 ${d.independence}%로 낮은 편이므로:\n1. 지역화폐 활성화 - 소비 역외유출 방지, 초기비용 낮음\n2. 스마트시티/디지털 전환 - 행정 효율화, 비용 절감\n3. 관광 특구 지정 - 세수 증가, 고용 창출\n4. 광역 공동사업 - 인근 지자체와 비용 분담`
      : d.independence < 50
      ? `재정자립도 ${d.independence}%로 보통 수준이므로:\n1. 공공은행 도입 - 지역 금융 자립, 장기 수익\n2. 블록체인 지역화폐 - 기존 화폐 고도화\n3. 공공의료 확충 - 주민 삶의 질, 인구 유출 방지\n4. 교육 인프라 - 인적자본 투자`
      : `재정자립도 ${d.independence}%로 양호하므로:\n1. 대규모 인프라 투자 - 교통, 의료, 문화\n2. 공공은행 + 블록체인 복합 - 금융 혁신\n3. AI/디지털 전환 - 미래 경쟁력\n4. 탄소중립 사업 - ESG 투자`)
      : '지역 데이터를 확인할 수 없습니다. 진단하기를 먼저 실행해주세요.'}\n\n⚠️ 규칙 기반 답변입니다.`,
  },
];

function generateFallbackAnswer(
  question: string,
  regionName: string,
  regionData?: { independence: number; budget: number; population: number; debt: number; autonomy: number },
  grade?: string,
): string | null {
  for (const rule of FALLBACK_RULES) {
    if (rule.keywords.test(question)) {
      return rule.answer(regionName, regionData, grade);
    }
  }
  // Generic fallback
  return `[규칙 기반 답변]\n\n"${question.slice(0, 50)}"에 대한 질문을 받았습니다.\n\n${regionData ? `${regionName}의 현재 재정 상태:\n- 재정자립도: ${regionData.independence}%\n- 예산: ${regionData.budget.toLocaleString()}억원\n- 인구: ${regionData.population.toLocaleString()}명\n- 등급: ${grade || '미평가'}` : ''}\n\n현재 AI 서비스가 일시적으로 사용할 수 없어 상세 분석이 제한됩니다. 잠시 후 다시 질문해주시면 AI가 더 정확한 답변을 제공합니다.\n\n💡 시뮬레이션 입력란에 구체적 정책(예: "공공병원 신설", "지역화폐 30% 확대")을 넣으시면 비용추계 분석도 받을 수 있습니다.\n\n⚠️ 규칙 기반 답변입니다.`;
}

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const { question, regionType, regionName, history } = await request.json() as {
      question: string;
      regionType?: 'metro' | 'district';
      regionName?: string;
      history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    };

    if (!question || question.trim().length < 2) {
      return NextResponse.json({ error: '질문을 입력해주세요.' }, { status: 400 });
    }

    // ─── Load region data ───
    let regionData: (MetroFiscalData | DistrictFiscalData) | undefined;
    let score: { grade: string; total: number } | undefined;
    let regionContext = '';

    if (regionType && regionName) {
      if (regionType === 'metro') {
        const metros = getMetroFiscalData();
        regionData = metros.find(m => m.name === regionName);
        if (regionData) {
          score = calculateFiscalHealthScore(regionData as MetroFiscalData);
          regionContext = `\n[현재 분석 대상 지역: ${regionName}]\n인구: ${regionData.population.toLocaleString()}명\n예산: ${regionData.budget.toLocaleString()}억원\n재정자립도: ${regionData.independence}%\n재정자주도: ${regionData.autonomy}%\n지역채무: ${regionData.debt}억원\n건전성 등급: ${score.grade} (${score.total}/100)`;
        }
      } else {
        const districts = getAllDistrictFiscalData();
        regionData = districts.find(d => d.name === regionName);
        if (regionData) {
          score = calculateDistrictHealthScore(regionData as DistrictFiscalData);
          regionContext = `\n[현재 분석 대상 지역: ${regionName}]\n인구: ${regionData.population.toLocaleString()}명\n예산: ${regionData.budget.toLocaleString()}억원\n재정자립도: ${regionData.independence}%\n재정자주도: ${regionData.autonomy}%\n지역채무: ${regionData.debt}억원\n건전성 등급: ${score.grade} (${score.total}/100)`;
        }
      }
    }

    // ─── Check cache first ───
    const cacheKey = simpleCacheKey(question, regionName);
    const cachedAnswer = getCached(cacheKey);
    if (cachedAnswer) {
      return NextResponse.json({ answer: cachedAnswer, cached: true });
    }

    // ─── If no API key, use fallback ───
    if (!apiKey) {
      const fallback = generateFallbackAnswer(
        question, regionName || '해당 지역',
        regionData ? { independence: regionData.independence, budget: regionData.budget, population: regionData.population, debt: regionData.debt, autonomy: regionData.autonomy } : undefined,
        score?.grade,
      );
      if (fallback) setCache(cacheKey, fallback);
      return NextResponse.json({ answer: fallback, isFallback: true });
    }

    // ─── Rate limit check ───
    const rateCheck = checkGeminiRateLimit();
    if (!rateCheck.allowed) {
      // Try fallback instead of waiting
      const fallback = generateFallbackAnswer(
        question, regionName || '해당 지역',
        regionData ? { independence: regionData.independence, budget: regionData.budget, population: regionData.population, debt: regionData.debt, autonomy: regionData.autonomy } : undefined,
        score?.grade,
      );
      if (fallback) {
        setCache(cacheKey, fallback);
        return NextResponse.json({ answer: fallback, isFallback: true });
      }
    }

    markGeminiCall();

    const systemPrompt = `당신은 대한민국 지방재정 정책 전문 AI 어드바이저입니다.

역할:
- 시민이 이해하기 쉬운 언어로 정책과 법안을 설명합니다
- 지역 재정 데이터를 기반으로 정책의 영향을 분석합니다
- 글로벌 성공 사례를 참고하여 맞춤형 정책을 추천합니다
- 비용추계, 재정 영향, 주민 영향, 정치적 실현가능성을 종합적으로 분석합니다

규칙:
- 한국어로 답변합니다
- 구체적 수치와 근거를 포함합니다
- 출처를 밝힙니다 (법률, 통계, 사례 등)
- 3-5문장으로 핵심을 먼저 요약하고, 상세 내용을 이어서 설명합니다
- 정책 추천 시 해당 지역의 재정 상황(등급, 자립도)을 반드시 고려합니다
${regionContext}`;

    const contents = [
      ...(history || []),
      { role: 'user' as const, parts: [{ text: question.trim() }] },
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 4000, temperature: 0.3 },
        }),
      });
    } catch {
      // Network error → fallback
      const fallback = generateFallbackAnswer(
        question, regionName || '해당 지역',
        regionData ? { independence: regionData.independence, budget: regionData.budget, population: regionData.population, debt: regionData.debt, autonomy: regionData.autonomy } : undefined,
        score?.grade,
      );
      if (fallback) setCache(cacheKey, fallback);
      return NextResponse.json({ answer: fallback || '네트워크 오류가 발생했습니다.', isFallback: true });
    }

    if (!res.ok) {
      if (res.status === 429) {
        // 429 → fallback
        const fallback = generateFallbackAnswer(
          question, regionName || '해당 지역',
          regionData ? { independence: regionData.independence, budget: regionData.budget, population: regionData.population, debt: regionData.debt, autonomy: regionData.autonomy } : undefined,
          score?.grade,
        );
        if (fallback) {
          setCache(cacheKey, fallback);
          return NextResponse.json({ answer: fallback, isFallback: true });
        }
      }
      return NextResponse.json({ error: 'AI 응답 오류' }, { status: 502 });
    }

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '답변을 생성하지 못했습니다.';

    // Cache successful AI response
    setCache(cacheKey, answer);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Policy chat error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
