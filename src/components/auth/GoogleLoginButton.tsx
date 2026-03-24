'use client';

import { useEffect, useCallback, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/providers/UserProvider';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton() {
  const router = useRouter();
  const { refresh } = useUser();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          await refresh();
          router.push('/');
        }
      } catch {
        // login failed silently
      }
    },
    [refresh, router],
  );

  const initializeGoogle = useCallback(() => {
    if (
      initializedRef.current ||
      !window.google?.accounts?.id ||
      !buttonRef.current
    )
      return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 400,
      text: 'signin_with',
      shape: 'rectangular',
      locale: 'ko',
    });

    initializedRef.current = true;
  }, [handleCredentialResponse]);

  useEffect(() => {
    // Try to initialize if script already loaded
    initializeGoogle();
  }, [initializeGoogle]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}
