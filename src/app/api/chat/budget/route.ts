import { NextRequest, NextResponse } from 'next/server';
import { loadFlatBudget, loadMetadata } from '@/lib/data/load-budget';
import type { BudgetRawItem } from '@/types/budget';

// ─── Daily Rate Limiter (prevent exceeding free tier 250 RPD) ───
const DAILY_LIMIT = 230; // Buffer before the 250 hard limit
let dailyCount = 0;
let dailyDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC

function checkAndIncrementLimit(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyDate) {
    dailyDate = today;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_LIMIT) {
    return false; // limit reached
  }
  dailyCount++;
  return true; // ok to proceed
}

// Korean stop words to filter out when extracting keywords
const STOP_WORDS = new Set([
  '은', '는', '이', '가', '의', '를', '을', '에', '에서', '로', '으로',
  '한', '할', '하는', '하고', '하면', '했', '된', '되는', '되어', '합니다',
  '얼마', '예산', '얼마나', '대한', '어떤', '무엇', '어디', '몇',
  '그', '그리고', '또는', '및', '등', '약', '총', '가장', '많은', '적은',
  '있는', '없는', '있나요', '인가요', '인지', '나요', '대해', '알려',
  '관련', '현황', '내역', '규모', '비교', '분석', '설명', '정도',
  '해주세요', '주세요', '알려주세요', '보여주세요',
]);

/**
 * Extract meaningful Korean keywords from a question.
 * Also generates 2-char sub-keywords from compound words (e.g. "초등학교" → "초등", "학교").
 */
