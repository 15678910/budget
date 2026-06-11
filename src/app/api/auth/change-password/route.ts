import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, verifyPassword, hashPassword, COOKIE_NAME } from '@/lib/analytics/auth';
import { getUserById, updateUserPassword } from '@/lib/analytics/db';

// ---------------------------------------------------------------------------
// POST /api/auth/change-password — 로그인 사용자 비밀번호 변경
//   보안: user_token 검증 + 현재 비밀번호 확인(세션 탈취 방어) + 새 비번 정책
//        + 사용자별 현재비번 시도 rate-limit(탈취 토큰 무차별 대입 방어)
// ---------------------------------------------------------------------------

// 사용자별 실패 시도 추적 (in-memory, best-effort)
const attempts = new Map<number, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5분

export async function POST(request: NextRequest) {
  try {
    // CSRF 방어: 상태변경 엔드포인트는 동일 출처만 허용 (Origin↔Host 대조)
    const origin = request.headers.get('origin');
    if (origin) {
      const host = request.headers.get('host');
      let originHost: string | null = null;
      try { originHost = new URL(origin).host; } catch { originHost = null; }
      if (!originHost || originHost !== host) {
        return NextResponse.json({ error: '잘못된 요청 출처입니다.' }, { status: 403 });
      }
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    const payload = await verifyUserToken(token);
    if (!payload) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' }, { status: 400 });
    }
    // 새 비밀번호 정책: 8~128자, 영문+숫자 포함
    if (newPassword.length < 8) {
      return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }
    // 길이 상한: bcrypt 72바이트 silent truncation 및 과대입력 DoS 표면 차단
    if (newPassword.length > 128) {
      return NextResponse.json({ error: '새 비밀번호는 128자 이하여야 합니다.' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: '새 비밀번호는 영문과 숫자를 포함해야 합니다.' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: '새 비밀번호가 현재 비밀번호와 동일합니다.' }, { status: 400 });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    // 구글 전용 계정 등 비밀번호 미설정 케이스 방어
    if (!user.password_hash) {
      return NextResponse.json({ error: '비밀번호가 설정되지 않은 계정입니다(소셜 로그인).' }, { status: 400 });
    }

    // rate-limit: 현재비번 무차별 대입 방어
    const now = Date.now();
    const rec = attempts.get(user.id);
    if (rec && rec.resetAt > now && rec.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
      const base = rec && rec.resetAt > now ? rec : { count: 0, resetAt: now + WINDOW_MS };
      attempts.set(user.id, { count: base.count + 1, resetAt: base.resetAt });
      if (attempts.size > 1000) attempts.clear();
      return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    attempts.delete(user.id); // 성공 시 초기화

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(user.id, newHash);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/change-password] Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
