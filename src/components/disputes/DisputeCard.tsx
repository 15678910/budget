import Link from 'next/link';
import type { Dispute } from '@/lib/disputes/types';
import { STAGE_LABEL } from '@/lib/disputes/types';

export function DisputeCard({ dispute }: { dispute: Dispute }) {
  return (
    <Link
      href={`/disputes/${dispute.slug}`}
      className="block rounded-lg border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-muted px-2 py-0.5 text-sm font-medium text-foreground">
          {STAGE_LABEL[dispute.stage]}
        </span>
        <span className="text-base tabular-nums text-muted-foreground">{dispute.scale}</span>
      </div>
      <h2 className="mt-2 text-xl font-bold text-foreground">{dispute.title}</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{dispute.question}</p>
      {dispute.nextMilestone && (
        <p className="mt-3 text-base text-muted-foreground">
          다음 분기점 — {dispute.nextMilestone.date} {dispute.nextMilestone.label}
        </p>
      )}
    </Link>
  );
}
