'use client';

import { estimateJobs, laborCostCrosscheck, verifyClaim } from '@/lib/datacenter/employment';
import {
  ULSAN_CLAIMED_EFFECT,
  ULSAN_PERMANENT,
  VIRGINIA_INVESTMENT_PER_JOB,
} from '@/lib/datacenter/sources';
import type { FinanceAssumptions } from '@/lib/datacenter/types';
import { formatEokKrw, formatEokUsd, formatJoKrw, formatManUsd } from './formatting';

interface EmploymentSectionProps {
  assumptions: FinanceAssumptions;
  /** 시설 용량 (MW). 현재는 1GW 고정이며 국가 단위 집계에서 확장된다. */
  capacityMw: number;
}

const jobs = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}명`;

export function EmploymentSection({ assumptions, capacityMw }: EmploymentSectionProps) {
  const result = estimateJobs(capacityMw, assumptions.capexUsd);
  const verdict = verifyClaim(ULSAN_CLAIMED_EFFECT.value, ULSAN_PERMANENT.value);
  // 보고서의 운영비 구성에서 인건비는 5%다.
  const crosscheck = laborCostCrosscheck(assumptions.opexAnnualUsd, 0.05, capacityMw);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">상시 일자리 [실측 벤치마크]</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {jobs(result.permanent.low)}~{jobs(result.permanent.high)}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            중앙값 {jobs(result.permanent.mid)}. 출처마다 10배까지 차이가 나므로 단일값으로
            제시하지 않는다.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">건설 일자리 (한시적)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {jobs(result.construction.low)}~{jobs(result.construction.high)}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            공사 기간에만 존재한다. 준공 후에는 상시 인력만 남는다.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">상시 일자리 1개당 투자액</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatEokKrw(result.investmentPerJobUsd)}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            투자 1조 원당 {result.jobsPerTrillionKrw.toFixed(1)}명. 총 투자{' '}
            {formatJoKrw(assumptions.capexUsd)} 기준이다.
          </p>
        </div>
      </div>

      {/* 서로 다른 방식으로 구한 두 값이 얼마나 가까운지 보여준다 */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm font-semibold text-foreground">
          미국 실측치와 대조하면 어떤가
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          버지니아주 실측은 투자 {formatManUsd(VIRGINIA_INVESTMENT_PER_JOB.value)}(약{' '}
          {formatEokKrw(VIRGINIA_INVESTMENT_PER_JOB.value)})당 상시 일자리 1명이다. 같은 밀도를 이 투자액에 적용하면{' '}
          {jobs(result.virginiaEquivalentJobs)}이 되고, 벤치마크 중앙값은{' '}
          {jobs(result.permanent.mid)}이다. 서로 다른 방식으로 구한 두 값이 같은 자릿수에
          있다는 것은 추정이 크게 빗나가지 않았다는 뜻이다.
        </p>
      </div>

      {/* §2.4 발표 고용효과 검증 */}
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <p className="text-sm font-semibold text-foreground">
          발표된 고용창출 효과는 상시 인력의 {Math.round(verdict.multiple)}배다
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          SK 울산의 공식 발표는 상시 근무인력 {jobs(verdict.baselineJobs)}, 고용창출 효과{' '}
          {jobs(verdict.claimedJobs)}이다. 간접·유발 효과를 포함한 수치로 보이나, 산업연관표
          취업유발계수는 통상 직접고용의 2~3배 수준이다. 그 범위로는{' '}
          {jobs(verdict.impliedByTypical.low)}~{jobs(verdict.impliedByTypical.high)}까지만 설명되며,
          발표치를 설명하려면 통상 계수의 {verdict.unexplainedFactor.toFixed(0)}배가 더 필요하다.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          이 계산은 간접효과를 부정하지 않는다. 다만 발표치에는 별도의 산출 근거가 필요하다는 뜻이다.
        </p>
      </div>

      {/* §2.3 인건비 교차검증 */}
      <div
        className={`rounded-lg border p-4 ${
          crosscheck.overlaps
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-border bg-muted/30'
        }`}
      >
        <p className="text-sm font-semibold text-foreground">
          {crosscheck.overlaps
            ? '독립적인 두 출처가 같은 답을 가리킨다'
            : '역산값이 실측 범위를 벗어난다'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          운영비 {formatEokUsd(assumptions.opexAnnualUsd)}의 인건비 5%를 1인당 연 15만 달러로
          나누면 {jobs(crosscheck.impliedHeadcount)}이 나온다. 실측 벤치마크(100MW당 30~50명)를
          같은 용량에 적용하면 {jobs(crosscheck.benchmarkLow)}~{jobs(crosscheck.benchmarkHigh)}
          이다.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          보고서의 인건비 5% 가정은 과소평가가 아니다. 데이터센터는 원래 사람을 거의 쓰지 않는
          사업이며, 이 점이 &lsquo;투자 대비 일자리&rsquo;를 따질 때 핵심이다.
        </p>
      </div>
    </div>
  );
}
