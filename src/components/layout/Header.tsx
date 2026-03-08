"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/format";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          나라살림
        </Link>

        {/* Center: Navigation */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-foreground hover:bg-muted"
            )}
          >
            트리맵
          </Link>
          <Link
            href="/table"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            테이블
          </Link>
          <Link
            href="/compare"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            비교
          </Link>
          <Link
            href="/search"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            검색
          </Link>
          <Link
            href="/regional-compare"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            비교
          </Link>
          <Link
            href="/fiscal-health"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            재정건전성
          </Link>
          <Link
            href="/debt-clock"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            국채시계
          </Link>
          <Link
            href="/simulator"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            AI기본사회
          </Link>
          <Link
            href="/local-simulator"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            자치구AI
          </Link>
        </nav>

        {/* Right: Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="테마 전환"
        >
          {mounted ? (
            theme === "dark" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )
          ) : (
            <div className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>
    </header>
  );
}
