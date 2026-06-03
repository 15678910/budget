import { EducationPledgeDashboard, type PledgeFeed } from '@/components/pledge/EducationPledgeDashboard';
import type { PledgeDataset } from '@/lib/pledge/types';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: '선거 공약 분석 (2026 지방선거) | 마을살림/나라살림',
  description:
    '2026 제9회 전국동시지방선거 교육감·시도지사·구시군의장 후보 공약을 동일 기준으로 분석합니다 — 정책 분야 분류와 비용 추계. 출처: 중앙선거관리위원회.',
};

function load(type: string): PledgeDataset | null {
  const file = path.join(process.cwd(), 'public', 'data', `pledges-20260603-${type}.json`);
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) as PledgeDataset; } catch { return null; }
}

export default function PledgesPage() {
  const defs = [
    { type: '11', label: '교육감' },
    { type: '3', label: '시도지사' },
    { type: '4', label: '구시군의장' },
  ];
  const feeds: PledgeFeed[] = defs
    .map((d) => { const dataset = load(d.type); return dataset ? { type: d.type, label: d.label, dataset } : null; })
    .filter((f): f is PledgeFeed => f != null);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <EducationPledgeDashboard feeds={feeds} />
    </div>
  );
}
