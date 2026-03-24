import { LocalFundSimulator } from '@/components/simulator/LocalFundSimulator';
import type { Metadata } from 'next';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: '지역 AI기본사회 시뮬레이터 | 마을살림/나라살림',
  description: '광역시도·시군구별 효율화를 통한 지역 펀드 운용 및 기본소득 시뮬레이션',
};

const PAGE_SECTIONS = [
  { id: 'region-select', label: '지역 선택' },
  { id: 'region-overview', label: '지역 현황' },
  { id: 'params', label: '시뮬레이션 설정' },
  { id: 'catalog', label: 'AI 카탈로그' },
  { id: 'results', label: '효율화 결과' },
  { id: 'projection', label: 'N년 후 결과' },
  { id: 'growth', label: '성장 추이' },
  { id: 'comparison', label: '전국 비교' },
];

export default function LocalSimulatorPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar title="지역 시뮬레이터" sections={PAGE_SECTIONS} />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <LocalFundSimulator />
        </div>
      </main>
    </div>
  );
}
