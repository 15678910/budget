import { NextRequest, NextResponse } from 'next/server';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';

interface ReportRequest {
  regionName: string;
  policyText: string;
  simResult: Record<string, unknown>;
}

// In-memory cache
const cache = new Map<string, { report: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const body = (await request.json()) as ReportRequest;
    const { regionName, policyText, simResult } = body;

    if (!regionName || !policyText || !simResult) {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
    }

    // Cache check
    const cacheKey = `${regionName}:${policyText.slice(0, 50)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ report: cached.report, source: 'cache' });
    }

    // Try Gemini AI
    if (apiKey) {
      const rateCheck = checkGeminiRateLimit();
      if (rateCheck.allowed) {
        try {
          markGeminiCall();
          const report = await generateAIReport(apiKey, regionName, policyText, simResult);
          if (report) {
            cache.set(cacheKey, { report, timestamp: Date.now() });
            if (cache.size > 100) cache.clear();
            return NextResponse.json({ report, source: 'ai' });
          }
        } catch {
          // Fall through to local
        }
      }
    }

    // Local fallback
    const report = generateLocalReport(regionName, policyText, simResult);
    return NextResponse.json({ report, source: 'local' });
  } catch {
    return NextResponse.json({ error: '보고서 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function generateAIReport(
  apiKey: string,
  regionName: string,
  policyText: string,
  simResult: Record<string, unknown>,
): Promise<string | null> {
  const prompt = `당신은 대한민국 지방재정 정책 분석 전문가입니다. 아래 시뮬레이션 결과를 바탕으로 정책 분석 보고서를 작성하세요.

지역: ${regionName}
정책: ${policyText}
시뮬레이션 결과 요약:
- 초기 투자: ${simResult.costBreakdown ? (simResult.costBreakdown as Record<string, unknown>).totalInitialCost : 'N/A'}
- 연간 운영비: ${simResult.costBreakdown ? (simResult.costBreakdown as Record<string, unknown>).annualOperatingCost : 'N/A'}
- 실현 가능성: ${simResult.feasibility || 'N/A'}
- 재정자립도 변화: ${simResult.fiscalImpact ? (simResult.fiscalImpact as Record<string, unknown>).independenceChange : 'N/A'}%p
- 효과 발현: ${simResult.timeframe || 'N/A'}

보고서 형식:
1. 정책 개요 (2-3문장)
2. 재정 영향 분석 (비용, 세수 효과, 재정자립도 변화)
3. 사회적 기대효과 (인구, 고용, 삶의 질)
4. 리스크 및 과제
5. 종합 평가 및 권고사항

전문적이고 객관적인 어조로 작성하세요. 500자 내외.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

function generateLocalReport(
  regionName: string,
  policyText: string,
  simResult: Record<string, unknown>,
): string {
  const cost = simResult.costBreakdown as Record<string, unknown> | undefined;
  const fiscal = simResult.fiscalImpact as Record<string, unknown> | undefined;
  const feasibility = String(simResult.feasibility || '중');
  const timeframe = String(simResult.timeframe || '중기');

  return `[정책 분석 보고서] ${regionName} - ${policyText}

1. 정책 개요
${regionName}에서 "${policyText}" 정책의 시행을 검토한 결과, 초기 투자 ${cost?.totalInitialCost || 'N/A'}, 연간 운영비 ${cost?.annualOperatingCost || 'N/A'}가 소요될 것으로 추정됩니다. 실현 가능성은 '${feasibility}'으로 평가되며, 효과 발현까지 ${timeframe}이 소요됩니다.

2. 재정 영향
재정자립도는 ${fiscal?.independenceChange || 0}%p 변화가 예상됩니다. ${Number(fiscal?.independenceChange || 0) < 0 ? '단기적으로 재정 부담이 증가하나, 장기적 세수 증가 효과가 기대됩니다.' : '재정 건전성 개선에 긍정적 효과가 예상됩니다.'}

3. 사회적 기대효과
지역 주민의 삶의 질 향상과 서비스 접근성 개선이 기대되며, 직간접 고용 창출 효과가 예상됩니다.

4. 리스크
초기 투자 부담과 운영 적자 발생 가능성이 주요 리스크입니다. 사전 수요조사와 단계적 추진이 필요합니다.

5. 종합 평가
${feasibility === '상' ? '적극 추진을 권고합니다.' : feasibility === '중' ? '조건부 추진을 권고하며, 시범사업 후 확대를 검토하십시오.' : '신중한 검토가 필요합니다. 대안 정책을 우선 고려하십시오.'}

(규칙 기반 분석 보고서)`;
}
