'use client';

import { useState } from 'react';
import { computeGrant } from '@/lib/disputes/grant-formula';
import { FIGURE_KIND_LABEL } from '@/lib/datacenter/types';
import type { FigureKind } from '@/lib/datacenter/types';
import { RegionalImpactTable } from './RegionalImpactTable';

/** 개정안 부칙 제3조가 정한 법정 기준금액 (75조 6,901억 8,400만원) */
const PREVIOUS_GRANT_JO = 75.69018;
/**
 * 비교용 내국세 총액 (조원) — 역산값이다.
 *
 * 정부가 밝힌 '기존 산식 유지 시 약 100조원'을 20.79%로 나눠(100 ÷ 0.2079) 되돌린
 * 수치이지, 출처가 있는 내국세 전망치가 아니다. 따라서 이 값으로 계산한 '기존 20.79%
 * 연동' 결과는 약 100조원을 독립적으로 검증한 것이 아니라 그대로 재확인한 것이다.
 */
const INTERNAL_TAX_BACKSOLVED_JO = 481;

export function GrantFormula() {
  const [growth, setGrowth] = useState(0.062);
  const [change, setChange] = useState(-0.0537);
  const [rate, setRate] = useState(0.35);

  const result = computeGrant({
    previousGrantJo: PREVIOUS_GRANT_JO,
    nominalGrowth: growth,
    schoolAgeChange: change,
    reflectRate: rate,
    internalTaxJo: INTERNAL_TAX_BACKSOLVED_JO,
  });

  const cutEok = result.gapJo !== null && result.gapJo < 0 ? Math.abs(result.gapJo) * 10000 : 0;

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
          note="3년 연평균. 명목 GDP 증가율이라 물가가 이미 포함돼 있다. 정부가 실제로 사용한 값은 공개되지 않았다"
          onChange={setGrowth}
        />
        <Slider
          label="학령인구 변화율"
          value={change}
          min={-0.1}
          max={0}
          step={0.001}
          display={`${(change * 100).toFixed(1)}%`}
          note="개정안 제3조 제3항은 학령인구를 3세부터 17세까지로 정의한다. 교부금은 초·중등 재원인데 영유아가 포함된다"
          onChange={setChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure label="새 산식" value={`${result.grantJo.toFixed(1)}조원`} />
        <Figure
          label="기존 20.79% 연동"
          kind="derived"
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
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-base leading-relaxed text-foreground">
          산식 결과가 전년보다 적어 <b>감소분 보전 규정</b>이 적용됐습니다. 다만 이 보전은
          명목 금액 기준이라 호봉 승급과 공공요금 인상은 반영되지 않습니다.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-foreground">
          기존 연동을 유지했다면, 우리 지역은 얼마를 더 받았나
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          이 표의 차액은 전년도 대비 삭감액이 아닙니다. 기존 20.79% 연동을 유지했다면 받았을
          금액과 새 산식 결과의 차이이며, 개정안에는 전년도 금액 아래로 내려가지 않도록 하는
          보전 규정이 있습니다. 전국 차액을 시도별 이전수입 비중으로 안분했는데, 이전수입에는
          교부금 외에 국고보조금과 지방자치단체 전입금이 섞여 있어 정확한 교부금 배분액은
          아니고 지역 간 상대적 크기를 보기 위한 근사입니다.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          &lsquo;비인건비 세출 대비&rsquo;는 그 차액이 인건비를 뺀 세출에서 차지하는
          비율입니다. 인건비는 단기에 줄이기 어려우므로, 이 비율이 높을수록 시설·교육과정·
          복지에서 감당해야 할 몫이 큽니다.
        </p>
        <RegionalImpactTable cutEok={cutEok} />
      </div>

      <p className="text-base leading-relaxed text-muted-foreground">
        전년도 교부금 {PREVIOUS_GRANT_JO}조원은 개정안 부칙 제3조가 정한 법정 기준금액(75조
        6,901억 8,400만원)입니다. 학령인구 변화율의 기본값 −5.4%는 정부가 발표한 2027년
        교부금 78조 8,718억원을 역산해 얻은 값입니다. 정부는 실제로 사용한 경상성장률과
        학령인구 변화율을 공개하지 않았으므로, 이 값은 경상성장률을 6.2%로 가정했을 때
        발표치를 재현하는 조합일 뿐입니다.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        참고로 2025년 초·중·고 학생 수의 실제 감소율은 2.3%였습니다. 발표치를 재현하려면
        그보다 훨씬 가파른 감소율이 필요한데, 이는 개정안이 학령인구를 3~17세로 정의해
        영유아까지 포함한 결과로 보입니다. 오른쪽 &lsquo;기존 20.79% 연동&rsquo; 값은 정부가
        밝힌 &lsquo;약 100조원&rsquo;을 20.79%로 역산해 내국세({INTERNAL_TAX_BACKSOLVED_JO}
        조원)를 되돌린 뒤 다시 곱한 것이라, 독립적인 검증이 아니라 같은 값을 재확인한
        것입니다.
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
        aria-valuetext={display}
      />
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Figure({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind?: FigureKind;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-base text-muted-foreground">
        {label}
        {kind && <span className="ml-1 font-mono text-sm">{FIGURE_KIND_LABEL[kind]}</span>}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
