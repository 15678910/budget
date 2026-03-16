import { GoalsDashboard } from '@/components/goals/GoalsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지역 목표 추적 | 마을살림/나라살림',
  description: '한국 17개 광역시도 11개 삶의 질 영역 목표 달성 현황 대시보드 (SDG 스타일)',
};

export default function GoalsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <GoalsDashboard />
    </div>
  );
}
