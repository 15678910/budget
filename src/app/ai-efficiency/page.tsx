import { AIEfficiencyDashboard } from '@/components/ai-efficiency/AIEfficiencyDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 효율화 분석 | 나라살림',
  description: '5개 부처별 AI 도입 효과 시뮬레이션 - 국세청, 조달청, 복지부, 건보공단, 국토부',
};

export default function AIEfficiencyPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <AIEfficiencyDashboard />
    </div>
  );
}
