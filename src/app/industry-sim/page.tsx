import { IndustrySimulator } from '@/components/simulator/IndustrySimulator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역 산업 경쟁력 시뮬레이터 | 마을살림/나라살림',
  description: '광역시도별 산업 도입 효과 및 시도 통합 시나리오 시뮬레이션',
};

export default function IndustrySimPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <IndustrySimulator />
    </div>
  );
}
