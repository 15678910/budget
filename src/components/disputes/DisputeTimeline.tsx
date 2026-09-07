import type { TimelineEvent } from '@/lib/disputes/types';

const STATUS_CLASS: Record<TimelineEvent['status'], string> = {
  done: 'border-l-muted-foreground/40',
  current: 'border-l-blue-500 bg-blue-500/10',
  upcoming: 'border-l-border',
};

export function DisputeTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {events.map((e) => (
        <li
          key={`${e.date}-${e.label}`}
          className={`rounded-md border-l-4 bg-muted/20 px-4 py-3 ${STATUS_CLASS[e.status]}`}
        >
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{e.date}</span>
            <span className="text-base font-semibold text-foreground">{e.label}</span>
            {e.source && (
              <span className="font-mono text-xs text-muted-foreground">{e.source}</span>
            )}
          </div>
          {e.detail && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
