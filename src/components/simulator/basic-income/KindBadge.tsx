import { DEFAULT_SOURCES } from '@/lib/basic-income';
import type { SourceKey, ValueKind } from '@/lib/basic-income/types';

const KIND_LABEL: Record<ValueKind, string> = {
  source: '1차 자료',
  derived: '필자 계산',
  assumption: '가정',
};

const KIND_STYLE: Record<ValueKind, string> = {
  source: 'border-blue-700 text-blue-300',
  derived: 'border-amber-700 text-amber-300',
  assumption: 'border-gray-700 text-gray-400',
};

/** 기본값이 어디서 왔는지 보여 주는 작은 배지. 1차 자료면 원문 링크를 단다. */
export function KindBadge({ sourceKey }: { sourceKey: SourceKey }) {
  const v = DEFAULT_SOURCES[sourceKey];
  const title = [v.source, v.note].filter(Boolean).join(' · ');
  const cls = `inline-block rounded border px-1.5 py-0.5 text-[10px] leading-none ${KIND_STYLE[v.kind]}`;
  if (v.url) {
    return (
      <a href={v.url} target="_blank" rel="noopener noreferrer" title={title} className={`${cls} hover:underline`}>
        {KIND_LABEL[v.kind]}
      </a>
    );
  }
  return (
    <span title={title} className={cls}>
      {KIND_LABEL[v.kind]}
    </span>
  );
}
