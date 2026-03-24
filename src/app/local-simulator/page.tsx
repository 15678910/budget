import { LocalFundSimulator } from '@/components/simulator/LocalFundSimulator';
import type { Metadata } from 'next';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: '지역 AI기본사회 시뮬레이터 | 마을살림/나라살림',
  description: '광역시도·시군구별 효율화를 통한 지역 펀드 운용 및 기본소득 시뮬레이션',
};

export default function LocalSimulatorPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <LocalFundSimulator />
        </div>
      </main>
    </div>
  );
}
