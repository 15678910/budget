import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FiscalDoctorDashboard } from '@/components/fiscal-doctor/FiscalDoctorDashboard';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI 정책진단 | 마을살림/나라살림',
  description: 'AI가 지역 재정 건강을 진단하고 정책 시뮬레이션을 제공합니다',
};

const AI_MENU = [
  { href: '/fiscal-doctor', label: 'AI정책진단', active: true },
  { href: '/simulator', label: 'AI기본사회' },
  { href: '/local-simulator', label: '자치구AI' },
  { href: '/goals', label: '목표추적' },
  { href: '/industry-sim', label: '산업시뮬' },
  { href: '/fiscal-innovation', label: '재정혁신' },
  { href: '/ai-law', label: 'AI기본법' },
];

const PAGE_SECTIONS = [
  { id: 'diagnosis', label: '재정 진단' },
  { id: 'simulation', label: '정책 시뮬레이션' },
  { id: 'bill-search', label: '국회 법률안 검색' },
  { id: 'ordinance-search', label: '지자체 조례 검색' },
  { id: 'benchmarking', label: '글로벌 벤치마킹' },
  { id: 'ai-advisor', label: '정책 AI 어드바이저' },
  { id: 'fiscal-impact', label: '재정 영향 분석' },
  { id: 'multi-perspective', label: '다관점 분석' },
];

export default function FiscalDoctorPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-gray-800 bg-gray-950/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav className="p-4 space-y-6">
          {/* AI기본사회 Menu */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              AI기본사회
            </h3>
            <ul className="space-y-1">
              {AI_MENU.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                      item.active
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

          {/* Page Sections */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              페이지 내 이동
            </h3>
            <ul className="space-y-1">
              {PAGE_SECTIONS.map((section) => (
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <Suspense>
          <FiscalDoctorDashboard />
        </Suspense>
      </main>
    </div>
  );
}
