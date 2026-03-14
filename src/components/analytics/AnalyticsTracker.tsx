'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

function getOrCreateSessionId(): string {
  const key = '_ns_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;

    try {
      const sessionId = getOrCreateSessionId();
      const payload = {
        sessionId,
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
