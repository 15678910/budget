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

    const systemPrompt = `당신은 대한민국 정부 예산 전문가입니다. 아래 예산 데이터를 기반으로 질문에 답변하세요.
- 답변은 한국어로, 구체적 수치를 포함하여 3~5문장으로 작성하세요.
- 금액은 억원 또는 조원 단위로만 표시하세요. 같은 금액을 다른 단위로 중복 표기하지 마세요.
- 데이터의 백만원 단위는 참고용이며, 답변에는 억원/조원만 사용하세요. (100백만원 = 1억원, 1,000,000백만원 = 1조원)
- 데이터에 없는 내용은 "해당 데이터를 찾을 수 없습니다"라고 답하세요.
- 연도: ${selectedYear}년 예산 기준

[요약 통계]
총 예산: ${totalBudgetTrillion}조원
부처 수: ${uniqueMinistries}개
프로그램 수: ${uniquePrograms}개

[관련 예산 데이터]
${budgetContext || '관련 데이터를 찾지 못했습니다.'}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 800 },
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
