'use client';

import { useState } from 'react';
import { computeGrant } from '@/lib/disputes/grant-formula';

/** 2026년 본예산 교부금 (조원) */
const PREVIOUS_GRANT_JO = 71.67;
/** 비교용 내국세 총액 (조원) */
const INTERNAL_TAX_JO = 481;

export function GrantFormula() {
  const [growth, setGrowth] = useState(0.062);
  const [change, setChange] = useState(-0.03);
  const [rate, setRate] = useState(0.35);

  const result = computeGrant({
    previousGrantJo: PREVIOUS_GRANT_JO,
    nominalGrowth: growth,
    schoolAgeChange: change,
    reflectRate: rate,
    internalTaxJo: INTERNAL_TAX_JO,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Slider
          label="학령인구 반영률"
          value={rate}
          min={0}
          max={1}
          step={0.05}
          display={`${(rate * 100).toFixed(0)}%`}
          note="정부안은 35%. 입법조사처는 이 숫자의 근거가 충분히 제시되지 않았다고 지적했다"
          onChange={setRate}
        />
        <Slider
          label="경상성장률"
          value={growth}
          min={-0.02}
          max={0.12}
          step={0.002}
          display={`${(growth * 100).toFixed(1)}%`}
          note="3년 연평균. 명목 GDP 증가율이라 물가가 이미 포함돼 있다"
          onChange={setGrowth}
        />
        <Slider
          label="학령인구 변화율"
          value={change}
          min={-0.1}
          max={0}
          step={0.005}
          display={`${(change * 100).toFixed(1)}%`}
          note="3년 연평균. 음수는 감소를 뜻한다"
          onChange={setChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure label="새 산식" value={`${result.grantJo.toFixed(1)}조원`} />
        <Figure
          label="기존 20.79% 연동"
          value={result.legacyJo === null ? '—' : `${result.legacyJo.toFixed(1)}조원`}
        />
        <Figure
          label="차이"
          value={
            result.gapJo === null
              ? '—'
              : `${result.gapJo >= 0 ? '+' : '−'}${Math.abs(result.gapJo).toFixed(1)}조원`
          }
        />
      </div>

      {result.floorApplied && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm leading-relaxed text-foreground">
          산식 결과가 전년보다 적어 <b>감소분 보전 규정</b>이 적용됐습니다. 다만 이 보전은
          명목 금액 기준이라 호봉 승급과 공공요금 인상은 반영되지 않습니다.
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        전년도 교부금 {PREVIOUS_GRANT_JO}조원, 내국세 {INTERNAL_TAX_JO}조원을 기준값으로 둔
        계산입니다. 실제 편성에서는 추가세수를 제외한 내국세가 기준이 되므로 비교값은
        참고용입니다. 이 기본값대로 계산하면 새 산식 결과는 약 75.3조원으로, 정부가 발표한
        78조 8,718억원과는 차이가 나는데, 발표치에는 이 산식만으로는 설명되지 않는 정산분
        등이 추가로 반영돼 있기 때문입니다.
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
