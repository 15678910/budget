import type { Finding } from '@/lib/disputes/types';

export function DisputeFindings({ findings }: { findings: Finding[] }) {
  return (
    <div className="flex flex-col gap-3">
      {findings.map((f) => (
        <article
          key={f.heading}
          className="rounded-md border border-border border-l-4 border-l-amber-500/60 bg-muted/20 p-4"
        >
          <h3 className="text-base font-bold text-foreground">{f.heading}</h3>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{f.article}</p>
          <p className="mt-2 text-base leading-relaxed text-foreground">{f.body}</p>
          {f.remains && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              남는 것 — {f.remains}
            </p>
          )}
          <p className="mt-2 font-mono text-sm text-muted-foreground">출처 — {f.source}</p>
        </article>
      ))}
    </div>
  );
}
