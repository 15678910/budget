import { NextRequest, NextResponse } from 'next/server';
import { updateUserNickname } from '@/lib/analytics/db';
import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// POST /api/admin/update-user — 관리자용 사용자 목록 조회
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { password } = (await request.json()) as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || !password || password !== adminPassword) {
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
    const { password, userId, nickname } = (await request.json()) as {
      password?: string;
      userId?: number;
      nickname?: string;
    };

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || !password || password !== adminPassword) {
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
