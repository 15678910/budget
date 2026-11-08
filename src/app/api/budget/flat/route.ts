import { NextRequest, NextResponse } from 'next/server';
import { loadFlatBudget } from '@/lib/data/load-budget';
import type { BudgetRawItem } from '@/types/budget';

// In-memory cache — budget data is static at runtime
const cache = new Map<number, BudgetRawItem[]>();

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, immutable' };

export async function GET(request: NextRequest): Promise<NextResponse> {
  const yearStr = request.nextUrl.searchParams.get('year');
  const year = parseInt(yearStr ?? '', 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
  }

  const cached = cache.get(year);
  if (cached) {
    return NextResponse.json(cached, { headers: CACHE_HEADERS });
  }

  try {
    const data = loadFlatBudget(year) as BudgetRawItem[];
    if (cache.size >= 100) cache.clear();
    cache.set(year, data);
    return NextResponse.json(data, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: `Data not found for year=${year}` }, { status: 404 });
  }
}
