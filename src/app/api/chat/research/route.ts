import { NextRequest, NextResponse } from 'next/server';

// ─── Cache ───
interface CacheEntry { data: unknown; ts: number; }
const cache = new Map<string, CacheEntry>();
const TTL = 10 * 60 * 1000;

async function fetchJSON(url: string): Promise<unknown> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const { query, regionName } = await request.json() as { query: string; regionName?: string };

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
    }

    const key = `${query}|${regionName || ''}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json(cached.data);
    }

    const baseUrl = request.nextUrl.origin;

    // Extract keywords from query (split by spaces, take meaningful words)
    const keywords = query.trim().split(/\s+/).filter(w => w.length >= 2).slice(0, 3);
    const searchTerm = keywords.join(' ');

    // Parallel fetch: bills + ordinances
    const [billsData, ordinanceData] = await Promise.all([
      fetchJSON(`${baseUrl}/api/nabo/bills?search=${encodeURIComponent(searchTerm)}&size=5`),
      fetchJSON(`${baseUrl}/api/ordinance/search?query=${encodeURIComponent(searchTerm)}&size=5`),
    ]);

    const bills = (billsData as { bills?: Array<{ name: string; proposer: string; proposeDate: string }> })?.bills || [];
    const ordinances = (ordinanceData as { ordinances?: Array<{ name: string; localGov: string; promulgationDate: string; amendmentType: string }> })?.ordinances || [];

    const result = {
      query: searchTerm,
      region: regionName || null,
      timestamp: new Date().toISOString(),
      bills: {
        count: bills.length,
        items: bills.map(b => ({
          name: b.name,
          proposer: b.proposer,
          date: b.proposeDate,
        })),
      },
      ordinances: {
        count: ordinances.length,
        items: ordinances.map(o => ({
          name: o.name,
          localGov: o.localGov,
          date: o.promulgationDate,
          type: o.amendmentType,
        })),
      },
      summary: `"${searchTerm}" 관련 조사 결과: 국회 법률안 ${bills.length}건, 지자체 조례 ${ordinances.length}건이 검색되었습니다.${bills.length > 0 ? ` 최근 법률안: "${bills[0].name}" (${bills[0].proposer}, ${bills[0].proposeDate})` : ''}${ordinances.length > 0 ? ` 관련 조례: "${ordinances[0].name}" (${ordinances[0].localGov})` : ''}`,
    };

    if (cache.size > 100) cache.clear();
    cache.set(key, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Research agent error:', error);
    return NextResponse.json({ error: '조사 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
