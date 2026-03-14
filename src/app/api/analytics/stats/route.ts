import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getOverviewStats,
  getDailyTrend,
  getPageStats,
  getDeviceStats,
  getBrowserStats,
  getOSStats,
  getGeoStats,
  getReferrerStats,
  getHourlyHeatmap,
  getSurveyStats,
} from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// JWT verification helper
// ---------------------------------------------------------------------------

async function verifyToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return false;

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Section fetchers
// ---------------------------------------------------------------------------

type SectionKey =
  | 'overview'
  | 'daily'
  | 'pages'
  | 'devices'
  | 'browsers'
  | 'os'
  | 'geo'
  | 'referrers'
  | 'heatmap'
  | 'surveys';

const SECTION_FETCHERS: Record<SectionKey, (days: number) => Promise<unknown>> = {
  overview:  (d) => getOverviewStats(d),
  daily:     (d) => getDailyTrend(d),
  pages:     (d) => getPageStats(d),
  devices:   (d) => getDeviceStats(d),
  browsers:  (d) => getBrowserStats(d),
  os:        (d) => getOSStats(d),
  geo:       (d) => getGeoStats(d),
  referrers: (d) => getReferrerStats(d),
  heatmap:   (d) => getHourlyHeatmap(d),
  surveys:   ()  => getSurveyStats(),
};

// ---------------------------------------------------------------------------
// GET /api/analytics/stats?days=30&section=all
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // JWT auth check
  const authenticated = await verifyToken(request);
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  // Parse days (default 30, max 365)
  let days = parseInt(searchParams.get('days') ?? '30', 10);
  if (isNaN(days) || days < 1) days = 30;
  if (days > 365) days = 365;

  const section = (searchParams.get('section') ?? 'all') as SectionKey | 'all';

  try {
    if (section !== 'all' && section in SECTION_FETCHERS) {
      const data = await SECTION_FETCHERS[section](days);
      return NextResponse.json({ [section]: data });
    }

    // Fetch all sections in parallel
    const [
      overview,
      daily,
      pages,
      devices,
      browsers,
      os,
      geo,
      referrers,
      heatmap,
      surveys,
    ] = await Promise.all([
      getOverviewStats(days),
      getDailyTrend(days),
      getPageStats(days),
      getDeviceStats(days),
      getBrowserStats(days),
      getOSStats(days),
      getGeoStats(days),
      getReferrerStats(days),
      getHourlyHeatmap(days),
      getSurveyStats(),
    ]);

    return NextResponse.json({
      overview,
      daily,
      pages,
      devices,
      browsers,
      os,
      geo,
      referrers,
      heatmap,
      surveys,
    });
  } catch (error) {
    console.error('[analytics/stats] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
