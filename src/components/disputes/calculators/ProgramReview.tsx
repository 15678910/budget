'use client';

import { useMemo, useState } from 'react';
import { programsOf } from '@/lib/programs';
import { CENTRAL_GOV } from '@/lib/programs/gov';
import { PRESETS, rankPrograms } from '@/lib/programs/scoring';
import { reallocate, type ReallocationInput } from '@/lib/programs/reallocation';
import type { Weights } from '@/lib/programs/types';
import { WeightPanel } from './program-review/WeightPanel';
import { RankingTable } from './program-review/RankingTable';
import { ReallocationPanel } from './program-review/ReallocationPanel';

const DEFAULT_INPUT: ReallocationInput = {
  bottomN: 3,
  cutRate: 0,
  split: { top: 0, grant: 0.5, debt: 0.25, reserve: 0.25 },
};

export function ProgramReview() {
  const [weights, setWeights] = useState<Weights>(PRESETS[0].weights);
  const [input, setInput] = useState<ReallocationInput>(DEFAULT_INPUT);

  const programs = useMemo(() => programsOf(CENTRAL_GOV), []);
  const ranked = useMemo(() => rankPrograms(programs, weights), [programs, weights]);
  const result = useMemo(() => reallocate(ranked, input), [ranked, input]);

  const disclosedEok = programs
    .filter((p) => !p.isRemainder)
    .reduce((s, p) => s + p.amount27Eok, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">
          사업 검토 — 기준을 정하면 순위가 바뀝니다
        </h3>
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
          미래대응기금 4대 계정 첫해 사업지출 45조 4,000억원 가운데 정부가 주요사업으로 공개한
          것은 {(disclosedEok / 10000).toFixed(1)}조원입니다. 나머지는 계정별 「기타」로 두고
          총액에만 넣었습니다.
        </p>
      </div>

      <WeightPanel weights={weights} onChange={setWeights} />
      <RankingTable ranked={ranked} />
      <ReallocationPanel input={input} onChange={setInput} result={result} />

      <p className="rounded-md border border-border bg-muted/20 p-3 text-base leading-relaxed text-muted-foreground">
        이 도구는 효과를 추정하지 않습니다. 사업의 성격·규모·경로·근거라는 확인 가능한 사실을
        독자의 기준으로 정렬할 뿐입니다. 순위가 낮다는 것은 그 기준에서 그렇다는 뜻이지 사업이
        나쁘다는 뜻이 아닙니다.
      </p>
      <p className="font-mono text-sm text-muted-foreground">
        출처 — 기획예산처 2027년 예산안 홍보자료 7쪽 「미래대응기금 주요사업」 · 100대 신규사업
        · 2027년 청년정책 주요내용 개요도. 점수·재배분은 화면의 계산식대로 산출한 [역산]
        값입니다.
      </p>
    </div>
  );
}
