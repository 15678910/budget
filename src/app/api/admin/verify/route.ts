import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ---------------------------------------------------------------------------
// GET /api/admin/verify  — Check whether the current session is authenticated
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
