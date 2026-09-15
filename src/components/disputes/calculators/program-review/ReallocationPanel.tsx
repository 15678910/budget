'use client';

import { useState } from 'react';
import {
  GRANT_GAP_CAP_EOK,
  type ReallocationInput,
  type ReallocationResult,
} from '@/lib/programs/reallocation';
import type { FundAccount } from '@/lib/programs/types';
import { ACCOUNT_LABEL, SPLIT_LABEL } from './labels';

type SplitKey = 'top' | 'grant' | 'debt' | 'reserve';
const SPLIT_KEYS: readonly SplitKey[] = ['top', 'grant', 'debt', 'reserve'];
const ACCOUNT_ORDER: readonly Exclude<FundAccount, 'none'>[] = [
  'youth',
  'growth',
  'regional',
  'education',
];

/**
 * 막대 폭. 인라인 스타일 금지 규칙 때문에 10% 단위 고정 클래스만 쓴다.
 * 그래서 막대는 눈대중이고, 정확한 값은 옆의 숫자와 aria-valuenow에 있다.
 */
const BAR_WIDTH = [
  'w-0',
  'w-[10%]',
  'w-[20%]',
  'w-[30%]',
  'w-[40%]',
  'w-[50%]',
  'w-[60%]',
  'w-[70%]',
  'w-[80%]',
  'w-[90%]',
  'w-full',
] as const;

function barWidth(ratio: number): string {
  const i = Math.min(BAR_WIDTH.length - 1, Math.max(0, Math.round(ratio * 10)));
  return BAR_WIDTH[i];
}

const eok = (v: number) => `${Math.round(v).toLocaleString('ko-KR')}억원`;

/** 슬라이더는 0~100 눈금이고, 계산에 넘기기 전에 합이 1이 되도록 정규화한다 */
function normalize(raw: Record<SplitKey, number>): ReallocationInput['split'] {
  const sum = SPLIT_KEYS.reduce((s, k) => s + raw[k], 0);
  if (sum <= 0) return { top: 0, grant: 0, debt: 0, reserve: 1 };
  return { top: raw.top / sum, grant: raw.grant / sum, debt: raw.debt / sum, reserve: raw.reserve / sum };
}

