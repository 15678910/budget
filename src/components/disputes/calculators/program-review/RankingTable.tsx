'use client';

import { Fragment, useState } from 'react';
import type { RankedProgram } from '@/lib/programs/scoring';
import { LENS_KEYS } from '@/lib/programs/types';
import {
  ACCOUNT_LABEL,
  LENS_LABEL,
  NATURE_LABEL,
  ROUTE_LABEL,
  SPEND_LABEL,
  UNCLASSIFIED_BADGE,
} from './labels';

const COLUMN_COUNT = 7;

export function RankingTable({ ranked }: { ranked: RankedProgram[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[46rem] text-base">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">사업</th>
            <th className="px-3 py-2 font-medium">계정</th>
            <th className="px-3 py-2 text-right font-medium">’27 (억원)</th>
            <th className="px-3 py-2 font-medium">성격</th>
            <th className="px-3 py-2 font-medium">지출 유형</th>
            <th className="px-3 py-2 text-right font-medium">점수</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => {
            const p = r.program;
            const isOpen = open === p.id;
            const muted = p.isRemainder ? 'text-muted-foreground' : 'text-foreground';
            return (
              // key는 Fragment에 단다. <> 단축 문법은 key를 받지 못해 목록 경고가 난다
              <Fragment key={p.id}>
                <tr className="border-t border-border align-top">
                  <td className={`px-3 py-2 tabular-nums ${muted}`}>{i + 1}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : p.id)}
                      aria-expanded={isOpen}
                      className={`text-left underline decoration-dotted underline-offset-4 hover:decoration-solid ${muted}`}
                    >
                      {p.name}
                      <span className="ml-1 text-sm text-muted-foreground">
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </button>
                    {p.classificationNote && (
                      <span className="ml-2 rounded-sm border border-border bg-muted px-1.5 py-0.5 align-middle text-sm whitespace-nowrap text-muted-foreground">
                        {UNCLASSIFIED_BADGE}
                      </span>
                    )}
                    <span className="block text-sm text-muted-foreground">{p.ministry}</span>
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap ${muted}`}>
                    {ACCOUNT_LABEL[p.account]}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${muted}`}>
                    {p.amount27Eok.toLocaleString('ko-KR')}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap ${muted}`}>
                    {NATURE_LABEL[p.nature]}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap ${muted}`}>
                    {SPEND_LABEL[p.spendType]}
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums ${muted}`}>
                    {r.score === undefined ? '—' : r.score.toFixed(2)}
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-border bg-muted/20">
                    <td className="px-3 py-3" colSpan={COLUMN_COUNT}>
                      <ProgramDetail ranked={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProgramDetail({ ranked }: { ranked: RankedProgram }) {
  const p = ranked.program;
  const lenses = LENS_KEYS.filter((k) => ranked.lenses[k] !== undefined);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-base text-muted-foreground">
        심의 경로 <span className="text-foreground">{ROUTE_LABEL[p.route]}</span>
        {' · '}
        전년(’26){' '}
        <span className="text-foreground">
          {p.amount26Eok === null
            ? '없음(신규)'
            : `${p.amount26Eok.toLocaleString('ko-KR')}억원`}
        </span>
        {p.beneficiaries && (
          <>
            {' · '}
            수혜 범위{' '}
            <span className="text-foreground">
              {p.beneficiaries.value.toLocaleString('ko-KR')}
              {p.beneficiaries.unit}
            </span>
          </>
        )}
      </p>

      {p.classificationNote && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-base leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">{UNCLASSIFIED_BADGE}</span> —{' '}
          {p.classificationNote} 이 행은 점수를 내지 않습니다 — 순위표에서는 점수가 있는 행
          뒤에 금액순으로 놓입니다.
        </p>
      )}

      {lenses.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lenses.map((k) => (
            <li key={k} className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <span className="text-base text-muted-foreground">{LENS_LABEL[k].name}</span>
              <span className="ml-2 text-base font-bold tabular-nums text-foreground">
                {ranked.lenses[k]?.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">
          정부가 사업 단위로 공개하지 않은 잔여입니다. 렌즈 값이 없어 점수를 내지 않고 총액에만
          넣었습니다.
        </p>
      )}

      {p.unit && (
        <p className="text-base leading-relaxed text-muted-foreground">
          검산 — {p.unit.price} × {p.unit.count} ={' '}
          {p.unit.product.toLocaleString('ko-KR')}억원, 예산{' '}
          {p.amount27Eok.toLocaleString('ko-KR')}억원 ({p.unit.matches ? '±1% 안' : '어긋남'})
          {p.unit.note && <span className="block">{p.unit.note}</span>}
        </p>
      )}

      {p.evidence.length > 0 && (
        <ul className="flex flex-col gap-1">
          {p.evidence.map((e, idx) => (
            <li key={`${e.field}-${idx}`} className="text-base leading-relaxed text-muted-foreground">
              「{e.quote}」 — {e.source}
            </li>
          ))}
        </ul>
      )}

      {p.sources.length > 0 && (
        <p className="font-mono text-sm text-muted-foreground">출처 — {p.sources.join(' · ')}</p>
      )}
    </div>
  );
}
