import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ---------------------------------------------------------------------------
// Middleware: protect /admin/dashboard(.*)
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
};
