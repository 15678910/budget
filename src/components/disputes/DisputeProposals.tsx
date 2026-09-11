import type { Proposals } from '@/lib/disputes/types';

export function DisputeProposals({ proposals }: { proposals: Proposals }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-5">
      <p className="text-base leading-relaxed text-muted-foreground">{proposals.intro}</p>
      <ol className="mt-4 list-decimal space-y-3 pl-6">
        {proposals.items.map((item) => (
          <li key={item} className="text-base leading-relaxed text-foreground">
            {item}
          </li>
        ))}
      </ol>
      {proposals.note && (
        <p className="mt-4 border-t border-border pt-4 text-base leading-relaxed text-muted-foreground">
          {proposals.note}
        </p>
      )}
      <p className="mt-3 font-mono text-sm text-muted-foreground">출처 — {proposals.source}</p>
    </div>
  );
}
