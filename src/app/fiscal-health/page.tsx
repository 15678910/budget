import { FiscalHealthDashboard } from '@/components/fiscal/FiscalHealthDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역재정 건전성 | 마을살림/나라살림',
  description: '광역시도·시군구 재정자립도, 재정자주도, 지역채무 현황 대시보드',
};

export default function FiscalHealthPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <FiscalHealthDashboard />
    </div>
  );
}