export function ReallocationPanel({
  input,
  onChange,
  result,
}: {
  input: ReallocationInput;
  onChange: (i: ReallocationInput) => void;
  result: ReallocationResult;
}) {
  const [raw, setRaw] = useState<Record<SplitKey, number>>(() => ({
    top: Math.round(input.split.top * 100),
    grant: Math.round(input.split.grant * 100),
    debt: Math.round(input.split.debt * 100),
    reserve: Math.round(input.split.reserve * 100),
  }));
  const allZero = SPLIT_KEYS.every((k) => raw[k] === 0);
  const shown = normalize(raw);

  const setSplit = (k: SplitKey, v: number) => {
    const next = { ...raw, [k]: v };
    setRaw(next);
    onChange({ ...input, split: normalize(next) });
  };

  const elsewhereEok = result.grantEok + result.debtEok + result.reserveEok;
  const maxAccountEok = Math.max(
    1,
    ...ACCOUNT_ORDER.map((a) => {
      const v = result.byAccount[a];
      return Math.max(v?.before ?? 0, v?.after ?? 0);
    }),
  );

  // 반올림 잔차는 가장 큰 항목(사업 합계)이 흡수한다. 화면의 덧셈이 어긋나면 안 되기 때문이다
  const totalEok = Math.round(result.totalBeforeEok);
  const grantEok = Math.round(result.grantEok);
  const debtEok = Math.round(result.debtEok);
  const reserveEok = Math.round(result.reserveEok);
  const programsEok = totalEok - grantEok - debtEok - reserveEok;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="text-lg font-bold text-foreground">재배분 — 깎으면 그 돈은 어디로 가나</h4>
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
          위 순위에서 아래쪽 사업을 깎고, 풀린 돈의 행선지를 정해 보세요. 총액 45조 4,000억원은
          바뀌지 않습니다. 계정별 「기타」 잔여는 사업 단위가 공개되지 않아 삭감 대상에서
          빠집니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slider
          label="하위 몇 건을 깎을까"
          value={input.bottomN}
          min={1}
          max={10}
          step={1}
          display={`${input.bottomN}건`}
          note="순위표 맨 아래부터 셉니다. 같은 수만큼 상위 사업이 증액 대상이 됩니다"
          onChange={(v) => onChange({ ...input, bottomN: v })}
        />
        <Slider
          label="삭감률"
          value={input.cutRate}
          min={0}
          max={1}
          step={0.05}
          display={`${(input.cutRate * 100).toFixed(0)}%`}
          note="해당 사업의 2027년 금액에서 이 비율만큼 덜어냅니다. 0이면 정부안 그대로입니다"
          onChange={(v) => onChange({ ...input, cutRate: v })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SPLIT_KEYS.map((k) => (
          <Slider
            key={k}
            label={SPLIT_LABEL[k]}
            value={raw[k]}
            min={0}
            max={100}
            step={5}
            display={`${(shown[k] * 100).toFixed(0)}%`}
            note={`눈금 ${raw[k]} — 네 항목의 합으로 나눈 비율로 배분합니다`}
            onChange={(v) => setSplit(k, v)}
          />
        ))}
      </div>

      {allZero && (
        <p className="rounded-md border border-border bg-muted/20 p-3 text-base leading-relaxed text-muted-foreground">
          네 항목이 모두 0이라 풀린 돈을 전액 적립으로 두었습니다. 돈은 사라지지 않으므로
          행선지가 없으면 총액 불변식이 성립하지 않기 때문입니다.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure label="풀린 금액" value={eok(result.freedEok)} />
        <Figure label="재배분 후 사업 합계" value={eok(result.totalAfterEok)} />
        <Figure label="교부금 보전·국채·적립 합" value={eok(elsewhereEok)} />
      </div>

      {result.grantEok >= GRANT_GAP_CAP_EOK && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-base leading-relaxed text-foreground">
          교부금 차액 보전이 상한 {GRANT_GAP_CAP_EOK.toLocaleString('ko-KR')}억원(정부 추산
          차액)에 걸렸습니다. 넘는 몫은 적립으로 보냈습니다.
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-base font-medium text-foreground">계정별 — 정부안 vs 내 안</p>
        {ACCOUNT_ORDER.map((a) => {
          const v = result.byAccount[a];
          if (!v) return null;
          return (
            <div key={a} className="flex flex-col gap-1">
              <p className="text-base text-foreground">{ACCOUNT_LABEL[a]}</p>
              <Bar
                caption="정부안"
                label={`${ACCOUNT_LABEL[a]} 정부안`}
                valueEok={v.before}
                maxEok={maxAccountEok}
              />
              <Bar
                caption="내 안"
                label={`${ACCOUNT_LABEL[a]} 내 안`}
                valueEok={v.after}
                maxEok={maxAccountEok}
                accent
              />
            </div>
          );
        })}
      </div>

      <p className="rounded-md border border-border bg-muted/30 p-3 text-base leading-relaxed text-foreground">
        사업 합계 {programsEok.toLocaleString('ko-KR')}억원 + 교부금 보전{' '}
        {grantEok.toLocaleString('ko-KR')}억원 + 국채 상환 {debtEok.toLocaleString('ko-KR')}억원 +
        적립 {reserveEok.toLocaleString('ko-KR')}억원 = {totalEok.toLocaleString('ko-KR')}억원
      </p>
    </div>
  );
}

function Bar({
  caption,
  label,
  valueEok,
  maxEok,
  accent,
}: {
  caption: string;
  label: string;
  valueEok: number;
  maxEok: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-sm text-muted-foreground">{caption}</span>
      <span className="h-3 flex-1 rounded-sm bg-muted/50">
        <span
          role="meter"
          aria-label={label}
          aria-valuenow={Math.round(valueEok)}
          aria-valuemin={0}
          aria-valuemax={Math.round(maxEok)}
          className={`block h-3 rounded-sm ${accent ? 'bg-blue-600' : 'bg-muted-foreground'} ${barWidth(valueEok / maxEok)}`}
        />
      </span>
      <span className="w-28 shrink-0 text-right text-sm tabular-nums text-foreground">
        {eok(valueEok)}
      </span>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  note,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  note: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-medium text-foreground">{label}</span>
        <span className="text-base font-bold tabular-nums text-foreground">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-blue-600"
        aria-label={label}
        aria-valuetext={display}
      />
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-base text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