function extractKeywords(question: string): string[] {
  const words = question.replace(/[?!.,;:'"()（）【】\[\]{}]/g, '').split(/\s+/);
  const filtered = words.filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  const expanded = new Set<string>();
  for (const word of filtered) {
    expanded.add(word);
    // For compound words (4+ chars), generate 2-char sliding sub-keywords
    // e.g. "초등학교" → "초등", "등학", "학교"
    // e.g. "교육분야" → "교육", "육분", "분야"
    if (word.length >= 4) {
      for (let i = 0; i <= word.length - 2; i++) {
        const sub = word.slice(i, i + 2);
        if (!STOP_WORDS.has(sub)) {
          expanded.add(sub);
        }
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Score a budget item by how many keyword matches it has across its fields.
 * Longer keyword matches score higher.
 */
function scoreBudgetItem(item: BudgetRawItem, keywords: string[]): number {
  const searchFields = [
    item.ministryName,
    item.domainName,
    item.sectorName,
    item.programName,
    item.unitProjectName,
    item.detailProjectName,
  ];

  let score = 0;
  for (const keyword of keywords) {
    for (const field of searchFields) {
      if (field && field.includes(keyword)) {
        // Longer keywords get higher weight (full word match > 2-char sub-keyword)
        score += keyword.length >= 3 ? 3 : 1;
      }
    }
  }
  return score;
}

/**
 * Search flat budget data for items matching the question keywords.
 * Returns top 20 items sorted by relevance score, then by budget amount.
 * Falls back to top items by amount if keyword search finds nothing.
 */
function searchBudgetItems(items: BudgetRawItem[], question: string): BudgetRawItem[] {
  const keywords = extractKeywords(question);
  if (keywords.length === 0) return items.slice().sort((a, b) => b.amount - a.amount).slice(0, 20);

  const scored = items
    .map((item) => ({ item, score: scoreBudgetItem(item, keywords) }))
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.item.amount - a.item.amount;
  });

  // If no results, fallback to top items by budget amount
  if (scored.length === 0) {
    return items.slice().sort((a, b) => b.amount - a.amount).slice(0, 20);
  }

  return scored.slice(0, 20).map((entry) => entry.item);
}

/**
 * Format budget items as a readable context string for the LLM.
 */
function formatBudgetContext(items: BudgetRawItem[]): string {
  return items
    .map((item, i) => {
      const amountBillion = (item.amount / 100).toFixed(1); // 백만원 -> 억원
      return `${i + 1}. [${item.ministryName}] ${item.domainName} > ${item.sectorName} > ${item.programName} > ${item.unitProjectName} > ${item.detailProjectName} | ${amountBillion}억원 (${item.amount.toLocaleString()}백만원)`;
    })
    .join('\n');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API 키가 설정되지 않았습니다. AI 챗봇을 사용하려면 관리자에게 문의하세요.' },
      { status: 503 }
    );
  }

  // Rate limit check
  if (!checkAndIncrementLimit()) {
    return NextResponse.json(
      { error: '오늘의 AI 챗봇 사용량(250건)을 초과했습니다. 내일 다시 이용해주세요.' },
      { status: 429 }
    );
  }

  try {
    const { question, year = 2026 } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: '질문을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Validate year
    const validYears = [2023, 2024, 2025, 2026];
    const selectedYear = validYears.includes(year) ? year : 2026;

    // Load budget data and metadata
    let flatBudget: BudgetRawItem[];
    let metadata;
    try {
      flatBudget = loadFlatBudget(selectedYear);
      metadata = loadMetadata();
    } catch {
      return NextResponse.json(
        { error: '예산 데이터를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // RAG: search for relevant budget items
    const relevantItems = searchBudgetItems(flatBudget, question);
    const budgetContext = formatBudgetContext(relevantItems);

    // Summary stats
    const totalBudget = metadata.totalsByYear[selectedYear] ?? 0;
    const totalBudgetTrillion = (totalBudget / 1000000).toFixed(1);
    const uniqueMinistries = new Set(flatBudget.map((item) => item.ministryName)).size;
    const uniquePrograms = new Set(flatBudget.map((item) => item.programName)).size;

    // Detect if question is about monetary theory / currency revolution topics
    const monetaryKeywords = [
      '화폐', '배당', '달러', 'dividend', '이자 추출', '이자 부과', '화폐 발행', '화폐발행',
      '국채', '시뇨리지', '부분준비금', '중앙은행', '공공은행', '공공신용', '신용조합',
      'g-money', 'gmoney', 'G-Money', '디지털화폐', 'CBDC', '지역화폐',
      '주권부기금', 'SWF', 'sovereign', '노르웨이', '알래스카', 'BND',
      'Richard Duncan', '리처드 던컨', '화폐 혁명', '화폐혁명',
      '배당 환원', '이자 추출', '부채 기반', '자산 담보',
      '인플레이션', '양적완화', '통화정책', '금융시스템',
      '닉슨', '그린백', 'greenback', '링컨', '금본위', '금태환', '브레턴우즈', 'bretton woods',
      '법정화폐', '불환화폐', 'fiat', '연방준비', '연준', 'Fed', 'FRB',
      '미국재무부', '재무부', 'treasury', '통화량', '신용창출', '화폐개혁',
      '공공화폐', '주권화폐', '국가화폐', '화폐주권', '정부화폐',
      '이자부담', '국가부채', '가계부채', '부채', '빚',
      '복리', '기금', '적립', '준비금',
      '발행', '자치구', '지방채', '공공발행', '화폐제도', '금융개혁',
      '은행', '대출', '금리', '이자',
    ];
    const isMonetaryQuestion = monetaryKeywords.some(kw =>
      question.toLowerCase().includes(kw.toLowerCase())
    );

    const monetaryKnowledge = isMonetaryQuestion ? `

[화폐혁명 지식베이스]
아래 내용은 Richard Duncan의 "The Money Revolution"(2022) 및 관련 화폐 이론을 기반으로 합니다.

1. 현행 화폐 시스템의 구조 (이자 추출 시스템):
- 화폐 발행 과정: 정부가 국채를 발행 → 중앙은행(한국은행/미국 Fed)이 국채를 매입하여 화폐 공급
- 이 과정에서 국채 이자가 발생하며, 이자는 궁극적으로 세금으로 충당됨
- 즉, 화폐 = 빚(국채), 빚 = 원금 + 이자 → 화폐가 존재하는 한 이자가 계속 발생
- 한국의 경우 2026년 국채 이자만 연 약 30조원 이상
- 시중은행의 부분준비금 제도: 예금의 일부만 준비금으로 보유, 나머지를 대출 → 신용 창출 과정에서도 이자 발생
- 대출자가 갚아야 할 이자분의 화폐는 원래 존재하지 않으므로, 누군가 다른 곳에서 빚을 져야 충당 가능

2. 배당 달러(Dividend Dollar) - 대안 시스템:
- 현행: 화폐 발행 = 빚(국채) 기반, 이자가 국민에서 금융시스템으로 추출됨
- 대안: 화폐 발행 = 자산 담보 기반, 배당이 시스템에서 국민에게 환원됨
- USDebtClock.org 2030년 시나리오에서 제시된 개념
- 미국 재무부가 직접 발행하는 자산담보형 배당 달러, 연 약 3% 가치 상승 전망
- 화폐 발행 이익(시뇨리지)을 금융기관이 아닌 화폐 보유자에게 직접 배당
- 비교표: 현행(빚 기반, 이자 추출, 인플레이션 하락, 금융기관 수혜) vs 배당 달러(자산 담보, 배당 환원, 연 3% 상승, 국민 수혜)

3. 공공신용조합(Public Credit Union) / 50 State Credit Unions:
- 모델: 미국 노스다코타주 은행(BND, 1919년 설립), 미국 유일의 주립 공공은행
- 100년 이상 운영, 주 정부에 누적 19억 달러 이상 수익 환원
- "50 State Credit Unions"는 BND 모델을 미국 50개 주 전체로 확대하는 제안
- 이자 절감: 시중 가계대출 금리 5% → 공공은행 금리 2%로 전환 시 가구당 연간 수십~수백만원 절감
- 한국 적용: 자치구별 지역공공은행 설립 → 가계부채 이자 부담 절감 + 순수익 지역사회 환원

4. G-Money(Government Money):
- 정부 발행 디지털 화폐, 모든 공공 재정 거래를 블록체인/분산원장으로 기록
- CBDC(중앙은행 디지털화폐)의 지방정부 버전
- 효과: 행정비용 절감(에스토니아 사례: GDP 2% 절감), 재정 누수 방지(2~3%), 세수 증대(1%)
- 시민이 스마트폰으로 세금 사용처를 실시간 확인 가능 → 재정 민주주의 실현

5. 주권부기금(SWF, Sovereign Wealth Fund):
- 정부가 장기적으로 국가/지역의 부를 축적·운용하는 투자 기금
- 주요 사례: 노르웨이 GPFG(1.7조 달러), 싱가포르 GIC/테마섹, UAE 아부다비투자청
- 알래스카 영구기금: 석유 수입 적립, 주민 1인당 연 $1,000~$2,000 배당
- 지방 적용: 자치구 예산의 일정비율 장기 적립 → 복리효과 → 위기 시 완충 + 운용수익 복지 재투입
- 예시: 예산 1조원 자치구, 매년 3% 적립, 연 5% 수익률 → 15년 후 약 647억원 기금(197억원 순수익)

6. Richard Duncan 저자 정보:
- 아시아 18년 이상 활동한 금융 분석가/경제학자, IMF·세계은행 컨설턴트
- 저서: The Dollar Crisis(2003, 2008년 금융위기 5년 전 예측), The Money Revolution(2022)
- 핵심 주장: 미국 SWF 설립, 배당형 화폐, 공공 신용 시스템
- 2025년 트럼프 행정부 SWF 설립 공식화로 그의 15년간 주장이 현실 정책화

7. 그린백(Greenback)과 화폐 주권의 역사:
- 그린백은 1862년 에이브러햄 링컨 대통령이 남북전쟁 비용 조달을 위해 발행한 미국 재무부 직접 발행 화폐
- 핵심: 중앙은행(민간 은행)을 거치지 않고 정부가 직접 화폐를 발행 → 국채 이자 불필요
- 링컨의 그린백 vs 현행 시스템: 그린백은 정부가 직접 발행하므로 이자 부담 제로, 현행은 국채→중앙은행 경로로 이자 발생
- 닉슨과의 관계: 1971년 닉슨 대통령이 금태환(브레턴우즈 체제) 폐지 → 달러가 순수 법정화폐(fiat money)로 전환
- 닉슨 이후 달러는 금 담보 없이 정부 신용만으로 발행되는 불환화폐이나, 여전히 국채→Fed 경로의 이자 추출 구조 유지
- 배당 달러와의 차이:
  · 링컨 그린백: 정부 직접 발행, 이자 없음, 단순 법정화폐 (전시 임시 조치)
  · 닉슨 이후 달러: 금태환 폐지, 불환화폐이나 국채 기반 발행으로 이자 구조 유지
  · 배당 달러: 자산담보형, 이자 없음 + 보유자에게 배당 환원, 디지털 기반 투명성
- 즉, 그린백은 '이자 없는 정부 화폐'의 선구적 시도이고, 배당 달러는 이를 현대적으로 발전시킨 개념

위 지식을 바탕으로 화폐 시스템, 배당 달러, 공공은행, G-Money, SWF 관련 질문에 구체적으로 답변하세요.
예산 데이터와 함께 답변할 경우, 실제 자치구 재정 데이터와 연결지어 설명하세요.` : '';

    const systemPrompt = `당신은 대한민국 정부 예산 전문가이자 재정혁신 분석가입니다. 아래 데이터를 기반으로 질문에 답변하세요.
- 답변은 한국어로, 구체적 수치를 포함하여 3~5문장으로 작성하세요.
- 금액은 억원 또는 조원 단위로만 표시하세요. 같은 금액을 다른 단위로 중복 표기하지 마세요.
- 데이터의 백만원 단위는 참고용이며, 답변에는 억원/조원만 사용하세요. (100백만원 = 1억원, 1,000,000백만원 = 1조원)
- 예산 데이터에 없는 내용이지만 화폐혁명 지식베이스에 있는 질문에는 해당 지식으로 답변하세요.
- 어떤 데이터에도 없는 내용은 "해당 데이터를 찾을 수 없습니다"라고 답하세요.
- 연도: ${selectedYear}년 예산 기준

[요약 통계]
총 예산: ${totalBudgetTrillion}조원
부처 수: ${uniqueMinistries}개
프로그램 수: ${uniquePrograms}개

[관련 예산 데이터]
${budgetContext || '관련 데이터를 찾지 못했습니다.'}${monetaryKnowledge}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: isMonetaryQuestion ? 2500 : 1200 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API error:', response.status, errBody);
      if (response.status === 429) {
        return NextResponse.json(
          { error: '오늘의 AI 챗봇 사용량을 초과했습니다. 내일 다시 이용해주세요.' },
          { status: 429 }
        );
      }
      let detail = '';
      try {
        const errJson = JSON.parse(errBody);
        detail = errJson.error?.message || errBody.slice(0, 200);
      } catch {
        detail = errBody.slice(0, 200);
      }
      return NextResponse.json(
        { error: `AI 답변 생성에 실패했습니다. (${response.status}: ${detail})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '답변을 생성하지 못했습니다.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Budget Chat API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
