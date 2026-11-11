'use client';

import { NumberField } from './NumberField';
import type { InputPanelProps } from './types';

/** 맨 윗줄: 얼마를, 언제부터, 얼마 동안, 어떤 규칙으로 */
export function TargetControls({ input, onChange }: InputPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      <NumberField label="1인당 월" unit="원" step={10_000} min={0} value={input.monthlyPerPerson}
        onChange={(n) => onChange({ monthlyPerPerson: n })} sourceKey="monthlyPerPerson" />
      <NumberField label="지급 시작" unit="년" step={1} min={input.baseYear} value={input.payStartYear}
        onChange={(n) => onChange({ payStartYear: n })} />
      <NumberField label="기간" unit="년" step={1} min={1} max={200} value={input.horizonYears}
        onChange={(n) => onChange({ horizonYears: n })} sourceKey="horizonYears" />
      <NumberField label="인출률" unit="%" scale={100} step={0.1} min={0} value={input.withdrawalRate}
        onChange={(n) => onChange({ withdrawalRate: n })} sourceKey="withdrawalRate" />
      <NumberField label="실질수익률" unit="%" scale={100} step={0.1} value={input.realReturn}
        onChange={(n) => onChange({ realReturn: n })} sourceKey="realReturn" />
      <NumberField label="인구 연 변화율" unit="%" scale={100} step={0.1} value={input.populationGrowth}
        onChange={(n) => onChange({ populationGrowth: n })} sourceKey="populationGrowth" />
    </div>
  );
}
