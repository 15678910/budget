import type { Metadata } from 'next';
import { AILawDashboard } from '@/components/ai-law/AILawDashboard';

export const metadata: Metadata = {
  title: 'AI 기본법 | 마을살림/나라살림',
  description: 'AI 기본법 해설, 지자체 AI 도입 비용 계산기, 해외 벤치마킹',
};

export default function AILawPage() {
  return <AILawDashboard />;
}
