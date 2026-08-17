'use client';

import {
  announcedCapacityGw,
  bySite,
  CAPACITY_2035,
  megaprojectSummary,
} from '@/lib/datacenter/megaproject';
import type { Cooling } from '@/lib/datacenter/regional';
import { formatEokFromKrw, formatJoFromKrw, formatPercent } from './formatting';

interface MegaprojectSectionProps {
  targetYear: number;
  onYearChange: (year: number) => void;
  cooling: Cooling;
}

const num = (n: number, digits = 0) =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function MegaprojectSection({
  targetYear,
  onYearChange,
  cooling,
}: MegaprojectSectionProps) {
  const s = megaprojectSummary(targetYear, cooling);
  const sites = bySite(cooling);
  const announced = announcedCapacityGw();
  const unannounced = CAPACITY_2035.value - announced;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
        <span className="text-base font-medium text-foreground">목표 연도</span>
        {[2029, 2035].map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onYearChange(y)}
            aria-pressed={targetYear === y}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              targetYear === y
                ? 'border-blue-500 bg-blue-500/10 text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {y}년 ({y === 2029 ? '8.4GW' : '18.4GW 누적'})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">계획 용량 [발표]</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{s.capacityGw}GW</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            현재 국내 전체(2.0GW, 325개소)의 {num(s.multipleOfCurrent, 1)}배. 국내 최대
            시설(100MW) {num(s.equivalentLargestSites)}개분이다.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">투자액 [발표]</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatJoFromKrw(s.investmentKrw, 0)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            데이터센터 부문 550조 원을 목표 용량에 비례 배분했다. 3대 메가프로젝트 전체는 1,500조
            원이다.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-muted-foreground">상시 일자리 [실측 벤치마크]</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {num(s.permanentJobs.low)}~{num(s.permanentJobs.high)}명
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            중앙값 {num(s.permanentJobs.mid)}명. 건설 일자리는 공사 기간에만 존재한다.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-muted-foreground">일자리 1개당 투자액</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatEokFromKrw(s.investmentPerJobKrw)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            이 도구가 답해야 할 질문 중 하나다 — 550조 원을 투자하면 상시 일자리가 몇 개 생기는가.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">전력</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            원전 {num(s.nuclearUnits, 1)}기
          </p>
          <p className="mt-2 text-sm text-muted-foreground">연 {num(s.annualTwh, 1)}TWh</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">용수 [추정]</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {s.dailyWaterTons === 0 ? '0톤/일' : `${num(s.dailyWaterTons / 1e4)}만 톤/일`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {s.dailyWaterTons === 0 ? '공랭식 기준' : '용인 클러스터 150만 톤/일과 비교해보세요'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">탄소</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            연 {num(s.annualCarbonTons / 1e4)}만 톤
          </p>
          <p className="mt-2 text-sm text-muted-foreground">전력 배출계수 적용</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground">연간 지방세 [추정]</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatEokFromKrw(s.annualTaxKrw)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            투자액의 {formatPercent(s.annualTaxPerInvestment, 3)}
          </p>
        </div>
      </div>

      {/* 입지별 배분 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-base">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-foreground">입지</th>
              <th className="px-3 py-2 text-left font-semibold text-foreground">사업자</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">용량</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">전력</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">용수</th>
              <th className="px-3 py-2 text-right font-semibold text-foreground">상시 일자리</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id} className="border-t border-border">
                <td className="px-3 py-2 text-foreground">
                  {site.name}
                  {site.note && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({site.note})</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{site.operator}</td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">
                  {site.capacityGw}GW
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {num(site.annualTwh, 1)}TWh
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {site.dailyWaterTons === 0 ? '0' : `${num(site.dailyWaterTons / 1e4, 1)}만 톤/일`}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">
                  {num(site.permanentJobsMid)}명
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="px-3 py-2 text-sm text-muted-foreground" colSpan={6}>
                발표된 입지 합계는 {announced}GW로, 2035년 계획 총량 {CAPACITY_2035.value}GW 중{' '}
                {num(unannounced, 1)}GW는 아직 입지가 공개되지 않았다. 울산은 공랭식 무용수를
                표방하므로 용수를 0으로 계산했다.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="rounded-lg border border-border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
        집계는 단순 선형 스케일업이다 — 1GW 결과 × N. 규모의 경제, 입지별 전력·용지 비용 차이,
        동시 건설로 인한 자재·인력 단가 상승을 반영하지 않는다. 선형 가정은 보수적이지도
        낙관적이지도 않은 중립 기준선이며, 실제 값은 어느 쪽으로든 벗어날 수 있다.
      </p>
    </div>
  );
}
