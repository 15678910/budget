import { NextRequest, NextResponse } from 'next/server';
import { createUserToken, COOKIE_NAME } from '@/lib/analytics/auth';
import { createOrGetGoogleUser } from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// POST /api/auth/google — Google OAuth 로그인
// ---------------------------------------------------------------------------

interface GoogleTokenPayload {
  sub: string;       // Google user ID
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { credential } = (await request.json()) as { credential?: string };

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential이 필요합니다.' },
        { status: 400 },
      );
    }

    // Verify Google ID token via Google's tokeninfo endpoint
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: '유효하지 않은 Google 인증입니다.' },
        { status: 401 },
      );
    }

    const payload = (await verifyRes.json()) as GoogleTokenPayload;

    // Verify the token has a valid Google user ID
    if (!payload.sub || !payload.email) {
      return NextResponse.json(
        { error: 'Google 인증 정보가 올바르지 않습니다.' },
        { status: 401 },
      );
    }

    // Create or get user in DB
    const user = await createOrGetGoogleUser({
      email: payload.email,
      nickname: payload.name || payload.email.split('@')[0],
      googleId: payload.sub,
    });

    // Issue JWT
    const token = await createUserToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        nickname: user.nickname,
      },
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
    console.error('[auth/google] Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
