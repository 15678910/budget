import { SectionHeader } from '@/components/fiscal/primitives';
import type { CaseEvent, CaseSource, WatchCase } from '@/lib/watch/case-types';
import { ELECTION_DAY, daysBetween } from '@/lib/watch/cases';
import { ClaimTable, SourceLink } from './ClaimTable';
import {
  PROCEDURE_BASIS,
  PROCEDURE_KEYS,
  PROCEDURE_LABEL,
  PROCEDURE_STATUS_CLASS,
  PROCEDURE_STATUS_LABEL,
  TAG_LABEL,
  TAG_NOTE,
  formatEok,
} from './labels';

interface TimelineRow {
  date: string;
  label: string;
  source?: CaseSource;
  election: boolean;
}

/** 사건 목록에 선거일을 날짜 순서대로 끼워 넣는다. 같은 날짜면 선거일을 뒤에 둔다 */
function buildTimeline(events: readonly CaseEvent[]): TimelineRow[] {
  const rows: TimelineRow[] = events.map((event) => ({
    date: event.date,
    label: event.label,
    source: event.source,
    election: false,
  }));
  rows.push({ date: ELECTION_DAY, label: '제9회 전국동시지방선거', election: true });
  return rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return Number(a.election) - Number(b.election);
  });
}

/** 선거일과의 간격. 사실(일수)만 적는다 */
function gapLabel(date: string): string {
  const days = daysBetween(date, ELECTION_DAY);
  if (days === 0) return '선거 당일';
  return days > 0 ? `선거 ${days}일 전` : `선거 ${-days}일 후`;
}

/** 주장·타임라인·절차에 붙은 출처를 URL 기준으로 중복 제거 */
function collectSources(watchCase: WatchCase): CaseSource[] {
  const byUrl = new Map<string, CaseSource>();
  const push = (source?: CaseSource) => {
    if (!source) return;
    const existing = byUrl.get(source.url);
    if (!existing || (!existing.quote && source.quote)) byUrl.set(source.url, source);
  };
  watchCase.claims.forEach((claim) => claim.sources.forEach(push));
  watchCase.timeline.forEach((event) => push(event.source));
  watchCase.procedures.forEach((procedure) => push(procedure.source));
  return [...byUrl.values()];
}

function Timeline({ rows }: { rows: TimelineRow[] }) {
  return (
    <ul className="divide-y divide-gray-800 border border-gray-800">
      {rows.map((row) => (
        <li
          key={`${row.date}-${row.label}`}
          className={`flex flex-col gap-1 px-3 py-2 md:flex-row md:items-baseline md:gap-3 ${
            row.election ? 'bg-orange-500/5' : ''
          }`}
        >
          <span className="w-24 shrink-0 font-mono text-xs text-gray-500 tabular-nums">{row.date}</span>
          <span
            className={`w-24 shrink-0 font-mono text-xs tabular-nums ${
              row.election ? 'text-orange-300' : 'text-gray-600'
            }`}
          >
            {row.election ? '선거일' : gapLabel(row.date)}
          </span>
          <span className={`min-w-0 text-sm leading-relaxed ${row.election ? 'text-orange-200' : 'text-gray-300'}`}>
            {row.label}
            {row.source && (
              <span className="ml-2 text-xs">
                <SourceLink source={row.source} />
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Procedures({ watchCase }: { watchCase: WatchCase }) {
  return (
    <ul className="divide-y divide-gray-800 border border-gray-800">
      {PROCEDURE_KEYS.map((key) => {
        const procedure = watchCase.procedures.find((p) => p.key === key);
        const status = procedure?.status ?? 'unknown';
        const note = procedure?.note ?? '확인 자료 없음';
        return (
          <li key={key} className="flex flex-col gap-1 px-3 py-2 md:flex-row md:items-baseline md:gap-3">
            <span className="w-28 shrink-0 text-sm text-gray-300">{PROCEDURE_LABEL[key]}</span>
            <span className="w-40 shrink-0 text-xs text-gray-600">{PROCEDURE_BASIS[key]}</span>
            <span
              className={`w-fit shrink-0 border px-2 py-0.5 text-xs font-semibold ${PROCEDURE_STATUS_CLASS[status]}`}
            >
              {PROCEDURE_STATUS_LABEL[status]}
            </span>
            <span className="min-w-0 text-sm leading-relaxed text-gray-400">
              {note}
              {procedure?.source && (
                <span className="ml-2 text-xs">
                  <SourceLink source={procedure.source} />
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function CaseDetail({ watchCase }: { watchCase: WatchCase }) {
  const timeline = buildTimeline(watchCase.timeline);
  const sources = collectSources(watchCase);

  return (
    <div className="space-y-1">
      <div className="border border-gray-800 px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm text-gray-500">{watchCase.gov.name}</span>
          <h3 className="text-base font-bold text-gray-200 md:text-lg">{watchCase.title}</h3>
          <span className="font-mono text-sm text-orange-300 tabular-nums">{formatEok(watchCase.amountEok)}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{watchCase.amountNote}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>상태 — {watchCase.status}</span>
          <span>검증일 — {watchCase.verifiedAt}</span>
        </div>
      </div>

      <p className="border border-gray-800 px-4 py-3 text-sm leading-relaxed text-gray-300">{watchCase.summary}</p>

      <SectionHeader title="타임라인" color="text-orange-400" />
      <Timeline rows={timeline} />

      <SectionHeader title="주장과 판정" color="text-orange-400" />
      <ClaimTable claims={watchCase.claims} />

      <SectionHeader title="절차 점검" color="text-orange-400" />
      <Procedures watchCase={watchCase} />

      <SectionHeader title="구조 태그" color="text-orange-400" />
      <div className="border border-gray-800 px-4 py-3">
        {watchCase.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {watchCase.tags.map((tag) => (
              <span
                key={tag}
                className="border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-300"
              >
                {TAG_LABEL[tag]}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">붙은 태그 없음</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-gray-600">{TAG_NOTE}</p>
      </div>

      <SectionHeader title="출처" color="text-orange-400" />
      <ul className="space-y-1.5 border border-gray-800 px-4 py-3 text-sm">
        {sources.map((source) => (
          <li key={source.url} className="leading-snug">
            <SourceLink source={source} />
          </li>
        ))}
      </ul>
    </div>
  );
}
