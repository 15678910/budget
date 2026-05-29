import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// POST /api/admin/auth  — Admin login
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { password } = (await request.json()) as { password?: string };

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminPasswordHash) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 503 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 },
      );
    }

    // Create JWT (24 h expiry)
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'JWT secret not configured' },
        { status: 503 },
      );
    }

    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(secret));

    // Set httpOnly cookie
    const response = NextResponse.json({ ok: true });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('[admin/auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
