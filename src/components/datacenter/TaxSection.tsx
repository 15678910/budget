'use client';

import { localTax } from '@/lib/datacenter/tax';
import type { FinanceAssumptions } from '@/lib/datacenter/types';
import { formatEokFromKrw, formatJoKrw, formatPercent } from './formatting';

interface TaxSectionProps {
  assumptions: FinanceAssumptions;
  capacityMw: number;
  permanentJobs: number;
}

/**
 * CAPEX 구성을 과세/비과세로 나눠 보여준다.
 *
 * 인라인 스타일이 금지돼 있어(CLAUDE.md) 동적 폭 막대 대신 비율 수치와 테두리 색으로
 * 구분한다. 전하려는 것은 정확한 길이가 아니라 '서버·GPU가 통째로 빠진다'는 사실이다.
 */
function BaseRow({ share, label, taxable }: { share: number; label: string; taxable: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border-l-4 bg-background/50 px-3 py-2 ${
        taxable ? 'border-l-blue-500' : 'border-l-muted-foreground/40'
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums text-foreground">
        {formatPercent(share, 1)}
      </span>
    </div>
  );
}

export function TaxSection({ assumptions, capacityMw, permanentJobs }: TaxSectionProps) {
  const tax = localTax(
    assumptions.capexUsd,
    assumptions.capexSplitServer,
    assumptions.capexSplitBuilding,
    capacityMw / 1000,
    permanentJobs,
  );
  const { base } = tax;

  const rows = [
    { name: '재산세 (건축물)', value: tax.propertyTaxBuildingKrw, rate: '0.25%' },
    { name: '재산세 (별도합산토지)', value: tax.propertyTaxLandKrw, rate: '0.3%' },
    { name: '지역자원시설세', value: tax.regionalResourceTaxKrw, rate: '0.08%' },
    { name: '지방교육세', value: tax.localEducationTaxKrw, rate: '재산세의 20%' },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <p className="text-base font-semibold text-foreground">
          투자액의 {formatPercent(base.taxableShare, 0)}에만 지방세가 붙는다
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          지방세법상 재산세 과세대상은 토지·건축물·주택·선박·항공기다. 서버와 GPU는 여기에
          해당하지 않는다. 투자비의 절반 이상을 차지하는 서버·GPU가 과세표준에서 통째로 빠지므로,
          투자 규모가 아무리 커도 지방세수는 건물과 토지에만 붙는다.
        </p>
        <div className="mt-3 space-y-2">
          <BaseRow share={assumptions.capexSplitServer} label="서버·GPU — 과세대상 아님" taxable={false} />
          <BaseRow share={assumptions.capexSplitBuilding} label="건축물 — 전액 과세" taxable />
          <BaseRow
            share={base.otherTaxableKrw / base.capexKrw}
            label="네트워크·기타 중 과세분"
            taxable
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">일회성 취득세 [추정]</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatEokFromKrw(tax.acquisitionTaxKrw)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            세율 4%에 산업단지·기회발전특구 감면 50%를 적용했다. 투자액의{' '}
            {formatPercent(tax.oneTimePerCapex, 2)}다.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">연간 지방세 [추정]</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatEokFromKrw(tax.annualTotalKrw)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            투자액 {formatJoKrw(assumptions.capexUsd)}의{' '}
            {formatPercent(tax.annualPerCapex, 3)}에 해당한다.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">상시 일자리 1개당 세수</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {tax.annualPerJobKrw === null
              ? '산출 불가'
              : formatEokFromKrw(tax.annualPerJobKrw, 1)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            상시 {Math.round(permanentJobs).toLocaleString('ko-KR')}명 기준 연간 세수다.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] text-base">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-foreground">세목</th>
              <th className="px-3 py-2 text-left font-semibold text-foreground">적용 세율</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">연간 세수</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-border">
                <td className="px-3 py-2 text-foreground">{row.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{row.rate}</td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">
                  {formatEokFromKrw(row.value, 1)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-3 py-2 text-sm text-muted-foreground" colSpan={3}>
                국내 데이터센터의 실제 지방세 납부액은 공개 사례가 없다. 법정 세율에서 직접 계산한
                값이므로 전체가 [추정]이다. 시가표준액 비율 70%, 부지 단가 평당 50만 원을
                가정했다.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
