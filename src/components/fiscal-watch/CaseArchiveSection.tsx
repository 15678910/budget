'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionHeader } from '@/components/fiscal/primitives';
import type { StructuralTag, Verdict, WatchCase } from '@/lib/watch/case-types';
import { WATCH_CASES, getWatchCase } from '@/lib/watch/cases';
import { VerdictBadge } from './ClaimTable';
import { CaseDetail } from './CaseDetail';
import {
  ARCHIVE_NOTICE,
  TAG_LABEL,
  TAG_NOTE,
  TAG_ORDER,
  VERDICT_LABEL,
  VERDICT_ORDER,
  formatEok,
} from './labels';

const SELECT_CLASS =
  'border border-gray-700 bg-gray-900 px-2 py-1 text-sm text-gray-300 focus:border-gray-500 focus:outline-none';

function countByVerdict(watchCase: WatchCase): { verdict: Verdict; count: number }[] {
  return VERDICT_ORDER.map((verdict) => ({
    verdict,
    count: watchCase.claims.filter((claim) => claim.verdict === verdict).length,
  })).filter((entry) => entry.count > 0);
}

function CaseCard({ watchCase, onSelect }: { watchCase: WatchCase; onSelect: (slug: string) => void }) {
  const counts = countByVerdict(watchCase);
  return (
    <button
      type="button"
      onClick={() => onSelect(watchCase.slug)}
      className="flex w-full flex-col gap-2 border border-gray-800 p-3 text-left transition-colors hover:border-gray-600 hover:bg-gray-900/60"
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs text-gray-500">{watchCase.gov.name}</span>
        <span className="text-sm font-semibold text-gray-200">{watchCase.title}</span>
      </div>
      <div className="font-mono text-sm text-orange-300 tabular-nums">{formatEok(watchCase.amountEok)}</div>
      {watchCase.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {watchCase.tags.map((tag) => (
            <span
              key={tag}
              className="border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 text-[11px] text-orange-300"
            >
              {TAG_LABEL[tag]}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {counts.map(({ verdict, count }) => (
          <span key={verdict} className="text-[11px] text-gray-500">
            {VERDICT_LABEL[verdict]} {count}
          </span>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{watchCase.status}</p>
      <p className="text-[11px] text-gray-600">검증일 {watchCase.verifiedAt}</p>
    </button>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-gray-800 px-4 py-2">
      <span className="text-xs text-gray-500">판정 표기</span>
      {VERDICT_ORDER.map((verdict) => (
        <VerdictBadge key={verdict} verdict={verdict} />
      ))}
      <span className="text-xs text-gray-600">확인 / 부분확인 / 반박 / 미확인</span>
    </div>
  );
}

function CaseArchive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `/fiscal-innovation?tab=cases&case=<slug>` 로 들어오면 그 사례를 펼친 채로 시작한다
  const caseParam = searchParams.get('case');
  const linkedSlug = caseParam && getWatchCase(caseParam) ? caseParam : null;

  const [govFilter, setGovFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(linkedSlug);

  // 다른 화면(자치단체 상세)에서 링크로 들어와 쿼리가 바뀌면 선택도 따라간다
  useEffect(() => {
    setSelectedSlug(linkedSlug);
  }, [linkedSlug]);

  /** 목록으로 돌아갈 때 `case` 쿼리를 지워 새로고침해도 목록이 나오게 한다 */
  const backToList = () => {
    setSelectedSlug(null);
    if (!caseParam) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('case');
    if (!next.has('tab')) next.set('tab', 'cases');
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const govNames = useMemo(
    () => [...new Set(WATCH_CASES.map((watchCase) => watchCase.gov.name))].sort((a, b) => a.localeCompare(b, 'ko')),
    [],
  );
  const usedTags = useMemo(
    () => TAG_ORDER.filter((tag) => WATCH_CASES.some((watchCase) => watchCase.tags.includes(tag))),
    [],
  );

  const filtered = useMemo(
    () =>
      WATCH_CASES.filter((watchCase) => {
        if (govFilter !== 'all' && watchCase.gov.name !== govFilter) return false;
        if (tagFilter !== 'all' && !watchCase.tags.includes(tagFilter as StructuralTag)) return false;
        return true;
      }),
    [govFilter, tagFilter],
  );

  const selected = selectedSlug ? getWatchCase(selectedSlug) : undefined;

  return (
    <div className="space-y-1">
      <p className="border border-orange-500/40 bg-orange-500/5 px-4 py-3 text-sm leading-relaxed text-orange-200">
        {ARCHIVE_NOTICE}
      </p>

      <Legend />

      {selected ? (
        <>
          <div className="border border-gray-800 px-4 py-2">
            <button
              type="button"
              onClick={backToList}
              className="text-sm text-gray-400 transition-colors hover:text-gray-200"
            >
              ← 목록으로
            </button>
          </div>
          <CaseDetail watchCase={selected} />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 border border-gray-800 px-4 py-2">
            <label className="flex items-center gap-2 text-sm text-gray-500">
              시도
              <select
                value={govFilter}
                onChange={(event) => setGovFilter(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value="all">전체</option>
                {govNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-500">
              구조 태그
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className={SELECT_CLASS}
              >
                <option value="all">전체</option>
                {usedTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {TAG_LABEL[tag]}
                  </option>
                ))}
              </select>
            </label>
            <span className="font-mono text-xs text-gray-600 tabular-nums">
              {filtered.length} / {WATCH_CASES.length}건
            </span>
          </div>

          {/* 구조 태그의 뜻은 카드마다 되풀이하지 않고 필터 밑에 한 번만 적는다 */}
          <p className="border border-gray-800 px-4 py-2 text-xs leading-relaxed text-gray-600">
            {TAG_NOTE}
          </p>

          <SectionHeader title="지목된 사업" color="text-orange-400" />
          {filtered.length === 0 ? (
            <p className="border border-gray-800 px-4 py-6 text-center text-sm text-gray-500">
              조건에 맞는 사례가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((watchCase) => (
                <CaseCard key={watchCase.slug} watchCase={watchCase} onSelect={setSelectedSlug} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** useSearchParams를 쓰므로 이 절 자체를 Suspense 경계 안에 둔다 */
export function CaseArchiveSection() {
  return (
    <Suspense fallback={null}>
      <CaseArchive />
    </Suspense>
  );
}
