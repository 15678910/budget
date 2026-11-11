'use client';

import type { YearRow } from '@/lib/basic-income/types';
import { fmtJo, fmtPeople, fmtWon } from './format';
import { NumberField } from './NumberField';
import type { InputPanelProps } from './types';

interface OutflowPanelProps extends InputPanelProps {
  firstPaying: YearRow | undefined;
}

/** 나가는 돈: 1인당 액수 × 인구 (+ 연금·건보 보전) */
export function OutflowPanel({ input, onChange, firstPaying }: OutflowPanelProps) {
  const top = input.socialInsuranceTopUp;
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">{firstPaying ? `${firstPaying.year}년 인구` : '인구'}</dt>
        <dd className="text-right text-gray-200">{firstPaying ? fmtPeople(firstPaying.population) : '-'}</dd>
        <dt className="text-gray-500">1인당 연</dt>
        <dd className="text-right text-gray-200">{fmtWon(input.monthlyPerPerson * 12)}</dd>
        <dt className="text-gray-500">첫해 필요액</dt>
        <dd className="text-right font-semibold text-gray-100">{firstPaying ? fmtJo(firstPaying.need) : '-'}</dd>
      </dl>
      <label className="flex items-center gap-2 text-sm text-gray-400">
        <input
          type="checkbox"
          checked={top.enabled}
          className="accent-blue-500"
          onChange={(e) => onChange({ socialInsuranceTopUp: { ...top, enabled: e.target.checked } })}
        />
        연금·건보 보전도 기금에서
      </label>
      {top.enabled && (
        <NumberField label="보전액(연)" unit="조" step={1} min={0} value={top.annual}
          onChange={(annual) => onChange({ socialInsuranceTopUp: { ...top, annual } })} sourceKey="socialInsuranceTopUp" />
      )}
    </div>
  );
}
