import { NextRequest, NextResponse } from 'next/server';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';

// 10 Agent Personas
const AGENT_PERSONAS = [
  { id: 'resident1', name: '김주민', role: '30대 맞벌이 부부', perspective: '육아·교육 관심, 세금 부담 민감', emoji: '👨‍👩‍👧' },
  { id: 'resident2', name: '이어르신', role: '70대 독거 노인', perspective: '의료·복지 서비스 의존, 변화에 불안', emoji: '👴' },
  { id: 'resident3', name: '박청년', role: '20대 취업준비생', perspective: '일자리·주거 관심, 지역 이탈 고려 중', emoji: '👩‍💻' },
  { id: 'official1', name: '최공무원', role: '지자체 재정담당', perspective: '예산 균형, 상급기관 평가 의식', emoji: '👔' },
  { id: 'official2', name: '정과장', role: '지자체 정책기획', perspective: '성과지표, 주민 만족도, 재선 지원', emoji: '📋' },
  { id: 'business1', name: '강사장', role: '지역 중소기업 대표', perspective: '지역경제 활성화, 고용 확대 기대', emoji: '🏭' },
  { id: 'business2', name: '윤상인', role: '전통시장 상인회장', perspective: '골목상권 보호, 대형 개발 경계', emoji: '🏪' },
  { id: 'politician1', name: '한의원', role: '여당 지역구 의원', perspective: '정책 성과 홍보, 유권자 반응 중시', emoji: '🏛️' },
  { id: 'politician2', name: '송의원', role: '야당 지역구 의원', perspective: '예산 낭비 감시, 대안 제시', emoji: '⚖️' },
  { id: 'expert1', name: '임교수', role: '지방재정 전문가', perspective: '학술적 근거, 장기 재정 건전성', emoji: '🎓' },
];

interface AgentResponse {
  id: string;
  name: string;
  role: string;
  emoji: string;
  stance: 'support' | 'oppose' | 'neutral';
  opinion: string;
  concern: string;
  suggestion: string;
}

interface SimulationResult {
  agents: AgentResponse[];
  consensus: string;
  supportRate: number;
  keyDebatePoints: string[];
  source: 'ai' | 'local';
}

// In-memory cache
const cache = new Map<string, { result: SimulationResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const body = await request.json();
    const { regionName, policyText, regionData } = body as {
      regionName: string;
      policyText: string;
      regionData?: Record<string, unknown>;
    };

    if (!regionName || !policyText) {
      return NextResponse.json({ error: '지역명과 정책을 입력해주세요.' }, { status: 400 });
    }

    const cacheKey = `${regionName}:${policyText.slice(0, 50)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.result);
    }

    // Try AI simulation
    if (apiKey) {
      const rateCheck = checkGeminiRateLimit();
      if (rateCheck.allowed) {
        try {
          markGeminiCall();
          const result = await runAISimulation(apiKey, regionName, policyText, regionData);
          if (result) {
            cache.set(cacheKey, { result, timestamp: Date.now() });
            if (cache.size > 50) cache.clear();
            return NextResponse.json(result);
          }
        } catch {
          // Fall through to local
        }
      }
    }

    // Local fallback
    const result = runLocalSimulation(regionName, policyText);
    cache.set(cacheKey, { result, timestamp: Date.now() });
    return NextResponse.json(result);

  } catch {
    return NextResponse.json({ error: '시뮬레이션 오류' }, { status: 500 });
  }
}

async function runAISimulation(
  apiKey: string,
  regionName: string,
  policyText: string,
  regionData?: Record<string, unknown>,
): Promise<SimulationResult | null> {
  const agentDescriptions = AGENT_PERSONAS.map(a =>
    `- ${a.name}(${a.role}): ${a.perspective}`
  ).join('\n');

  const prompt = `당신은 정책 시뮬레이션 엔진입니다. ${regionName}에서 "${policyText}" 정책이 제안되었을 때, 아래 10명의 에이전트가 각자의 관점에서 어떻게 반응할지 시뮬레이션하세요.
${regionData ? `\n지역 데이터: 예산 ${regionData.budget}억원, 재정자립도 ${regionData.independence}%, 인구 ${regionData.population}명` : ''}

에이전트 목록:
${agentDescriptions}

각 에이전트에 대해 다음을 JSON 배열로 응답하세요:
[
  {
    "id": "에이전트ID",
    "stance": "support 또는 oppose 또는 neutral",
    "opinion": "핵심 의견 (1문장)",
    "concern": "주요 우려사항 (1문장)",
    "suggestion": "제안사항 (1문장)"
  }
]

마지막에 consensus(종합 여론 요약 2문장)와 keyDebatePoints(핵심 쟁점 3개)를 추가하세요.

전체 JSON 형식:
{
  "agents": [...위 배열...],
  "consensus": "종합 여론",
  "keyDebatePoints": ["쟁점1", "쟁점2", "쟁점3"]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.5,
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
    const agents: AgentResponse[] = (parsed.agents || []).map((a: Record<string, string>) => {
      const persona = AGENT_PERSONAS.find(p => p.id === a.id);
      return {
        id: a.id,
        name: persona?.name || a.id,
        role: persona?.role || '',
        emoji: persona?.emoji || '👤',
        stance: a.stance as 'support' | 'oppose' | 'neutral',
        opinion: a.opinion || '',
        concern: a.concern || '',
        suggestion: a.suggestion || '',
      };
    });

    const supportCount = agents.filter(a => a.stance === 'support').length;
    const supportRate = Math.round((supportCount / Math.max(agents.length, 1)) * 100);

    return {
      agents,
      consensus: parsed.consensus || '',
      supportRate,
      keyDebatePoints: parsed.keyDebatePoints || [],
      source: 'ai',
    };
  } catch {
    return null;
  }
}

