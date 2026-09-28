'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/format';

interface SDGNavItem {
  href: string;
  label: string;
  /** 활성 상태일 때 배경/테두리/텍스트에 쓸 색상 팔레트(테일윈드 색상 이름). */
  color: 'gray' | 'emerald' | 'sky' | 'violet' | 'amber';
  /** '/sdg'는 정확히 일치할 때만 활성, 나머지는 하위 경로도 활성으로 간주. */
  exact?: boolean;
}

const SDG_NAV_ITEMS: SDGNavItem[] = [
  { href: '/sdg', label: '🗺 SDG 지역 상황판', color: 'gray', exact: true },
  { href: '/sdg/vlr', label: '📄 VLR 지역 자기평가 리포트', color: 'emerald' },
  { href: '/sdg/ontology', label: '🔗 데이터 온톨로지 관계도', color: 'sky' },
  { href: '/sdg/interlinkage', label: '🧩 연계성 분석(시너지·상충)', color: 'violet' },
  { href: '/sdg/effectiveness', label: '📊 실효성 분석(예산-성과)', color: 'amber' },
];

// 색상별 클래스를 정적 문자열로 매핑(테일윈드가 동적 클래스명을 감지하지 못하므로 필수).
const ACTIVE_CLASS: Record<SDGNavItem['color'], string> = {
  gray: 'border-gray-400 bg-gray-700/60 text-gray-50 ring-1 ring-gray-400/50',
  emerald: 'border-emerald-400 bg-emerald-800/60 text-emerald-50 ring-1 ring-emerald-400/50',
  sky: 'border-sky-400 bg-sky-800/60 text-sky-50 ring-1 ring-sky-400/50',
  violet: 'border-violet-400 bg-violet-800/60 text-violet-50 ring-1 ring-violet-400/50',
  amber: 'border-amber-400 bg-amber-800/60 text-amber-50 ring-1 ring-amber-400/50',
};

const INACTIVE_CLASS: Record<SDGNavItem['color'], string> = {
  gray: 'border-gray-600/60 bg-gray-900/30 text-gray-200 hover:bg-gray-800/40',
  emerald: 'border-emerald-600/60 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/40',
  sky: 'border-sky-700/60 bg-sky-950/30 text-sky-200 hover:bg-sky-900/40',
  violet: 'border-violet-700/60 bg-violet-950/30 text-violet-200 hover:bg-violet-900/40',
  amber: 'border-amber-700/60 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40',
};

/** SDG 5개 페이지(상황판/VLR/온톨로지/연계성/실효성) 공통 상단 메뉴. 현재 페이지가 채워진 상태로 표시된다. */
export function SDGSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="SDG 메뉴" className="mx-auto max-w-6xl px-4 py-2">
      <div className="flex flex-nowrap gap-2 overflow-x-auto whitespace-nowrap sm:flex-wrap sm:whitespace-normal">
        {SDG_NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:ring-blue-400',
                isActive ? ACTIVE_CLASS[item.color] : INACTIVE_CLASS[item.color],
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
