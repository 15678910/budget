'use client';

import { EXCLUDED_REVENUES } from '@/lib/basic-income';
import type { AltRevenueInput, RevenueBreakdown } from '@/lib/basic-income/types';
import { GiftInflows } from './GiftInflows';
import { NumberField } from './NumberField';
import { RevenueRow } from './RevenueRow';
import type { InputPanelProps } from './types';

interface InflowPanelProps extends InputPanelProps {
  firstYear: RevenueBreakdown;
}

/** 들어오는 돈: 로봇세·데이터세·탄소세, 유산 기부·초과 세수·공유 자산 */
export function InflowPanel({ input, onChange, firstYear }: InflowPanelProps) {
  const { robot, data, carbon } = input.alt;
  const setAlt = <K extends keyof AltRevenueInput>(k: K, patch: Partial<AltRevenueInput[K]>) =>
    onChange({ alt: { ...input.alt, [k]: { ...input.alt[k], ...patch } } });

  return (
    <div className="space-y-3">
      <RevenueRow title="로봇세" firstYear={firstYear.robot} mode={robot.mode} onMode={(mode) => setAlt('robot', { mode })}
        footer="자동화가 끝나면 과세 기반이 줄어든다. 적립해 원금으로 남기는 편이 맞다.">
        <NumberField label="과세 기반" unit="조" step={1} min={0} value={robot.base} onChange={(base) => setAlt('robot', { base })} sourceKey="robotBase" />
        <NumberField label="세율" unit="%" scale={100} step={0.5} min={0} max={100} value={robot.rate} onChange={(rate) => setAlt('robot', { rate })} sourceKey="robotRate" />
        <NumberField label="기반 연 감소" unit="%" scale={100} step={0.5} min={0} max={100} value={robot.annualDecline} onChange={(annualDecline) => setAlt('robot', { annualDecline })} sourceKey="robotDecline" />
      </RevenueRow>
      <RevenueRow title="데이터세" firstYear={firstYear.data} mode={data.mode} onMode={(mode) => setAlt('data', { mode })}
        footer="데이터 이용이 늘수록 기반이 커진다. 해마다 바로 나누는 지급용에 맞다.">
        <NumberField label="과세 기반" unit="조" step={0.1} min={0} value={data.base} onChange={(base) => setAlt('data', { base })} sourceKey="dataBase" />
        <NumberField label="세율" unit="%" scale={100} step={0.5} min={0} max={100} value={data.rate} onChange={(rate) => setAlt('data', { rate })} sourceKey="dataRate" />
        <NumberField label="기반 연 증가" unit="%" scale={100} step={0.5} value={data.annualGrowth} onChange={(annualGrowth) => setAlt('data', { annualGrowth })} sourceKey="dataGrowth" />
      </RevenueRow>
      <RevenueRow title="탄소세" firstYear={firstYear.carbon} mode={carbon.mode} onMode={(mode) => setAlt('carbon', { mode })}
        footer="K-ETS가 이미 값을 매기는 배출에 겹쳐 매기지 않도록 과세 비율로 나머지만 잡는다. 배출이 탄소중립 연도까지 직선으로 0이 된다고 본다. 사라지는 세입이라 적립용에 맞고, 지급용으로 돌려도 영구 목표에서는 빼지 않는다.">
        <NumberField label="총배출량" unit="백만 t" step={1} min={0} value={carbon.emissionsMt} onChange={(emissionsMt) => setAlt('carbon', { emissionsMt })} sourceKey="carbonEmissions" />
        <NumberField label="과세 비율" unit="%" scale={100} step={1} min={0} max={100} value={carbon.taxableShare} onChange={(taxableShare) => setAlt('carbon', { taxableShare })} sourceKey="carbonTaxableShare" />
        <NumberField label="t당 가격" unit="원" step={1_000} min={0} value={carbon.pricePerTonWon} onChange={(pricePerTonWon) => setAlt('carbon', { pricePerTonWon })} sourceKey="carbonPrice" />
        <NumberField label="탄소중립" unit="년" step={1} value={carbon.netZeroYear} onChange={(netZeroYear) => setAlt('carbon', { netZeroYear })} sourceKey="netZeroYear" />
      </RevenueRow>
      <GiftInflows input={input} onChange={onChange} firstYear={firstYear} />
      <ul className="space-y-1 border-t border-gray-800 pt-3 text-xs text-gray-500">
        {EXCLUDED_REVENUES.map((e) => (
          <li key={e.label}>
            제외: {e.label} — {e.reason}{' '}
            {e.url ? (
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">({e.source})</a>
            ) : (
              <span>({e.source})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
