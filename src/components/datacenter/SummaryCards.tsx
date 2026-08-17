'use client';

import type { FinanceAssumptions, FinanceSummary } from '@/lib/datacenter/types';
import { formatEokUsd, formatPayback, formatPercent, formatSignedEokUsd } from './formatting';

interface SummaryCardsProps {
  summary: FinanceSummary;
  assumptions: FinanceAssumptions;
}

interface CardProps {
  label: string;
  value: string;
  hint: string;
  /** 값이 경고 구간일 때 색으로 표시한다. 판단은 사용자가 하되 눈에는 띄게 한다. */
  tone: 'neutral' | 'warn' | 'good';
}

/**
 * 색조는 반투명 틴트로만 준다.
 *
 * 이 프로젝트의 테마 전환은 .dark 클래스 방식인데 Tailwind v4의 `dark:` 유틸리티는
 * @custom-variant 선언이 없으면 OS 설정을 따른다. 둘이 어긋나면 밝은 배경에 밝은 글씨가
 * 남으므로, 테마와 무관하게 성립하는 알파 틴트와 -600 계열 글자색만 쓴다.
 */
const TONE_CLASS: Record<CardProps['tone'], string> = {
  neutral: 'border-border bg-muted/30',
  warn: 'border-red-500/40 bg-red-500/10',
  good: 'border-emerald-500/40 bg-emerald-500/10',
};

function Card({ label, value, hint, tone }: CardProps) {
  return (
    <div className={`rounded-lg border p-4 ${TONE_CLASS[tone]}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SummaryCards({ summary, assumptions }: SummaryCardsProps) {
  const { paybackYears, recoveryRatioAtGpuEol, npv, irr } = summary;
  const { gpuLifeYears, horizonYears } = assumptions;

  // GPU 수명 안에 회수하지 못하면 재투자 시점에 원금이 남는다 — 이 도구의 핵심 질문이다.
  const recoveredInLifetime = paybackYears !== null && paybackYears <= gpuLifeYears;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="회수기간"
        value={formatPayback(paybackYears, horizonYears)}
        hint={
          recoveredInLifetime
            ? `GPU 수명 ${gpuLifeYears}년 안에 원금을 회수한다`
            : `GPU 수명 ${gpuLifeYears}년을 넘긴다 — 재투자 시점에 원금이 남는다`
        }
        tone={recoveredInLifetime ? 'good' : 'warn'}
      />
      <Card
        label={`GPU 수명(${gpuLifeYears}년) 시점 회수율`}
        value={formatPercent(recoveryRatioAtGpuEol)}
        hint="누적 순현금 ÷ 총 투자비. 100% 미만이면 GPU를 교체할 시점에 원금을 다 건지지 못한 상태다"
        tone={recoveryRatioAtGpuEol >= 1 ? 'good' : 'warn'}
      />
      <Card
        label={`NPV (할인율 ${formatPercent(assumptions.discountRate, 0)})`}
        value={formatSignedEokUsd(npv)}
        hint={npv >= 0 ? '할인 후에도 투자비를 넘는다' : '할인하면 투자비에 미치지 못한다'}
        tone={npv >= 0 ? 'good' : 'warn'}
      />
      <Card
        label="IRR"
        value={irr === null ? '산출 불가' : formatPercent(irr)}
        hint={
          irr === null
            ? '어떤 할인율에서도 원금을 회수하지 못하는 현금흐름이다'
            : `총 순현금 ${formatEokUsd(summary.totalNetCash)} (${horizonYears}년 누적)`
        }
        tone={irr === null ? 'warn' : 'neutral'}
      />
    </div>
  );
}
