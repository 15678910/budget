'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarSection {
  id: string;
  label: string;
}

interface AISidebarProps {
  sections?: SidebarSection[];
}

const AI_PAGES = [
  { href: '/fiscal-doctor', label: 'AI정책진단' },
  { href: '/simulator', label: 'AI기본사회' },
  { href: '/local-simulator', label: '자치구AI' },
  { href: '/industry-sim', label: '산업시뮬' },
  { href: '/fiscal-innovation', label: '재정혁신' },
  { href: '/public-bank', label: '공공은행' },
  { href: '/ai-law', label: 'AI기본법' },
  { href: '/goals', label: '목표추적' },
];

export function AISidebar({ sections }: AISidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-48 shrink-0 border-r border-gray-800 bg-gray-950/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="p-4 space-y-6">
        {/* AI기본사회 Pages */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            AI기본사회
          </h3>
          <ul className="space-y-0.5">
            {AI_PAGES.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-600/20 text-blue-400 font-medium border-l-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Page Sections (if provided) */}
        {sections && sections.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              페이지 내 이동
            </h3>
            <ul className="space-y-0.5">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 rounded-md transition-colors"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
