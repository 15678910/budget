'use client';

import { solveFor, tornado, type NumericParam } from '@/lib/datacenter/sensitivity';
import type { FinanceAssumptions } from '@/lib/datacenter/types';
import { formatPercent } from './formatting';

interface SensitivitySectionProps {
  assumptions: FinanceAssumptions;
}

const PARAMS: NumericParam[] = [
  'revenueYear1Usd',
  'capexUsd',
  'interestRate',
  'rentDeclineAnnual',
  'utilization',
  'opexAnnualUsd',
  'debtRatio',
];

/**
 * 회수기간을 사람이 읽는 형태로.
 *
 * '범위 초과'와 '미회수'를 구분한다. 가동률 120% 같은 값은 계산이 불가능한 것이지
 * 회수에 실패한 것이 아니다. 둘을 뭉뚱그리면 계산할 수 없는 변수가 가장 중요한 변수로 둔갑한다.
 */
function metricText(v: number | null, horizon: number, outOfRange: boolean): string {
  if (outOfRange) return '범위 초과';
  if (v === null) return `${horizon}년 내 미회수`;
  if (!Number.isFinite(v)) return '미회수';
  return `${v.toFixed(2)}년`;
}

export function SensitivitySection({ assumptions }: SensitivitySectionProps) {
  const rows = tornado(assumptions, PARAMS, 0.2, 'paybackYears');

  // "GPU 수명 안에 회수하려면 임대료 하락률이 몇 % 이하여야 하는가"
  const rentLimit = solveFor(
    assumptions,
    'rentDeclineAnnual',
    'paybackYears',
    assumptions.gpuLifeYears,
    0,
    0.6,
  );
  // "금리가 몇 %를 넘으면 GPU 수명 안에 회수하지 못하는가"
  const rateLimit = solveFor(
    assumptions,
    'interestRate',
    'paybackYears',
    assumptions.gpuLifeYears,
    0.01,
    0.6,
  );

  const maxSwing = rows.reduce(
    (acc, r) => (r.swing !== null && Number.isFinite(r.swing) ? Math.max(acc, r.swing) : acc),
    0,
  );

  return (
    <div className="space-y-4">
      {/* 역산 — 이 도구가 답해야 할 질문 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">
            GPU 수명 {assumptions.gpuLifeYears}년 안에 회수하려면
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {rentLimit === null
              ? '임대료 하락 조건으로는 불가'
              : `임대료 하락 ${formatPercent(rentLimit)} 이하`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {rentLimit === null
              ? '현재 가정에서는 임대료 하락률을 어떤 값으로 바꿔도 이 목표를 달성할 수 없다.'
              : `현재 설정은 ${formatPercent(
                  assumptions.rentDeclineAnnual,
                )}다. 이 값을 넘어서면 GPU를 교체할 시점에 원금이 남는다.`}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">금리 한계선</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {rateLimit === null ? '금리 조건으로는 불가' : `${formatPercent(rateLimit, 2)} 이하`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {rateLimit === null
              ? '현재 가정에서는 금리를 낮춰도 GPU 수명 안에 회수할 수 없다. 다른 조건이 이미 결과를 결정하고 있다는 뜻이다.'
              : `현재 설정은 ${formatPercent(
                  assumptions.interestRate,
                  2,
                )}다. 네오클라우드 금리대(10~15%)에서 이 선을 넘는지 확인해보세요.`}
          </p>
        </div>
      </div>

      {/* 토네이도 — 무엇이 결과를 지배하는가 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] text-base">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-foreground">가정</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">−20%일 때</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">+20%일 때</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">변화폭</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dominant =
                row.swing !== null && Number.isFinite(row.swing) && row.swing >= maxSwing * 0.5;
              return (
                <tr
                  key={row.param}
                  className={`border-t border-border ${dominant ? 'bg-amber-500/10' : ''}`}
                >
                  <td className="px-3 py-2 font-medium text-foreground">{row.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {metricText(row.lowMetric, assumptions.horizonYears, row.lowOutOfRange)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {metricText(row.highMetric, assumptions.horizonYears, row.highOutOfRange)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                    {row.swing === null
                      ? '산출 불가'
                      : Number.isFinite(row.swing)
                        ? `${row.swing.toFixed(2)}년`
                        : '미회수 발생'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-3 py-2 text-sm leading-relaxed text-muted-foreground" colSpan={4}>
                각 가정을 ±20% 흔들었을 때 회수기간이 얼마나 움직이는지 본다. 위에 있을수록 결과를
                크게 좌우한다. 변화폭이 0인 항목은 현재 시나리오에서 그 가정이 결과에 영향을 주지
                않는다는 뜻이다(예: 임대료 하락률이 0으로 고정된 재현 시나리오). &lsquo;범위 초과&rsquo;는
                흔든 값이 유효 범위를 벗어나 계산할 수 없다는 뜻이며(예: 가동률 120%), 회수 실패와는
                다르다.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
