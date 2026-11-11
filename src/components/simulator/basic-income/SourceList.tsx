import { DEFAULT_SOURCES } from '@/lib/basic-income';
import type { SourcedValue, ValueKind } from '@/lib/basic-income/types';
import { fmtPct } from './format';

const GROUPS: { kind: ValueKind; title: string }[] = [
  { kind: 'source', title: '1차 자료' },
  { kind: 'derived', title: '필자 계산' },
  { kind: 'assumption', title: '가정(정책 손잡이 포함)' },
];

function valueText(v: SourcedValue): string {
  if (v.unit === '비율') return fmtPct(v.value);
  if (v.unit === '년') return `${v.value}년`;
  return `${v.value.toLocaleString('ko-KR', { maximumFractionDigits: 4 })} ${v.unit}`;
}

/** 기본값 전부를 종류별로 묶고 원문 링크를 단다 */
export function SourceList() {
  const all = Object.values(DEFAULT_SOURCES);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {GROUPS.map((g) => (
        <div key={g.kind}>
          <h4 className="mb-2 text-sm font-semibold text-gray-200">{g.title}</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            {all
              .filter((v) => v.kind === g.kind)
              .map((v) => (
                <li key={v.label}>
                  <span className="text-gray-200">{v.label}</span>: {valueText(v)}
                  {v.source && <span className="block text-gray-500">{v.source}</span>}
                  {v.note && <span className="block text-gray-500">{v.note}</span>}
                  {v.columnRef !== undefined && <span className="block text-gray-500">칼럼 참고 자료 {v.columnRef}</span>}
                  {v.url && (
                    <a href={v.url} target="_blank" rel="noopener noreferrer" className="break-all text-blue-400 hover:underline">
                      원문
                    </a>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
