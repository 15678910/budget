'use client';

import type { UNTarget, UNTargetsMeta } from '@/lib/sdg/ontology';

interface UNTargetsSectionProps {
  /** 선택된 SDG 목표의 UN 169 세부목표(국제 원본). 비어 있으면 렌더 안 함. */
  targets: UNTarget[];
  /** UN 세부목표 출처 메타(source/url/fetchedAt). */
  meta: UNTargetsMeta;
}

/**
 * UN 169 세부목표(국제 기준) 섹션 — OntologyInspector 의 K-SDGs 섹션 아래에 표시.
 * 각 항목: code + 영문 원문(공식) + 작은 국문(비공식). 상단 출처 배지.
 * 영문(en)=UN 공식 축자, 국문(ko)=비공식 참고 번역(명시).
 */
export default function UNTargetsSection({ targets, meta }: UNTargetsSectionProps) {
  if (targets.length === 0) return null;

  const fetchedDate = meta.fetchedAt.slice(0, 10);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="text-sm font-medium text-slate-500">
        UN 169 세부목표 · 국제 기준 ({targets.length})
      </p>
      <p className="mt-1 inline-block rounded bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
        UN SDG API · 영문 공식 · 국문 비공식 참고
      </p>
      <ul className="mt-1.5 space-y-2">
        {targets.map((t) => (
          <li key={t.code} className="text-sm leading-relaxed">
            <div className="flex gap-2">
              <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-sky-700">
                {t.code}
              </span>
              <span className="min-w-0 flex-1 text-slate-700">{t.en}</span>
            </div>
            {t.ko && (
              <p className="mt-0.5 pl-[2.6rem] text-[13px] text-slate-500">
                <span className="mr-1 rounded bg-slate-100 px-1 py-px text-[11px] text-slate-400">
                  비공식
                </span>
                {t.ko}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-400">
        출처: {meta.source} (
        <a
          href={meta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-600"
        >
          unstats.un.org
        </a>
        ) · 수집 {fetchedDate}. 영문은 공식 축자 인용, 국문은 비공식 참고 번역입니다.
      </p>
    </div>
  );
}
