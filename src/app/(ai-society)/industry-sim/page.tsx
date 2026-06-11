import { IndustrySimulator } from '@/components/simulator/IndustrySimulator';
import type { Metadata } from 'next';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: '지역 산업 경쟁력 시뮬레이터 | 마을살림/나라살림',
  description: '광역시도별 산업 도입 효과 및 시도 통합 시나리오 시뮬레이션',
};

const PAGE_SECTIONS = [
  { id: 'metro-select', label: '지역 선택' },
  { id: 'current-status', label: '현재 현황' },
  { id: 'industry-select', label: '산업 선택' },
  { id: 'sim-params', label: '시뮬레이션 설정' },
  { id: 'sim-results', label: '시뮬레이션 결과' },
];

export default function IndustrySimPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar title="산업 시뮬레이터" sections={PAGE_SECTIONS} />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <IndustrySimulator />
        </div>
      </main>
    </div>
  );
}