function runLocalSimulation(regionName: string, policyText: string): SimulationResult {
  // Deterministic local simulation based on policy keywords
  const isExpensive = /병원|은행|철도|인프라/.test(policyText);
  const isWelfare = /복지|돌봄|교육|아동|노인/.test(policyText);
  const isDigital = /AI|디지털|블록체인|스마트|화폐/.test(policyText);
  const isEconomic = /관광|산업|기업|일자리|고용/.test(policyText);

  const agents: AgentResponse[] = AGENT_PERSONAS.map(persona => {
    let stance: 'support' | 'oppose' | 'neutral' = 'neutral';
    let opinion = '';
    let concern = '';
    let suggestion = '';

    switch (persona.id) {
      case 'resident1':
        stance = isWelfare ? 'support' : isExpensive ? 'oppose' : 'neutral';
        opinion = isWelfare ? '육아 지원이 확대되면 좋겠습니다' : '세금 부담이 걱정됩니다';
        concern = '실질적인 혜택이 우리 가정에 돌아올지 의문입니다';
        suggestion = '맞벌이 가정을 위한 구체적 지원 방안을 포함해주세요';
        break;
      case 'resident2':
        stance = isWelfare ? 'support' : 'neutral';
        opinion = isWelfare ? '복지 확대는 환영합니다' : '큰 변화는 불안합니다';
        concern = '기존 복지 서비스가 축소될까 걱정됩니다';
        suggestion = '노인 대상 서비스는 유지해주세요';
        break;
      case 'resident3':
        stance = isDigital || isEconomic ? 'support' : isExpensive ? 'neutral' : 'oppose';
        opinion = isDigital ? '디지털 일자리가 생기길 기대합니다' : '청년 유출을 막을 수 있을지 의문입니다';
        concern = `${regionName}에 남을 이유가 필요합니다`;
        suggestion = '청년 일자리와 주거 지원을 연계해주세요';
        break;
      case 'official1':
        stance = isExpensive ? 'oppose' : 'neutral';
        opinion = isExpensive ? '재정 부담이 상당합니다' : '예산 범위 내에서 검토 가능합니다';
        concern = '재정자립도 하락이 우려됩니다';
        suggestion = '단계적 예산 배정과 중앙정부 보조금 확보가 필요합니다';
        break;
      case 'official2':
        stance = 'support';
        opinion = '주민 만족도 향상에 기여할 정책입니다';
        concern = '성과 측정이 어려울 수 있습니다';
        suggestion = 'KPI를 명확히 설정하고 중간 평가를 실시하세요';
        break;
      case 'business1':
        stance = isEconomic || isDigital ? 'support' : 'neutral';
        opinion = isEconomic ? '지역 경제 활성화에 기여할 것입니다' : '기업 환경 개선도 함께 추진해야 합니다';
        concern = '수혜가 대기업에 집중될 수 있습니다';
        suggestion = '지역 중소기업 참여 기회를 확보해주세요';
        break;
      case 'business2':
        stance = isExpensive ? 'oppose' : isDigital ? 'neutral' : 'support';
        opinion = isExpensive ? '대형 개발보다 골목상권 지원이 우선입니다' : '전통시장도 혜택을 받을 수 있으면 좋겠습니다';
        concern = '대형 시설이 들어오면 소상공인이 피해를 봅니다';
        suggestion = '전통시장 연계 방안을 마련해주세요';
        break;
      case 'politician1':
        stance = 'support';
        opinion = '주민 생활 개선을 위한 좋은 정책입니다';
        concern = '야당의 반대와 예산 심의 과정이 관건입니다';
        suggestion = '초당적 합의를 이끌어내겠습니다';
        break;
      case 'politician2':
        stance = isExpensive ? 'oppose' : 'neutral';
        opinion = isExpensive ? '예산 낭비 우려가 큽니다' : '원칙적으로 검토할 가치가 있습니다';
        concern = '타당성 조사가 부족합니다';
        suggestion = '독립적인 비용편익분석을 먼저 실시하세요';
        break;
      case 'expert1':
        stance = 'neutral';
        opinion = '학술적 근거에 기반한 정책 설계가 필요합니다';
        concern = '장기 재정 건전성에 미치는 영향을 면밀히 분석해야 합니다';
        suggestion = '유사 정책의 국내외 사례를 벤치마킹하세요';
        break;
      default:
        stance = 'neutral';
        opinion = '정책 검토가 필요합니다';
        concern = '구체적인 계획이 필요합니다';
        suggestion = '추가적인 논의를 진행해주세요';
    }

    return {
      id: persona.id,
      name: persona.name,
      role: persona.role,
      emoji: persona.emoji,
      stance,
      opinion,
      concern,
      suggestion,
    };
  });

  const supportCount = agents.filter(a => a.stance === 'support').length;
  const opposeCount = agents.filter(a => a.stance === 'oppose').length;
  const supportRate = Math.round((supportCount / agents.length) * 100);

  return {
    agents,
    consensus: `${regionName}의 "${policyText}" 정책에 대해 ${supportCount}명 찬성, ${opposeCount}명 반대, ${agents.length - supportCount - opposeCount}명 중립으로 나타났습니다. ${supportRate >= 60 ? '전반적으로 긍정적인 여론이 형성되어 있으나' : supportRate >= 40 ? '찬반이 엇갈리고 있으며' : '부정적 여론이 우세하며'} 재정 부담과 실효성에 대한 논의가 필요합니다.`,
    supportRate,
    keyDebatePoints: [
      '재정 부담 vs 장기 투자 가치',
      '기존 서비스 유지 vs 신규 정책 추진',
      '대규모 사업 vs 단계적 시범 운영',
    ],
    source: 'local',
  };
}
