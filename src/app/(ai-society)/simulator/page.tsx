import { SovereignFundSimulator } from '@/components/simulator/SovereignFundSimulator';
import type { Metadata } from 'next';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: '국부펀드 시뮬레이터 | 마을살림/나라살림',
  description: '공공부문 효율화를 통한 국부펀드 운용 및 AI 기본소득 시뮬레이션',
};

const PAGE_SECTIONS = [
  { id: 'overview', label: '공공부문 현황' },
  { id: 'params', label: '시뮬레이션 설정' },
  { id: 'catalog', label: 'AI 카탈로그' },
  { id: 'results', label: '효율화 결과' },
  { id: 'projection', label: 'N년 후 결과' },
  { id: 'sdg', label: 'SDG 영향' },
  { id: 'growth', label: '성장 추이' },
  { id: 'norway', label: '노르웨이 비교' },
];

export default function SimulatorPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar title="국부펀드 시뮬레이터" sections={PAGE_SECTIONS} />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <SovereignFundSimulator />
        </div>
      </main>
    </div>
  );
}
