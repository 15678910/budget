'use client';

import type { FinanceAssumptions } from '@/lib/datacenter/types';
import { formatEokUsd, formatPercent } from './formatting';

interface AssumptionControlsProps {
  assumptions: FinanceAssumptions;
  onChange: (patch: Partial<FinanceAssumptions>) => void;
  onReset: () => void;
}

interface SliderProps {
  label: string;
  /** 출처 태그. 이 값이 실측인지 발표인지 역산인지 화면에서 바로 보이게 한다. */
  tag: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  note: string;
  onChange: (value: number) => void;
}

function Slider({ label, tag, value, display, min, max, step, note, onChange }: SliderProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-base font-medium text-foreground">
          {label}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{tag}</span>
        </label>
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
      />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

const BILLION = 1e9;

export function AssumptionControls({ assumptions, onChange, onReset }: AssumptionControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-base text-muted-foreground">
          가정을 바꾸면 결과가 어떻게 움직이는지 확인하세요. 판단은 사용자가 합니다.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          시나리오 기본값으로
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Slider
          label="총 투자비 (CAPEX)"
          tag="[발표]"
          value={assumptions.capexUsd / BILLION}
          display={formatEokUsd(assumptions.capexUsd)}
          min={20}
          max={80}
          step={1}
          note="보고서 380억~470억 달러. 서버·GPU 55%, 건물 30%, 기타 15%로 구성된다."
          onChange={(v) => onChange({ capexUsd: v * BILLION })}
        />

        <Slider
          label="연 매출 (1년차)"
          tag="[발표]"
          value={assumptions.revenueYear1Usd / BILLION}
          display={formatEokUsd(assumptions.revenueYear1Usd)}
          min={2}
          max={20}
          step={0.5}
          note="보고서의 장기계약 기준 120억 달러. 계약이 갱신되면 시세를 따라간다."
          onChange={(v) => onChange({ revenueYear1Usd: v * BILLION })}
        />

        <Slider
          label="임대료 연간 하락률"
          tag="[역산]"
          value={assumptions.rentDeclineAnnual}
          display={formatPercent(assumptions.rentDeclineAnnual)}
          min={0}
          max={0.4}
          step={0.005}
          note="시간당 $9 → $4 (3년)에서 역산한 값이 23.5%다. 보고서는 이 하락을 회수기간 계산에 넣지 않았다."
          onChange={(v) => onChange({ rentDeclineAnnual: v })}
        />

        <Slider
          label="금리"
          tag="[발표]"
          value={assumptions.interestRate}
          display={formatPercent(assumptions.interestRate, 2)}
          min={0.03}
          max={0.15}
          step={0.0005}
          note="빅테크 5~7%, 네오클라우드 10~15%. 보고서는 이자 금액만 밝히고 금리는 밝히지 않았다."
          onChange={(v) => onChange({ interestRate: v })}
        />

        <Slider
          label="부채비율"
          tag="[역산]"
          value={assumptions.debtRatio}
          display={formatPercent(assumptions.debtRatio, 0)}
          min={0}
          max={0.95}
          step={0.05}
          note="보고서에 명시되지 않은 값이다. 제시된 이자 금액에서 역산하면 70%가 나온다."
          onChange={(v) => onChange({ debtRatio: v })}
        />

        <Slider
          label="GPU 수명"
          tag="[발표]"
          value={assumptions.gpuLifeYears}
          display={`${assumptions.gpuLifeYears}년`}
          min={3}
          max={8}
          step={1}
          note="보고서 3~5년. 이 시점까지 원금을 회수하지 못하면 빚을 진 채로 GPU를 교체해야 한다."
          onChange={(v) => onChange({ gpuLifeYears: v })}
        />

        <Slider
          label="가동 개시 지연"
          tag="[추정]"
          value={assumptions.commissioningDelayYears}
          display={`${assumptions.commissioningDelayYears}년`}
          min={0}
          max={5}
          step={1}
          note="송전망 지연 시나리오. 해당 기간 매출은 0이지만 이자와 운영비는 계속 나간다."
          onChange={(v) => onChange({ commissioningDelayYears: v })}
        />

        <Slider
          label="가동률"
          tag="[추정]"
          value={assumptions.utilization}
          display={formatPercent(assumptions.utilization, 0)}
          min={0.3}
          max={1}
          step={0.05}
          note="수요가 계약 물량에 미치지 못할 경우를 보려면 낮춰보세요."
          onChange={(v) => onChange({ utilization: v })}
        />
      </div>
    </div>
  );
}
