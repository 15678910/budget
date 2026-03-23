"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/format";
import { startTour } from "@/components/shared/GuidedTour";
import { useUser } from "@/components/providers/UserProvider";

const MAIN_TABS = [
  { href: "/about", label: "소개" },
  { href: "/", label: "트리맵" },
  { href: "/table", label: "테이블" },
  { href: "/compare", label: "비교" },
  { href: "/regional", label: "지역지도" },
  { href: "/fiscal-health", label: "재정건전성" },
  { href: "/debt-clock", label: "국채시계" },
  { href: "/promise-check", label: "공약검증" },
];

const AI_SUB_TABS = [
  { href: "/simulator", label: "AI기본사회" },
  { href: "/local-simulator", label: "자치구AI" },
  { href: "/goals", label: "목표추적" },
  { href: "/industry-sim", label: "산업시뮬" },
  { href: "/ai-efficiency", label: "AI효율화" },
  { href: "/fiscal-innovation", label: "재정혁신" },
  { href: "/public-bank", label: "공공은행" },
  { href: "/ai-law", label: "AI기본법" },
  { href: "/fiscal-doctor", label: "AI정책진단" },
];

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, loading } = useUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktop = aiMenuRef.current?.contains(target);
      if (!inDesktop) {
        setAiMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setAiMenuOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const isAIActive = AI_SUB_TABS.some((t) => t.href === pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Row 1: Logo + Right icons */}
        <div className="h-12 md:h-14 flex items-center justify-between">
          {/* Left: Logo */}
          <Link
            href="/"
            className="text-base md:text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            마을살림/나라살림
          </Link>

          {/* Desktop nav (hidden on mobile) */}
          <nav data-tour="nav" className="hidden md:flex items-center gap-1">
            {MAIN_TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                  pathname === tab.href
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}

            {/* AI기본사회 Dropdown — desktop hover */}
            <div
              ref={aiMenuRef}
              className="relative"
              onMouseEnter={() => setAiMenuOpen(true)}
              onMouseLeave={() => setAiMenuOpen(false)}
            >
              <Link
                href="/simulator"
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                  isAIActive
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                AI기본사회
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn("transition-transform", aiMenuOpen && "rotate-180")}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Link>
              {aiMenuOpen && (
                <div className="absolute top-full left-0 pt-1 z-50">
                  <div className="w-40 bg-background border border-border rounded-lg shadow-lg p-1.5">
                    {AI_SUB_TABS.map((tab) => (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-md transition-colors",
                          pathname === tab.href
                            ? "text-foreground bg-muted/50 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {tab.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right: User + Help + Theme toggle */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Hamburger menu button - mobile only */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="메뉴"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>

            {/* User auth */}
            {!loading && (
              isLoggedIn && user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1 px-2 md:px-3 py-1.5 text-sm rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="hidden md:inline">{user.nickname}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-36 bg-background border border-border rounded-lg shadow-lg p-1.5 z-50">
                      <button
                        onClick={async () => {
                          await fetch('/api/auth/logout', { method: 'POST' });
                          window.location.href = '/';
                        }}
                        className="block w-full text-left px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1 px-2 md:px-3 py-1.5 text-sm rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="hidden md:inline">로그인</span>
                </Link>
              )
            )}

            <button
              onClick={() => startTour()}
              className="p-1.5 md:p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="가이드 투어"
              title="사이트 안내"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            <button
              data-tour="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 md:p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="테마 전환"
            >
              {mounted ? (
                theme === "dark" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

      </div>
      {mobileMenuOpen && (
        <div className="md:hidden overflow-y-auto bg-background border-t border-border" style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: 'calc(100vh - 49px)', zIndex: 100 }}>
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-3 pb-1">메뉴</p>
            {MAIN_TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2.5 text-sm rounded-lg transition-colors",
                  pathname === tab.href
                    ? "text-foreground bg-muted/50 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            ))}

            <div className="pt-3 pb-1 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground font-medium tracking-wider px-3 pb-2">AI 기본사회</p>
              <div className="pl-3 space-y-0.5">
                {AI_SUB_TABS.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 text-sm rounded-lg transition-colors",
                      pathname === tab.href
                        ? "text-foreground bg-muted/50 font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border mt-3">
              {!loading && (
                isLoggedIn && user ? (
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/';
                    }}
                    className="block w-full text-left px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    로그아웃 ({user.nickname})
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    로그인
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
