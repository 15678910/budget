import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FiscalDoctorDashboard } from '@/components/fiscal-doctor/FiscalDoctorDashboard';

export const metadata: Metadata = {
  title: 'AI 정책진단 | 마을살림/나라살림',
  description: 'AI가 지역 재정 건강을 진단하고 정책 시뮬레이션을 제공합니다',
};

export default function FiscalDoctorPage() {
  return (
    <Suspense>
      <FiscalDoctorDashboard />
    </Suspense>
  );
}
