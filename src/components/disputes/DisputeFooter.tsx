import type { Dispute } from '@/lib/disputes/types';

export function DisputeFooter({ dispute }: { dispute: Dispute }) {
  return (
    <footer className="border-t-2 border-border pt-6">
      <h2 className="text-xl font-bold text-foreground">확인이 필요한 것</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {dispute.caveats.map((c) => (
          <li key={c} className="text-base leading-relaxed text-muted-foreground">
            {c}
          </li>
        ))}
      </ul>
      <h3 className="mt-6 text-base font-bold text-foreground">출처</h3>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {dispute.sources.map((s) => (
          <li key={s.title} className="text-sm text-muted-foreground">
            {s.publisher}, 「{s.title}」, {s.date}
            {s.url && (
              <>
                {' '}
                <a
                  href={s.url}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  원문
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </footer>
  );
}
