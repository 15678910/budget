'use client';

import { useState } from 'react';

/** 여유자금 기본값 (조원) */
const IDLE_FUND_JO = 104.4;

export function FundScenario() {
  const [annualReturn, setAnnualReturn] = useState(0.04);
  const [years, setYears] = useState(3);

  const endingJo = IDLE_FUND_JO * Math.pow(1 + annualReturn, years);
  const gainJo = endingJo - IDLE_FUND_JO;
  const gainPct = (gainJo / IDLE_FUND_JO) * 100;
  const isLoss = gainJo < 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slider
          label="연 수익률"
          value={annualReturn}
          min={-0.2}
          max={0.1}
          step={0.005}
          display={`${(annualReturn * 100).toFixed(1)}%`}
          note="2008년 금융위기에 주요 연기금은 −20%대를 기록했다"
          onChange={setAnnualReturn}
        />
        <Slider
          label="보유 기간"
          value={years}
          min={1}
          max={10}
          step={1}
          display={`${years}년`}
          note="세수 결손이 나면 이 기간을 채우지 못하고 헐어야 한다"
          onChange={setYears}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure label="원금" value={`${IDLE_FUND_JO.toFixed(1)}조원`} />
        <Figure label={`${years}년 후`} value={`${endingJo.toFixed(1)}조원`} />
        <Figure
          label="손익"
          value={`${gainJo >= 0 ? '+' : '−'}${Math.abs(gainJo).toFixed(1)}조원 (${gainPct >= 0 ? '+' : '−'}${Math.abs(gainPct).toFixed(1)}%)`}
        />
      </div>

      {isLoss && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm leading-relaxed text-foreground">
          손실 구간입니다. 세수 결손으로 재정 보강이 필요해지는 시점은 자산가격이 떨어지는
          시점과 대체로 겹칩니다. 손실을 확정한 채로 인출해야 하는 상황이 이 기금의 구조적
          위험입니다.
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        여유자금 {IDLE_FUND_JO}조원이 전액 같은 수익률로 운용된다고 가정한 단순 복리
        계산입니다. 실제 운용은 자산군별 배분과 인출 일정에 따라 달라집니다.
      </p>
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
      />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
