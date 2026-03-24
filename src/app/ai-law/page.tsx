import type { Metadata } from 'next';
import { AILawDashboard } from '@/components/ai-law/AILawDashboard';
import { AISidebar } from '@/components/layout/AISidebar';

export const metadata: Metadata = {
  title: 'AI 기본법 | 마을살림/나라살림',
  description: 'AI 기본법 해설, 지자체 AI 도입 비용 계산기, 해외 벤치마킹',
};

const PAGE_SECTIONS = [
  { id: 'ai-law-title', label: '개요' },
  { id: 'ai-law-tabs', label: '탭 선택' },
  { id: 'ai-law-content', label: '콘텐츠' },
];

export default function AILawPage() {
  return (
    <div className="flex min-h-screen">
      <AISidebar title="AI 기본법" sections={PAGE_SECTIONS} />
      <main className="flex-1 min-w-0">
        <AILawDashboard />
      </main>
    </div>
  );
}
