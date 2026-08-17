'use client';

import { useMemo, useState } from 'react';
import { analyze } from '@/lib/datacenter/finance';
import { validateFinance } from '@/lib/datacenter/assumptions';
import { PRESETS, reportPessimistic, consistentPessimistic } from '@/lib/datacenter/scenarios';
import type { Cooling } from '@/lib/datacenter/regional';
import type { FinanceAssumptions } from '@/lib/datacenter/types';
import { AssumptionControls } from './AssumptionControls';
import { CashflowTable } from './CashflowTable';
import { EmploymentSection } from './EmploymentSection';
import { RegionalSection } from './RegionalSection';
import { ScenarioPicker } from './ScenarioPicker';
import { SummaryCards } from './SummaryCards';
import { formatPayback, USD_KRW } from './formatting';

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1.5 mb-3 text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className={description ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

/** 보고서의 이자 계산 불일치를 두 값의 차이로 보여준다 (설계문서 §2.2b). */
function ReportDiscrepancy() {
  const reported = analyze(reportPessimistic.assumptions).summary;
  const consistent = analyze(consistentPessimistic.assumptions).summary;
  const gap =
    consistent.paybackYears !== null && reported.paybackYears !== null
      ? consistent.paybackYears - reported.paybackYears
      : null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <p className="text-base font-semibold text-foreground">
        보고서의 비관 시나리오는 이자를 다른 기준으로 계산했다
      </p>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        보고서는 비관 시나리오에서 투자비를 470억 달러로 올리면서, 이자 28억 달러는 380억 달러
        기준으로 계산한 값을 그대로 썼다. 같은 금리를 실제 투자비에 일관되게 적용하면 회수기간이
        달라진다.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">보고서 표기</p>
          <p className="text-xl font-bold tabular-nums text-foreground">
            {formatPayback(reported.paybackYears, reportPessimistic.assumptions.horizonYears)}
          </p>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">이자 일관 적용</p>
          <p className="text-xl font-bold tabular-nums text-foreground">
            {formatPayback(
              consistent.paybackYears,
              consistentPessimistic.assumptions.horizonYears,
            )}
          </p>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">차이</p>
          <p className="text-xl font-bold tabular-nums text-danger">
            {gap === null ? '산출 불가' : `+${gap.toFixed(2)}년`}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 분석 대상 시설 용량. 국가 단위 집계(18.4GW)를 붙일 때 파라미터로 바뀐다. */
const CAPACITY_MW = 1000;

const CAVEATS = [
  '이 도구는 결론을 내리지 않는다. 공식 발표치와 제3자 실측치를 나란히 놓고, 가정을 바꿨을 때 결과가 어떻게 움직이는지 보여줄 뿐이다.',
  '모든 수치에는 성격 태그가 붙는다 — [실측]은 제3자가 관측한 값, [발표]는 기업·정부가 발표한 검증 대상 값, [역산]은 공개된 다른 수치에서 계산해낸 값, [추정]은 이 도구가 가정을 두고 만든 값이다.',
  '부채비율 70%는 보고서에 명시된 값이 아니라 제시된 이자 금액에서 역산한 값이다.',
  '세금·감가상각·법인세는 이 모델에 포함되지 않았다. 운영비 안의 세금 항목(16%)만 반영된다.',
  `원화 환산은 ${USD_KRW.toLocaleString('ko-KR')}원/달러 고정 환율 [추정]이며, 환율 변동은 모델링하지 않는다.`,
  '단일 1GW 시설 기준이다. 국가 단위 집계(18.4GW)와 지방세수는 다음 단계에서 추가된다.',
  '고용 벤치마크는 100MW 기준값을 선형 확대한 것이다. 규모의 경제나 입지별 차이는 반영하지 않는다.',
  '용수 원단위와 공랭식 전력 증가율은 국내 실측 자료가 공개되지 않아 가정값 [추정]이다. 결과 해석 시 이 점을 감안해야 한다.',
];

export function DatacenterDashboard() {
  const [selectedId, setSelectedId] = useState<string>(PRESETS[0].id);
  const [overrides, setOverrides] = useState<Partial<FinanceAssumptions>>({});
  const [cooling, setCooling] = useState<Cooling>('water');

  const preset = PRESETS.find((p) => p.id === selectedId) ?? PRESETS[0];

  const { assumptions, error } = useMemo(() => {
    const merged: FinanceAssumptions = { ...preset.assumptions, ...overrides };
    try {
      validateFinance(merged);
      return { assumptions: merged, error: null };
    } catch (e) {
      // 슬라이더는 범위가 제한돼 있어 정상 조작으로는 도달하지 않지만,
      // 잘못된 입력으로 조용히 틀린 답을 내지 않도록 기본값으로 되돌린다.
      return {
        assumptions: preset.assumptions,
        error: e instanceof Error ? e.message : '가정이 올바르지 않습니다',
      };
    }
  }, [preset, overrides]);

  const { rows, summary } = useMemo(() => analyze(assumptions), [assumptions]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setOverrides({});
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          AI 데이터센터 경제성 진단
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
          1GW 데이터센터가 몇 년 만에 원금을 회수하는지, 그 답이 GPU 수명 안에 들어오는지 따져본다.
          원보고서의 계산을 그대로 재현한 뒤, 같은 보고서가 리스크로 지적한 항목을 실제로 반영하면
          결과가 어떻게 바뀌는지 비교한다.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-danger">
          {error} — 시나리오 기본값으로 계산했습니다.
        </p>
      )}

      <Section
        id="scenario"
        title="시나리오"
        description="보고서를 재현한 계산과, 보고서가 스스로 지적한 리스크를 반영한 계산을 나란히 둔다."
      >
        <ScenarioPicker selectedId={selectedId} onSelect={handleSelect} />
      </Section>

      <Section id="summary" title="핵심 지표">
        <SummaryCards summary={summary} assumptions={assumptions} />
      </Section>

      <Section
        id="discrepancy"
        title="보고서 검산"
        description="원자료를 검산하는 과정에서 확인한 계산 불일치다."
      >
        <ReportDiscrepancy />
      </Section>

      <Section id="assumptions" title="가정 조절">
        <AssumptionControls
          assumptions={assumptions}
          onChange={(patch) => setOverrides((prev) => ({ ...prev, ...patch }))}
          onReset={() => setOverrides({})}
        />
      </Section>

      <Section
        id="employment"
        title="고용"
        description="투자액이 아무리 커도 상시 일자리는 많지 않다. 발표된 고용효과가 무엇으로 설명되는지 따져본다."
      >
        <EmploymentSection assumptions={assumptions} capacityMw={CAPACITY_MW} />
      </Section>

      <Section
        id="regional"
        title="지역 영향"
        description="전력·용수·탄소·부지는 어느 지역이든 실제로 감당해야 하는 몫이다. 냉각 방식을 바꾸면 용수와 전력이 맞교환된다."
      >
        <RegionalSection
          capacityMw={CAPACITY_MW}
          cooling={cooling}
          onCoolingChange={setCooling}
        />
      </Section>

      <Section
        id="cashflow"
        title="연도별 현금흐름"
        description="누적 회수율이 100%에 도달하는 시점이 원금 회수 시점이다. GPU 수명 연차를 함께 표시한다."
      >
        <CashflowTable rows={rows} assumptions={assumptions} paybackYears={summary.paybackYears} />
      </Section>

      <Section id="caveats" title="이 도구의 한계">
        <ul className="space-y-2">
          {CAVEATS.map((caveat) => (
            <li
              key={caveat}
              className="flex gap-2 text-base leading-relaxed text-muted-foreground"
            >
              <span aria-hidden="true">·</span>
              <span>{caveat}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
