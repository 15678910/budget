import type { Dispute } from '@/lib/disputes/types';
import { STAGE_LABEL } from '@/lib/disputes/types';
import { FIGURE_KIND_LABEL } from '@/lib/datacenter/types';

export function DisputeHeader({ dispute }: { dispute: Dispute }) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          {STAGE_LABEL[dispute.stage]}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {dispute.updatedAt} 기준
        </span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">{dispute.title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
        {dispute.question}
      </p>
      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dispute.figures.map((f) => (
          <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-4">
            <dt className="text-sm text-muted-foreground">
              {f.label}{' '}
              <span className="font-mono text-xs">{FIGURE_KIND_LABEL[f.kind]}</span>
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-foreground">{f.value}</dd>
            {f.note && (
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.note}</dd>
            )}
            <dd className="mt-2 font-mono text-xs text-muted-foreground">출처 — {f.source}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
