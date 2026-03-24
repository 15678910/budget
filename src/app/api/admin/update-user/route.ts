import { NextRequest, NextResponse } from 'next/server';
import { updateUserNickname } from '@/lib/analytics/db';
import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'crypto';

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------
const attempts = new Map<string, { count: number; resetAt: number }>();
function checkAdminRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// Timing-safe password check
function verifyPassword(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

// ---------------------------------------------------------------------------
// POST /api/admin/update-user — 관리자용 사용자 목록 조회
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkAdminRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
    }

    const { password } = (await request.json()) as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || !password || !verifyPassword(password, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sql = neon(process.env.DATABASE_URL!);
    const users = await sql`SELECT id, email, nickname FROM users ORDER BY id`;
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[admin/update-user] GET Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/update-user — 관리자용 사용자 정보 수정
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkAdminRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
    }

    const { password, userId, nickname } = (await request.json()) as {
      password?: string;
      userId?: number;
      nickname?: string;
    };

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || !password || !verifyPassword(password, adminPassword)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId || !nickname?.trim()) {
      return NextResponse.json({ error: 'userId and nickname required' }, { status: 400 });
    }

    await updateUserNickname(userId, nickname.trim());

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/update-user] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
