import { EducationBudgetDashboard } from '@/components/education/EducationBudgetDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전국 교육청 예산 정합성 분석 | 마을살림/나라살림',
  description:
    '전국 17개 시도교육청의 2026 예산을 학생 1인당 예산 기준으로 비교하고, 지역 간 격차·형평성(지니계수)·이상치를 분석합니다.',
};

export default function EducationBudgetPage() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <EducationBudgetDashboard />
    </div>
  );
}
