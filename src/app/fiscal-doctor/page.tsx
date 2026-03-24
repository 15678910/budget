import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FiscalDoctorDashboard } from '@/components/fiscal-doctor/FiscalDoctorDashboard';
import { AISidebar } from '@/components/layout/AISidebar';

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
      <AISidebar sections={PAGE_SECTIONS} />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <Suspense>
          <FiscalDoctorDashboard />
        </Suspense>
      </main>
    </div>
  );
}
