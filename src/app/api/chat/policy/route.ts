import { NextRequest, NextResponse } from 'next/server';
import {
  getMetroFiscalData,
  getAllDistrictFiscalData,
  calculateFiscalHealthScore,
  calculateDistrictHealthScore,
} from '@/lib/data/fiscal-health-data';
import type { MetroFiscalData, DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 503 });
  }

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

    // Build region context if provided
    let regionContext = '';
    if (regionType && regionName) {
      let regionData: MetroFiscalData | DistrictFiscalData | undefined;
      let score: { grade: string; total: number };

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
          regionContext = `\n[현재 분석 대상 지역: ${regionName}]\n인구: ${regionData.population.toLocaleString()}명\n예산: ${regionData.budget.toLocaleString()}억원\n재정자립도: ${regionData.independence}%\n재정자주도: ${regionData.autonomy}%\n지역채무: ${regionData.debt}억원\n건전성 등급: ${score!.grade} (${score!.total}/100)`;
        }
      }
    }

    // Rate limit check - wait if needed
    const rateCheck = checkGeminiRateLimit();
    if (!rateCheck.allowed) {
      const waitMs = Math.min(rateCheck.retryAfter * 1000, 8000);
      await new Promise(resolve => setTimeout(resolve, waitMs));
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
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 4000, temperature: 0.3 },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json({
          answer: '현재 AI 서비스가 바쁩니다. 잠시 후 다시 질문해주세요. (무료 API 할당량 초과)',
        });
      }
      return NextResponse.json({ error: 'AI 응답 오류' }, { status: 502 });
    }

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '답변을 생성하지 못했습니다.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Policy chat error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
