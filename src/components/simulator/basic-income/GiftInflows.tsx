'use client';

import { bequestFlow } from '@/lib/basic-income';
import type { RevenueBreakdown, SharedAsset } from '@/lib/basic-income/types';
import { fmtJo } from './format';
import { ModeSelect } from './ModeSelect';
import { NumberField } from './NumberField';
import { RevenueRow } from './RevenueRow';
import type { InputPanelProps } from './types';

interface GiftInflowsProps extends InputPanelProps {
  firstYear: RevenueBreakdown;
}

/** 유산 기부, 초과 세수 적립, 공유 자산 배당. 공유 자산만 지급/적립을 고른다. */
export function GiftInflows({ input, onChange, firstYear }: GiftInflowsProps) {
  const { bequest, surplus, sharedAssets } = input;
  const setBequest = (patch: Partial<typeof bequest>) => onChange({ bequest: { ...bequest, ...patch } });
  const setSurplus = (patch: Partial<typeof surplus>) => onChange({ surplus: { ...surplus, ...patch } });
  const setAsset = (id: string, patch: Partial<SharedAsset>) =>
    onChange({ sharedAssets: sharedAssets.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const loss = bequestFlow(bequest).generalAccountLoss;

  return (
    <>
      <RevenueRow
        title="유산 기부"
        firstYear={firstYear.bequest}
        footer={`미래 세대에 남기는 유산. 특례(나머지에 단일 세율)로 줄어드는 일반회계 상속세 ${fmtJo(loss, 2)}(연)는 따로 메워야 한다.`}
      >
        <NumberField label="대상 상속재산" unit="조" step={1} min={0} value={bequest.eligibleEstate}
          onChange={(eligibleEstate) => setBequest({ eligibleEstate })} sourceKey="bequestEstate" />
        <NumberField label="선택률" unit="%" scale={100} step={1} min={0} max={100} value={bequest.uptake}
          onChange={(uptake) => setBequest({ uptake })} sourceKey="bequestUptake" />
        <NumberField label="기부 몫" unit="%" scale={100} step={5} min={0} max={100} value={bequest.shareToFund}
          onChange={(shareToFund) => setBequest({ shareToFund })} sourceKey="bequestShare" />
        <NumberField label="상속세 실효율" unit="%" scale={100} step={1} min={0} max={100} value={bequest.effectiveTaxRate}
          onChange={(effectiveTaxRate) => setBequest({ effectiveTaxRate })} sourceKey="bequestTaxRate" />
        <NumberField label="특례 세율" unit="%" scale={100} step={1} min={0} max={100} value={bequest.specialRate}
          onChange={(specialRate) => setBequest({ specialRate })} sourceKey="bequestSpecialRate" />
      </RevenueRow>
      <RevenueRow title="초과 세수 적립" firstYear={firstYear.surplus} footer="기준선을 넘는 세수의 일부를 기금 원금에 넣는다.">
        <NumberField label="초과 세수(연)" unit="조" step={1} min={0} value={surplus.annualExcess}
          onChange={(annualExcess) => setSurplus({ annualExcess })} sourceKey="surplusExcess" />
        <NumberField label="적립 비율" unit="%" scale={100} step={5} min={0} max={100} value={surplus.saveRatio}
          onChange={(saveRatio) => setSurplus({ saveRatio })} sourceKey="surplusSaveRatio" />
      </RevenueRow>
      <RevenueRow
        title="공유 자산 배당"
        firstYear={firstYear.shared}
        footer="공공 지분(조 원)을 넣으면 해마다 배당이 들어온다. (검토 후보)는 아직 공유 자산이 아닌 산업이다."
      >
        {sharedAssets.map((a) => (
          <div key={a.id} className="col-span-2 grid grid-cols-2 items-end gap-2 sm:col-span-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <span className={`col-span-2 text-xs sm:col-span-1 sm:self-center ${a.candidate ? 'text-gray-500' : 'text-gray-300'}`}>
              {a.label}
            </span>
            <NumberField label="지분" unit="조" step={1} min={0} value={a.stake} onChange={(stake) => setAsset(a.id, { stake })} />
            <NumberField label="배당률" unit="%" scale={100} step={0.5} min={0} value={a.yieldRate}
              onChange={(yieldRate) => setAsset(a.id, { yieldRate })} sourceKey="sharedYield" />
            <ModeSelect value={a.mode} onChange={(mode) => setAsset(a.id, { mode })} label={a.label} />
          </div>
        ))}
      </RevenueRow>
    </>
  );
}
