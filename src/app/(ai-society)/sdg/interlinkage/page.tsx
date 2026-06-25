import type { Metadata } from 'next';
import InterlinkageMatrix from '@/components/sdg/InterlinkageMatrix';
import { buildInterlinkage } from '@/lib/sdg/interlinkage-build';

export const metadata: Metadata = {
  title: '정책 연계성(시너지·상충) | 마을살림/나라살림',
  description:
    '최대 16개 광역의 SDG 목표 달성도 점수 상관(Spearman)으로 목표 간 시너지·상충 경향을 탐색적으로 관측합니다. 쌍별 공통 지역 5~16곳이며 상관은 인과가 아닙니다.',
};

export default function SDGInterlinkagePage() {
  const data = buildInterlinkage();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">정책 연계성 — 시너지·상충 탐색</h1>
        <p className="mt-2 text-sm text-slate-400">
          16개 광역의 SDG 목표 <strong>달성도 점수</strong>가 목표들 사이에서 함께 오르내리는지를
          Spearman 순위상관으로 봅니다. 양의 상관은 <strong>시너지 경향</strong>, 음의 상관은{' '}
          <strong>상충 경향</strong>을 시사하지만, 이는 <strong>탐색적 관측치</strong>일 뿐
          정책 효과나 인과 관계를 증명하지 않습니다.
        </p>
      </header>
      <InterlinkageMatrix data={data} />
    </div>
  );
}
