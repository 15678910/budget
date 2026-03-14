import { NextRequest, NextResponse } from 'next/server';
import { insertPageView } from '@/lib/analytics/db';
import { parseUserAgent } from '@/lib/analytics/ua-parser';

// ---------------------------------------------------------------------------
// In-memory rate limiter: 60 requests / minute / IP
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodic cleanup so the map doesn't grow unboundedly
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

// ---------------------------------------------------------------------------
// String truncation helper
// ---------------------------------------------------------------------------

function truncate(value: string | undefined | null, maxLen: number): string {
  if (!value) return '';
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

// ---------------------------------------------------------------------------
// POST /api/analytics/track
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Extract IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0';

    // Rate-limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      sessionId,
      pagePath,
      referrer,
      screenWidth,
      screenHeight,
      language,
    } = body as {
      sessionId?: string;
      pagePath?: string;
      referrer?: string;
      screenWidth?: number;
      screenHeight?: number;
      language?: string;
    };

    if (!sessionId || !pagePath) {
      return NextResponse.json(
        { error: 'sessionId and pagePath are required' },
        { status: 400 },
      );
    }

    // Geo from Vercel headers
    const country = truncate(request.headers.get('x-vercel-ip-country') ?? '', 2);
    const rawCity = request.headers.get('x-vercel-ip-city') ?? '';
    const city = truncate(decodeURIComponent(rawCity), 200);
    const region = truncate(
      decodeURIComponent(request.headers.get('x-vercel-ip-region') ?? ''),
      200,
    );

    // Parse user-agent
    const ua = request.headers.get('user-agent') ?? '';
    const parsed = parseUserAgent(ua);

    await insertPageView({
      sessionId: truncate(sessionId, 36),
      pagePath: truncate(pagePath, 500),
      referrer: truncate(referrer, 2000),
      userAgent: truncate(ua, 1000),
      ip: truncate(ip, 45),
      country,
      city,
      region,
      deviceType: truncate(parsed.deviceType, 20),
      browser: truncate(parsed.browser, 50),
      os: truncate(parsed.os, 50),
      screenWidth: screenWidth ?? 0,
      screenHeight: screenHeight ?? 0,
      language: truncate(language, 10),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[analytics/track] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
