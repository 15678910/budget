import type { Metadata } from 'next';
import { DatacenterDashboard } from '@/components/datacenter/DatacenterDashboard';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: 'AI 데이터센터 경제성 진단 | 마을살림/나라살림',
  description:
    '1GW 데이터센터의 회수기간과 회수율을 따져보는 분석 도구. 발표치와 실측치를 나란히 놓고 가정을 바꿔가며 비교합니다.',
};

const PAGE_SECTIONS = [
  { id: 'scenario', label: '시나리오' },
  { id: 'summary', label: '핵심 지표' },
  { id: 'discrepancy', label: '보고서 검산' },
  { id: 'assumptions', label: '가정 조절' },
  { id: 'employment', label: '고용' },
  { id: 'regional', label: '지역 영향' },
  { id: 'tax', label: '지방세수' },
  { id: 'megaproject', label: '국가 단위 집계' },
  { id: 'sensitivity', label: '민감도와 역산' },
  { id: 'cashflow', label: '연도별 현금흐름' },
  { id: 'caveats', label: '이 도구의 한계' },
];

export default function DatacenterPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar title="데이터센터 경제성" sections={PAGE_SECTIONS} />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <DatacenterDashboard />
        </div>
      </main>
    </div>
  );
}
