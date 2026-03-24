import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FiscalDoctorDashboard } from '@/components/fiscal-doctor/FiscalDoctorDashboard';

export const metadata: Metadata = {
  title: 'AI 정책진단 | 마을살림/나라살림',
  description: 'AI가 지역 재정 건강을 진단하고 정책 시뮬레이션을 제공합니다',
};

const PAGE_SECTIONS = [
  { id: 'diagnosis', label: '재정 진단' },
  { id: 'simulation', label: '정책 시뮬레이션' },
  { id: 'bill-search', label: '국회 법률안 검색' },
  { id: 'ordinance-search', label: '지자체 조례 검색' },
  { id: 'benchmarking', label: '글로벌 벤치마킹' },
  { id: 'ai-advisor', label: '정책 AI 어드바이저' },
];

export default function FiscalDoctorPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:block w-48 shrink-0 border-r border-gray-800 bg-gray-950/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <nav className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            AI 정책진단
          </h3>
          <ul className="space-y-0.5">
            {PAGE_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 rounded-md transition-colors scroll-smooth"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
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
