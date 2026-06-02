import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ---------------------------------------------------------------------------
// Middleware
//   1) Maintenance mode — 외부 접근 차단 (사이트 공사중)
//      • MAINTENANCE_MODE === 'true' 일 때 활성화
//      • 관리자만 ?bypass=<MAINTENANCE_BYPASS_KEY> 로 한 번 진입하면
//        쿠키(maintenance_bypass)에 키의 SHA-256 해시가 30일 저장되어 통과
//   2) Admin 대시보드 JWT 보호 (기존 로직)
// ---------------------------------------------------------------------------

const BYPASS_COOKIE = 'maintenance_bypass';
const BYPASS_MAX_AGE = 60 * 60 * 24 * 30; // 30일
const MAINTENANCE_RETRY_AFTER = 60 * 60 * 6; // 크롤러 재방문 권장: 6시간
const MAX_BYPASS_QUERY_LEN = 256; // bypass 쿼리 길이 상한 (DoS 가드)

/**
 * 상수시간 문자열 비교 (Edge 런타임 호환).
 *   - Node `crypto.timingSafeEqual` 은 Edge 미들웨어에서 사용 불가하여 순수 JS로 구현.
 *   - 길이 불일치 시에도 전체 루프를 수행해 타이밍 사이드채널 차단 (CLAUDE.md 규칙).
 */
function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= ca ^ cb;
  }
  return mismatch === 0;
}

/** SHA-256 hex (Edge 런타임 Web Crypto). 쿠키에는 원본 키 대신 이 해시만 저장. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

  // 1) Maintenance mode (대소문자·공백 무관 파싱)
  const maintenanceMode =
    process.env.MAINTENANCE_MODE?.trim().toLowerCase() === 'true';

  if (maintenanceMode) {
    // 환경변수 붙여넣기 시 끝에 섞일 수 있는 공백/줄바꿈 제거 (흔한 오류 방어)
    const bypassKey = process.env.MAINTENANCE_BYPASS_KEY?.trim();
    const rawQueryKey = request.nextUrl.searchParams.get('bypass')?.trim();
    // DoS 가드: 비정상적으로 긴 입력은 비교 전에 폐기
    const queryKey =
      rawQueryKey && rawQueryKey.length <= MAX_BYPASS_QUERY_LEN
        ? rawQueryKey
        : null;
    const cookieHash = request.cookies.get(BYPASS_COOKIE)?.value;

    // 쿠키에 저장할 값 = 키의 SHA-256 해시 (원본 키 미저장 → 유출 표면 축소)
    const expectedHash = bypassKey ? await sha256Hex(bypassKey) : null;

    // 1-A) ?bypass=KEY 로 진입 → 해시 쿠키 발급 후 클린 URL 로 리다이렉트
    if (queryKey && bypassKey && timingSafeEqual(queryKey, bypassKey)) {
      const url = request.nextUrl.clone();
      url.searchParams.delete('bypass');
      const response = NextResponse.redirect(url);
      response.cookies.set(BYPASS_COOKIE, expectedHash!, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: BYPASS_MAX_AGE,
      });
      return response;
    }

    // 1-B) 쿠키 해시 일치 → 통과
    const allowedByCookie = Boolean(
      expectedHash && cookieHash && timingSafeEqual(cookieHash, expectedHash),
    );

    if (!allowedByCookie) {
      // 1-C) 차단 → /maintenance 로 rewrite (URL 유지, 내용만 점검 페이지)
      //      HTTP 503 + Retry-After 로 "일시적 점검"임을 검색엔진에 명시
      //      (영구 색인 제거 방지 — 점검 종료 후 순위 보존)
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      url.search = '';
      const response = NextResponse.rewrite(url, { status: 503 });
      response.headers.set('Retry-After', String(MAINTENANCE_RETRY_AFTER));
      response.headers.set('Cache-Control', 'no-store, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      return response;
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

  // 페이지(HTML) 응답은 캐시 금지 — 점검모드 전환 시 캐시된 옛 화면이
  // 노출되는 문제 방지 (PWA 홈화면 앱 / 브라우저 HTTP 캐시 / bfcache 포함).
  // 정적 자산(JS/CSS/이미지)은 step 0에서 이미 통과하므로 영향 없음.
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  return res;
}

export const config = {
  // 정적 자산 path는 위 핸들러에서도 빠르게 통과하지만,
  // matcher 단계에서도 가능한 한 제외하여 실행 오버헤드 최소화.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-|logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|otf)).*)',
  ],
};
