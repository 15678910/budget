import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, createUserToken, COOKIE_NAME } from '@/lib/analytics/auth';
import { createUser, getUserByEmail } from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, birthdate, address } = body as {
      name?: string;
      email?: string;
      password?: string;
      birthdate?: string;
      address?: string;
    };

    // --- Validation ---
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 주소를 입력해주세요.' },
        { status: 400 },
      );
    }

    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: '이름을 입력해주세요.' },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 },
      );
    }

    // --- Check duplicate email ---
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 },
      );
    }

    // --- Create user ---
    const passwordHash = await hashPassword(password);
    const nickname = name.trim();
    const user = await createUser({
      email,
      passwordHash,
      nickname,
      birthdate: birthdate ?? '',
      address: address ?? '',
      interest: '',
    });

    // --- Issue JWT ---
    const token = await createUserToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, nickname: user.nickname },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[auth/register] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
