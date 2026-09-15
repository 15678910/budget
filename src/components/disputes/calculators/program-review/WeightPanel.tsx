'use client';

import { LENS_KEYS, type Weights } from '@/lib/programs/types';
import { PRESETS } from '@/lib/programs/scoring';
import { LENS_LABEL } from './labels';

export function WeightPanel({
  weights,
  onChange,
}: {
  weights: Weights;
  onChange: (w: Weights) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.weights)}
            className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-base text-foreground hover:bg-muted"
            title={p.note}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        프리셋은 출발점입니다. 아래 가중치는 예시이며 바꿀 수 있습니다. 「정부 기준」은 NEXT
        원칙 중 데이터로 표현되는 N(자본축적)·X(탄력 집행)만 반영한 것입니다. 가중치를 모두
        0으로 두면 점수 없이 금액순으로 정렬됩니다.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LENS_KEYS.map((k) => (
          <div key={k} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-medium text-foreground">{LENS_LABEL[k].name}</span>
              <span className="text-base font-bold tabular-nums text-foreground">{weights[k]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={weights[k]}
              onChange={(e) =>
                onChange({ ...weights, [k]: Number(e.target.value) as Weights[typeof k] })
              }
              className="mt-2 w-full accent-blue-600"
              aria-label={LENS_LABEL[k].name}
              aria-valuetext={String(weights[k])}
            />
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              {LENS_LABEL[k].note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
