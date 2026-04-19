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
      // 방법 2: 레이트 리밋 시 자동 대기 + 재시도 (최대 2회)
      const rate = checkGeminiRateLimit();
      if (!rate.allowed) {
        // 대기 시간이 짧으면 자동 대기
        const waitMs = Math.min(rate.retryAfter * 1000, 5000);
        if (waitMs > 0) {
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }

      // 재시도 루프 (최대 2회: 초기 시도 + 429 시 1회 재시도)
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          markGeminiCall();
          const ai = await runAI(apiKey, promiseText, scope, regionName, budget, population);
          if (ai) {
            cache.set(key, { data: ai, ts: Date.now() });
            if (cache.size > 50) cache.clear();
            return NextResponse.json(ai);
          }
          // ai가 null이면 2차 시도 전 3초 대기
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 3000));
          }
        } catch {
          // 네트워크 오류 시 다음 루프로
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 3000));
          }
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

  // Priority 1: 복합 키워드 (가장 구체적) - AI/기술/의료 복합어 먼저 매칭
  if (/ai[\s]*플랫폼|ai[\s]*기본|클로드[\s]*코드|챗gpt|챗봇|생성형[\s]*ai|llm|대규모[\s]*언어/.test(text)) {
    ratio = 0.015;
    years = 3;
    taxRatio = 15;
    category = 'AI·LLM 기술';
  } else if (/공공[\s]*병원|지방[\s]*의료원|공공[\s]*의료|응급[\s]*의료|공공[\s]*보건/.test(text)) {
    ratio = 0.06;
    years = 7;
    taxRatio = 15;
    category = '공공의료';
  } else if (/공공[\s]*은행|지방[\s]*은행|서민[\s]*금융|마을[\s]*은행/.test(text)) {
    ratio = 0.04;
    years = 5;
    taxRatio = 10;
    category = '공공금융';
  } else if (/지역[\s]*화폐|블록체인|디지털[\s]*화폐|cbdc|가상[\s]*화폐/.test(text)) {
    ratio = 0.02;
    years = 3;
    taxRatio = 20;
    category = '지역화폐·블록체인';
  } else if (/기본[\s]*소득|청년[\s]*수당|재난[\s]*지원|현금[\s]*지급/.test(text)) {
    ratio = 0.08;
    years = 4;
    taxRatio = 55;
    category = '기본소득·수당';
  } else if (/공공[\s]*임대|행복[\s]*주택|청년[\s]*주택|신혼[\s]*주택/.test(text)) {
    ratio = 0.09;
    years = 6;
    taxRatio = 15;
    category = '공공주택';
  } else if (/무상[\s]*교육|무상[\s]*급식|무상[\s]*교복|무상[\s]*돌봄/.test(text)) {
    ratio = 0.05;
    years = 4;
    taxRatio = 45;
    category = '무상 공공서비스';
  }
  // Priority 2: 단일 키워드 (기술 > 인프라 > 의료 > 복지 순)
  else if (/인공지능|\bai\b|디지털|스마트시티|빅데이터|자율주행|로봇|데이터|플랫폼|iot|클라우드|메타버스|vr|ar|블록체인|토큰/.test(text)) {
    ratio = 0.02;
    years = 3;
    taxRatio = 20;
    category = 'AI·디지털';
  } else if (/철도|지하철|고속도로|항만|공항|교량|터널|ktx|gtx|광역[\s]*교통/.test(text)) {
    ratio = 0.09;
    years = 7;
    taxRatio = 8;
    category = '대형 인프라';
  } else if (/도로|교통|버스|인프라|상하수도|통신/.test(text)) {
    ratio = 0.07;
    years = 5;
    taxRatio = 10;
    category = '인프라';
  } else if (/병원|의료|보건|진료|응급/.test(text)) {
    ratio = 0.05;
    years = 7;
    taxRatio = 20;
    category = '의료·보건';
  } else if (/주택|아파트|임대|분양|재개발|재건축/.test(text)) {
    ratio = 0.08;
    years = 6;
    taxRatio = 15;
    category = '주택';
  } else if (/환경|탄소|신재생|태양광|풍력|폐기물|하수|친환경|에너지|공원|생태/.test(text)) {
    ratio = 0.05;
    years = 6;
    taxRatio = 35;
    category = '환경·에너지';
  } else if (/교육|학교|장학|급식|보육|유치원|대학|도서관|평생학습/.test(text)) {
    ratio = 0.06;
    years = 5;
    taxRatio = 40;
    category = '교육';
  } else if (/일자리|고용|창업|기업|중소기업|스타트업|산업|경제/.test(text)) {
    ratio = 0.03;
    years = 4;
    taxRatio = 25;
    category = '일자리·산업';
  } else if (/관광|특구|축제|문화|예술|체육|스포츠|박물관|공연/.test(text)) {
    ratio = 0.02;
    years = 3;
    taxRatio = 30;
    category = '문화·관광';
  } else if (/복지|돌봄|요양|노인|장애|아동|수당|저소득|취약계층/.test(text)) {
    ratio = 0.04;
    years = 4;
    taxRatio = 50;
    category = '복지';
  } else if (/무상|지원금|지원/.test(text)) {
    // "무상지원" 등 단독 사용 시 일반 복지로 분류
    ratio = 0.03;
    years = 4;
    taxRatio = 40;
    category = '일반 지원';
  }

  const estimatedCost = Math.max(0.1, Math.round(budget * ratio * 10) / 10);

  // scope별 재정 조달 표현 차별화
  let fundingLabel = '증세';
  let debtLabel = '국채';
  let fundingNote = '';
  if (scope === 'education') {
    fundingLabel = '교부금·전입금 활용';
    debtLabel = '교육채';
    fundingNote = ' (교육감은 증세·국채 발행 권한이 없어 실제로는 기존 예산 재편성 또는 교육채 시설비 충당)';
  } else if (scope === 'district' || scope === 'metro') {
    fundingLabel = '지방세·교부금';
    debtLabel = '지방채';
    fundingNote = ' (지자체는 국세 증세 권한이 없으며, 지방채 발행은 행안부 승인 필요)';
  }

  return {
    estimatedCost,
    years,
    taxRatio,
    rationale: `공약을 '${category}' 분야로 분류하여 해당 범위 예산의 ${(ratio * 100).toFixed(1)}%를 ${years}년에 걸쳐 소요되는 것으로 추정했습니다. ${fundingLabel} 비중 ${taxRatio}%, ${debtLabel} 발행 ${100 - taxRatio}%로 기본 설정되었습니다.${fundingNote}`,
    source: 'local',
  };
}
