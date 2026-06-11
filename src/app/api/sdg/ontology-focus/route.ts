import { NextRequest, NextResponse } from 'next/server';
import { buildOntology, validateFocus, ontologyNodeSummary } from '@/lib/sdg/ontology';
import { checkGeminiRateLimit, markGeminiCall } from '@/lib/gemini-rate-limiter';
import { extractJSON, cleanJSON } from '@/lib/simulation/json-parser';

// ─── Cache (query → validated focus ids), 10분 TTL, 100건 제한 ───
interface CacheEntry {
  ids: string[];
  expires: number;
}
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 100;
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): string[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.ids;
}

function cacheSet(key: string, ids: string[]): void {
  if (cache.size > CACHE_MAX) cache.clear();
  cache.set(key, { ids, expires: Date.now() + CACHE_TTL_MS });
}

const GEMINI_TIMEOUT_MS = 12_000;
const RETRY_DELAYS_MS = [5_000, 7_000, 9_000];
const RESPONSE_NOTE = '정의된 관계만 강조';

/** query 키워드를 노드 label/id에 매칭하는 결정론적 fallback (Gemini 불가/빈 결과 시) */
function keywordFallback(query: string): string[] {
  const summary = ontologyNodeSummary();
  const lowered = query.toLowerCase();
  // 공백/구두점 분할 후 2자 이상 토큰만 사용
  const tokens = lowered
    .split(/[\s,./·]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];
  const matched = summary.filter((n) => {
    const label = n.label.toLowerCase();
    return tokens.some((tok) => label.includes(tok) || n.id.toLowerCase().includes(tok));
  });
  return matched.map((n) => n.id);
}

async function callGemini(apiKey: string, query: string): Promise<string[] | null> {
  const summary = ontologyNodeSummary();
  // compact: id|label|type 한 줄씩
  const compact = summary.map((n) => `${n.id}|${n.label}|${n.type}`).join('\n');

  const systemPrompt = `당신은 SDG 데이터 온톨로지 그래프 포커스 도우미입니다.
아래는 그래프 노드 목록입니다(형식: id|label|type). 사용자 질의와 관련된 노드의 id만 골라
JSON {"focusNodeIds": string[]} 으로만 응답하세요.
규칙:
- 반드시 아래 목록에 실재하는 id만 사용하세요. 새 id를 만들지 마세요.
- 관련 없으면 빈 배열을 반환하세요.

노드 목록:
${compact}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const rate = checkGeminiRateLimit();
    if (!rate.allowed) {
      await new Promise((r) => setTimeout(r, rate.retryAfter * 1000));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      markGeminiCall();
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: query }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: 'application/json',
              maxOutputTokens: 1024,
            },
          }),
        },
      );

      if (response.status === 429) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        return null; // 3회 실패 → fallback
      }
      if (!response.ok) return null;

      const data = await response.json();
      const text: string =
        data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) return null;

      const parsed = JSON.parse(extractJSON(cleanJSON(text)));
      const ids = Array.isArray(parsed?.focusNodeIds) ? parsed.focusNodeIds : [];
      return ids.filter((x: unknown): x is string => typeof x === 'string');
    } catch {
      // timeout/parse/network → 다음 시도 또는 fallback
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const query: unknown = body?.query;
    if (typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'query가 필요합니다.' }, { status: 400 });
    }
    const trimmed = query.trim();

    // 캐시 확인
    const cached = cacheGet(trimmed);
    if (cached) {
      return NextResponse.json({ focusNodeIds: cached, note: RESPONSE_NOTE });
    }

    // 온톨로지가 비어있지 않은지 확인(파생 검증)
    const ontology = buildOntology();
    if (ontology.nodes.length === 0) {
      return NextResponse.json({ focusNodeIds: [], note: RESPONSE_NOTE });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let rawIds: string[] | null = null;

    if (apiKey) {
      rawIds = await callGemini(apiKey, trimmed);
    }

    // Gemini 결과를 폐쇄루프 검증(실재 id만)
    let focusNodeIds = rawIds ? validateFocus(rawIds) : [];

    // 빈 결과 → 키워드 fallback (역시 validateFocus로 검증)
    if (focusNodeIds.length === 0) {
      focusNodeIds = validateFocus(keywordFallback(trimmed));
    }

    cacheSet(trimmed, focusNodeIds);
    return NextResponse.json({ focusNodeIds, note: RESPONSE_NOTE });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
