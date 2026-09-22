'use client';

/**
 * 조기경보 카드 한 장. 법정 지표 6개의 신호와 「주의」 기준까지 남은 폭,
 * 지출 구조 지표 5종의 동종단체 백분위, 최근 3년 채무 순증을 함께 놓는다.
 * 카드는 종합 점수를 매기지 않는다 — 칩과 막대는 각각 별개의 값이다.
 */
import { AVAILABLE_LEGAL_INDICATORS } from '@/lib/watch/legal-thresholds';
import {
  LEGAL_INDICATOR_LABEL,
  WASTE_INDICATOR_LABEL,
  type CrisisSignal,
  type EntitySummary,
  type PercentileRank,
} from '@/lib/watch/signal-types';
import {
  SIGNAL_CLASS,
  SIGNAL_LABEL,
  barWidthClass,
  deltaClass,
  entityLabel,
  formatEok,
  formatPct,
  headroomText,
} from './warning-labels';

const AVAILABLE = new Set<string>(AVAILABLE_LEGAL_INDICATORS);

function SignalChip({ signal }: { signal: CrisisSignal }) {
  const label = LEGAL_INDICATOR_LABEL[signal.indicator];
  const computable = AVAILABLE.has(signal.indicator);
  const note = computable ? headroomText(signal.indicator, signal.value) : null;

  return (
    <div className={`border px-2 py-1 ${SIGNAL_CLASS[signal.level]}`}>
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[11px] opacity-80">{label}</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums">
          {signal.value === null ? SIGNAL_LABEL['no-data'] : formatPct(signal.value)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[11px] font-semibold">{SIGNAL_LABEL[signal.level]}</span>
        {note && <span className="truncate text-[10px] opacity-70">{note}</span>}
      </div>
    </div>
  );
}

function WasteBar({ rank }: { rank: PercentileRank }) {
  const label = WASTE_INDICATOR_LABEL[rank.indicator];
  const hasValue = rank.percentile !== null;
  const text = hasValue ? `상위 ${rank.percentile}% 이내` : '자료 없음';

  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 truncate text-[11px] text-gray-500">{label}</span>
      <div
        role="meter"
        aria-label={`${label} 동종단체 백분위`}
        aria-valuemin={0}
        aria-valuemax={100}
        // 값이 없으면 aria-valuenow를 0으로 두지 않고 아예 붙이지 않는다 (0은 "1등"으로 읽힌다)
        aria-valuenow={rank.percentile ?? undefined}
        aria-valuetext={text}
        className="h-1.5 min-w-0 flex-1 bg-gray-800"
      >
        <div className={`h-1.5 bg-sky-500/70 ${barWidthClass(rank.percentile)}`} />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-400">
        {text}
      </span>
      <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-600">
        {formatPct(rank.value)}
      </span>
    </div>
  );
}

export interface EntityCardProps {
  summary: EntitySummary;
  onOpen: (key: string) => void;
}

export function EntityCard({ summary, onOpen }: EntityCardProps) {
  const name = entityLabel(summary);

  // 카드 전체를 button으로 감싸면 role="meter"가 버튼 안에 들어가 보조기기에서 사라진다.
  // 카드는 article로 두고, 상세로 가는 조작은 아래의 작은 button 하나가 맡는다.
  return (
    <article className="flex w-full flex-col gap-2 border border-gray-800 p-3 text-left transition-colors hover:border-gray-600">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <h3 className="text-sm font-semibold text-gray-200">{name}</h3>
        <span className="text-[11px] text-gray-600">{summary.crisis[0]?.year}년 결산</span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {summary.crisis.map((signal) => (
          <SignalChip key={signal.indicator} signal={signal} />
        ))}
      </div>

      {summary.waste.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-gray-800 pt-2">
          {summary.waste.map((rank) => (
            <WasteBar key={rank.indicator} rank={rank} />
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-gray-800 pt-2">
        <span className="text-[11px] text-gray-500">최근 3년 채무 순증</span>
        <span className={`font-mono text-sm tabular-nums ${deltaClass(summary.debtDelta3y)}`}>
          {formatEok(summary.debtDelta3y, true)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onOpen(summary.key)}
        aria-label={`${name} 상세 보기`}
        className="w-full border border-gray-800 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200 focus:border-gray-500 focus:outline-none"
      >
        상세 보기
      </button>
    </article>
  );
}
