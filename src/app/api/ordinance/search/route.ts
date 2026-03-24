import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───
interface OrdinanceItem {
  자치법규일련번호: string;
  자치법규명: string;
  공포일자: string;
  공포번호: string;
  시행일자: string;
  지자체기관명: string;
  제개정구분명: string;
  자치법규분야명: string;
}

interface Ordinance {
  id: string;
  name: string;
  promulgationDate: string;
  effectiveDate: string;
  localGov: string;
  amendmentType: string;
  field: string;
}

// ─── Cache (5 min TTL) ───
interface CacheEntry { data: { ordinances: Ordinance[]; total: number; page: number; size: number }; expiresAt: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

// ─── Route Handler ───
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const size = Math.min(20, Math.max(1, parseInt(searchParams.get('size') ?? '10', 10)));
  const localGov = searchParams.get('localGov') ?? ''; // 지자체 필터 (e.g., "강원특별자치도")

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: '검색어를 2자 이상 입력해주세요.' }, { status: 400 });
  }

  const cacheKey = `${query}|${page}|${size}|${localGov}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data, { headers: { 'X-Cache': 'HIT' } });
  }

  // Build external API URL
  const url = new URL('https://www.law.go.kr/DRF/lawSearch.do');
  url.searchParams.set('OC', 'budgetai'); // service identifier
  url.searchParams.set('target', 'ordin');
  url.searchParams.set('type', 'JSON');
  url.searchParams.set('query', query.trim());
  url.searchParams.set('display', String(size));
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort', 'ddes'); // 최신순
  url.searchParams.set('knd', '조례'); // 조례만

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `법령정보 API 오류 (HTTP ${res.status})` }, { status: 502 });
    }

    const text = await res.text();
    let data: { OrdinSearch?: { totalCnt?: string; page?: string; 자치법규?: OrdinanceItem | OrdinanceItem[] } };

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: '법령정보 API 응답 파싱 실패' }, { status: 502 });
    }

    const total = parseInt(data.OrdinSearch?.totalCnt ?? '0', 10);

    // Handle single result vs array
    let items: OrdinanceItem[] = [];
    const raw = data.OrdinSearch?.['자치법규'];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw) {
      items = [raw];
    }

    // Filter by localGov if specified
    let filtered = items;
    if (localGov) {
      filtered = items.filter(item =>
        item.지자체기관명?.includes(localGov) ||
        localGov.includes(item.지자체기관명?.replace(/\s/g, ''))
      );
    }

    const ordinances: Ordinance[] = filtered.map(item => ({
      id: item.자치법규일련번호 || '',
      name: item.자치법규명 || '',
      promulgationDate: item.공포일자 || '',
      effectiveDate: item.시행일자 || '',
      localGov: item.지자체기관명 || '',
      amendmentType: item.제개정구분명 || '',
      field: item.자치법규분야명 || '',
    }));

    const response = { ordinances, total, page, size };
    if (cache.size > 100) cache.clear();
    cache.set(cacheKey, { data: response, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(response, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `법령정보 API 연결 실패: ${message}` }, { status: 502 });
  }
}
