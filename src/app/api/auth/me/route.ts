import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, COOKIE_NAME } from '@/lib/analytics/auth';
import { getUserById, updateUserNickname } from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyUserToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    // Fetch fresh user data from DB
    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        birthdate: user.birthdate,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ user: null });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/auth/me — 프로필 수정
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = await verifyUserToken(token);
    if (!payload) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { nickname } = body as { nickname?: string };

    if (!nickname || nickname.trim().length < 1) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }

    await updateUserNickname(payload.userId, nickname.trim());

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/me] PATCH Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
