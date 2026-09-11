'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/format';

interface HubTool {
  href: string;
  label: string;
  /** Optional secondary deep link shown under the parent (e.g. SDG 관계도) */
  sub?: { href: string; label: string };
}

interface HubGroup {
  title: string;
  /** 있으면 그룹 제목이 목록 페이지로 가는 링크가 된다 (예: 예산분쟁 → /disputes) */
  href?: string;
  tools: HubTool[];
}

// Labels mirror the existing header (AI_SUB_TABS) so navigation stays consistent.
const HUB_GROUPS: HubGroup[] = [
  {
    title: '시뮬레이션',
    tools: [
      { href: '/simulator', label: 'AI기본사회' },
      { href: '/local-simulator', label: '자치구AI' },
      { href: '/industry-sim', label: '산업시뮬' },
      { href: '/datacenter', label: '데이터센터' },
    ],
  },
  {
    title: '분석/진단',
    tools: [
      { href: '/fiscal-doctor', label: 'AI정책진단' },
      { href: '/fiscal-innovation', label: '재정혁신' },
      { href: '/ai-efficiency', label: 'AI효율화' },
    ],
  },
  {
    title: '도메인',
    tools: [
      { href: '/public-bank', label: '공공은행' },
      { href: '/ai-law', label: 'AI기본법' },
      { href: '/education-budget', label: '교육청예산' },
      { href: '/goals', label: '목표추적' },
      {
        href: '/sdg',
        label: 'SDG 상황판',
        sub: { href: '/sdg/ontology', label: '관계도' },
      },
    ],
  },
  {
    // 예산분쟁 세 건. 라벨은 src/lib/disputes/*.ts 의 title 을 사이드바 폭에 맞게 줄인 것이다.
    title: '예산분쟁',
    href: '/disputes',
    tools: [
      { href: '/disputes/education-grant', label: '교육교부금 개편' },
      { href: '/disputes/future-fund', label: '미래대응기금' },
      { href: '/disputes/pension', label: '공적연금 적자 보전' },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/sdg' || href === '/disputes') {
    // 목록·부모 항목은 정확히 그 경로일 때만 활성. 하위 경로는 자기 항목이 표시한다.
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function HubLinks() {
  const pathname = usePathname();

  return (
    <nav className="p-3">
      {HUB_GROUPS.map((group) => (
        <div key={group.title} className="mb-4 last:mb-0">
          {group.href ? (
            <Link
              href={group.href}
              className={cn(
                'block text-[11px] font-semibold uppercase tracking-wider px-2 mb-1.5 rounded-md transition-colors',
                isActive(pathname, group.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {group.title} ›
            </Link>
          ) : (
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              {group.title}
            </h3>
          )}
          <ul className="space-y-0.5">
            {group.tools.map((tool) => {
              const active = isActive(pathname, tool.href);
              const subActive = tool.sub ? pathname === tool.sub.href : false;
              return (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className={cn(
                      'block px-2.5 py-1.5 text-sm rounded-md transition-colors',
                      active
                        ? 'text-foreground bg-muted/60 font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {tool.label}
                  </Link>
                  {tool.sub && (
                    <Link
                      href={tool.sub.href}
                      className={cn(
                        'block ml-3 mt-0.5 px-2.5 py-1 text-xs rounded-md transition-colors',
                        subActive
                          ? 'text-foreground bg-muted/50 font-medium'
                          // 투명도를 주면 라이트 테마에서 대비가 3.2까지 떨어져 AA에 미달한다.
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      ▸ {tool.sub.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AISocietySidebar() {
  return (
    <>
      {/* Mobile: collapsible drawer keeps content width */}
      <details className="md:hidden border-b border-border bg-background/60 rounded-lg mb-2">
        <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-foreground flex items-center justify-between">
          <span>🏛 AI기본사회 허브</span>
          <span className="text-muted-foreground text-xs">메뉴 ▾</span>
        </summary>
        <HubLinks />
      </details>

      {/* Desktop: fixed-width sidebar beside content */}
      <aside className="hidden md:block w-[200px] shrink-0 border-r border-border bg-background/40 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="px-3 pt-3">
          <p className="text-xs font-bold text-foreground tracking-tight">🏛 AI기본사회 허브</p>
        </div>
        <HubLinks />
      </aside>
    </>
  );
}
