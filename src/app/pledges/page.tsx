import { EducationPledgeDashboard } from '@/components/pledge/EducationPledgeDashboard';
import type { PledgeDataset } from '@/lib/pledge/types';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: '교육감 후보 공약 분석 (2026 지방선거) | 마을살림/나라살림',
  description:
    '2026 제9회 전국동시지방선거 교육감 후보 공약을 동일 기준으로 분석합니다 — 정책 분야 분류와 비용 추계. 출처: 중앙선거관리위원회.',
};

export default function PledgesPage() {
  const file = path.join(process.cwd(), 'public', 'data', 'pledges-20260603-11.json');
  const dataset = JSON.parse(fs.readFileSync(file, 'utf-8')) as PledgeDataset;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <EducationPledgeDashboard dataset={dataset} />
    </div>
  );
}
