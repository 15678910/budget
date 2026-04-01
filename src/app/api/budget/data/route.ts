import { NextRequest, NextResponse } from 'next/server';
import {
  loadBudgetByDomain,
  loadBudgetByMinistry,
  loadRegionalByMetro,
  loadRegionalByDistrict,
  loadEducationByOffice,
} from '@/lib/data/load-budget';
import type { BudgetTreeNode } from '@/types/budget';

const VALID_VIEWS = ['domain', 'ministry', 'metro', 'district', 'education'] as const;
type BudgetView = typeof VALID_VIEWS[number];

// In-memory cache — budget data is static at runtime
const cache = new Map<string, BudgetTreeNode>();

const loaders: Record<BudgetView, (year: number) => BudgetTreeNode> = {
  domain: loadBudgetByDomain,
  ministry: loadBudgetByMinistry,
  metro: loadRegionalByMetro,
  district: loadRegionalByDistrict,
  education: loadEducationByOffice,
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const view = searchParams.get('view');
  const yearStr = searchParams.get('year');

  if (!view || !VALID_VIEWS.includes(view as BudgetView)) {
    return NextResponse.json(
      { error: 'Invalid view parameter. Must be one of: domain, ministry, metro, district, education' },
      { status: 400 }
    );
  }

  const year = parseInt(yearStr ?? '2026', 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json(
      { error: 'Invalid year parameter' },
      { status: 400 }
    );
  }

  const cacheKey = `${view}:${year}`;
  if (cache.has(cacheKey)) {
    return NextResponse.json(cache.get(cacheKey), {
      headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  }

  try {
    const loader = loaders[view as BudgetView];
    const data = loader(year);
    cache.set(cacheKey, data);

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400, immutable' },
    });
  } catch {
    return NextResponse.json(
      { error: `Data not found for view=${view}, year=${year}` },
      { status: 404 }
    );
  }
}
