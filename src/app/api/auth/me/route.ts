import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, COOKIE_NAME } from '@/lib/analytics/auth';
import { getUserById } from '@/lib/analytics/db';

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
        ageRange: user.age_range,
        gender: user.gender,
        interest: user.interest,
      },
    });
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ user: null });
  }
}
