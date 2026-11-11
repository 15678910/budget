'use client';

import type { YearRow } from '@/lib/basic-income/types';
import { fmtJo, fmtPct } from './format';
import { NumberField } from './NumberField';
import type { InputPanelProps } from './types';

interface FundPanelProps extends InputPanelProps {
  last: YearRow | undefined;
  target: { target: number; progress: number };
}

/** 기금: 처음 잔액, 기간 끝 잔액과 원금, 영구 지급 목표선 */
export function FundPanel({ input, onChange, last, target }: FundPanelProps) {
  const pct = Math.round(Math.min(1, Math.max(0, target.progress)) * 100);
  return (
    <div className="space-y-3">
      <NumberField label="처음 기금" unit="조" step={10} min={0} value={input.initialFund}
        onChange={(initialFund) => onChange({ initialFund })} sourceKey="initialFund" />
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">{last ? `${last.year}년 기금` : '기간 끝 기금'}</dt>
        <dd className="text-right text-gray-200">{last ? fmtJo(last.fundEnd) : '-'}</dd>
        <dt className="text-gray-500">그때 원금</dt>
        <dd className="text-right text-gray-200">{last ? fmtJo(last.principal) : '-'}</dd>
        <dt className="text-gray-500">영구 지급 목표</dt>
        <dd className="text-right text-gray-200">{fmtJo(target.target)}</dd>
        <dt className="text-gray-500">달성률</dt>
        <dd className="text-right text-gray-200">{fmtPct(target.progress)}</dd>
      </dl>
      <progress className="h-2 w-full appearance-none overflow-hidden rounded [&::-moz-progress-bar]:bg-blue-500 [&::-webkit-progress-bar]:bg-gray-800 [&::-webkit-progress-value]:bg-blue-500" max={100} value={pct} aria-label="영구 지급 목표 달성률" />
      <p className="text-xs text-gray-500">
        목표 = (첫해 필요액 − 지급용 세입) ÷ 인출률. 이만큼 있으면 원금을 깎지 않고 계속 준다.
      </p>
    </div>
  );
}
