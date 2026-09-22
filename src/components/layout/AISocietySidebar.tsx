'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/format';
import { SidebarSectionNav } from './SidebarSectionNav';

interface HubSubLink {
  href: string;
  label: string;
}

interface HubTool {
  href: string;
  label: string;
  /** 부모 아래에 표시할 깊은 링크들 (예: SDG 관계도, 재정혁신 탭) */
  subs?: HubSubLink[];
  /** 활성 상태일 때 페이지 절 목록 토글을 보여줄지 여부 (예: 예산분쟁 상세) */
  sections?: boolean;
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
      {
        href: '/fiscal-innovation',
        label: '재정혁신',
        subs: [{ href: '/fiscal-innovation?tab=cases', label: '사례 아카이브' }],
      },
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
        subs: [{ href: '/sdg/ontology', label: '관계도' }],
      },
    ],
  },
  {
    // 예산분쟁 세 건. 라벨은 src/lib/disputes/*.ts 의 title 을 사이드바 폭에 맞게 줄인 것이다.
    title: '예산분쟁',
    href: '/disputes',
    tools: [
      { href: '/disputes/education-grant', label: '교육교부금 개편', sections: true },
      { href: '/disputes/future-fund', label: '미래대응기금', sections: true },
      { href: '/disputes/pension', label: '공적연금 적자 보전', sections: true },
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

/** 하위 링크는 쿼리까지 비교한다 (예: /fiscal-innovation?tab=cases) */
function isSubActive(current: string, href: string): boolean {
  return current.startsWith(href);
}

function HubLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const current = search ? `${pathname}?${search}` : pathname;
  const [sectionsOpen, setSectionsOpen] = useState(true);

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
              const showToggle = tool.sections && active;
              return (
                <li key={tool.href}>
                  <div className="flex items-center">
                    <Link
                      href={tool.href}
                      className={cn(
                        'block flex-1 px-2.5 py-1.5 text-sm rounded-md transition-colors',
                        active
                          ? 'text-foreground bg-muted/60 font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {tool.label}
                    </Link>
                    {showToggle && (
                      <button
                        type="button"
                        aria-expanded={sectionsOpen}
                        aria-label="절 목록 접기/펼치기"
                        onClick={() => setSectionsOpen((v) => !v)}
                        className="shrink-0 px-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {sectionsOpen ? '▾' : '▸'}
                      </button>
                    )}
                  </div>
                  {showToggle && sectionsOpen && (
                    <div className="mt-0.5">
                      <SidebarSectionNav />
                    </div>
                  )}
                  {tool.subs?.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        'block ml-3 mt-0.5 px-2.5 py-1 text-xs rounded-md transition-colors',
                        isSubActive(current, sub.href)
                          ? 'text-foreground bg-muted/50 font-medium'
                          // 투명도를 주면 라이트 테마에서 대비가 3.2까지 떨어져 AA에 미달한다.
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      ▸ {sub.label}
                    </Link>
                  ))}
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
        {/* useSearchParams는 Suspense 경계 안에서만 프리렌더된다 */}
        <Suspense fallback={null}>
          <HubLinks />
        </Suspense>
      </details>

      {/* Desktop: fixed-width sidebar beside content */}
      <aside className="hidden md:block w-[200px] shrink-0 border-r border-border bg-background/40 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="px-3 pt-3">
          <p className="text-xs font-bold text-foreground tracking-tight">🏛 AI기본사회 허브</p>
        </div>
        <Suspense fallback={null}>
          <HubLinks />
        </Suspense>
      </aside>
    </>
  );
}
