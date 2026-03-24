import { SovereignFundSimulator } from '@/components/simulator/SovereignFundSimulator';
import type { Metadata } from 'next';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: '국부펀드 시뮬레이터 | 마을살림/나라살림',
  description: '공공부문 효율화를 통한 국부펀드 운용 및 AI 기본소득 시뮬레이션',
};

export default function SimulatorPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <SovereignFundSimulator />
        </div>
      </main>
    </div>
  );
}
