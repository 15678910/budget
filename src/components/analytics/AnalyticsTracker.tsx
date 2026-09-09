'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { resolveSessionId } from '@/lib/analytics/session';

// 로컬 개발 서버(.env.local의 실서버 DATABASE_URL 사용)가 실서버 통계를 오염시키지 않도록 차단.
// NODE_ENV는 빌드 시 인라인되므로 클라이언트에서도 안전하게 읽을 수 있다.
const IS_DEV = process.env.NODE_ENV === 'development';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useUser();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (IS_DEV) return;
    if (pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;

    try {
      const sessionId = resolveSessionId(window.localStorage, Date.now(), () => crypto.randomUUID());
      const payload = {
        sessionId,
        userId: user?.id || null,
        pagePath: pathname,
        referrer: document.referrer,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
      };

      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/analytics/track', blob);
    } catch {
      // Silently fail — analytics should never break the app
    }
  }, [pathname]);

  return null;
}
