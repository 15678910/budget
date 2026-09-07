import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_DISPUTES, getDispute } from '@/lib/disputes';
import { staticAdapter } from '@/lib/disputes/tracking';
import { DisputeHeader } from '@/components/disputes/DisputeHeader';
import { DisputeTimeline } from '@/components/disputes/DisputeTimeline';
import { DisputePositions } from '@/components/disputes/DisputePositions';
import { DisputeFooter } from '@/components/disputes/DisputeFooter';
import { DisputeComparison } from '@/components/disputes/DisputeComparison';
import { CALCULATORS } from '@/components/disputes/calculators';

export function generateStaticParams() {
  return ALL_DISPUTES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dispute = getDispute(slug);
  if (!dispute) return { title: '예산분쟁' };
  return {
    title: dispute.title,
    description: dispute.question,
  };
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dispute = getDispute(slug);
  if (!dispute) notFound();

  const timeline = await staticAdapter.fetchTimeline(slug);
  const Calculator = dispute.calculator ? CALCULATORS[dispute.calculator] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 md:px-6">
      <DisputeHeader dispute={dispute} />

      <section>
        <h2 className="text-xl font-bold text-foreground">진행</h2>
        <div className="mt-4">
          <DisputeTimeline events={timeline} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground">쟁점</h2>
        <div className="mt-4">
          <DisputePositions positions={dispute.positions} />
        </div>
      </section>

      {Calculator && (
        <section>
          <h2 className="text-xl font-bold text-foreground">숫자로 보기</h2>
          <p className="mt-1 mb-4 text-base leading-relaxed text-muted-foreground">
            가정을 바꾸면 결과가 어떻게 움직이는지 직접 확인하세요. 판단은 독자가 합니다.
          </p>
          <Calculator />
        </section>
      )}

      {!Calculator && dispute.comparison && (
        <section>
          <h2 className="text-xl font-bold text-foreground">숫자로 보기</h2>
          <p className="mt-1 mb-4 text-base leading-relaxed text-muted-foreground">
            이 분쟁에는 계산기를 두지 않았습니다. 자동조정장치는 국내에 도입된 전례가 없어
            계산 결과가 전부 가정이 되기 때문입니다. 확인된 수치만 나란히 놓습니다.
          </p>
          <DisputeComparison
            caption={dispute.comparison.caption}
            rows={dispute.comparison.rows}
          />
        </section>
      )}

      <DisputeFooter dispute={dispute} />
    </main>
  );
}
