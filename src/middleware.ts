import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ---------------------------------------------------------------------------
// Middleware
//   1) Maintenance mode — 외부 접근 차단 (사이트 공사중)
//      • MAINTENANCE_MODE === 'true' 일 때 활성화
//      • 사용자만 ?bypass=<MAINTENANCE_BYPASS_KEY> 로 한 번 진입하면
//        쿠키(maintenance_bypass)가 30일 저장되어 계속 정상 사용 가능
//   2) Admin 대시보드 JWT 보호 (기존 로직)
// ---------------------------------------------------------------------------

const BYPASS_COOKIE = 'maintenance_bypass';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0) 정적 자산·점검 페이지 자체는 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/maintenance') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpe?g|webp|gif|ico|css|js|map|woff2?|ttf|otf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 1) Maintenance mode
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  if (maintenanceMode) {
    const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;
    const queryKey = request.nextUrl.searchParams.get('bypass');
    const cookieKey = request.cookies.get(BYPASS_COOKIE)?.value;

    // 1-A) ?bypass=KEY 로 진입 → 쿠키 발급 후 클린 URL 로 리다이렉트
    if (queryKey && bypassKey && queryKey === bypassKey) {
      const url = request.nextUrl.clone();
      url.searchParams.delete('bypass');
      const response = NextResponse.redirect(url);
      response.cookies.set(BYPASS_COOKIE, queryKey, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // 1-B) 쿠키 일치 → 통과
    const allowedByCookie =
      bypassKey && cookieKey && cookieKey === bypassKey;

    if (!allowedByCookie) {
      // 1-C) 차단 → /maintenance 로 rewrite (URL은 유지, 내용만 점검 페이지)
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      url.search = '';
      return NextResponse.rewrite(url, { status: 503 });
    }
  }

  // 2) Admin 대시보드 JWT 보호 (기존 로직 유지)
  if (pathname.startsWith('/admin/dashboard')) {
    const token = request.cookies.get('admin_token')?.value;
    const secret = process.env.ADMIN_JWT_SECRET;

    if (!token || !secret) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
    } catch {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // 정적 자산 path는 위 핸들러에서도 빠르게 통과하지만,
  // matcher 단계에서도 가능한 한 제외하여 실행 오버헤드 최소화.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|otf)).*)',
  ],
};
