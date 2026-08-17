'use client';

import {
  amenityImpact,
  carbonImpact,
  gridRisk,
  landImpact,
  powerImpact,
  propertyEffect,
  waterImpact,
  type Cooling,
} from '@/lib/datacenter/regional';
import { formatEokUsd, formatPercent } from './formatting';

interface RegionalSectionProps {
  capacityMw: number;
  cooling: Cooling;
  onCoolingChange: (cooling: Cooling) => void;
}

const num = (n: number, digits = 0) =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

export function RegionalSection({ capacityMw, cooling, onCoolingChange }: RegionalSectionProps) {
  const gw = capacityMw / 1000;
  const power = powerImpact(gw, cooling);
  const water = waterImpact(gw, cooling);
  const carbon = carbonImpact(gw, cooling);
  const land = landImpact(gw);
  const amenity = amenityImpact(gw);
  const grid = gridRisk();
  const property = propertyEffect();

  return (
    <div className="space-y-4">
      {/* 냉각 방식 — 용수와 전력의 맞교환을 직접 보게 한다 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-3">
        <span className="text-base font-medium text-foreground">냉각 방식</span>
        {(['water', 'air'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCoolingChange(c)}
            aria-pressed={cooling === c}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              cooling === c
                ? 'border-blue-500 bg-blue-500/10 text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {c === 'water' ? '수랭식' : '공랭식 (무용수)'}
          </button>
        ))}
        <span className="text-sm text-muted-foreground">
          SK 울산이 공랭식 무용수를 표방한다. 용수를 0으로 만드는 대신 전력이 늘어난다 [추정].
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="전력 [역산]"
          value={`원전 ${num(power.nuclearUnits, 1)}기`}
          note={`연 ${num(power.annualTwh, 1)}TWh. 18.4GW를 원전 10여 기로 본 정부 발표에서 역산한 비율이다.${
            power.coolingPenaltyTwh > 0
              ? ` 공랭식 선택으로 ${num(power.coolingPenaltyTwh, 2)}TWh가 더 든다.`
              : ''
          }`}
        />
        <Metric
          label="용수 [추정]"
          value={water.dailyTons === 0 ? '0톤/일' : `${num(water.dailyTons)}톤/일`}
          note={
            water.dailyTons === 0
              ? '공랭식은 용수를 쓰지 않는다. 대신 전력이 늘어난다.'
              : `영산강·섬진강 장래 물부족 전망량(36.8만 톤/일)의 ${formatPercent(
                  water.shareOfProjectedShortage,
                )}에 해당한다.`
          }
        />
        <Metric
          label="탄소 [실측 계수]"
          value={`연 ${num(carbon.annualTons / 1e4)}만 톤`}
          note={`2035년까지 누적 ${num(
            carbon.cumulative2035Tons / 1e4,
          )}만 톤. 18.4GW 기준 8,500만 톤 추산을 용량 비례로 환산했다.`}
        />
        <Metric
          label="부지 [발표]"
          value={`${num(land.pyeongLow / 1e4)}~${num(land.pyeongHigh / 1e4)}만 평`}
          note={`최대 ${num(land.km2High, 2)}㎢ — 축구장 ${num(
            land.footballFields,
          )}면, 여의도 ${num(land.yeouidoRatio, 2)}배. 농지 전용 시 ${num(
            land.farmlandPyeong / 1e4,
          )}만 평이 전용된다 [추정 50%].`}
        />
      </div>

      {/* 생활환경 — 부정 방향의 증거 */}
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
        <p className="text-base font-semibold text-foreground">생활환경 영향 [실측]</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          인근 측정 소음은 {amenity.noiseDb}dB로 지하철 소음(80dB)보다 높다. 주변 온도는 평균 +
          {amenity.tempRiseAvg}℃, 최대 +{amenity.tempRiseMax}℃ 상승이 관측됐다. 건강피해 비용은 연{' '}
          {formatEokUsd(amenity.healthCostLowUsd, 1)}~{formatEokUsd(amenity.healthCostHighUsd, 1)},
          조기사망은 연 {num(amenity.prematureDeathsLow, 1)}~{num(amenity.prematureDeathsHigh, 1)}
          명으로 추정된다.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          소음과 온도는 시설 1개 측정값을 그대로 쓴다. 건강피해만 용량에 비례해 확대했으므로 그
          부분은 추정이다.
        </p>
      </div>

      {/* 부동산 — 양방향 증거를 모두 보여준다 */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-base font-semibold text-foreground">
          부동산 영향은 통념과 반대 방향의 증거가 있다
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          가격 측면에서는 {property.priceEvidence}. 반면 주민들이 실제 비용으로 지목하는 것은
          다음이다 — {property.residentConcerns.join(', ')}.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          가격은 중립~긍정, 생활환경은 부정이라는 비대칭이 이 사안의 실제 모습이다. 어느 쪽으로도
          단정하지 않는다.
        </p>
      </div>

      {/* 송전 지연 — 재무 레이어와 수동으로 연결된다 */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-base font-semibold text-foreground">송전망 지연 위험 [실측]</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          11차 송변전설비계획의 변전설비 25개 중 14개({formatPercent(grid.delayRate, 0)})가
          지연됐다. 통상 지연 기간 {grid.typicalDelayYears}년 [추정]을 적용하면 기대 지연은{' '}
          {num(grid.expectedDelayYears, 1)}년이다.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          이 값은 회수기간에 자동으로 반영되지 않는다. 위 &lsquo;가정 조절&rsquo;의 가동 개시 지연을
          직접 움직여 &lsquo;가동이 2년 늦으면 회수기간이 어떻게 되는가&rsquo;를 확인하세요.
        </p>
      </div>
    </div>
  );
}
