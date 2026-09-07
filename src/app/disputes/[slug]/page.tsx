import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_DISPUTES, getDispute } from '@/lib/disputes';
import { staticAdapter } from '@/lib/disputes/tracking';
import { DisputeHeader } from '@/components/disputes/DisputeHeader';
import { DisputeTimeline } from '@/components/disputes/DisputeTimeline';
import { DisputePositions } from '@/components/disputes/DisputePositions';
import { DisputeFooter } from '@/components/disputes/DisputeFooter';

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
  if (!dispute) return { title: '예산분쟁 | 마을살림/나라살림' };
  return {
    title: `${dispute.title} | 마을살림/나라살림`,
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

      <DisputeFooter dispute={dispute} />
    </main>
  );
}
