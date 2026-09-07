import type { Position } from '@/lib/disputes/types';

const SIDE_LABEL: Record<Position['side'], string> = {
  for: '찬성',
  against: '반대',
  neutral: '중립',
};

const SIDE_CLASS: Record<Position['side'], string> = {
  for: 'border-l-emerald-500/60',
  against: 'border-l-red-500/60',
  neutral: 'border-l-border',
};

export function DisputePositions({ positions }: { positions: Position[] }) {
  return (
    <div className="flex flex-col gap-3">
      {positions.map((p) => (
        <article
          key={`${p.actor}-${p.claim.slice(0, 12)}`}
          className={`rounded-md border border-border border-l-4 bg-muted/20 p-4 ${SIDE_CLASS[p.side]}`}
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-xs text-muted-foreground">{SIDE_LABEL[p.side]}</span>
            <span className="text-base font-bold text-foreground">{p.actor}</span>
          </div>
          <p className="mt-2 text-base leading-relaxed text-foreground">{p.claim}</p>
          {p.evidence && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.evidence}</p>
          )}
          <p className="mt-2 font-mono text-xs text-muted-foreground">출처 — {p.source}</p>
        </article>
      ))}
    </div>
  );
}
