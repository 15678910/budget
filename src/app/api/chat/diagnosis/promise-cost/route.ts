import { NextRequest, NextResponse } from 'next/server';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';

interface PromiseRequest {
  promiseText: string;
  scope: 'national' | 'metro' | 'district' | 'education';
  regionName: string;
  budget: number;     // 조원
  population: number; // 명
}

interface PromiseResult {
  estimatedCost: number;  // 조원
  years: number;
  taxRatio: number;       // %
  rationale: string;
  source: 'ai' | 'local';
}

const cache = new Map<string, { data: PromiseResult; ts: number }>();
const TTL = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PromiseRequest;
    const { promiseText, scope, regionName, budget, population } = body;

    if (!promiseText || promiseText.trim().length < 2) {
      return NextResponse.json({ error: '공약 내용을 입력해주세요.' }, { status: 400 });
    }

    const key = `${scope}:${regionName}:${promiseText.slice(0, 60)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL) {
      return NextResponse.json(hit.data);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const rate = checkGeminiRateLimit();
      if (rate.allowed) {
        try {
          markGeminiCall();
          const ai = await runAI(apiKey, promiseText, scope, regionName, budget, population);
          if (ai) {
            cache.set(key, { data: ai, ts: Date.now() });
            if (cache.size > 50) cache.clear();
            return NextResponse.json(ai);
          }
        } catch {
          // fall through
        }
      }
    }

    const local = runLocal(promiseText, scope, budget);
    cache.set(key, { data: local, ts: Date.now() });
    return NextResponse.json(local);
  } catch {
    return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function runAI(
  apiKey: string,
  promiseText: string,
  scope: string,
  regionName: string,
  budget: number,
  population: number,
): Promise<PromiseResult | null> {
  const scopeLabel = {
    national: '대한민국 국가 단위',
    metro: '광역시도 단위',
    district: '기초자치단체 단위',
    education: '시도 교육청 단위',
  }[scope] || '국가 단위';

  const prompt = `당신은 대한민국 공공정책 비용추계 전문가입니다. 아래 선거 공약의 재정 타당성을 추정하세요.

[공약 정보]
- 공약 내용: "${promiseText}"
- 적용 범위: ${scopeLabel}
- 대상 지역: ${regionName}
- 해당 지역 예산: ${budget.toFixed(1)}조원
- 관할 인구/학생: ${population.toLocaleString()}명

[추정 기준]
- NABO 비용추계 사례집 참고
- 유사 공약 시행 사례의 실제 예산 반영
- 초기비용 + 운영비 합산 (총 이행기간 비용)
- ${scope === 'district' ? '기초단체는 예산 대비 5% 이내가 현실적'
   : scope === 'education' ? '교육청은 예산 대비 10% 이내가 현실적'
   : scope === 'metro' ? '광역은 예산 대비 20% 이내가 현실적'
   : '국가는 예산 대비 10% 이내가 현실적'}

[응답 형식 - JSON만 반환]
{
  "estimatedCost": 숫자 (조원, 전체 이행기간 총액),
  "years": 숫자 (적정 이행기간 1~10년),
  "taxRatio": 숫자 (증세 비중 % 0~100, 복지공약 높게, 투자공약 낮게),
  "rationale": "산출 근거 2-3문장 (비교 사례, 단가 기준, 공약 성격)"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return {
      estimatedCost: Number(parsed.estimatedCost) || 1,
      years: Math.min(10, Math.max(1, Number(parsed.years) || 5)),
      taxRatio: Math.min(100, Math.max(0, Number(parsed.taxRatio) || 30)),
      rationale: String(parsed.rationale || ''),
      source: 'ai',
    };
  } catch {
    return null;
  }
}

function runLocal(promiseText: string, scope: string, budget: number): PromiseResult {
  const text = promiseText.toLowerCase();

  // Keyword-based cost estimation (ratio of budget)
  let ratio = 0.03; // 기본 3%
  let years = 5;
  let taxRatio = 30;
  let category = '일반 정책';

  if (/병원|의료|보건/.test(text)) {
    ratio = 0.05;
    years = 7;
    taxRatio = 20;
    category = '의료·보건';
  } else if (/주택|아파트|임대|재개발/.test(text)) {
    ratio = 0.08;
    years = 6;
    taxRatio = 15;
    category = '주택';
  } else if (/도로|철도|교통|인프라/.test(text)) {
    ratio = 0.07;
    years = 5;
    taxRatio = 10;
    category = '인프라';
  } else if (/복지|돌봄|노인|아동|무상/.test(text)) {
    ratio = 0.04;
    years = 4;
    taxRatio = 50;
    category = '복지';
  } else if (/교육|학교|장학|급식|보육/.test(text)) {
    ratio = 0.06;
    years = 5;
    taxRatio = 40;
    category = '교육';
  } else if (/ai|디지털|스마트|플랫폼/.test(text)) {
    ratio = 0.02;
    years = 3;
    taxRatio = 20;
    category = 'AI·디지털';
  } else if (/일자리|고용|창업|기업/.test(text)) {
    ratio = 0.03;
    years = 4;
    taxRatio = 25;
    category = '일자리';
  } else if (/환경|탄소|에너지|친환경/.test(text)) {
    ratio = 0.05;
    years = 6;
    taxRatio = 35;
    category = '환경';
  } else if (/문화|관광|축제|체육/.test(text)) {
    ratio = 0.02;
    years = 3;
    taxRatio = 30;
    category = '문화·관광';
  }

  const estimatedCost = Math.max(0.1, Math.round(budget * ratio * 10) / 10);

  return {
    estimatedCost,
    years,
    taxRatio,
    rationale: `[규칙 기반] 공약을 '${category}' 분야로 분류하여 해당 범위 예산의 ${(ratio * 100).toFixed(1)}%를 ${years}년에 걸쳐 소요되는 것으로 추정했습니다. 증세 비중은 ${taxRatio}% (국채 ${100 - taxRatio}%)로 기본 설정되었습니다. 정확한 AI 분석은 잠시 후 다시 시도해주세요.`,
    source: 'local',
  };
}
