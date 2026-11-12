'use client';

import { useMemo, useState } from 'react';
import {
  DEFAULT_FUND_RULES,
  DEFAULT_FUTURE_FUND,
  DEFAULT_INPUT,
  firstPassingYear,
  maxSustainableNow,
  perpetualTarget,
  runFundRules,
  runFutureFundScenarios,
  sanitizeInput,
  simulate,
} from '@/lib/basic-income';
import type { FundRuleInput, SimInput } from '@/lib/basic-income/types';
import { BudgetCompare } from './BudgetCompare';
import { ExportButtons } from './ExportButtons';
import { FundPanel } from './FundPanel';
import { FundRuleTable } from './FundRuleTable';
import { InflowPanel } from './InflowPanel';
import { OutflowPanel } from './OutflowPanel';
import { ScenarioTable } from './ScenarioTable';
import { SourceList } from './SourceList';
import { TargetControls } from './TargetControls';
import type { InputPatch } from './types';
import { VerdictCard } from './VerdictCard';
import { YearChart } from './YearChart';

const SECTION_TITLE = 'mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400 md:text-base';
const BOX = 'border border-gray-800 p-4 md:p-5';

/**
 * AI 기본소득 기금 시뮬레이터: 들어오는 돈 → 기금 → 나가는 돈을 해마다 한 칸씩 계산하고,
 * 기간 내내 원금을 지키며 줄 수 있는지 판정한다.
 */
export function BasicIncomeFundSimulator() {
  const [input, setInput] = useState<SimInput>(DEFAULT_INPUT);
  const onChange: InputPatch = (patch) => setInput((prev) => ({ ...prev, ...patch }));

  const clean = useMemo(() => sanitizeInput(input), [input]);
  const result = useMemo(() => simulate(clean), [clean]);
  const now = useMemo(() => maxSustainableNow(clean), [clean]);
  const passYear = useMemo(() => firstPassingYear(clean), [clean]);
  const target = useMemo(() => perpetualTarget(clean), [clean]);
  const scenarios = useMemo(() => runFutureFundScenarios(clean, DEFAULT_FUTURE_FUND), [clean]);
  const ruleInput = useMemo<FundRuleInput>(
    () => ({
      ...DEFAULT_FUND_RULES,
      baseYear: clean.baseYear,
      annualInflow: clean.surplus.annualExcess,
      realReturn: clean.realReturn,
      withdrawalRate: clean.withdrawalRate,
      population0: clean.population0,
      populationGrowth: clean.populationGrowth,
    }),
    [clean],
  );
  const fundRules = useMemo(() => runFundRules(ruleInput), [ruleInput]);

  const first = result.rows[0];
  const firstPaying = result.rows.find((r) => r.paying);
  const last = result.rows[result.rows.length - 1];

  return (
    <div className="bi-print-root space-y-6 bg-gray-950 px-4 py-6 text-gray-300 md:px-8">
      <header>
        <h2 className="text-xl font-bold text-gray-100 md:text-2xl">AI 기본소득 기금 시뮬레이터</h2>
        <p className="mt-1 text-sm text-gray-400">
          로봇세·데이터세·탄소세와 유산 기부를 기금에 모아, 원금을 지키며 1인당 기본소득을 얼마나 오래 줄 수 있는지 본다.
          금액은 2027년 불변가격 실질 조 원. 입력칸 옆 배지는 값의 종류(1차 자료·필자 계산·가정)다.
        </p>
      </header>

      <section className={BOX}>
        <h3 className={SECTION_TITLE}>목표</h3>
        <TargetControls input={input} onChange={onChange} />
      </section>

      <section id="bi-flow" className="grid gap-4 lg:grid-cols-[3fr_2fr_2fr]">
        <div className={BOX}>
          <h3 className={SECTION_TITLE}>① 들어오는 돈</h3>
          {first && <InflowPanel input={input} onChange={onChange} firstYear={first.revenues} />}
        </div>
        <div className={BOX}>
          <h3 className={SECTION_TITLE}>② 기금</h3>
          <FundPanel input={input} onChange={onChange} last={last} target={target} />
        </div>
        <div className={BOX}>
          <h3 className={SECTION_TITLE}>③ 나가는 돈</h3>
          <OutflowPanel input={input} onChange={onChange} firstPaying={firstPaying} />
        </div>
      </section>

      <section id="bi-verdict">
        <h3 className={SECTION_TITLE}>지속가능 판정</h3>
        <VerdictCard input={clean} verdict={result.verdict} now={now} passYear={passYear} progress={target.progress} />
      </section>

      <section className={BOX}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-blue-400 md:text-base">연도별 흐름</h3>
          <ExportButtons rows={result.rows} fileYear={clean.baseYear} />
        </div>
        <YearChart rows={result.rows} />
      </section>

      <section id="bi-scenarios" className={BOX}>
        <h3 className={SECTION_TITLE}>미래대응기금 쓰임새 비교</h3>
        <ScenarioTable rows={scenarios} />
      </section>

      <section id="bi-fund-rules" className={BOX}>
        <h3 className={SECTION_TITLE}>기금 규칙 비교: 정부안 · 노르웨이 · 칠레</h3>
        <FundRuleTable rows={fundRules} input={ruleInput} />
      </section>

      {firstPaying && (
        <section id="bi-budget" className={BOX}>
          <h3 className={SECTION_TITLE}>나라 예산과 비교</h3>
          <BudgetCompare need={firstPaying.need} year={firstPaying.year} />
        </section>
      )}

      <section id="bi-sources" className={BOX}>
        <h3 className={SECTION_TITLE}>기본값과 출처</h3>
        <SourceList />
      </section>
    </div>
  );
}
